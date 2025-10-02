## 🔗 Project Links

- **Demo Video**: [Watch here](https://drive.google.com/file/d/1ukZno1Z5KC8AfFZYDWNC3PmhNvm3ZR7e/view?usp=drive_link)
- **Problem Statement**: [Access here](https://drive.google.com/file/d/16dYKi0u5i3H1zKgWCli4-Ls-ifgJRdoi/view?usp=sharing)
- **Project Presentation**: [Access here](https://drive.google.com/file/d/1HIZBTps1Nx9_lmjPCSG42Jhs9jbXjTg-/view?usp=drive_link)

## Dashboard Features

### 1. Learning Gaps Analysis Dashboard
- **Overview**: Summary statistics and question performance charts
- **Student Analysis**: Individual student performance and distribution
- **Time Analysis**: Question timing patterns and insights
- **Weak Questions**: Identification of problematic questions with detailed breakdown

### 2. Generate Support Materials Dashboard
- **AI-Powered Study Materials**: Generate personalized study content using LLM
- **Interactive Q&A**: Ask questions and get comprehensive educational responses
- **Markdown Rendering**: Beautifully formatted study materials with proper structure

### 3. Student's Learning Journey Dashboard
- **Overall Analysis**: Module-wise learning time analysis across all students
- **Individual Student Analysis**: Detailed performance tracking per student
- **Score Progression**: Track score improvement over attempts
- **Study Time Analysis**: Monitor self-learning hours per attempt

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

### LLM Setup (Optional - for Study Materials Generation)

1. Install Ollama and pull the embedding model:
   ```bash
   # Install Ollama (visit https://ollama.ai for installation)
   ollama pull nomic-embed-text
   ```

2. Set up environment variables:
   ```bash
   # Create .env file in the project root
   echo "GROQ_API_KEY=your_groq_api_key_here" > .env
   ```

3. The LLM components will be automatically available when the backend is running.

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

### Frontend
- **React 18.2.0** - UI framework
- **Vite 7.1.7** - Build tool and dev server
- **Chart.js 4.5.0** - Charting library
- **React-ChartJS-2 5.3.0** - React wrapper for Chart.js
- **Plotly.js 3.1.0** - Interactive plotting library
- **React-Plotly.js 2.6.0** - React wrapper for Plotly
- **React-Dropzone 14.3.8** - File upload component
- **Axios 1.12.2** - HTTP client
- **React-Markdown 10.1.0** - Markdown rendering
- **CSS3** - Styling with modern gradients and animations

### Backend
- **Flask** - Web framework
- **Flask-CORS** - Cross-origin resource sharing
- **Pandas** - Data manipulation and analysis
- **NumPy** - Numerical computing
- **OpenPyXL** - Excel file processing
- **Python-dotenv** - Environment variable management

### LLM & AI Stack
- **LangChain** - LLM application framework
- **LangChain-Community** - Community integrations
- **LangChain-Groq** - Groq LLM integration
- **LangChain-Ollama** - Ollama integration
- **Groq** - Open source LLM provider (OpenAI/gpt-oss-120b)
- **Ollama** - Local model management
- **Nomic-Embed-Text** - Embedding model for vectorization
- **ChromaDB** - Vector database for embeddings
- **Tesseract OCR** - Image text extraction
- **Pillow (PIL)** - Image processing
- **Python-PPTX** - PowerPoint presentation processing

## API Endpoints

### Learning Gaps Analysis
- `GET /` - API status
- `POST /upload` - Upload and analyze Excel file
- `GET /health` - Health check

### Study Materials Generation
- `POST /query` - Generate study materials using LLM
- `POST /api/analyze` - Analyze performance data for learning journey
- `GET /api/download/<session_id>` - Download generated reports

## Development

The project is structured as follows:
- `frontend/` - React application with multiple dashboards
- `backend/` - Flask API server with learning gaps analysis
- `llm/` - LLM and AI components for study material generation
- `backend/learningGaps.py` - Core learning gaps analysis logic
- `backend/app.py` - Flask routes and file handling
- `llm/query.py` - LLM query processing and study material generation
- `llm/all_text_extraction.py` - Text extraction from presentations and images
- `llm/embedding_using_nomic.py` - Vector embedding generation
