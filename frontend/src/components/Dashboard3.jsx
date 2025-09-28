// frontend/src/components/PerformanceDashboard.jsx

import React, { useState, useMemo } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import './Dashboard3.css';

// Ensure this port matches your Flask server's port
const API_URL = 'http://127.0.0.1:5000'; 

const naturalSort = (a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

export default function Dashboard3() {
    const [analysisData, setAnalysisData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // State to manage which tab is active
    const [activeTab, setActiveTab] = useState('overall'); 

    // State for user selections
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedModule, setSelectedModule] = useState('');

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsLoading(true);
        setError('');
        setAnalysisData(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_URL}/api/analyze`, formData);
            setAnalysisData(response.data);
            
            if (response.data?.student_ids?.length > 0) {
                setSelectedStudent(response.data.student_ids[0]);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'An unexpected error occurred.';
            setError(`Failed to analyze file: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Data processing and memoization (no change in logic) ---
    const studentSpecificData = useMemo(() => {
        if (!analysisData || !selectedStudent) return { data: [], modules: [] };
        const data = analysisData.all_student_data.filter(row => row.login_id === selectedStudent);
        const modules = [...new Set(data.map(d => d.activity_name))].sort(naturalSort);
        return { data, modules };
    }, [analysisData, selectedStudent]);

    if (selectedStudent && studentSpecificData.modules.length > 0 && !studentSpecificData.modules.includes(selectedModule)) {
        setSelectedModule(studentSpecificData.modules[0]);
    }
    
    const moduleSpecificData = useMemo(() => {
        return studentSpecificData.data
            .filter(row => row.activity_name === selectedModule)
            .sort((a, b) => a['Attempt No'] - b['Attempt No']);
    }, [studentSpecificData.data, selectedModule]);

    const studentMetrics = useMemo(() => {
        const data = studentSpecificData.data;
        if (data.length === 0) return { hours: 0, attempts: 0, avgScore: 0 };
        const totalHours = data.reduce((sum, row) => sum + row['Self Learning Hours'], 0);
        const totalAttempts = data.length;
        const totalCalcScore = data.reduce((sum, row) => sum + row['Calculated Score'], 0);
        const totalMaxScore = data.reduce((sum, row) => sum + row['Total Score'], 0);
        const avgScore = totalMaxScore > 0 ? (totalCalcScore / totalMaxScore) * 100 : 0;
        return { hours: totalHours, attempts: totalAttempts, avgScore: avgScore };
    }, [studentSpecificData.data]);
    
    // --- UI Rendering Functions for each tab ---

    const renderOverallAnalysis = () => (
        <div className="chart-container">
            <h3 className="chart-title">Overall Module Analysis (All Students)</h3>
            <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Total self-learning time invested in each module across the entire cohort.
            </p>
            <Plot
                data={[{
                    x: analysisData.overall_learning_chart.map(d => d.activity_name),
                    y: analysisData.overall_learning_chart.map(d => d['Self Learning Hours']),
                    type: 'bar',
                    marker: {
                        color: '#3b82f6',
                        line: {
                            color: '#1d4ed8',
                            width: 1
                        }
                    }
                }]}
                layout={{ 
                    title: 'Total Self-Learning Time per Module', 
                    yaxis: { title: 'Self Learning (Hours)' },
                    xaxis: { title: 'Module Name' },
                    font: { family: 'Inter, sans-serif' },
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    margin: { t: 60, b: 60, l: 60, r: 60 }
                }}
                style={{ width: '100%', height: '400px' }}
                useResizeHandler
                config={{
                    responsive: true,
                    displayModeBar: true,
                    displaylogo: false,
                    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
                    toImageButtonOptions: {
                        format: 'png',
                        filename: 'overall_analysis',
                        height: 400,
                        width: 800,
                        scale: 1
                    }
                }}
            />
        </div>
    );

    const renderIndividualAnalysis = () => (
        <div>
            <div className="student-selector">
                <label htmlFor="student-select">Select Student:</label>
                <select
                    id="student-select"
                    className="student-dropdown"
                    value={selectedStudent}
                    onChange={e => setSelectedStudent(e.target.value)}
                >
                    {analysisData.student_ids.map(id => <option key={id} value={id}>{id}</option>)}
                </select>
            </div>

            <div className="student-details">
                 <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>
                     Analysis for Student: {selectedStudent}
                 </h3>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{studentMetrics.hours.toFixed(2)}</div>
                        <div className="stat-label">Total Learning Hours</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{studentMetrics.attempts}</div>
                        <div className="stat-label">Total Attempts</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{studentMetrics.avgScore.toFixed(2)}%</div>
                        <div className="stat-label">Average Score</div>
                    </div>
                </div>
            </div>
            
            <div className="chart-container">
                <h3 className="chart-title">Detailed Performance per Module</h3>
                <label style={{textAlign: 'center'}} htmlFor="module-select">Select a Module: </label>
                <select  id="module-select" value={selectedModule} onChange={e => setSelectedModule(e.target.value)} style={{marginBottom: '1rem', display: 'block', margin: '0 auto 1rem auto'}}>
                    {studentSpecificData.modules.map(module => <option key={module} value={module}>{module}</option>)}
                </select>
                <div className="charts-grid">
                    <div className="chart-wrapper">
                        <h4 style={{textAlign: 'center', marginBottom: '1rem', color: '#1e293b', fontSize: '1.125rem', fontWeight: '600'}}>
                            1. Score vs Attempts
                        </h4>
                        <Plot
                            data={[{
                                x: moduleSpecificData.map(d => d['Attempt No']),
                                y: moduleSpecificData.map(d => d['Calculated Score']),
                                type: 'scatter', 
                                mode: 'lines+markers',
                                marker: {
                                    color: '#10b981',
                                    size: 8,
                                    line: {
                                        color: '#059669',
                                        width: 2
                                    }
                                },
                                line: {
                                    color: '#10b981',
                                    width: 3
                                }
                            }]}
                            layout={{ 
                                title: 'Score Progression', 
                                xaxis: { title: 'Attempt', tickmode: 'linear' }, 
                                yaxis: { title: 'Score' },
                                font: { family: 'Inter, sans-serif' },
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                margin: { t: 60, b: 60, l: 60, r: 60 }
                            }}
                            style={{ width: '100%', height: '400px' }}
                            useResizeHandler
                            config={{
                                responsive: true,
                                displayModeBar: true,
                                displaylogo: false,
                                modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
                                toImageButtonOptions: {
                                    format: 'png',
                                    filename: 'score_progression',
                                    height: 400,
                                    width: 800,
                                    scale: 1
                                }
                            }}
                        />
                    </div>
                    <div className="chart-wrapper">
                        <h4 style={{textAlign: 'center', marginBottom: '1rem', color: '#1e293b', fontSize: '1.125rem', fontWeight: '600'}}>
                            2. Self-learning in hrs vs Attempts
                        </h4>
                        <Plot
                            data={[{
                                x: moduleSpecificData.map(d => d['Attempt No']),
                                y: moduleSpecificData.map(d => d['Self Learning Hours']),
                                type: 'bar',
                                marker: {
                                    color: '#f59e0b',
                                    line: {
                                        color: '#d97706',
                                        width: 1
                                    }
                                }
                            }]}
                            layout={{ 
                                title: 'Study Time per Attempt', 
                                xaxis: { title: 'Attempt', tickmode: 'linear' }, 
                                yaxis: { title: 'Hours' },
                                font: { family: 'Inter, sans-serif' },
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                margin: { t: 60, b: 60, l: 60, r: 60 }
                            }}
                            style={{ width: '100%', height: '400px' }}
                            useResizeHandler
                            config={{
                                responsive: true,
                                displayModeBar: true,
                                displaylogo: false,
                                modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
                                toImageButtonOptions: {
                                    format: 'png',
                                    filename: 'study_time',
                                    height: 400,
                                    width: 800,
                                    scale: 1
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const tabs = [
        { id: 'overall', label: 'Overall Analysis' },
        { id: 'individual', label: 'Individual Student Analysis' },
    ];

    // --- Main component return ---
    return (
        <div className="dashboard"> 
            <div className="card">
                <h3>1. Upload Your Raw Data File</h3>
                <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} disabled={isLoading} />
                {isLoading && <p>🔄 Processing, please wait...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>

            {analysisData && (
                <>
                    <div className="card">
                        <h3>2. Download Processed Excel Report</h3>
                        <a
                            href={`${API_URL}/api/download/${analysisData.session_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <button className="action-button">📥 Download Full Report</button>
                        </a>
                    </div>
                    <div className="tab-container">
                        <div className="tab-buttons">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Render the content of the active tab */}
                    {activeTab === 'overall' && renderOverallAnalysis()}
                    {activeTab === 'individual' && renderIndividualAnalysis()}
                </>
            )}
        </div>
    );
}