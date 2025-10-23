# 🚀 SmartProof AI - START HERE

**Welcome to SmartProof AI!** This guide will get you up and running in ~30 minutes.

---

## 📖 What You're About to Build

SmartProof AI is an intelligent compliance checking system for Toyota marketing materials that:
- ✅ Analyzes PDFs and images for compliance violations
- ✅ Uses 6 AI agents to check brand, legal, and product accuracy
- ✅ Generates detailed compliance reports with recommendations
- ✅ Runs entirely on Azure cloud services

---

## ⚡ Quickstart Options

### Option 1: One-Command Deploy (Recommended - 20-25 minutes)

```bash
# 1. Login to Azure
az login

# 2. Run complete deployment script
./scripts/deploy-local.sh dev

# This will:
# - Provision all Azure resources
# - Create text-embedding-ada-002 deployment
# - Install dependencies
# - Configure all settings automatically

# 3. Start backend (Terminal 1)
cd backend && npm start

# 4. Start frontend (Terminal 2)
cd frontend && npm run dev

# 5. Open browser: http://localhost:3000
```

**Done!** 🎉

### Option 2: Manual Step-by-Step (15-20 minutes)

```bash
# 1. Login to Azure
az login

# 2. Provision all Azure resources
./scripts/provision-azure-resources.sh dev
# This creates config-dev.txt with all connection strings

# 3. Create text-embedding-ada-002 deployment
# (Required for knowledge base vector search)
az cognitiveservices account deployment create \
  --name smartproof-openai-dev \
  --resource-group smartproof-rg-dev \
  --deployment-name text-embedding-ada-002 \
  --model-name text-embedding-ada-002 \
  --model-version "2" \
  --model-format OpenAI \
  --sku-capacity 10 \
  --sku-name "Standard"

# 4. Setup dependencies
./scripts/setup-local.sh

# 5. Copy values from config-dev.txt to:
#    - backend/local.settings.json (add AZURE_OPENAI_EMBEDDING_DEPLOYMENT)
#    - frontend/.env
# See: WHERE_TO_CONFIGURE.md for exact mappings

# 6. Start backend (Terminal 1)
cd backend && npm start

# 7. Start frontend (Terminal 2)
cd frontend && npm run dev

# 8. Open browser: http://localhost:3000
```

**Done!** 🎉

---

## 📚 Documentation Index

Choose your path:

### 🏃 I want to run it NOW
→ **[WHERE_TO_CONFIGURE.md](WHERE_TO_CONFIGURE.md)** - Copy-paste configuration guide

### 🔧 I want to understand the setup
→ **[LOCAL_DEVELOPMENT_GUIDE.md](LOCAL_DEVELOPMENT_GUIDE.md)** - Step-by-step walkthrough

### 📋 I want detailed configuration info
→ **[CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md)** - Complete configuration reference

### 🎯 I want a quick overview
→ **[QUICKSTART.md](QUICKSTART.md)** - Project overview and quick reference

### 📊 I want to see what's been built
→ **[BUILD_COMPLETE.md](BUILD_COMPLETE.md)** - Complete project status

### 📖 I want to understand decisions
→ **[HISTORY.md](HISTORY.md)** - Development history and decisions

---

## 🎯 What Happens When You Run These Scripts

### Provisioning Script (`./scripts/provision-azure-resources.sh`)
Creates in Azure:
- ✅ Resource Group
- ✅ Storage Account (4 containers)
- ✅ Azure Functions
- ✅ App Service (frontend hosting)
- ✅ AI Search
- ✅ Document Intelligence
- ✅ Computer Vision
- ✅ Azure OpenAI (GPT-4 + GPT-4V)
- ✅ Application Insights

**Output:** `config-dev.txt` with all connection strings

**Time:** ~15 minutes

**Cost:** ~$235-450/month (dev environment)

### Setup Script (`./scripts/setup-local.sh`)
Installs:
- ✅ Frontend dependencies (React, TypeScript, MUI)
- ✅ Backend dependencies (Azure SDKs, Functions runtime)
- ✅ Creates config templates (.env, local.settings.json)

**Time:** ~5 minutes

**Cost:** Free

---

## 🔑 Configuration Cheat Sheet

You need to configure **2 files**:

### File 1: `backend/local.settings.json`
Copy from `config-dev.txt`:
- Storage connection string
- OpenAI endpoint & key
- AI Search endpoint & key
- Document Intelligence endpoint & key
- Computer Vision endpoint & key

### File 2: `frontend/.env`
Get from Azure Portal (or provisioning script output):
- Azure AD Client ID
- Azure AD Tenant ID

**See [WHERE_TO_CONFIGURE.md](WHERE_TO_CONFIGURE.md) for exact copy-paste instructions.**

---

## ✅ Verification Checklist

Use this to confirm everything is set up:

- [ ] Azure CLI installed (`az --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Azure resources provisioned (check Azure Portal)
- [ ] `config-dev.txt` exists with values
- [ ] `backend/local.settings.json` configured
- [ ] `frontend/.env` configured
- [ ] Backend starts without errors (`cd backend && npm start`)
- [ ] Frontend starts without errors (`cd frontend && npm run dev`)
- [ ] Can access http://localhost:3000
- [ ] Can login with Azure AD

**All checked?** You're ready to develop! 🚀

---

## 🎨 What You'll See

### Frontend (http://localhost:3000)
- **Dashboard** - Statistics and recent uploads
- **Upload** - Drag-drop PDF/image upload
- **Search** - Product information search
- **Compliance** - Detailed compliance reports

### Backend (http://localhost:7071)
- API endpoints for upload, search, reports
- 6 AI agents running compliance checks
- Logs showing processing workflow

---

## 🧪 Test the System

### Quick Test Flow:
1. Navigate to **Upload** page
2. Drag a PDF file (any PDF for testing)
3. Click upload
4. Go to **Dashboard** - see upload appear
5. Go to **Compliance** - see report (when processing completes)

### Check Backend Logs:
Watch Terminal 1 (backend) for:
```
[Orchestrator] Starting workflow orchestration
[Parser] Starting document parsing
[Image Analysis] Analyzing images
[Search] Starting product information search
[Compliance] Starting compliance checks
[Critic] Starting report generation
```

---

## 🐛 Common Issues

### "Can't connect to Azure services"
→ Check `backend/local.settings.json` has correct keys from `config-dev.txt`

### "Azure AD login fails"
→ Check `frontend/.env` has correct client ID and tenant ID
→ Verify redirect URI in Azure Portal is `http://localhost:3000`

### "Port already in use"
→ Kill process: `lsof -i :3000` or `lsof -i :7071`, then `kill -9 <PID>`

### "Module not found"
→ Run `npm install` in frontend/ and backend/ directories

**More help:** [LOCAL_DEVELOPMENT_GUIDE.md](LOCAL_DEVELOPMENT_GUIDE.md#common-issues--solutions)

---

## 📁 Project Structure

```
smartproof-poc/
├── frontend/              # React SPA (15 files)
├── backend/               # Azure Functions (18 files)
├── ai-agents/             # 6 AI agents (25+ files)
├── infrastructure/        # Bicep templates (9 files)
├── scripts/               # Setup & deployment (3 files)
├── docs/                  # Documentation (5 files)
├── config-dev.txt         # Generated config (after provisioning)
└── WHERE_TO_CONFIGURE.md  # Configuration guide
```

**Total:** 75+ files, ~11,000 lines of code

---

## 🎓 Learn the Architecture

### Agent Workflow
```
Upload PDF
    ↓
Orchestrator Agent
    ↓
Parser Agent (extract text/tables/images)
    ↓
Image Analysis Agent (check logos, colors, quality)
    ↓
Search Agent (retrieve product info)
    ↓
Compliance Agent (check 16 rules)
    ↓
Critic Agent (generate report)
    ↓
Download HTML/PDF Report
```

### Tech Stack
- **Frontend:** React 18 + TypeScript + Material-UI
- **Backend:** Azure Functions (Node.js)
- **AI:** GPT-4, GPT-4 Vision, Document Intelligence, Computer Vision
- **Data:** Azure Storage, AI Search
- **Auth:** Azure AD (MSAL)
- **Deploy:** Bicep (IaC), GitHub Actions

---

## 🚢 Deploy to Azure

When ready to deploy (not for initial local dev):

```bash
# Deploy everything to Azure
./scripts/deploy.sh \
  --environment dev \
  --deploy-infra \
  --deploy-backend \
  --deploy-frontend

# Or use GitHub Actions
# Go to Actions → Manual Deploy → Run workflow
```

---

## 🆘 Need Help?

1. **Quick config help:** [WHERE_TO_CONFIGURE.md](WHERE_TO_CONFIGURE.md)
2. **Step-by-step setup:** [LOCAL_DEVELOPMENT_GUIDE.md](LOCAL_DEVELOPMENT_GUIDE.md)
3. **Detailed config:** [CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md)
4. **Project overview:** [QUICKSTART.md](QUICKSTART.md)
5. **Project status:** [BUILD_COMPLETE.md](BUILD_COMPLETE.md)

---

## 🎯 Your Next Steps

### Now:
1. Run `./scripts/provision-azure-resources.sh dev`
2. Configure the 2 config files
3. Start the servers
4. Access http://localhost:3000

### Later Today:
1. Upload a test PDF
2. Explore all pages
3. Review backend logs
4. Check Azure Portal resources

### This Week:
1. Seed AI Search with product data
2. Test compliance checking
3. Review generated reports
4. Make code changes

### When Ready:
1. Deploy to Azure
2. Test in cloud environment
3. Share with stakeholders

---

## 💡 Pro Tips

- Keep `config-dev.txt` safe - it has all your keys
- Use VS Code for editing (syntax highlighting)
- Watch backend terminal for debugging
- Clear browser cache if authentication acts weird
- Use Azure Portal to verify resources created

---

## 🎉 You're Ready!

Run these two commands to get started:

```bash
./scripts/provision-azure-resources.sh dev
./scripts/setup-local.sh
```

Then configure and run!

**Questions?** See the docs folder.

**Good luck!** 🚀

---

**Project:** SmartProof AI - Toyota Marketing Compliance System
**Version:** 1.0.0 (PoC)
**Last Updated:** 2025-10-23
