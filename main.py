from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
import tempfile

# Import your AI Logic (Logic from previous steps)
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from dotenv import load_dotenv

load_dotenv()

# --- 1. Setup the Server ---
app = FastAPI(title="RFP Analyst API", version="1.0")

# Enable CORS (Allows React to talk to Python)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your React app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to hold the Vector DB in memory (simple version)
# In production, you would use Pinecone (Cloud DB) so it persists on restart.
vector_store = None

# --- 2. Data Models (The Shape of Requests) ---
class ChatRequest(BaseModel):
    question: str

# --- 3. The API Endpoints ---

@app.get("/")
def read_root():
    return {"status": "Active", "service": "RFP Agent API"}

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    global vector_store
    
    # Validation: Is it a PDF?
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    # Save temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        shutil.copyfileobj(file.file, tmp_file)
        tmp_path = tmp_file.name
    
    try:
        # Ingestion Logic
        print(f"📄 Processing {file.filename}...")
        loader = PyPDFLoader(tmp_path)
        docs = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        vector_store = FAISS.from_documents(splits, embeddings)
        
        return {"message": "PDF processed successfully", "chunks": len(splits)}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.remove(tmp_path) # Clean up

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    global vector_store
    
    if vector_store is None:
        raise HTTPException(status_code=400, detail="Please upload a PDF first.")
    
    question = request.question
    
    # --- ROUTER LOGIC ---
    llm_router = ChatGroq(model="llama-3.1-8b-instant", temperature=0)
    
    router_prompt = f"""
    Classify the user's question into 'TECHNICAL' or 'LEGAL'.
    If it mentions cost/risk/business -> LEGAL.
    If it mentions code/architecture -> TECHNICAL.
    Question: {question}
    Return ONLY the category word.
    """
    category = llm_router.invoke(router_prompt).content.strip().upper()
    if "LEGAL" in category: category = "LEGAL"
    else: category = "TECHNICAL"
    
    # --- RAG LOGIC ---
    retriever = vector_store.as_retriever()
    docs = retriever.invoke(question)
    context = "\n".join([d.page_content for d in docs])
    
    # --- GENERATION LOGIC ---
    if category == "TECHNICAL":
        system = "You are a Technical Architect. Answer with technical depth."
    else:
        system = "You are a Business Analyst. Answer focusing on risk and value."
        
    final_prompt = f"""
    {system}
    Context: {context}
    Question: {question}
    Answer:
    """
    
    response = llm_router.invoke(final_prompt)
    
    return {
        "category": category,
        "answer": response.content
    }

# To run: uvicorn main:app --reload