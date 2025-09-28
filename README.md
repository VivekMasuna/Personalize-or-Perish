# Learning Gaps Analysis Dashboard

A comprehensive dashboard for analyzing student learning gaps from Excel assessment data. Built with React frontend and Flask backend.

## Features

- **File Upload**: Drag & drop Excel file upload with validation
- **Real-time Analysis**: Automatic processing of student assessment data
- **Interactive Visualizations**: Multiple chart types for different analysis perspectives
- **Modern UI**: Clean, responsive design with gradient backgrounds and smooth animations
- **Comprehensive Reports**: Cohort-level and individual student analysis

## Dashboard Sections

1. **Overview**: Summary statistics and question performance charts
2. **Student Analysis**: Individual student performance and distribution
3. **Time Analysis**: Question timing patterns and insights
4. **Weak Questions**: Identification of problematic questions with detailed breakdown

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the Flask server:
   ```bash
   python app.py
   ```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`

## Usage

1. Open your browser and go to `http://localhost:5173`
2. Upload an Excel file containing student assessment data
3. Wait for the analysis to complete
4. Explore the interactive dashboard with different tabs and visualizations
5. Use the "Upload New File" button to analyze different datasets

## Excel File Format

The Excel file should contain the following columns:
- `Login ID`: Student identifier
- `Question ID`: Question identifier
- `Answer Status`: "Correct" or "Incorrect"
- `TimeSpent (InSeconds)`: Time taken to answer
- `Question Text`: The actual question text
- `Attempt ID`: Attempt number

## Technology Stack

- **Frontend**: React 19, Vite, Recharts, React Dropzone
- **Backend**: Flask, Pandas, NumPy, OpenPyXL
- **Styling**: CSS3 with modern gradients and animations

## API Endpoints

- `GET /` - API status
- `POST /upload` - Upload and analyze Excel file
- `GET /health` - Health check

## Development

The project is structured as follows:
- `frontend/` - React application
- `backend/` - Flask API server
- `backend/learningGaps.py` - Core analysis logic
- `backend/app.py` - Flask routes and file handling
