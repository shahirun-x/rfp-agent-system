import os
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from ingest_test import ingest_pdf  # We import your previous work!

# 1. Load Environment
load_dotenv()

def create_vector_db():
    # A. Ingest the File (Get the 39 chunks)
    pdf_name = "sample_rfp.pdf"
    chunks = ingest_pdf(pdf_name)
    
    if not chunks:
        print(" No chunks found. Check your PDF.")
        return

    # B. Initialize the "Translator" (Embeddings Model)
    # This model turns text into numbers. We use a free, powerful one from HuggingFace.
    print(" Initializing Embedding Model (This might take a minute)...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    # C. Create the Database
    print(" Creating Vector Database...")
    vector_store = FAISS.from_documents(chunks, embeddings)

    # D. Save it locally (Persist to disk)
    vector_store.save_local("rfp_index")
    print(" Success! Memory saved to 'rfp_index' folder.")

if __name__ == "__main__":
    create_vector_db()