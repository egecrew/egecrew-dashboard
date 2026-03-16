import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [businessData, setBusinessData] = useState(null)
  const [surveyData, setSurveyData] = useState({
    wantsWebsite: '',
    preferredDomain: '',
    wantsAgent: '',
    phoneNumber: '',
    bestTimeToCall: '',
    additionalServices: []
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')

  useEffect(() => {
    if (token) {
      // Decode token to get business data
      // In production, verify with backend
      try {
        const decoded = atob(token)
        const data = JSON.parse(decoded)
        setBusinessData(data)
        setLoading(false)
      } catch (e) {
        console.error('Invalid token')
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [token])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSurveyData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (service) => {
    setSurveyData(prev => ({
      ...prev,
      additionalServices: prev.additionalServices.includes(service)
        ? prev.additionalServices.filter(s => s !== service)
        : [...prev.additionalServices, service]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Send to backend (webhook or API)
    const payload = {
      ...businessData,
      survey: surveyData,
      submittedAt: new Date().toISOString()
    }
    
    // In production: Send to API
    console.log('Survey submitted:', payload)
    
    // For now, just show success
    setSubmitted(true)
    
    // Also send to Resend for notification
    try {
      const response = await fetch('/api/submit-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        console.log('Survey sent successfully')
      }
    } catch (error) {
      console.error('Error sending survey:', error)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Yükleniyor...</p>
      </div>
    )
  }

  if (!businessData) {
    return (
      <div className="error">
        <h2>❌ Geçersiz veya eksik link</h2>
        <p>Lütfen email'inizdeki linke tıklayarak buraya gelin.</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="success-page">
        <div className="success-content">
          <h1>✅ Teşekkürler!</h1>
          <p>Bilgileriniz başarıyla alındı.</p>
          <p>En kısa sürede size dönüş yapacağız.</p>
          
          <div className="next-steps">
            <h3>Sırada Ne Var?</h3>
            <ul>
              <li>24 saat içinde sizi arayacağız</li>
              <li>Domain tercihinizi kontrol edeceğiz</li>
              <li>Size özel fiyat teklifi hazırlayacağız</li>
              {surveyData.wantsAgent === 'yes' && (
                <li>AI Agent demo'su ayarlayacağız</li>
              )}
            </ul>
          </div>
          
          <a href={businessData.website} className="view-site-btn">
            Web Sitenizi Görüntüleyin →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <h1 className="logo">🚀 Ege Crew</h1>
          <p className="tagline">Dijital Çözüm Ortağınız</p>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h2>Merhaba {businessData.name}! 👋</h2>
          <p>Size özel hazırladığımız web sitesi yayında:</p>
          
          <div className="website-preview">
            <div className="browser-mockup">
              <div className="browser-bar">
                <div className="browser-dots">
                  <span></span><span></span><span></span>
                </div>
                <div className="browser-url">{businessData.website}</div>
              </div>
              <iframe 
                src={businessData.website} 
                title="Website Preview"
                className="website-iframe"
              />
            </div>
            
            <div className="website-stats">
              <div className="stat">
                <h3>⭐ {businessData.rating || '4.5'}</h3>
                <p>Google Rating</p>
              </div>
              <div className="stat">
                <h3>💬 {businessData.reviews || '0'}</h3>
                <p>Yorum</p>
              </div>
              <div className="stat">
                <h3>📱 100%</h3>
                <p>Mobil Uyumlu</p>
              </div>
            </div>
          </div>
          
          <a href={businessData.website} target="_blank" rel="noopener noreferrer" className="visit-btn">
            Web Sitenizi Ziyaret Edin →
          </a>
        </div>
      </section>

      {/* Survey Section */}
      <section className="survey">
        <div className="container">
          <h2>🎯 Size Nasıl Yardımcı Olabiliriz?</h2>
          <p>Birkaç kısa soru ile ihtiyaçlarınızı öğrenmek istiyoruz.</p>
          
          <form onSubmit={handleSubmit} className="survey-form">
            {/* Website Interest */}
            <div className="form-group">
              <label>Bu web sitesini beğendiniz mi?</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="wantsWebsite"
                    value="yes"
                    onChange={handleInputChange}
                    required
                  />
                  <span>😍 Evet, harika!</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="wantsWebsite"
                    value="maybe"
                    onChange={handleInputChange}
                    required
                  />
                  <span>🤔 Bazı değişikliklerle</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="wantsWebsite"
                    value="no"
                    onChange={handleInputChange}
                    required
                  />
                  <span>😕 Hayır</span>
                </label>
              </div>
            </div>

            {/* Domain Preference */}
            {surveyData.wantsWebsite !== 'no' && (
              <div className="form-group">
                <label>Hangi domain adresini tercih edersiniz?</label>
                <input
                  type="text"
                  name="preferredDomain"
                  placeholder="örn: kilincmarket.com.tr"
                  value={surveyData.preferredDomain}
                  onChange={handleInputChange}
                  className="text-input"
                />
                <p className="hint">Boş bırakırsanız sizin için öneri hazırlarız</p>
              </div>
            )}

            {/* Additional Services */}
            <div className="form-group">
              <label>Hangi ek hizmetler ilginizi çeker?</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    value="email"
                    onChange={() => handleCheckboxChange('email')}
                  />
                  <span>📧 Kurumsal E-posta</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    value="seo"
                    onChange={() => handleCheckboxChange('seo')}
                  />
                  <span>🔍 SEO Optimizasyonu</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    value="social"
                    onChange={() => handleCheckboxChange('social')}
                  />
                  <span>📱 Sosyal Medya Yönetimi</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    value="ads"
                    onChange={() => handleCheckboxChange('ads')}
                  />
                  <span>📢 Google Ads</span>
                </label>
              </div>
            </div>

            {/* AI Agent Interest */}
            <div className="form-group ai-section">
              <label>🤖 AI Agent (Yapay Zeka Asistan) ilginizi çeker mi?</label>
              <p className="description">
                OpenClaw benzeri bir AI asistan kurulumu. İşletmeniz için:
                • Otomatik müşteri yanıtları
                • Randevu yönetimi
                • Sosyal medya otomasyonu
                • 7/24 çalışan dijital asistan
              </p>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="wantsAgent"
                    value="yes"
                    onChange={handleInputChange}
                    required
                  />
                  <span>✨ Evet, demo görmek isterim</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="wantsAgent"
                    value="maybe"
                    onChange={handleInputChange}
                    required
                  />
                  <span>🤔 Daha fazla bilgi istiyorum</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="wantsAgent"
                    value="no"
                    onChange={handleInputChange}
                    required
                  />
                  <span>👎 İlgilenmiyorum</span>
                </label>
              </div>
            </div>

            {/* Contact Info */}
            <div className="form-group">
              <label>📞 Size nasıl ulaşalım?</label>
              <input
                type="tel"
                name="phoneNumber"
                placeholder="0532 XXX XX XX"
                value={surveyData.phoneNumber}
                onChange={handleInputChange}
                className="text-input"
                required
              />
              
              <label style={{marginTop: '1rem'}}>En uygun zaman:</label>
              <select 
                name="bestTimeToCall" 
                value={surveyData.bestTimeToCall}
                onChange={handleInputChange}
                className="select-input"
                required
              >
                <option value="">Seçiniz</option>
                <option value="morning">Sabah (09:00-12:00)</option>
                <option value="afternoon">Öğleden sonra (12:00-17:00)</option>
                <option value="evening">Akşam (17:00-20:00)</option>
                <option value="anytime">Her zaman uygun</option>
              </select>
            </div>

            {/* Submit Button */}
            <button type="submit" className="submit-btn">
              Gönder ve Teklif Al 🚀
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 Ege Crew - Bodrum, Türkiye</p>
          <p>📧 info@egecrew.com | 🌐 egecrew.com</p>
        </div>
      </footer>
    </div>
  )
}

export default App