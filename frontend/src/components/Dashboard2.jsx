import { useState } from "react";
import ReactMarkdown from "react-markdown";
import "./Dashboard2.css";

function Dashboard2() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [queryHistory, setQueryHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError("Please enter a question before submitting.");
      return;
    }

    setIsLoading(true);
    setError("");
    
    try {
      const res = await fetch("http://localhost:5000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setAnswer(data.answer);
      
      // Add to query history
      setQueryHistory(prev => [
        { query, answer: data.answer, timestamp: new Date() },
        ...prev.slice(0, 4) // Keep only last 5 queries
      ]);
      
    } catch (err) {
      console.error("Error fetching answer:", err);
      setError(err.message || "Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setQueryHistory([]);
    setAnswer("");
    setError("");
  };

  return (
    <div className="dashboard2-container">
      <div className="query-section">
        <div className="query-header">
          <h2>Study Materials Generator</h2>
          <p>Ask questions about your learning materials and get comprehensive study materials, explanations, and practice content</p>
        </div>
        
        <form onSubmit={handleSubmit} className="query-form">
          <div className="input-group">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a question/query"
              className="query-input"
              rows="3"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Generating...
                </>
              ) : (
                "Generate Study Materials"
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
      </div>

      {answer && (
        <div className="response-section">
          <div className="response-header">
            <h3>Generated Study Materials</h3>
            <button onClick={clearHistory} className="clear-button">
              Clear History
            </button>
          </div>
          <div className="response-content">
            <div className="response-text">
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {queryHistory.length > 0 && (
        <div className="history-section">
          <h3>Recent Queries</h3>
          <div className="history-list">
            {queryHistory.map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-query">
                  <strong>Q:</strong> {item.query}
                </div>
                <div className="history-answer">
                  <strong>A:</strong> {item.answer.replace(/[#*`>]/g, '').substring(0, 100)}...
                </div>
                <div className="history-timestamp">
                  {item.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default Dashboard2;
