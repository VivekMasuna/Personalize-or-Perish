import { useState } from 'react'
import './App.css'
import HomePage from './components/HomePage'
import FileUpload from './components/FileUpload'
import Dashboard from './components/Dashboard'
import Dashboard2 from './components/Dashboard2'
import Dashboard3 from './components/Dashboard3'

function App() {
  const [currentView, setCurrentView] = useState('home') // 'home', 'upload', 'dashboard', 'support-materials', 'learning-journey'
  const [analysisData, setAnalysisData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleNavigation = (view) => {
    setCurrentView(view)
  }

  const handleAnalysisComplete = (data) => {
    setAnalysisData(data)
    setCurrentView('dashboard')
  }

  const handleReset = () => {
    setAnalysisData(null)
    setCurrentView('home')
  }

  const handleBackToHome = () => {
    setCurrentView('home')
    setAnalysisData(null)
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage onNavigate={handleNavigation} />
      case 'upload':
        return (
          <div className="app">
            <header className="app-header">
              <div className="header-content">
                <button className="back-button" onClick={handleBackToHome}>
                  ← Back to Home
                </button>
                <div className="header-text">
                  <h1>Learning Gaps Analysis Dashboard</h1>
                  <p>Upload an Excel file to analyze student learning gaps and performance</p>
                </div>
              </div>
            </header>
            <main className="app-main">
              <FileUpload
                onAnalysisComplete={handleAnalysisComplete}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </main>
          </div>
        )
      case 'dashboard':
        return (
          <div className="app">
            <header className="app-header">
              <div className="header-content">
                <button className="back-button" onClick={handleBackToHome}>
                  ← Back to Home
                </button>
                <div className="header-text">
                  <h1>Learning Gaps Analysis Dashboard</h1>
                  <p>Analysis results and visualizations</p>
                </div>
              </div>
            </header>
            <main className="app-main">
              <Dashboard
                data={analysisData}
                onReset={handleReset}
              />
            </main>
          </div>
        )
      case 'support-materials':
        return (
          <div className="app">
            <header className="app-header">
              <div className="header-content">
                <button className="back-button" onClick={handleBackToHome}>
                  ← Back to Home
                </button>
                <div className="header-text">
                  <h1>Generate Study Materials</h1>
                  <p>Ask questions and get personalized study materials and explanations</p>
                </div>
              </div>
            </header>
            <main className="app-main">
              <Dashboard2 />
            </main>
          </div>
        )
      case 'learning-journey':
        return (
          <div className="app">
            <header className="app-header">
              <div className="header-content">
                <button className="back-button" onClick={handleBackToHome}>
                  ← Back to Home
                </button>
                <div className="header-text">
                  <h1>Student's Learning Journey</h1>
                  <p>Track individual student progress and analyze learning patterns</p>
                </div>
              </div>
            </header>
            <main className="app-main">
              <Dashboard3 />
            </main>
          </div>
        )
      default:
        return <HomePage onNavigate={handleNavigation} />
    }
  }

  return renderCurrentView()
}

export default App
