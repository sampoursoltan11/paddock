# SmartProof AI - Local Development Guide

This guide walks you through setting up SmartProof AI for local development step-by-step.

---

## 🎯 Goal

Run SmartProof AI completely on your local machine with Azure cloud services.

---

## 📋 Prerequisites Checklist

Before you begin, install these tools:

- [ ] **Node.js 18+** - [Download here](https://nodejs.org/)
- [ ] **npm 9+** - Comes with Node.js
- [ ] **Git** - [Download here](https://git-scm.com/)
- [ ] **Azure CLI** - [Install guide](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- [ ] **Azure Functions Core Tools** - Install via: `npm install -g azure-functions-core-tools@4`
- [ ] **VS Code** (recommended) - [Download here](https://code.visualstudio.com/)
- [ ] **Azure Subscription** - Required for cloud services

### Verify Installation

```bash
# Check Node.js (should be 18+)
node --version

# Check npm (should be 9+)
npm --version

# Check Azure CLI
az --version

# Check Azure Functions Core Tools
func --version
```

---

## 🚀 Step-by-Step Setup

### Step 1: Get the Code

```bash
# Navigate to project directory
cd /Users/sampoursoltan/Library/CloudStorage/OneDrive-blunivo.com.au/BlunivoProjects/AI\ demo/paddock

# Verify you're in the right directory
ls -la
# You should see: frontend/, backend/, ai-agents/, infrastructure/, etc.
```

### Step 2: Install Dependencies

```bash
# Run the automated setup script
./scripts/setup-local.sh

# This will:
# - Install all frontend dependencies
# - Install all backend dependencies
# - Create .env and local.settings.json templates
```

**Expected output:**
```
✓ Node.js v18.x.x detected
✓ npm v9.x.x detected
✓ Azure CLI detected
📦 Installing frontend dependencies...
✓ Frontend dependencies installed
📦 Installing backend dependencies...
✓ Backend dependencies installed
✓ Created frontend/.env
✓ Created backend/local.settings.json
Setup Complete! ✨
```

### Step 3: Provision Azure Resources

```bash
# Login to Azure
az login

# Verify you're using the correct subscription
az account show

# Run provisioning script (takes 10-15 minutes)
./scripts/provision-azure-resources.sh dev
```

**What this does:**
1. Creates resource group `smartproof-rg-dev`
2. Deploys all Azure resources:
   - Storage Account (4 containers)
   - Azure Functions
   - App Service
   - AI Search
   - Document Intelligence
   - Computer Vision
   - Azure OpenAI (GPT-4 + GPT-4V)
   - Application Insights
3. Retrieves all connection strings and keys
4. Creates `config-dev.txt` with all values
5. Optionally creates Azure AD app registration

**Expected output:**
```
===> Creating Resource Group
✓ Resource group created: smartproof-rg-dev
===> Deploying Azure Infrastructure (this may take 10-15 minutes)
✓ Infrastructure deployment completed
===> Retrieving Resource Information
✓ Retrieved resource names
===> Retrieving Connection Strings and Keys
✓ Retrieved all connection strings and keys
===> Creating Configuration File
✓ Configuration saved to: config-dev.txt
```

### Step 4: Configure Backend

```bash
# Open the generated config file
cat config-dev.txt

# Open backend configuration file in editor
code backend/local.settings.json

# Or use any text editor
nano backend/local.settings.json
```

**Copy values from `config-dev.txt` to `backend/local.settings.json`:**

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "PASTE_FROM_config-dev.txt",
    "FUNCTIONS_WORKER_RUNTIME": "node",

    "AZURE_STORAGE_CONNECTION_STRING": "PASTE_FROM_config-dev.txt",
    "AZURE_STORAGE_ACCOUNT_NAME": "PASTE_FROM_config-dev.txt",

    "AZURE_OPENAI_ENDPOINT": "PASTE_FROM_config-dev.txt",
    "AZURE_OPENAI_KEY": "PASTE_FROM_config-dev.txt",
    "AZURE_OPENAI_DEPLOYMENT_GPT4": "gpt-4",
    "AZURE_OPENAI_DEPLOYMENT_GPT4_VISION": "gpt-4-vision",

    "AZURE_AI_SEARCH_ENDPOINT": "PASTE_FROM_config-dev.txt",
    "AZURE_AI_SEARCH_KEY": "PASTE_FROM_config-dev.txt",
    "AZURE_AI_SEARCH_INDEX_NAME": "smartproof-product-info",

    "AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT": "PASTE_FROM_config-dev.txt",
    "AZURE_DOCUMENT_INTELLIGENCE_KEY": "PASTE_FROM_config-dev.txt",

    "AZURE_COMPUTER_VISION_ENDPOINT": "PASTE_FROM_config-dev.txt",
    "AZURE_COMPUTER_VISION_KEY": "PASTE_FROM_config-dev.txt",

    "BLOB_CONTAINER_UPLOADS": "uploads",
    "BLOB_CONTAINER_PROCESSED": "processed",
    "BLOB_CONTAINER_REPORTS": "reports",
    "BLOB_CONTAINER_STATE": "state",

    "LOG_LEVEL": "info",
    "ENVIRONMENT": "development"
  }
}
```

**Save and close the file.**

### Step 5: Configure Azure AD (Frontend)

You have two options:

#### Option A: If provisioning script created Azure AD app

The script will display:
```
Add the following to frontend/.env:
VITE_AZURE_AD_CLIENT_ID=xxx-xxx-xxx
VITE_AZURE_AD_TENANT_ID=xxx-xxx-xxx
```

Copy these values to `frontend/.env`

#### Option B: Create Azure AD app manually

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations** → **New registration**
3. Name: `smartproof-dev`
4. Supported account types: **Accounts in this organizational directory only**
5. Click **Register**
6. Go to **Authentication** → **Add a platform** → **Single-page application**
7. Add redirect URI: `http://localhost:3000`
8. Enable **ID tokens**
9. Click **Save**
10. Go to **Overview** and copy:
    - Application (client) ID
    - Directory (tenant) ID

**Update `frontend/.env`:**

```bash
# Open frontend config
code frontend/.env

# Or use text editor
nano frontend/.env
```

```env
# Azure AD Configuration
VITE_AZURE_AD_CLIENT_ID=<paste-client-id-here>
VITE_AZURE_AD_TENANT_ID=<paste-tenant-id-here>
VITE_AZURE_AD_REDIRECT_URI=http://localhost:3000

# API Configuration
VITE_API_BASE_URL=http://localhost:7071/api

# Environment
VITE_ENVIRONMENT=development
```

**Save and close the file.**

### Step 6: Start Development Servers

Open **two terminal windows/tabs**:

#### Terminal 1 - Backend (Azure Functions)

```bash
cd backend
npm start
```

**Expected output:**
```
Azure Functions Core Tools
Core Tools Version: 4.x.x
Function Runtime Version: 4.x.x

Functions:
  upload-asset: [POST] http://localhost:7071/api/assets/upload
  process-asset: blobTrigger
  search-product: [POST,GET] http://localhost:7071/api/search/product
  get-compliance-report: [GET] http://localhost:7071/api/compliance/reports/{assetId}
  download-report: [GET] http://localhost:7071/api/compliance/reports/{assetId}/download/{format}

For detailed output, run func with --verbose flag.
[2025-10-23T...] Worker process started and initialized.
```

**Backend is now running on `http://localhost:7071`**

#### Terminal 2 - Frontend (React)

```bash
cd frontend
npm run dev
```

**Expected output:**
```
VITE v5.0.8  ready in 432 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

**Frontend is now running on `http://localhost:3000`**

### Step 7: Access the Application

1. Open your browser
2. Navigate to: **http://localhost:3000**
3. You should see the SmartProof AI login page
4. Click **Sign in** to authenticate with Azure AD

**Expected screens:**
- Login page with Azure AD sign-in
- Dashboard with statistics (empty at first)
- Upload page with drag-drop area
- Search page for product info
- Compliance review page

---

## 🧪 Testing Your Setup

### Test 1: Backend Health Check

```bash
# In a new terminal
curl http://localhost:7071/api/assets/upload

# Expected: Error (no file provided) but confirms endpoint is working
```

### Test 2: Frontend Access

- Open browser to http://localhost:3000
- Should see SmartProof UI
- Should be able to navigate between pages

### Test 3: Azure Storage Connection

```bash
# Test storage connection
az storage container list \
  --connection-string "<from-config-dev.txt>"

# Should see: uploads, processed, reports, state
```

### Test 4: Upload a Test File

1. Go to **Upload** page
2. Drag and drop a PDF file
3. Fill in metadata (optional)
4. Click upload
5. Check backend terminal for logs
6. Check Azure Storage for uploaded file:

```bash
az storage blob list \
  --container-name uploads \
  --connection-string "<from-config-dev.txt>"
```

---

## 📁 Project Structure Overview

```
smartproof-poc/
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── pages/           # Dashboard, Upload, Search, ComplianceReview
│   │   ├── components/      # UI components
│   │   ├── services/        # API clients
│   │   └── styles/          # Theme
│   ├── .env                 # Frontend config (you created this)
│   └── package.json
│
├── backend/                  # Azure Functions
│   ├── functions/           # 5 function endpoints
│   ├── shared/              # Utilities
│   ├── local.settings.json  # Backend config (you created this)
│   └── package.json
│
├── ai-agents/                # 6 AI agents
│   ├── orchestrator/
│   ├── parser-agent/
│   ├── image-analysis-agent/
│   ├── search-agent/
│   ├── compliance-agent/
│   └── critic-agent/
│
├── config-dev.txt            # Generated by provisioning script
└── scripts/                  # Setup and deployment scripts
```

---

## 🔧 Development Workflow

### Daily Development

```bash
# 1. Start backend (Terminal 1)
cd backend && npm start

# 2. Start frontend (Terminal 2)
cd frontend && npm run dev

# 3. Make changes to code
# 4. Frontend auto-reloads on save
# 5. Backend requires restart for changes
```

### Making Code Changes

**Frontend (Hot Reload):**
- Edit files in `frontend/src/`
- Browser automatically reloads
- No restart needed

**Backend (Manual Restart):**
- Edit files in `backend/`
- Stop backend (Ctrl+C)
- Run `npm start` again

**AI Agents:**
- Edit files in `ai-agents/`
- Backend needs restart

### Adding New Features

1. Create feature branch
2. Make changes
3. Test locally
4. Commit and push
5. Deploy to Azure dev environment

---

## 🐛 Common Issues & Solutions

### Issue: "EADDRINUSE: address already in use"

**Cause:** Port 3000 or 7071 already in use

**Solution:**
```bash
# Find process using port
lsof -i :3000  # or :7071

# Kill process
kill -9 <PID>

# Or change port in config
```

### Issue: "Cannot find module"

**Cause:** Dependencies not installed

**Solution:**
```bash
cd frontend && npm install
cd backend && npm install
```

### Issue: Azure AD login fails

**Cause:** Incorrect client ID or redirect URI

**Solution:**
1. Check `frontend/.env` has correct values
2. Verify redirect URI in Azure Portal matches `http://localhost:3000`
3. Try clearing browser cache/cookies

### Issue: Backend can't connect to Azure services

**Cause:** Invalid connection strings or keys

**Solution:**
1. Regenerate keys in Azure Portal
2. Update `backend/local.settings.json`
3. Restart backend

### Issue: CORS errors in browser

**Cause:** Backend not running or wrong URL

**Solution:**
1. Ensure backend is running on http://localhost:7071
2. Check `VITE_API_BASE_URL` in `frontend/.env`
3. Verify backend CORS settings

---

## 📚 Next Steps

After successful setup:

1. ✅ **Explore the UI** - Navigate all pages
2. ✅ **Test file upload** - Upload a sample PDF
3. ✅ **Review backend logs** - See function executions
4. ✅ **Examine Azure resources** - Check Azure Portal
5. ✅ **Read the code** - Understand the architecture
6. ✅ **Make a small change** - Test hot reload
7. ✅ **Deploy to Azure** - When ready

---

## 🆘 Getting Help

**Documentation:**
- [CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md) - Detailed configuration
- [QUICKSTART.md](../QUICKSTART.md) - Quick reference
- [BUILD_COMPLETE.md](../BUILD_COMPLETE.md) - Project status
- [HISTORY.md](HISTORY.md) - Development decisions

**Common Commands:**
```bash
# View logs
func start --verbose  # Backend with detailed logs
npm run dev           # Frontend

# Check Azure resources
az resource list --resource-group smartproof-rg-dev --output table

# View storage contents
az storage blob list --container-name uploads --connection-string "<connection-string>"

# Test API endpoints
curl http://localhost:7071/api/search/product?q=Camry
```

---

## ✅ Setup Checklist

Use this checklist to track your progress:

- [ ] Prerequisites installed (Node, Azure CLI, Functions Core Tools)
- [ ] Project dependencies installed (`./scripts/setup-local.sh`)
- [ ] Azure resources provisioned (`./scripts/provision-azure-resources.sh`)
- [ ] Backend configured (`backend/local.settings.json`)
- [ ] Frontend configured (`frontend/.env`)
- [ ] Azure AD app registration created
- [ ] Backend server starts successfully
- [ ] Frontend server starts successfully
- [ ] Can access http://localhost:3000
- [ ] Can log in with Azure AD
- [ ] Can navigate all pages
- [ ] Can upload a test file
- [ ] Backend logs show function executions

**All checked?** 🎉 You're ready to develop!

---

**Last Updated:** 2025-10-23
**Version:** 1.0.0
