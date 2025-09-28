from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import sys
from learningGaps import analyze_and_export
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "llm")))
import query

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Create uploads directory if it doesn't exist
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/")
def home():
    return jsonify({"message": "Learning Gaps Analysis API", "status": "running"})

@app.route("/upload", methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Please upload an Excel file (.xlsx or .xls)'}), 400
        
        # Generate unique filename to avoid conflicts
        filename = str(uuid.uuid4()) + '_' + file.filename
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        print(f"Processing file: {filename}")
        
        # Analyze the uploaded file
        analysis_result = analyze_and_export(file_path)
        
        # Clean up the uploaded file
        try:
            os.remove(file_path)
        except:
            pass  # Ignore cleanup errors
        
        if analysis_result['success']:
            print("Analysis completed successfully")
            return jsonify(analysis_result['data'])
        else:
            print(f"Analysis failed: {analysis_result['error']}")
            return jsonify({'error': analysis_result['error']}), 500
            
    except Exception as e:
        import traceback
        error_msg = f'Server error: {str(e)}\nTraceback: {traceback.format_exc()}'
        print(error_msg)
        return jsonify({'error': error_msg}), 500

@app.route("/query", methods=["POST"])
def query_api():
    try:
        # Validate request data
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_query = data.get("query", "").strip()
        if not user_query:
            return jsonify({"error": "Query cannot be empty"}), 400
        
        # Log the query for debugging
        print(f"Received query: {user_query}")
        
        # Process the query using the query.py module
        try:
            answer = query.run_query(user_query)
            
            # Validate the response
            if not answer or not isinstance(answer, str):
                return jsonify({"error": "Invalid response from query processor"}), 500
            
            # Log successful response
            print(f"Query processed successfully. Response length: {len(answer)}")
            
            return jsonify({
                "answer": answer,
                "status": "success",
                "query": user_query
            })
            
        except Exception as query_error:
            print(f"Error in query processing: {str(query_error)}")
            return jsonify({
                "error": f"Failed to process query: {str(query_error)}"
            }), 500
            
    except Exception as e:
        import traceback
        error_msg = f'Server error: {str(e)}\nTraceback: {traceback.format_exc()}'
        print(error_msg)
        return jsonify({"error": "Internal server error"}), 500

@app.route("/health")
def health():
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
