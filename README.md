RFP Intelligent Analyst Agent
Project Overview
The RFP Intelligent Analyst is an autonomous Multi-Agent System designed to streamline the analysis of Request for Proposal (RFP) documents. Unlike traditional chatbots, this system utilizes an agentic workflow to semantically route user queries to specialized sub-agents (Technical vs. Legal), ensuring domain-specific accuracy.

The application leverages Retrieval-Augmented Generation (RAG) with vision-enabled document parsing to handle complex data structures like tables and charts. It features a full-stack architecture with a React frontend and a FastAPI backend, capable of automated report generation and human-in-the-loop (HITL) validation.

Key Features
Multi-Agent Orchestration: Implements a semantic router that classifies user intent and directs queries to either a "Technical Architect" agent or a "Legal/Compliance" agent.

Vision-Enabled RAG: Utilizes LlamaParse to accurately parse unstructured PDFs, including tables and charts, converting them into structured Markdown for the LLM.

Cloud-Native Memory: Stores vector embeddings in a serverless Pinecone database, ensuring persistence and scalability beyond local sessions.

Automated Content Generation: Includes a "Writer Agent" capable of drafting structured Executive Briefs and Risk Assessments automatically.

Human-in-the-Loop (HITL): Features a manager review workflow allowing users to reject, critique, and refine AI-generated drafts before finalization.

Contextual Memory: Retains conversation history to handle follow-up questions and complex reasoning chains.

Report Export: Functionality to compile chat history and generated briefs into a downloadable Microsoft Word (.docx) document.

System Architecture
The system follows a decoupled client-server architecture:

Frontend: A React application (Vite) provides the chat interface, file upload, and document review controls.

Backend: A FastAPI server handles API requests, file processing, and agent orchestration.

Orchestration Layer: Logic determines whether to retrieve context, generate text, or refine output based on user feedback.

Knowledge Base:

Ingestion: Documents are processed via LlamaParse.

Storage: Embeddings are generated using HuggingFace models and stored in Pinecone.

Inference: Groq (Llama-3) serves as the reasoning engine for all agents.

Technology Stack
Language: Python 3.10+, JavaScript (ES6+)

Frontend Framework: React, Vite, Tailwind CSS (concepts), Axios

Backend Framework: FastAPI, Uvicorn

LLM & Inference: Groq API (Llama-3.1-8b-instant)

Vector Database: Pinecone (Serverless)

Document Parsing: LlamaParse (LlamaIndex)

Orchestration: LangChain Core

Utilities: Pydantic, Python-docx, Nest Asyncio

Prerequisites
Before running the project, ensure you have the following installed:

Python 3.10 or higher

Node.js (v16 or higher) and npm

Git

You will also need API keys for:

Groq Cloud (LLM Inference)

Pinecone (Vector Database)

LlamaCloud (Document Parsing)

Installation & Setup
1. Clone the Repository
Bash

git clone https://github.com/your-username/rfp-agent-system.git
cd rfp-agent-system
2. Backend Configuration
Navigate to the root directory (where main.py is located).

Install Python Dependencies:

Bash

pip install -r requirements.txt
Configure Environment Variables: Create a file named .env in the root directory and add your credentials:

Code snippet

GROQ_API_KEY=your_groq_api_key
PINECONE_API_KEY=your_pinecone_api_key
LLAMA_CLOUD_API_KEY=your_llama_cloud_api_key
Start the Server:

Bash

uvicorn main:app --reload
The backend will start at http://127.0.0.1:8000.

3. Frontend Configuration
Open a new terminal and navigate to the frontend directory.

Navigate to Frontend:

Bash

cd frontend
Install Node Dependencies:

Bash

npm install
Update API URL (If deploying): If running locally, the default configuration works. If deploying, update API_URL in src/App.jsx.

Start the Application:

Bash

npm run dev
The frontend will start at http://localhost:5173.

Usage Guide
Ingestion: Open the application and upload a PDF document (e.g., an RFP or Technical Paper). Wait for the "Processed" confirmation.

Q&A: Type questions in the chat bar.

Ask about code or architecture to trigger the Technical Agent.

Ask about risks, costs, or compliance to trigger the Legal Agent.

Source Verification: Check the citations (Page Numbers) provided below each response.

Auto-Brief: Click the "Auto-Brief" button to generate an executive summary.

Review: If using the Auto-Brief, use the "Approve" or "Reject & Edit" buttons to refine the content.

Export: Click the "Export" button to download the entire session as a Word document.

Project Structure


rfp-agent-system/
├── frontend/                # React Frontend
│   ├── src/
│   │   ├── App.jsx          # Main UI Logic
│   │   ├── App.css          # Styling
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   └── vite.config.js
├── main.py                  # FastAPI Backend & Agent Logic
├── requirements.txt         # Python Dependencies
├── .env                     # API Secrets (Not committed)
├── .gitignore               # Git Ignore Rules
└── README.md                # Documentation