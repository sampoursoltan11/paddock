# Smart AI - Marketing Compliance System

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
3. **AI Agents (6 Total)** - Intelligent processing pipeline
4. **Data Layer** - Azure Blob Storage + AI Search
5. **Infrastructure** - Azure Bicep IaC templates

### AI Agents
1. **Orchestrator Agent** - Coordinates entire workflow
2. **Search Agent** - Retrieval-Augmented Generation for product info
3. **Parser Agent** - Extracts text, tables, and images from PDFs
4. **Image Analysis Agent** - Visual compliance (logos, quality, brand colors)
5. **Compliance Agent** - Rule-based checks (brand, legal, PIT)
6. **Critic Agent** - Validates and summarizes results

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
- Azure AI Foundry - Agent orchestration
- Azure OpenAI - GPT-4 + GPT-4 Vision
- Azure Document Intelligence - PDF processing
- Azure AI Search - Product information index
- Azure Computer Vision - Image analysis

### Infrastructure
- Azure Bicep - Infrastructure as Code
- GitHub Actions - Manual deployment workflows
- Application Insights - Monitoring

## Project Structure

```
smartproof-poc/
├── frontend/              # React SPA
├── backend/               # Azure Functions
├── ai-agents/             # 6 AI agents
├── infrastructure/        # Bicep templates
├── scripts/               # Deployment scripts
├── .github/workflows/     # CI/CD pipelines
├── docs/                  # Documentation
└── tests/                 # Integration tests
```

## 🚀 Quick Start

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
    "AZURE_STORAGE_ACCOUNT": "<storage-account>",
    "AZURE_AI_SEARCH_ENDPOINT": "<search-endpoint>",
    "AZURE_AI_SEARCH_KEY": "<search-key>",
    "AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT": "<doc-intel-endpoint>",
    "AZURE_DOCUMENT_INTELLIGENCE_KEY": "<doc-intel-key>",
    "AZURE_COMPUTER_VISION_ENDPOINT": "<vision-endpoint>",
    "AZURE_COMPUTER_VISION_KEY": "<vision-key>"
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
- ✅ Extract text, tables, and images
- ✅ AI-powered product information search
- ✅ Automated compliance checking (text + visual)
- ✅ Logo detection and brand color verification
- ✅ Image quality assessment
- ✅ Generate HTML/PDF compliance reports
- ✅ Role-based access control
- ✅ Audit logging

### Image Analysis (PoC)
- Logo detection and positioning
- Image quality checks (DPI, blur)
- Brand color verification
- Text extraction from images (OCR)
- Object detection (vehicles, products)
- GPT-4V brand guideline compliance

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

- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Image Analysis Guide](docs/IMAGE-ANALYSIS.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Development History](docs/HISTORY.md)

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
