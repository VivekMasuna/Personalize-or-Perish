import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'

const FileUpload = ({ onAnalysisComplete, isLoading, setIsLoading }) => {
  const [uploadError, setUploadError] = useState(null)

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setUploadError('Please upload an Excel file (.xlsx or .xls)')
      return
    }

    setIsLoading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      console.log('Upload response:', response.data)
      onAnalysisComplete(response.data)
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(
        error.response?.data?.error || 
        'Failed to process the file. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [onAnalysisComplete, setIsLoading])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  })

  return (
    <div className="upload-container">
      <h2>Upload Excel File</h2>
      <p>Select or drag and drop your Excel file containing student assessment data</p>
      
      <div
        {...getRootProps()}
        className={`upload-area ${isDragActive ? 'dragover' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="upload-text">
          {isDragActive
            ? 'Drop the file here...'
            : 'Drag & drop your Excel file here, or click to select'
          }
        </div>
        <div className="upload-subtext">
          Supports .xlsx and .xls files
        </div>
      </div>

      {uploadError && (
        <div style={{ 
          color: '#ff6b6b', 
          marginTop: '1rem', 
          padding: '1rem', 
          background: '#ffe6e6', 
          borderRadius: '10px',
          border: '1px solid #ffcccc'
        }}>
          {uploadError}
        </div>
      )}

      <button
        className="upload-button"
        disabled={isLoading}
        onClick={() => document.querySelector('input[type="file"]').click()}
      >
        {isLoading ? (
          <>
            <span className="loading-spinner"></span>
            Processing...
          </>
        ) : (
          'Choose File'
        )}
      </button>
    </div>
  )
}

export default FileUpload
