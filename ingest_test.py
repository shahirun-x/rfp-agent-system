import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 1. Load Secrets (Your API keys)
load_dotenv()

def ingest_pdf(pdf_path):
    print(f" Loading PDF from: {pdf_path}...")
    
    # Check if file exists
    if not os.path.exists(pdf_path):
        print(" Error: File not found. Did you upload it?")
        return None

    # A. Load the File
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()
    print(f" Loaded {len(docs)} pages.")

    # B. Split into Chunks (Crucial for RAG)
    # We create chunks of 1000 characters with 200 overlap
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    splits = text_splitter.split_documents(docs)
    
    print(f" Split into {len(splits)} chunks.")
    print("--- Example Chunk ---")
    print(splits[0].page_content[:200] + "...") # Show preview of first chunk
    return splits

if __name__ == "__main__":
    # REPLACE THIS with the name of the PDF you upload
    pdf_name = "sample_rfp.pdf" 
    ingest_pdf(pdf_name)