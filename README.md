# SmartProof AI - Marketing Compliance System

> **🚀 New here? Start with [docs/START_HERE.md](docs/START_HERE.md) for a 30-minute quickstart!**

[![Status](https://img.shields.io/badge/Status-Ready%20for%20Development-green)]()
[![Version](https://img.shields.io/badge/Version-1.0.0%20PoC-blue)]()

## Overview
SmartProof is an AI-powered solution that automates Toyota's product information search and marketing asset compliance processes. Built on Microsoft Azure, it combines intelligent automation with human validation to reduce manual review effort, shorten approval timelines, and increase accuracy.

## Project Status
**Version:** 1.0.0 (PoC)
**Status:** In Development
**Last Updated:** 2025-10-23

## Architecture

### System Components
1. **Frontend (React SPA)** - User interface for upload, search, and compliance review
2. **Backend (Azure Functions)** - Serverless API orchestration
3. **AI Agents (5 Total)** - Intelligent processing pipeline
4. **Data Layer** - Azure Blob Storage + AI Search
5. **Infrastructure** - Azure Bicep IaC templates

### AI Agents
1. **Orchestrator Agent** - Coordinates entire workflow
2. **Parser Agent** - Extracts text, tables, and images from PDFs using GPT-4o Vision
3. **Image Analysis Agent** - Visual compliance (logos, quality, brand colors) using GPT-4o Vision
4. **Compliance Agent** - Checks compliance against Australian standards using GPT-4o
5. **Knowledge Base Builder Agent** - Indexes documents for search with AI metadata extraction

## Technology Stack

### Frontend
- React 18 + TypeScript
- Material-UI (MUI) - Neutral color design system
- React Router - Navigation
- Axios - HTTP client
- MSAL.js - Azure AD authentication
- Vite - Build tool

### Backend
- Azure Functions (Node.js/TypeScript)
- Azure Storage SDK
- Winston - Logging

### AI Services
- Azure OpenAI - GPT-4o (with vision capabilities for document parsing and image analysis)
- Azure OpenAI Embeddings - text-embedding-ada-002 (1536-dimensional vectors for semantic search)
- Azure AI Search - Hybrid search index (keyword + semantic + vector)

**Note:** GPT-4o handles all document parsing, image analysis, and metadata extraction.

### Infrastructure
- Azure Bicep - Infrastructure as Code
- GitHub Actions - Manual deployment workflows
- Application Insights - Monitoring

## Project Structure

For a detailed directory structure and organization, see [DIRECTORY-STRUCTURE.md](DIRECTORY-STRUCTURE.md)

```
paddock/
├── README.md                   # This file
├── DIRECTORY-STRUCTURE.md      # Detailed directory structure
├── start-servers.sh           # Start backend and frontend servers
├── backend/                   # Azure Functions backend
├── frontend/                  # React SPA
├── ai-agents/                 # AI agent implementations
├── infrastructure/            # Bicep IaC templates
├── scripts/                   # Utility and deployment scripts
│   └── test-scripts/          # Test automation scripts
├── tests/                     # End-to-end tests
├── docs/                      # Documentation
│   └── test-results/          # Test reports and results
├── logs/                      # Application logs (gitignored)
└── test-documents/            # Sample PDFs for testing
```

## 🚀 Quick Start

**Option 1: One-Command Deploy (Recommended)**
```bash
# Complete deployment from scratch (20-25 min)
./scripts/deploy-local.sh dev

# Then start the servers:
cd backend && npm start      # Terminal 1
cd frontend && npm run dev   # Terminal 2
```

**Option 2: Manual Step-by-Step**
```bash
# 1. Provision Azure resources (15 min)
./scripts/provision-azure-resources.sh dev

# 2. Setup local environment (5 min)
./scripts/setup-local.sh

# 3. Configure (see docs/WHERE_TO_CONFIGURE.md)
#    - backend/local.settings.json
#    - frontend/.env

# 4. Start development
cd backend && npm start      # Terminal 1
cd frontend && npm run dev   # Terminal 2

# 5. Open http://localhost:3000
```

**📖 For detailed setup instructions, see [docs/START_HERE.md](docs/START_HERE.md)**

## Prerequisites
- Node.js 18+
- Azure CLI
- Azure Functions Core Tools
- Azure subscription

### Environment Variables

Copy `.env.example` files and configure:

**Frontend (.env)**
```
VITE_API_BASE_URL=http://localhost:7071/api
VITE_AZURE_AD_CLIENT_ID=<your-client-id>
VITE_AZURE_AD_TENANT_ID=<your-tenant-id>
```

**Backend (local.settings.json)**
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "<storage-connection-string>",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AZURE_OPENAI_ENDPOINT": "<openai-endpoint>",
    "AZURE_OPENAI_KEY": "<openai-key>",
    "AZURE_OPENAI_DEPLOYMENT_GPT4": "gpt-4o",
    "AZURE_OPENAI_EMBEDDING_DEPLOYMENT": "text-embedding-ada-002",
    "AZURE_STORAGE_CONNECTION_STRING": "<storage-connection-string>",
    "AZURE_STORAGE_ACCOUNT_NAME": "<storage-account>",
    "AZURE_AI_SEARCH_ENDPOINT": "<search-endpoint>",
    "AZURE_AI_SEARCH_KEY": "<search-key>",
    "AZURE_AI_SEARCH_INDEX_NAME": "smartproof-product-info"
  }
}
```

## Deployment

### Manual Deployment

```bash
# Deploy infrastructure
./scripts/deploy.sh --environment dev --deploy-infra

# Deploy backend
./scripts/deploy.sh --environment dev --deploy-backend

# Deploy frontend
./scripts/deploy.sh --environment dev --deploy-frontend
```

### GitHub Actions (Manual Trigger)

1. Go to Actions tab in GitHub
2. Select "Manual Deploy" workflow
3. Click "Run workflow"
4. Choose environment (dev/staging)
5. Confirm deployment

## Key Features

### PoC Capabilities
- ✅ Upload PDF marketing materials
- ✅ Extract text, tables, and images using GPT-4o Vision
- ✅ AI-powered product information search with vector embeddings
- ✅ Automatic knowledge base indexing with metadata extraction
- ✅ Hybrid search (keyword + semantic + vector similarity)
- ✅ Automated compliance checking (text + visual)
- ✅ Logo detection and brand color verification
- ✅ Image quality assessment
- ✅ Generate HTML/PDF compliance reports
- ✅ Role-based access control
- ✅ Audit logging

### Knowledge Base Features
- ✅ **Automatic Indexing** - Documents indexed during compliance workflow
- ✅ **AI Metadata Extraction** - GPT-4o extracts model, category, standards, certifications
- ✅ **Vector Embeddings** - text-embedding-ada-002 (1536 dimensions)
- ✅ **Hybrid Search** - Combines keyword, semantic, and vector similarity
- ✅ **Natural Language Queries** - Search using plain English
- ✅ **Relevance Scoring** - Smart ranking with semantic understanding

### Image Analysis (PoC)
- Logo detection and positioning using GPT-4o Vision
- Image quality checks (DPI, blur)
- Brand color verification
- Text extraction from images (OCR)
- Object detection (vehicles, products)
- GPT-4o Vision brand guideline compliance

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## Documentation

### Getting Started
- [🚀 Quick Start Guide](docs/START_HERE.md) - 30-minute setup walkthrough
- [⚙️ Configuration Guide](docs/WHERE_TO_CONFIGURE.md) - Where to configure all settings
- [💻 Local Development](docs/LOCAL_DEVELOPMENT_GUIDE.md) - Development environment setup
- [📋 Setup Summary](docs/SETUP_SUMMARY.md) - Complete setup overview

### Reference
- [📖 Build Complete](docs/BUILD_COMPLETE.md) - Complete implementation summary
- [📜 Development History](docs/HISTORY.md) - Project development timeline
- [📊 Implementation Status](docs/IMPLEMENTATION_STATUS.md) - Feature completion status

### Testing
- [🧪 Test Suite](tests/README.md) - Comprehensive testing guide
- [📦 Test Fixtures](tests/fixtures/README.md) - Test data and samples

## Security

- Azure AD authentication
- Role-based access control (RBAC)
- Managed Identity for service-to-service auth
- Data encryption at rest and in transit
- Audit logging for all operations

## Monitoring

- Application Insights for telemetry
- Azure Monitor for alerts
- Structured JSON logging
- Performance metrics dashboards

## Support

For issues and questions:
- Create GitHub issue
- Contact: [Your contact info]

## License

Proprietary - Toyota Motor Corporation

## Contributors

- Development Lead: Sam Poursoltan

---

**Built with Azure AI** | **Powered by GPT-4**
