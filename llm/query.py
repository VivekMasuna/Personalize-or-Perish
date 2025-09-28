# 3_query.py
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

load_dotenv()
if not os.getenv("GROQ_API_KEY"):
    raise ValueError("GROQ_API_KEY not found in .env file.")

embeddings = OllamaEmbeddings(model="nomic-embed-text")

llm = ChatGroq(
    model_name="openai/gpt-oss-120b",
    temperature=0.7
)

vectorstore = Chroma(
    persist_directory="./chroma_all_db",
    embedding_function=embeddings
)

prompt_template = """
You are an expert educational content creator and study material generator. Your role is to create comprehensive, well-structured study materials based on the provided context and user queries.

When a user asks a question or requests study materials, you should:

1. **Analyze the Context**: Use the provided context to understand the topic and relevant information
2. **Generate Study Materials**: Create comprehensive study materials that include:
   - Clear explanations of key concepts
   - Step-by-step solutions or processes
   - Examples and illustrations
   - 10 Practice questions or exercises
   - Summary points
   - Additional resources or references

3. **Structure Your Response**: Organize the content in a logical, easy-to-follow format using Markdown with:
   - Clear headings and subheadings (use #, ##, ###)
   - Bullet points for key information (use - or *)
   - Numbered steps for processes (use 1., 2., 3.)
   - Examples in separate sections
   - Summary or key takeaways
   - Use **bold** for emphasis and *italics* for important terms
   - Use `code blocks` for examples or formulas
   - Use > blockquotes for important notes or tips

4. **Educational Focus**: Ensure all content is:
   - Accurate and factually correct
   - Appropriate for the learning level
   - Engaging and easy to understand
   - Practical and applicable

5. **Format Requirements**: Always format your response using proper Markdown syntax for:
   - Headers (# ## ###)
   - Lists (- or 1.)
   - Bold (**text**)
   - Italics (*text*)
   - Code (`code`)
   - Blockquotes (> text)

Context: {context}
User Query/Question: {question}

Generate comprehensive study materials in Markdown format:
"""
PROMPT = PromptTemplate(
    template=prompt_template, input_variables=["context", "question"]
)

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 3}),
    chain_type_kwargs={"prompt": PROMPT},
    return_source_documents=True
)

# Function to handle queries
def run_query(query: str) -> str:
    try:
        if not query.strip():
            return "Please enter a valid query."
        
        print(f"Processing query: {query}")
        
        # Invoke the QA chain
        result = qa_chain.invoke({"query": query})
        
        # Extract the answer
        answer = result.get("result", "")
        
        if not answer:
            return "I couldn't generate a response for your query. Please try rephrasing your question or ask about a different topic."
        
        # Add some formatting to make the response more readable
        formatted_answer = format_response(answer)
        
        print(f"Query processed successfully. Response generated.")
        return formatted_answer
        
    except Exception as e:
        error_msg = f"Error processing query: {str(e)}"
        print(error_msg)
        return f"I encountered an error while processing your query. Please try again or rephrase your question. Error: {str(e)}"

def format_response(response: str) -> str:
    """Format the response to make it more readable for study materials with proper Markdown formatting"""
    import re
    
    # Clean up the response
    formatted = response.strip()
    
    # Ensure proper spacing around markdown headers
    formatted = re.sub(r'\n(#{1,6}\s)', r'\n\n\1', formatted)
    
    # Ensure proper spacing around lists
    formatted = re.sub(r'\n(\s*[-•*]\s)', r'\n\n\1', formatted)
    formatted = re.sub(r'\n(\s*\d+\.\s)', r'\n\n\1', formatted)
    
    # Ensure proper spacing around blockquotes
    formatted = re.sub(r'\n(>\s)', r'\n\n\1', formatted)
    
    # Ensure proper spacing around code blocks
    formatted = re.sub(r'\n(```)', r'\n\n\1', formatted)
    formatted = re.sub(r'(```)\n', r'\1\n\n', formatted)
    
    # Clean up excessive newlines (more than 2 consecutive)
    formatted = re.sub(r'\n{3,}', r'\n\n', formatted)
    
    # Ensure proper spacing after periods in the middle of sentences
    formatted = re.sub(r'\.([A-Z])', r'. \1', formatted)
    
    # Ensure proper spacing around horizontal rules
    formatted = re.sub(r'\n(---)', r'\n\n\1', formatted)
    formatted = re.sub(r'(---)\n', r'\1\n\n', formatted)
    
    return formatted
