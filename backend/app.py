from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
import sys
from learningGaps import analyze_and_export
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "llm")))
import query

import pandas as pd
import re
from io import BytesIO

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# A simple in-memory cache to store data between analysis and download
DATA_CACHE = {}

# Helper functions from analysis_ui.py
def natural_sort_key(s):
    return [int(text) if text.isdigit() else text.lower() for text in re.split('([0-9]+)', s)]

def to_multisheet_excel(sheets):
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        for sheet_name, df in sheets.items():
            df.to_excel(writer, sheet_name=sheet_name, index=False)
    return output.getvalue()


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

@app.route('/api/analyze', methods=['POST'])
def analyze_performance_data():
    """
    Handles the file upload and analysis for the performance dashboard.
    This is separate from your existing '/upload' route.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    try:
        # Read the file directly into pandas from memory
        df_raw = pd.read_excel(file)

        # All data processing logic from analysis_ui.py goes here
        df_all_data = df_raw[['login_id', 'activity_name', 'self learning seconds', 'attendance', 'attempt_number', 'calculated_score', 'total_marks']].copy()
        df_all_data.rename(columns={
            'self learning seconds': 'Self Learning Seconds', 'attempt_number': 'Attempt No',
            'calculated_score': 'Calculated Score', 'total_marks': 'Total Score'
        }, inplace=True)
        df_all_data['Self Learning Hours'] = df_all_data['Self Learning Seconds'] / 3600
        numeric_cols = ['Attempt No', 'Calculated Score', 'Total Score', 'Self Learning Hours']
        for col in numeric_cols:
            df_all_data[col] = pd.to_numeric(df_all_data[col], errors='coerce')
        df_all_data.dropna(subset=numeric_cols, inplace=True)
        df_user_summary = df_raw.groupby('login_id').agg(
            total_self_learning_seconds=('self learning seconds', 'sum'),
            total_attempts=('attempt_number', 'sum'),
            total_calculated_score=('calculated_score', 'sum'),
            total_marks=('total_marks', 'sum')
        ).reset_index()

        df_model_scores = df_raw.pivot_table(index='login_id', columns='activity_name', values='calculated_score', aggfunc='max').reset_index()

        session_id = str(uuid.uuid4())
        DATA_CACHE[session_id] = {
            'All_Data': df_all_data,
            'User_Summary': df_user_summary,
            'All_Model_Scores': df_model_scores
        }

        overall_learning_time = df_all_data.groupby('activity_name')['Self Learning Hours'].sum().reset_index()
        overall_chart_data = overall_learning_time.sort_values(by='Self Learning Hours', ascending=False)
        
        return jsonify({
            "session_id": session_id,
            "student_ids": sorted(df_all_data['login_id'].unique()),
            "all_student_data": df_all_data.to_dict(orient='records'),
            "overall_learning_chart": overall_chart_data.to_dict(orient='records')
        })

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/download/<session_id>', methods=['GET'])
def download_performance_report(session_id):
    """ Serves the generated multi-sheet Excel file. """
    if session_id not in DATA_CACHE:
        return "Report not found or session expired.", 404

    excel_data_bytes = to_multisheet_excel(DATA_CACHE.pop(session_id)) # Pop removes the item after getting it

    return send_file(
        BytesIO(excel_data_bytes),
        as_attachment=True,
        download_name="NEW_report.xlsx",
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@app.route("/health")
def health():
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
