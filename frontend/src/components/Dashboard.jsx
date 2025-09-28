import { useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'
import ErrorBoundary from './ErrorBoundary'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

const Dashboard = ({ data, onReset }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedStudent, setSelectedStudent] = useState('')

  // Debug data structure
  console.log('Dashboard received data:', data)
  console.log('Data type:', typeof data)
  console.log('Data keys:', data ? Object.keys(data) : 'No data')
  
  // Process data for visualizations with error handling
  if (!data || !data.cohort || !data.students) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h2 className="dashboard-title">Analysis Results</h2>
          <button className="reset-button" onClick={onReset}>
            Upload New File
          </button>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
          <h3>Error: Invalid data structure</h3>
          <p>Please upload a valid Excel file and try again.</p>
        </div>
      </div>
    )
  }

  const cohortData = data.cohort
  const studentsData = data.students
  
  console.log('Cohort data:', cohortData)
  console.log('Students data:', studentsData)

  // Prepare question performance data for charts with error handling
  const questionPerformanceData = (() => {
    try {
      if (!cohortData.question_wise) {
        console.error('question_wise data not found')
        return []
      }
      return Object.entries(cohortData.question_wise).map(([qid, qData]) => ({
        questionId: qid,
        accuracy: Math.round((qData.Accuracy || 0) * 100),
        studentsAttempted: qData['Students Attempted'] || 0,
        questionText: (qData['Question Text'] || `Question ${qid}`).substring(0, 50) + '...'
      }))
    } catch (error) {
      console.error('Error processing question performance data:', error)
      return []
    }
  })()

  // Prepare student performance data with error handling
  const studentPerformanceData = (() => {
    try {
      if (!studentsData) {
        console.error('students data not found')
        return []
      }
      return Object.entries(studentsData).map(([studentId, studentData]) => ({
        studentId: studentId,
        accuracy: Math.round((studentData.overall_accuracy || 0) * 100),
        weakQuestions: Array.isArray(studentData.weak_questions) ? studentData.weak_questions.length : 
                      (typeof studentData.weak_questions === 'object' && studentData.weak_questions !== null ? Object.keys(studentData.weak_questions).length : 0),
        totalAttempts: studentData.total_attempts || 0
      }))
    } catch (error) {
      console.error('Error processing student performance data:', error)
      return []
    }
  })()

  // Prepare time analysis data with error handling
  const timeAnalysisData = (() => {
    try {
      if (!cohortData.time_analysis) {
        console.error('time_analysis data not found')
        return []
      }
      return Object.entries(cohortData.time_analysis).map(([qid, timeData]) => ({
        questionId: qid,
        avgTime: Math.round(timeData.mean || 0),
        medianTime: Math.round(timeData.median || 0),
        stdDev: Math.round(timeData.std || 0)
      }))
    } catch (error) {
      console.error('Error processing time analysis data:', error)
      return []
    }
  })()

  // Calculate summary statistics with error handling
  const totalStudents = studentsData ? Object.keys(studentsData).length : 0
  const totalQuestions = cohortData.question_wise ? Object.keys(cohortData.question_wise).length : 0
  const avgAccuracy = (() => {
    try {
      if (!studentsData || totalStudents === 0) return 0
      const totalAccuracy = Object.values(studentsData).reduce((sum, student) => sum + (student.overall_accuracy || 0), 0)
      return Math.round((totalAccuracy / totalStudents) * 100)
    } catch (error) {
      console.error('Error calculating average accuracy:', error)
      return 0
    }
  })()
  
  // Get student list for dropdown with error handling
  const studentList = (() => {
    try {
      if (!studentsData) return []
      return Object.keys(studentsData).map(studentId => ({
        id: studentId,
        name: `Student ${studentId}`,
        accuracy: Math.round((studentsData[studentId].overall_accuracy || 0) * 100)
      }))
    } catch (error) {
      console.error('Error creating student list:', error)
      return []
    }
  })()

  // Debug processed data
  console.log('Question performance data length:', questionPerformanceData.length)
  console.log('Student performance data length:', studentPerformanceData.length)
  console.log('Time analysis data length:', timeAnalysisData.length)
  console.log('Question performance data sample:', questionPerformanceData.slice(0, 2))

  // Colors for charts
  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']

  const renderOverview = () => (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{totalStudents}</div>
          <div className="stat-label">Total Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalQuestions}</div>
          <div className="stat-label">Total Questions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgAccuracy}%</div>
          <div className="stat-label">Average Accuracy</div>
        </div>
      </div>


      <div className="chart-container">
        <h3 className="chart-title">Question Performance Overview</h3>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
          Accuracy percentage for each question across all students
        </p>
        {questionPerformanceData.length > 0 ? (
          <ErrorBoundary>
            <Bar
              data={{
                labels: questionPerformanceData.map(item => item.questionId),
                datasets: [
                  {
                    label: 'Accuracy (%)',
                    data: questionPerformanceData.map(item => item.accuracy),
                    backgroundColor: '#3b82f6',
                    borderColor: '#1d4ed8',
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: false,
                  },
                  legend: {
                    display: true,
                    position: 'top',
                  },
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Question ID',
                    },
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45,
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Accuracy (%)',
                    },
                    beginAtZero: true,
                    max: 100,
                  },
                },
              }}
              height={400}
            />
          </ErrorBoundary>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            color: '#64748b',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
              No question performance data available
            </p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
              Please check your Excel file format and try again.
            </p>
          </div>
        )}
      </div>
    </div>
  )

  const renderStudentAnalysis = () => {
    const selectedStudentData = selectedStudent ? studentsData[selectedStudent] : null

    return (
      <div>
        {/* Student Selection */}
        <div className="student-selector">
          <label htmlFor="student-select">Select Student:</label>
          <select
            id="student-select"
            className="student-dropdown"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="">Choose a student...</option>
            {studentList.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.accuracy}% accuracy)
              </option>
            ))}
          </select>
        </div>

        {/* Student Details */}
        {selectedStudentData && (
          <div className="student-details">
            <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>
              Student {selectedStudent} Analysis
            </h3>
            <div className="student-info">
              <div className="student-info-item">
                <div className="student-info-value">
                  {Math.round(selectedStudentData.overall_accuracy * 100)}%
                </div>
                <div className="student-info-label">Overall Accuracy</div>
              </div>
              <div className="student-info-item">
                <div className="student-info-value">
                  {(() => {
                    try {
                      const weakQuestions = selectedStudentData.weak_questions
                      if (Array.isArray(weakQuestions)) return weakQuestions.length
                      if (typeof weakQuestions === 'object' && weakQuestions !== null) {
                        return Object.keys(weakQuestions).length
                      }
                      return 0
                    } catch (error) {
                      return 0
                    }
                  })()}
                </div>
                <div className="student-info-label">Weak Questions</div>
              </div>
              <div className="student-info-item">
                <div className="student-info-value">
                  {selectedStudentData.total_attempts || 0}
                </div>
                <div className="student-info-label">Total Attempts</div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Charts */}
        {selectedStudentData && (
          <div className="comparison-container">
            <div className="comparison-chart">
              <h4 className="comparison-title">Accuracy Comparison</h4>
              <Bar
                data={{
                  labels: ['Selected Student', 'Cohort Average'],
                  datasets: [
                    {
                      label: 'Accuracy (%)',
                      data: [
                        Math.round(selectedStudentData.overall_accuracy * 100),
                        avgAccuracy
                      ],
                      backgroundColor: ['#3b82f6', '#10b981'],
                      borderColor: ['#1d4ed8', '#059669'],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                    },
                  },
                }}
                height={300}
              />
            </div>

            <div className="comparison-chart">
              <h4 className="comparison-title">Weak Questions Comparison</h4>
              <Bar
                data={{
                  labels: ['Selected Student', 'Cohort Average'],
                  datasets: [
                    {
                      label: 'Weak Questions',
                      data: [
                        (() => {
                          try {
                            const weakQuestions = selectedStudentData.weak_questions
                            if (Array.isArray(weakQuestions)) return weakQuestions.length
                            if (typeof weakQuestions === 'object' && weakQuestions !== null) {
                              return Object.keys(weakQuestions).length
                            }
                            return 0
                          } catch (error) {
                            return 0
                          }
                        })(),
                        Math.round(Object.values(studentsData).reduce((sum, s) => {
                          try {
                            const weakQuestions = s.weak_questions
                            if (Array.isArray(weakQuestions)) return sum + weakQuestions.length
                            if (typeof weakQuestions === 'object' && weakQuestions !== null) {
                              return sum + Object.keys(weakQuestions).length
                            }
                            return sum
                          } catch (error) {
                            return sum
                          }
                        }, 0) / totalStudents)
                      ],
                      backgroundColor: ['#ef4444', '#f97316'],
                      borderColor: ['#dc2626', '#ea580c'],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
                height={300}
              />
            </div>
          </div>
        )}

        {/* Cohort Overview */}
        <div className="chart-container">
          <h3 className="chart-title">Student Performance Distribution</h3>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Individual student accuracy across the cohort
          </p>
          <Bar
            data={{
              labels: studentPerformanceData.map(item => item.studentId),
              datasets: [
                {
                  label: 'Accuracy (%)',
                  data: studentPerformanceData.map(item => item.accuracy),
                  backgroundColor: '#3b82f6',
                  borderColor: '#1d4ed8',
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: false,
                },
                legend: {
                  display: true,
                  position: 'top',
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Student ID',
                  },
                  ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: 'Accuracy (%)',
                  },
                  beginAtZero: true,
                  max: 100,
                },
              },
            }}
            height={400}
          />
        </div>
      </div>
    )
  }

  const renderTimeAnalysis = () => {
    const selectedStudentData = selectedStudent ? studentsData[selectedStudent] : null

    // Prepare time comparison data for selected student
    const timeComparisonData = selectedStudentData ? 
      Object.entries(selectedStudentData.time_comparison).map(([qid, timeData]) => ({
        questionId: qid,
        studentTime: Math.round(timeData.student_time),
        cohortTime: Math.round(timeData.cohort_time),
        difference: Math.round(timeData.difference)
      })) : []

    return (
      <div>
        {/* Student Selection */}
        <div className="student-selector">
          <label htmlFor="time-student-select">Select Student:</label>
          <select
            id="time-student-select"
            className="student-dropdown"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="">Choose a student...</option>
            {studentList.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.accuracy}% accuracy)
              </option>
            ))}
          </select>
        </div>

        {/* Individual Student Time Analysis */}
        {selectedStudentData && timeComparisonData.length > 0 && (
          <div className="chart-container">
            <h3 className="chart-title">Student vs Cohort Time Analysis</h3>
            <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Time spent by Student {selectedStudent} compared to cohort average
            </p>
            <Bar
              data={{
                labels: timeComparisonData.map(item => item.questionId),
                datasets: [
                  {
                    label: 'Student Time (s)',
                    data: timeComparisonData.map(item => item.studentTime),
                    backgroundColor: '#3b82f6',
                    borderColor: '#1d4ed8',
                    borderWidth: 1,
                  },
                  {
                    label: 'Cohort Time (s)',
                    data: timeComparisonData.map(item => item.cohortTime),
                    backgroundColor: '#94a3b8',
                    borderColor: '#64748b',
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: false,
                  },
                  legend: {
                    display: true,
                    position: 'top',
                  },
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Question ID',
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Time (seconds)',
                    },
                    beginAtZero: true,
                  },
                },
              }}
              height={400}
            />
          </div>
        )}

        {/* Cohort Time Analysis */}
        <div className="chart-container">
          <h3 className="chart-title">Cohort Question Timing Analysis</h3>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Average and median time spent on each question across all students
          </p>
          <Bar
            data={{
              labels: timeAnalysisData.map(item => item.questionId),
              datasets: [
                {
                  label: 'Average Time (s)',
                  data: timeAnalysisData.map(item => item.avgTime),
                  backgroundColor: '#3b82f6',
                  borderColor: '#1d4ed8',
                  borderWidth: 1,
                },
                {
                  label: 'Median Time (s)',
                  data: timeAnalysisData.map(item => item.medianTime),
                  backgroundColor: '#94a3b8',
                  borderColor: '#64748b',
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: false,
                },
                legend: {
                  display: true,
                  position: 'top',
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Question ID',
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: 'Time (seconds)',
                  },
                  beginAtZero: true,
                },
              },
            }}
            height={400}
          />
        </div>
      </div>
    )
  }

  const renderWeakQuestions = () => {
    const selectedStudentData = selectedStudent ? studentsData[selectedStudent] : null
    
    // Cohort weak questions
    const cohortWeakQuestions = Object.entries(cohortData.weak_questions).map(([qid, qData]) => ({
      questionId: qid,
      accuracy: Math.round(qData.Accuracy * 100),
      questionText: qData['Question Text'],
      studentsAttempted: qData['Students Attempted']
    }))

    // Student weak questions
    const studentWeakQuestions = selectedStudentData ? 
      (() => {
        try {
          // Handle both DataFrame and object formats
          const weakQuestions = selectedStudentData.weak_questions
          console.log('Student weak questions data:', weakQuestions)
          
          if (Array.isArray(weakQuestions) || !weakQuestions) {
            return []
          }
          
          // If it's an object with numeric keys (DataFrame format)
          if (typeof weakQuestions === 'object') {
            const entries = Object.entries(weakQuestions)
            console.log('Weak questions entries:', entries)
            
            return entries.map(([qid, qData]) => ({
              questionId: qid,
              accuracy: Math.round((qData.Accuracy || qData.accuracy || 0) * 100),
              questionText: qData['Question Text'] || qData.questionText || `Question ${qid}`
            }))
          }
          
          return []
        } catch (error) {
          console.error('Error processing student weak questions:', error)
          return []
        }
      })() : []

    return (
      <div>
        {/* Student Selection */}
        <div className="student-selector">
          <label htmlFor="weak-student-select">Select Student:</label>
          <select
            id="weak-student-select"
            className="student-dropdown"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="">Choose a student...</option>
            {studentList.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.accuracy}% accuracy)
              </option>
            ))}
          </select>
        </div>

        {/* Individual Student Weak Questions */}
        {selectedStudentData && (
          <div>
            {studentWeakQuestions.length > 0 ? (
              <>
                <div className="chart-container">
                  <h3 className="chart-title">Student {selectedStudent} Weak Questions</h3>
                  <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    Questions where Student {selectedStudent} scored below 60% accuracy
                  </p>
                  <Bar
                    data={{
                      labels: studentWeakQuestions.map(item => item.questionId),
                      datasets: [
                        {
                          label: 'Accuracy (%)',
                          data: studentWeakQuestions.map(item => item.accuracy),
                          backgroundColor: '#ef4444',
                          borderColor: '#dc2626',
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        title: {
                          display: false,
                        },
                        legend: {
                          display: true,
                          position: 'top',
                        },
                      },
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Question ID',
                          },
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Accuracy (%)',
                          },
                          beginAtZero: true,
                          max: 100,
                        },
                      },
                    }}
                    height={400}
                  />
                </div>

                <div className="chart-container">
                  <h3 className="chart-title">Student {selectedStudent} Weak Questions Details</h3>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {studentWeakQuestions.map((q, index) => (
                      <div key={q.questionId} style={{
                        padding: '1rem',
                        margin: '0.5rem 0',
                        background: '#fef2f2',
                        borderRadius: '8px',
                        border: '1px solid #fecaca'
                      }}>
                        <h4 style={{ color: '#dc2626', marginBottom: '0.5rem', fontSize: '1rem' }}>
                          Question {q.questionId} - {q.accuracy}% Accuracy
                        </h4>
                        <p style={{ color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                          {q.questionText}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="chart-container">
                <h3 className="chart-title">Student {selectedStudent} Weak Questions</h3>
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: '#10b981',
                  background: '#ecfdf5',
                  borderRadius: '8px',
                  border: '1px solid #a7f3d0'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                  <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                    Great job! Student {selectedStudent} has no weak questions.
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#059669' }}>
                    All questions scored above 60% accuracy.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cohort Weak Questions */}
        <div className="chart-container">
          <h3 className="chart-title">Cohort Weak Questions (Accuracy &lt; 70%)</h3>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Questions where the cohort average accuracy is below 70%
          </p>
          <Bar
            data={{
              labels: cohortWeakQuestions.map(item => item.questionId),
              datasets: [
                {
                  label: 'Accuracy (%)',
                  data: cohortWeakQuestions.map(item => item.accuracy),
                  backgroundColor: '#ef4444',
                  borderColor: '#dc2626',
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: false,
                },
                legend: {
                  display: true,
                  position: 'top',
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Question ID',
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: 'Accuracy (%)',
                  },
                  beginAtZero: true,
                  max: 100,
                },
              },
            }}
            height={400}
          />
        </div>

        {/* Detailed Weak Questions */}
        <div className="chart-container">
          <h3 className="chart-title">Weak Questions Details</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {cohortWeakQuestions.map((q, index) => (
              <div key={q.questionId} style={{
                padding: '1rem',
                margin: '0.5rem 0',
                background: '#fef2f2',
                borderRadius: '8px',
                border: '1px solid #fecaca'
              }}>
                <h4 style={{ color: '#dc2626', marginBottom: '0.5rem', fontSize: '1rem' }}>
                  Question {q.questionId} - {q.accuracy}% Accuracy
                </h4>
                <p style={{ color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  {q.questionText}
                </p>
                <small style={{ color: '#6b7280' }}>
                  {q.studentsAttempted} students attempted
                </small>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'students', label: 'Student Analysis' },
    { id: 'timing', label: 'Time Analysis' },
    { id: 'weak', label: 'Weak Questions' }
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Learning Gaps Analysis Results</h2>
        <button className="reset-button" onClick={onReset}>
          Upload New File
        </button>
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

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'students' && renderStudentAnalysis()}
      {activeTab === 'timing' && renderTimeAnalysis()}
      {activeTab === 'weak' && renderWeakQuestions()}
    </div>
  )
}

export default Dashboard
