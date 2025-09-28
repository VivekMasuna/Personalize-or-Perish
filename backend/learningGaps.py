import pandas as pd
import numpy as np
from collections import defaultdict
import json
import os

def analyze_learning_gaps(file_path):
    """
    Analyze learning gaps from an Excel file and return structured results
    """
    # Load the data from the provided file path
    df = pd.read_excel(file_path)
    results = {}

    # ===== COHORT-LEVEL ANALYSIS =====
    cohort_analysis = {}

    # 1. Question-wise performance (this doesn't need topic mapping)
    question_performance = df.groupby('Question ID').agg({
        'Answer Status': lambda x: (x == 'Correct').mean(),
        'Login ID': 'nunique',  # Number of students who attempted
        'Question Text': 'first'  # Include the actual question text
    }).rename(columns={'Answer Status': 'Accuracy', 'Login ID': 'Students Attempted'})

    # 3. Time analysis (are students rushing or struggling?)
    time_analysis = df.groupby('Question ID')['TimeSpent (InSeconds)'].agg(['mean', 'median', 'std'])

    # 4. Identify weakest questions (accuracy < 70%)
    weak_questions = question_performance[question_performance['Accuracy'] < 0.7]

    cohort_analysis = {
        'question_wise': question_performance,
        'time_analysis': time_analysis,
        'weak_questions': weak_questions,
    }

    # ===== INDIVIDUAL STUDENT ANALYSIS =====
    student_analysis = {}

    for student_id in df['Login ID'].unique():
        student_data = df[df['Login ID'] == student_id]

        # Overall performance
        total_questions = len(student_data)
        correct_answers = (student_data['Answer Status'] == 'Correct').sum()
        overall_accuracy = correct_answers / total_questions if total_questions > 0 else 0

        # Question-wise performance
        student_question_performance = student_data.groupby('Question ID').agg({
            'Answer Status': lambda x: (x == 'Correct').mean(),
            'Question Text': 'first'
        }).rename(columns={'Answer Status': 'Accuracy'})

        # Identify weak areas (accuracy < 60%)
        weak_questions_student = student_question_performance[student_question_performance['Accuracy'] < 0.6]

        # Time analysis (compare with cohort average)
        student_time_vs_cohort = {}
        for qid in student_data['Question ID'].unique():
            student_time = student_data[student_data['Question ID'] == qid]['TimeSpent (InSeconds)'].mean()
            cohort_time = time_analysis.loc[qid, 'mean'] if qid in time_analysis.index else student_time
            student_time_vs_cohort[qid] = {
                'student_time': student_time,
                'cohort_time': cohort_time,
                'difference': student_time - cohort_time
            }

        student_analysis[student_id] = {
            'overall_accuracy': overall_accuracy,
            'weak_questions': weak_questions_student,
            'time_comparison': student_time_vs_cohort,
            'total_attempts': student_data['Attempt ID'].max()  # How many times they took the test
        }

    results['cohort'] = cohort_analysis
    results['students'] = student_analysis

    return results

def convert_to_json_serializable(data):
    """
    Convert pandas DataFrames and numpy types to JSON serializable format
    """
    if isinstance(data, dict):
        return {str(key): convert_to_json_serializable(value) for key, value in data.items()}
    elif isinstance(data, pd.DataFrame):
        # Convert DataFrame to dict and ensure all keys are strings
        df_dict = data.to_dict('index')
        return {str(key): convert_to_json_serializable(value) for key, value in df_dict.items()}
    elif isinstance(data, pd.Series):
        # Convert Series to dict and ensure all keys are strings
        series_dict = data.to_dict()
        return {str(key): convert_to_json_serializable(value) for key, value in series_dict.items()}
    elif isinstance(data, (np.integer, np.int64, np.int32, np.int16, np.int8)):
        return int(data)
    elif isinstance(data, (np.floating, np.float64, np.float32, np.float16)):
        return float(data)
    elif isinstance(data, np.bool_):
        return bool(data)
    elif isinstance(data, np.ndarray):
        return data.tolist()
    elif isinstance(data, list):
        return [convert_to_json_serializable(item) for item in data]
    elif isinstance(data, tuple):
        return tuple(convert_to_json_serializable(item) for item in data)
    else:
        return data

def analyze_and_export(file_path):
    """
    Main function to analyze learning gaps and return JSON-serializable results
    """
    try:
        # Run the analysis
        analysis_results = analyze_learning_gaps(file_path)
        
        # Convert to JSON serializable format
        json_results = convert_to_json_serializable(analysis_results)
        
        # Additional validation to ensure JSON serializability
        import json
        json.dumps(json_results)  # This will raise an error if not serializable
        
        return {
            'success': True,
            'data': json_results
        }
    except Exception as e:
        import traceback
        return {
            'success': False,
            'error': f"Analysis failed: {str(e)}\nTraceback: {traceback.format_exc()}"
        }

# Generate reports without topic mapping
def generate_cohort_report(analysis_results):
    cohort = analysis_results['cohort']

    report = []
    report.append("=== COHORT LEARNING GAPS ANALYSIS ===")
    report.append(f"Total Students: {len(analysis_results['students'])}")
    report.append("")

    # Weakest Questions
    if not cohort['weak_questions'].empty:
        report.append("🚨 WEAKEST QUESTIONS (Class Accuracy < 70%):")
        for qid, row in cohort['weak_questions'].iterrows():
            accuracy_pct = row['Accuracy'] * 100
            question_text = row['Question Text'][:100] + "..." if len(row['Question Text']) > 100 else row['Question Text']
            report.append(f"   Question {qid}: {accuracy_pct:.1f}% correct")
            report.append(f"      '{question_text}'")
        report.append("")

    # Time Analysis Insights
    report.append("⏱️ TIME ANALYSIS (Questions taking significantly longer):")
    time_threshold = cohort['time_analysis']['mean'].quantile(0.75)  # Top 25% slowest
    slow_questions = cohort['time_analysis'][cohort['time_analysis']['mean'] > time_threshold]

    for qid, row in slow_questions.iterrows():
        avg_time = row['mean']
        question_text = cohort['question_wise'].loc[qid, 'Question Text']
        short_text = question_text[:80] + "..." if len(question_text) > 80 else question_text
        report.append(f"   Question {qid}: {avg_time:.1f} seconds - '{short_text}'")

    return "\n".join(report)

def generate_student_reports(analysis_results, top_n=None): # Changed default to None
    student_analysis = analysis_results['students']

    # Get all students or top N struggling students
    student_list = sorted(
        [(sid, data['overall_accuracy']) for sid, data in student_analysis.items()],
        key=lambda x: x[1]
    )

    if top_n is not None:
        student_list = student_list[:top_n]


    reports = []

    for student_id, accuracy in student_list:
        student_data = student_analysis[student_id]

        report = []
        report.append(f"=== STUDENT: {student_id} ===")
        report.append(f"Overall Accuracy: {accuracy:.1%}")
        report.append(f"Total Attempts: {student_data['total_attempts']}")
        report.append("")

        # Weak questions with actual question text
        if not student_data['weak_questions'].empty:
            report.append("❌ WEAK QUESTIONS:")
            for qid, row in student_data['weak_questions'].iterrows():
                accuracy_pct = row['Accuracy'] * 100
                question_text = row['Question Text'][:80] + "..." if len(row['Question Text']) > 80 else row['Question Text']
                report.append(f"   Question {qid}: {accuracy_pct:.1f}% correct")
                report.append(f"      '{question_text}'")
            report.append("")

        # Time analysis (where they're spending too much/too little time)
        report.append("⏰ TIME SPENT (vs Class Average):")
        time_issues = []
        for qid, time_data in student_data['time_comparison'].items():
            diff = time_data['difference']
            if abs(diff) > 10:  # Significant difference
                status = "⬆️ Much slower" if diff > 0 else "⬇️ Much faster"
                time_issues.append((qid, status, abs(diff)))

        # Show top 3 time issues
        for qid, status, diff in sorted(time_issues, key=lambda x: x[2], reverse=True)[:3]:
            report.append(f"   Question {qid}: {status} ({diff:.1f}s difference)")

        reports.append("\n".join(report))

    return reports

# Additional: Export to Excel for facilitator
def export_to_excel(analysis_results, filename='learning_gaps_analysis.xlsx'):
    with pd.ExcelWriter(filename, engine='openpyxl') as writer:
        # Cohort-level summary
        cohort_df = analysis_results['cohort']['question_wise'].copy()
        cohort_df['Accuracy'] = cohort_df['Accuracy'] * 100
        cohort_df['Is_Weak'] = cohort_df['Accuracy'] < 70
        cohort_df.to_excel(writer, sheet_name='Cohort_Performance')

        # Student-level summary
        student_data = []
        for student_id, data in analysis_results['students'].items():
            weak_question_count = len(data['weak_questions'])
            student_data.append({
                'Student_ID': student_id,
                'Overall_Accuracy': data['overall_accuracy'] * 100,
                'Weak_Question_Count': weak_question_count,
                'Total_Attempts': data['total_attempts']
            })

        student_df = pd.DataFrame(student_data)
        student_df.to_excel(writer, sheet_name='Student_Summary', index=False)

        # Detailed student performance
        detailed_data = []
        for student_id, data in analysis_results['students'].items():
            for qid, q_data in data['time_comparison'].items():
                detailed_data.append({
                    'Student_ID': student_id,
                    'Question_ID': qid,
                    'Student_Time': q_data['student_time'],
                    'Cohort_Time': q_data['cohort_time'],
                    'Time_Difference': q_data['difference']
                })

        detailed_df = pd.DataFrame(detailed_data)
        detailed_df.to_excel(writer, sheet_name='Detailed_Timing', index=False)

    print(f"Analysis exported to {filename}")

# Keep the original functionality for direct execution
if __name__ == "__main__":
    # This will only run if the script is executed directly
    df = pd.read_excel('Formative_M1.xlsx')
    analysis_results = analyze_learning_gaps('Formative_M1.xlsx')
    
    # Generate and print reports
    print(generate_cohort_report(analysis_results))
    print("\n" + "="*80 + "\n")

    student_reports = generate_student_reports(analysis_results) # Removed top_n=5
    for i, report in enumerate(student_reports, 1):
        print(f"STUDENT REPORT {i}:")
        print(report)
        print("\n" + "="*80 + "\n")

    # Export to Excel
    export_to_excel(analysis_results)