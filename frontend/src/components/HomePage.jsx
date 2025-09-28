import { useState } from 'react'
import './HomePage.css'

const HomePage = ({ onNavigate }) => {
  const [hoveredButton, setHoveredButton] = useState(null)

  const handleButtonClick = (feature) => {
    if (feature === 'learning-gaps') {
      onNavigate('upload')
    } else if (feature === 'support-materials') {
      onNavigate('support-materials')
    } else {
      // For future implementation
      alert(`${feature} feature is coming soon!`)
    }
  }

  const features = [
    {
      id: 'learning-gaps',
      title: 'Learning Gaps Analysis',
      description: 'Upload Excel files to analyze student performance, identify weak questions, and generate comprehensive learning gap reports.',
      icon: '📊',
      color: '#2563eb',
      available: true
    },
    {
      id: 'support-materials',
      title: 'Generate Support Materials',
      description: 'Create personalized study materials, practice questions, and remediation resources based on learning gap analysis.',
      icon: '📚',
      color: '#059669',
      available: true
    },
    {
      id: 'learning-journey',
      title: 'Student\'s Learning Journey',
      description: 'Track individual student progress, visualize learning paths, and monitor improvement over time.',
      icon: '🎯',
      color: '#dc2626',
      available: true
    }
  ]

  return (
    <div className="home-page">
      <div className="home-header">
        <h1 className="home-title">Learning Analytics Dashboard</h1>
        <p className="home-subtitle">
          Comprehensive tools for analyzing student performance and optimizing learning outcomes
        </p>
      </div>

      <div className="features-grid">
        {features.map((feature) => (
          <div
            key={feature.id}
            className={`feature-card ${feature.available ? 'available' : 'coming-soon'} ${
              hoveredButton === feature.id ? 'hovered' : ''
            }`}
            onClick={() => handleButtonClick(feature.id)}
            onMouseEnter={() => setHoveredButton(feature.id)}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              '--feature-color': feature.color,
              cursor: feature.available ? 'pointer' : 'not-allowed'
            }}
          >
            <div className="feature-icon" style={{ backgroundColor: feature.color }}>
              {feature.icon}
            </div>
            
            <div className="feature-content">
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>

            <div className="feature-action">
              <button className="action-button">
                Get Started →
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default HomePage
