# Project Directory Structure

This document describes the organized directory structure of the SmartProof AI project.

## Root Directory

```
paddock/
├── README.md                   # Main project documentation
├── DIRECTORY-STRUCTURE.md      # This file
├── .gitignore                  # Git ignore rules
├── playwright.config.ts        # End-to-end test configuration
├── start-servers.sh           # Script to start backend and frontend servers
│
├── backend/                   # Azure Functions backend
├── frontend/                  # React frontend application
├── ai-agents/                 # AI agent implementations
├── infrastructure/            # Azure infrastructure (Bicep templates)
├── scripts/                   # Utility scripts
├── tests/                     # End-to-end tests
├── docs/                      # Documentation
├── logs/                      # Application logs (gitignored)
└── test-documents/            # Sample PDFs for testing
```

## Detailed Structure

### 📁 `/backend/`
Azure Functions backend application
- `functions/` - Azure Function definitions
- `shared/` - Shared utilities and agents
  - `agents/` - AI agent implementations (orchestrator, parser, knowledge base builder)
  - `utils/` - Logger, response helpers, validation
- `src/` - Main entry point
- `package.json` - Dependencies

### 📁 `/frontend/`
React + TypeScript frontend
- `src/pages/` - React pages (Upload, Search, Reports, Insights)
- `src/services/` - API service layer
- `src/types/` - TypeScript type definitions
- `src/theme/` - MUI theme configuration

### 📁 `/ai-agents/`
AI agent system design and documentation
- Agent specifications
- Workflow diagrams
- Prompt templates

### 📁 `/infrastructure/`
Azure infrastructure as code
- `main.bicep` - Main Bicep template
- `modules/` - Bicep modules for resources

### 📁 `/scripts/`
Utility scripts for development and deployment
- `test-scripts/` - Test automation scripts
  - `test-upload.js` - Script to upload test documents
  - `test-process.js` - Script to trigger processing

### 📁 `/tests/`
End-to-end tests using Playwright
- Integration tests
- UI tests

### 📁 `/docs/`
Project documentation
- `test-results/` - Test results and reports
  - `TEST-RESULTS.md` - Latest end-to-end test results
- API documentation
- Architecture diagrams
- User guides

### 📁 `/logs/` (gitignored)
Application logs generated during development
- `backend.log` - Azure Functions logs
- `frontend.log` - Vite dev server logs

### 📁 `/test-documents/`
Sample PDF documents for testing
- Product information PDFs
- Marketing sheets
- Test cases

## Important Files

### Configuration Files
- `.gitignore` - Excludes logs/, node_modules/, .env files
- `playwright.config.ts` - E2E test configuration
- `backend/tsconfig.json` - TypeScript configuration for backend
- `frontend/tsconfig.json` - TypeScript configuration for frontend
- `frontend/vite.config.ts` - Vite build configuration

### Scripts
- `start-servers.sh` - Starts both backend and frontend servers
  - Backend: http://localhost:7071
  - Frontend: http://localhost:3011 (or next available port)
  - Logs output to `logs/` directory

## Development Workflow

### Starting the Application
```bash
# Start both servers
./start-servers.sh

# View logs
tail -f logs/backend.log
tail -f logs/frontend.log
```

### Running Tests
```bash
# Run end-to-end tests
npm run test:e2e

# Upload test document
node scripts/test-scripts/test-upload.js
```

### Adding New Documents
Place PDF files in `test-documents/` directory for testing and development.

## Gitignored Directories/Files
- `node_modules/` - Dependencies
- `dist/`, `build/` - Build outputs
- `logs/` - Application logs
- `.env*` - Environment variables
- `*.log` - All log files
- `.DS_Store` - macOS metadata

## Notes
- All log files are automatically excluded from git
- Test scripts are organized in `scripts/test-scripts/`
- Test results are documented in `docs/test-results/`
- Sample documents for testing are in `test-documents/`
