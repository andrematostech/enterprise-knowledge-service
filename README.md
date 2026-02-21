# KIVO — Enterprise Knowledge Infrastructure

KIVO is a multi-tenant knowledge platform that enables teams to build secure, AI-powered search and question-answering systems over private documents.

It allows organizations to upload internal files, index them into vector embeddings, and query them using Retrieval-Augmented Generation (RAG). KIVO provides both a production-ready backend API and a modern web interface for managing knowledge bases.

---

## 🧠 What Is KIVO?

KIVO is infrastructure for private AI knowledge systems.

Instead of sending your data to external tools, KIVO lets you:

- Upload internal documents
- Index them into a vector database
- Retrieve relevant context
- Generate grounded AI responses with citations

It is designed for:

- Startups building internal AI tools
- Enterprises managing structured knowledge
- Developer teams integrating AI into products
- Organizations requiring tenant-level isolation

---

## 🚀 What KIVO Does

KIVO enables:

### 📂 Multi-Tenant Knowledge Bases
Each knowledge base is isolated and can store its own documents, embeddings, and metadata.

### 📄 Document Ingestion Pipeline
- Upload PDF, DOC, TXT, or Markdown files
- Chunk documents into configurable sizes
- Generate embeddings
- Store vectors in Chroma
- Track ingestion metadata in PostgreSQL

### 🔍 Retrieval-Augmented Generation (RAG)
When querying:
1. The system retrieves the most relevant chunks
2. Sends context to the LLM
3. Generates a grounded response
4. Returns citations

### 🔐 Secure API Access
All API requests require an API key header:  
X-API-Key: <your_key>


### 🖥 Web Interface
A React-based dashboard for:
- Managing knowledge bases
- Uploading documents
- Running ingestion
- Querying AI
- Viewing usage metrics

---

## 🏗 System Architecture

```mermaid
flowchart LR
  Client[Client] -->|HTTP + X-API-Key| API[FastAPI]
  API --> Services[Service Layer]
  Services --> Repos[Repository Layer]
  Repos --> DB[(PostgreSQL)]
  Services --> Vector[Chroma Vector Store]
  Services --> Storage[Local File Storage]
  Services --> OpenAI[OpenAI API]
  WebUI[React UI] --> API