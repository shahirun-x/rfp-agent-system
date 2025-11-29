# Intelligent RFP Analyst Agent

## Project Overview

The Intelligent RFP Analyst Agent is an autonomous Multi-Agent System designed to streamline the analysis of Request for Proposals (RFPs) for Sales Engineering and Legal teams. Unlike standard chatbots, this system employs an Agentic Workflow that autonomously categorizes user intent, routes queries to specialized sub-agents (Technical vs. Legal), and generates structured executive briefs with citations.

The system leverages **Retrieval Augmented Generation (RAG)** using Cloud-Native Vector Databases (Pinecone) and advanced Computer Vision parsing (LlamaParse) to accurately interpret complex PDF tables and charts.

## Key Features

- **Multi-Agent Orchestration**: Implements a Semantic Router that dynamically classifies queries. Technical questions are routed to a "Solutions Architect" persona, while risk/cost questions are routed to a "Legal Analyst" persona.
- **Vision-Enabled RAG**: Utilizes LlamaParse to convert unstructured PDF data (including tables and charts) into markdown-structured data, enabling high-accuracy retrieval.
- **Cloud-Native Memory**: Stores vector embeddings in Pinecone (Serverless), ensuring scalability and persistence across sessions.
- **Contextual Memory**: Maintains conversation history to handle follow-up questions effectively.
- **Source Citations**: Enhances trust by providing specific page references for every AI-generated answer.
- **Automated "Writer" Agent**: Features an "Auto-Brief" mode that autonomously reads the document and drafts a comprehensive Executive Summary.
- **Human-in-the-Loop Governance**: Includes a Manager Review workflow allowing users to reject, refine, and edit AI-generated drafts before finalization.
- **Report Export**: Capabilities to export chat history and generated briefs into formatted Word documents (.docx).

## System Architecture

The application follows a decoupled client-server architecture:

1.  **Frontend**: React (Vite) application handling the chat interface, file uploads, and state management.
2.  **Backend**: FastAPI server handling orchestration, routing, and database connections.
3.  **Database**: Pinecone (Vector Store) for storing document embeddings.
4.  **AI Engine**: Groq (Llama-3.1-8b-instant) for high-speed inference and reasoning.
5.  **Ingestion Engine**: LlamaParse for document processing and OCR.

## Tech Stack

- **Orchestration**: LangChain, LangGraph
- **LLM Provider**: Groq
- **Vector Database**: Pinecone
- **Document Parsing**: LlamaParse (LlamaIndex)
- **Backend Framework**: FastAPI (Python)
- **Frontend Framework**: React, Vite, Tailwind CSS
- **Utilities**: Python-docx, Pydantic, Axios

## Prerequisites

- Python 3.10 or higher
- Node.js (v18 or higher) and npm
- Git
- API Keys for:
    - Groq Cloud
    - Pinecone
    - LlamaCloud