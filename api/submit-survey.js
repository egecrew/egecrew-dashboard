// Vercel serverless function for survey submission
import neo4j from 'neo4j-driver';

// Temporary hardcoded credentials - move to env vars later
const NEO4J_URI = process.env.NEO4J_URI || 'neo4j+s://e6699861.databases.neo4j.io';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'e6699861';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || '9bLT5X5ngPZ9L18lYxixNKg3IWz5trA42nH1lr5zq00';

const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD),
  {
    database: 'neo4j' // Use default database
  }
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Debug logging
  console.log('Neo4j connection info:', {
    uri: NEO4J_URI,
    username: NEO4J_USERNAME,
    hasPassword: !!NEO4J_PASSWORD
  });
  
  try {
    const { survey, submittedAt, ...businessData } = req.body;
    
    const session = driver.session({ database: 'neo4j' });
    
    // Update business with survey response
    const result = await session.run(`
      MATCH (p:Place {name: $name})
      SET p.survey_completed = true,
          p.survey_date = datetime($submittedAt),
          p.wants_website = $wantsWebsite,
          p.preferred_domain = $preferredDomain,
          p.wants_agent = $wantsAgent,
          p.contact_phone = $phoneNumber,
          p.best_time_to_call = $bestTimeToCall,
          p.additional_services = $additionalServices,
          p.lead_status = CASE 
            WHEN $wantsWebsite = 'yes' OR $wantsAgent = 'yes' THEN 'hot_lead'
            WHEN $wantsWebsite = 'maybe' OR $wantsAgent = 'maybe' THEN 'warm_lead'
            ELSE 'cold_lead'
          END
      RETURN p.name as name, p.lead_status as status
    `, {
      name: businessData.name,
      submittedAt: submittedAt,
      wantsWebsite: survey.wantsWebsite,
      preferredDomain: survey.preferredDomain || null,
      wantsAgent: survey.wantsAgent,
      phoneNumber: survey.phoneNumber,
      bestTimeToCall: survey.bestTimeToCall,
      additionalServices: survey.additionalServices
    });
    
    await session.close();
    
    // Log success
    console.log('Survey submitted for:', businessData.name);
    
    // Send notification email if hot lead
    if (survey.wantsWebsite === 'yes' || survey.wantsAgent === 'yes') {
      await sendNotificationEmail(businessData, survey);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Survey submitted successfully',
      leadStatus: result.records[0]?.get('status') || 'updated'
    });
    
  } catch (error) {
    console.error('Error submitting survey:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit survey',
      details: error.message
    });
  }
}

async function sendNotificationEmail(business, survey) {
  // Send notification to team using Resend
  const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_QDwCnFrq_Me895AvLSNeeoDi6pyK1XoMW';
  
  const emailContent = `
    <h2>🔥 New Hot Lead!</h2>
    <p><strong>${business.name}</strong> completed the survey</p>
    
    <h3>Survey Results:</h3>
    <ul>
      <li>Wants Website: ${survey.wantsWebsite}</li>
      <li>Preferred Domain: ${survey.preferredDomain || 'Not specified'}</li>
      <li>Wants AI Agent: ${survey.wantsAgent}</li>
      <li>Phone: ${survey.phoneNumber}</li>
      <li>Best Time: ${survey.bestTimeToCall}</li>
      <li>Additional Services: ${survey.additionalServices.join(', ') || 'None'}</li>
    </ul>
    
    <p>Contact them ASAP!</p>
  `;
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Survey System <onboarding@agent.egecrew.com>',
        to: 'info@egecrew.com',
        subject: `🔥 Hot Lead: ${business.name}`,
        html: emailContent
      })
    });
    
    if (response.ok) {
      console.log('Notification email sent');
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}