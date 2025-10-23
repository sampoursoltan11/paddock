# SmartProof AI - Quick Start Guide

## What We've Built So Far

This PoC project scaffolding includes:
- ✅ **Frontend (90% complete)** - Professional React SPA with Material-UI
- ✅ **Backend (40% complete)** - Azure Functions foundation
- ✅ **Documentation** - Comprehensive planning and tracking
- ⏳ **AI Agents (0%)** - Structure ready, implementation pending
- ⏳ **Infrastructure (0%)** - Bicep templates pending

## Project Structure

```
smartproof-poc/
├── frontend/              # React SPA (90% complete)
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Dashboard, Upload, Search, Compliance
│   │   ├── services/      # API clients
│   │   └── styles/        # Material-UI theme
│   └── package.json
│
├── backend/               # Azure Functions (40% complete)
│   ├── functions/         # API endpoints
│   ├── shared/            # Utilities (storage, logger, types)
│   └── package.json
│
├── ai-agents/             # 6 AI agents (structure only)
│   ├── orchestrator/
│   ├── search-agent/
│   ├── parser-agent/
│   ├── image-analysis-agent/
│   ├── compliance-agent/
│   └── critic-agent/
│
├── infrastructure/        # Bicep IaC (pending)
├── scripts/               # Deployment (pending)
└── docs/                  # Documentation
    ├── HISTORY.md         # Work history & decisions
    ├── IMPLEMENTATION_STATUS.md  # Current status
    └── QUICKSTART.md      # This file
```

## Getting Started (Local Development)

### Prerequisites
```bash
# Required tools
node --version    # Should be 18+
npm --version     # Should be 9+
az --version      # Azure CLI
func --version    # Azure Functions Core Tools
```

### 1. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your Azure AD credentials
# VITE_AZURE_AD_CLIENT_ID=your-client-id
# VITE_AZURE_AD_TENANT_ID=your-tenant-id
# VITE_API_BASE_URL=http://localhost:7071/api

# Start development server
npm run dev

# Frontend will run on http://localhost:3000
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create local settings
cp local.settings.json.example local.settings.json

# Edit local.settings.json with your Azure resource endpoints
# (You'll need to provision Azure resources first)

# Start Azure Functions locally
npm start

# Backend will run on http://localhost:7071
```

## What's Implemented

### Frontend Features ✅
1. **Dashboard Page**
   - Statistics cards (Total, Passed, Warnings, Failed)
   - Recent assets list
   - Common issues breakdown
   - Quick start guide

2. **Upload Page**
   - Drag-and-drop file upload
   - File validation (PDF, PNG, JPEG, max 50MB)
   - Metadata form (model, year, category)
   - Upload progress tracking
   - Processing status display

3. **Search Page**
   - Product information search
   - Results with relevance scoring
   - Filtering by model, year, category
   - Source citation

4. **Compliance Review Page**
   - Overall compliance status
   - Issue statistics
   - Text compliance issues with severity levels
   - Image compliance issues with analysis
   - Download HTML/PDF reports

5. **Layout & Navigation**
   - Professional sidebar navigation
   - User profile menu
   - Azure AD authentication (MSAL)
   - Responsive design (mobile-ready)

### Backend Features ✅
1. **Upload Asset Function**
   - POST /api/assets/upload
   - Multipart file upload
   - File validation
   - Blob storage integration
   - Workflow state initialization

2. **Shared Utilities**
   - Blob storage helpers (upload, download, list, delete)
   - Workflow state management
   - Structured logging (Winston)
   - API response formatting
   - TypeScript type definitions

### What's NOT Yet Implemented ⏳

**Backend Functions (need to create):**
- Process Asset (blob trigger)
- Search Product (GET /api/search/product)
- Get Compliance Report (GET /api/compliance/reports/:id)
- Download Report (GET /api/compliance/reports/:id/download)

**AI Agents (need to implement):**
- All 6 agents (orchestrator, search, parser, image-analysis, compliance, critic)
- Agent communication framework
- Integration with Azure AI services

**Infrastructure:**
- Bicep templates for all Azure resources
- Deployment scripts
- CI/CD GitHub Actions workflow

**Testing:**
- Unit tests
- Integration tests
- E2E tests with Playwright

## Next Development Steps

### Immediate Priority (This Week):
1. **Complete Backend Functions** (2-3 days)
   - Create 4 remaining Azure Functions
   - Add auth middleware
   - Implement request validation

2. **Start AI Agent Framework** (2 days)
   - Create base agent class
   - Implement state-based communication
   - Build orchestrator agent

### Following Priority (Next Week):
3. **Implement Core Agents** (5 days)
   - Parser Agent (Document Intelligence)
   - Image Analysis Agent (Computer Vision + GPT-4V)
   - Compliance Agent (rule engine)
   - Critic Agent (report generation)

4. **Infrastructure & Deployment** (3 days)
   - Create Bicep templates
   - Deploy to Azure dev environment
   - Test end-to-end workflow

## Azure Resources Needed

Before you can run the full application, you need to provision:

1. **Azure Storage Account** - For blob storage
2. **Azure Functions** - For backend APIs
3. **Azure App Service** - For frontend hosting
4. **Azure OpenAI** - For GPT-4 and GPT-4V
5. **Azure AI Search** - For product information retrieval
6. **Azure Document Intelligence** - For PDF parsing
7. **Azure Computer Vision** - For image analysis
8. **Azure Active Directory** - For authentication
9. **Application Insights** - For monitoring

**Estimated cost:** ~$235-450/month for dev environment

## Testing the Current Build

### Frontend Only (Mock Data):
```bash
cd frontend
npm run dev
# Visit http://localhost:3000
# Note: API calls will fail without backend
```

### Backend Only:
```bash
cd backend
npm start
# Test upload endpoint:
curl -X POST http://localhost:7071/api/assets/upload \
  -F "file=@test.pdf" \
  -F "model=Camry" \
  -F "year=2024"
```

## Documentation

- **[README.md](./README.md)** - Project overview
- **[docs/HISTORY.md](./docs/HISTORY.md)** - Complete development history
- **[docs/IMPLEMENTATION_STATUS.md](./docs/IMPLEMENTATION_STATUS.md)** - Detailed status
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - (To be created)
- **[docs/API.md](./docs/API.md)** - (To be created)

## Color Palette (UI Reference)

The application uses a professional neutral design:

- **Primary:** #2C3E50 (Dark slate blue)
- **Secondary:** #34495E (Charcoal gray)
- **Accent:** #3498DB (Soft blue for CTAs)
- **Success:** #27AE60 (Muted green)
- **Warning:** #F39C12 (Amber)
- **Error:** #E74C3C (Muted red)
- **Background:** #F5F7FA (Light gray)
- **Surface:** #FFFFFF (White)

## Key Technologies

**Frontend:**
- React 18 + TypeScript
- Material-UI (MUI)
- React Router
- React Query
- Axios
- MSAL (Azure AD)
- Vite

**Backend:**
- Azure Functions (Node.js)
- TypeScript
- Azure SDKs (Storage, OpenAI, Search, etc.)
- Winston (logging)

**AI:**
- Azure OpenAI (GPT-4, GPT-4V)
- Azure Document Intelligence
- Azure Computer Vision
- Azure AI Search
- Azure AI Foundry

## Support & Questions

For development questions or issues:
1. Check [IMPLEMENTATION_STATUS.md](./docs/IMPLEMENTATION_STATUS.md)
2. Review [HISTORY.md](./docs/HISTORY.md) for decisions
3. Create a GitHub issue

## License

Proprietary - Toyota Motor Corporation

---

**Project Started:** 2025-10-23
**Current Status:** Foundation Complete - Ready for Core Implementation
**Next Session:** Complete backend functions & start AI agents
