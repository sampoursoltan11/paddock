# SmartProof AI - Configuration Guide

This guide explains how to configure SmartProof AI for both local development and Azure deployment.

---

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Azure Resource Provisioning](#azure-resource-provisioning)
3. [Configuration Steps](#configuration-steps)
4. [Testing the Setup](#testing-the-setup)
5. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites

Before starting, ensure you have:

- ✅ **Node.js 18+** - [Download](https://nodejs.org/)
- ✅ **npm 9+** - Comes with Node.js
- ✅ **Azure CLI** - [Install Guide](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- ✅ **Azure Functions Core Tools** - `npm install -g azure-functions-core-tools@4`
- ✅ **Git** - For version control
- ✅ **VS Code** (recommended) - For development

### Quick Start (Without Azure)

For initial local development without Azure services:

```bash
# 1. Clone or navigate to project
cd /path/to/smartproof-poc

# 2. Run setup script
./scripts/setup-local.sh

# 3. Configure mock settings (see below)

# 4. Start development servers
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm start
```

---

## Azure Resource Provisioning

### Step 1: Login to Azure

```bash
# Login to Azure
az login

# Verify your subscription
az account show

# (Optional) Set specific subscription
az account set --subscription "Your-Subscription-Name"
```

### Step 2: Run Provisioning Script

```bash
# Navigate to project root
cd /path/to/smartproof-poc

# Run provisioning script for dev environment
./scripts/provision-azure-resources.sh dev

# This will:
# 1. Create resource group
# 2. Deploy all Azure resources via Bicep
# 3. Retrieve all connection strings and keys
# 4. Generate a config file (config-dev.txt)
# 5. Optionally create Azure AD app registration
```

**Script will provision:**
- Resource Group
- Storage Account (with 4 containers)
- Azure Functions
- App Service (Frontend)
- Azure AI Search
- Azure Document Intelligence
- Azure Computer Vision
- Azure OpenAI (GPT-4 + GPT-4 Vision)
- Application Insights

**Estimated time:** 10-15 minutes

**Estimated cost:** ~$235-450/month (dev environment)

### Step 3: Review Generated Config

After provisioning completes, you'll have a `config-dev.txt` file with all connection strings and keys.

```bash
# View the config file
cat config-dev.txt
```

---

## Configuration Steps

### Backend Configuration

#### File: `backend/local.settings.json`

1. **Copy the example file:**
   ```bash
   cd backend
   cp local.settings.json.example local.settings.json
   ```

2. **Update with values from `config-dev.txt`:**

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "<from config-dev.txt: AZURE_STORAGE_CONNECTION_STRING>",
    "FUNCTIONS_WORKER_RUNTIME": "node",

    "AZURE_STORAGE_CONNECTION_STRING": "<from config-dev.txt>",
    "AZURE_STORAGE_ACCOUNT_NAME": "<from config-dev.txt>",

    "AZURE_OPENAI_ENDPOINT": "<from config-dev.txt>",
    "AZURE_OPENAI_KEY": "<from config-dev.txt>",
    "AZURE_OPENAI_DEPLOYMENT_GPT4": "gpt-4",
    "AZURE_OPENAI_DEPLOYMENT_GPT4_VISION": "gpt-4-vision",

    "AZURE_AI_SEARCH_ENDPOINT": "<from config-dev.txt>",
    "AZURE_AI_SEARCH_KEY": "<from config-dev.txt>",
    "AZURE_AI_SEARCH_INDEX_NAME": "smartproof-product-info",

    "AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT": "<from config-dev.txt>",
    "AZURE_DOCUMENT_INTELLIGENCE_KEY": "<from config-dev.txt>",

    "AZURE_COMPUTER_VISION_ENDPOINT": "<from config-dev.txt>",
    "AZURE_COMPUTER_VISION_KEY": "<from config-dev.txt>",

    "AZURE_AD_TENANT_ID": "<your-tenant-id>",
    "AZURE_AD_CLIENT_ID": "<your-client-id>",

    "BLOB_CONTAINER_UPLOADS": "uploads",
    "BLOB_CONTAINER_PROCESSED": "processed",
    "BLOB_CONTAINER_REPORTS": "reports",
    "BLOB_CONTAINER_STATE": "state",

    "LOG_LEVEL": "info",
    "ENVIRONMENT": "development"
  }
}
```

### Frontend Configuration

#### File: `frontend/.env`

1. **Copy the example file:**
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. **Update with Azure AD credentials:**

```env
# Azure AD Configuration (from provisioning script or Azure Portal)
VITE_AZURE_AD_CLIENT_ID=<your-app-registration-client-id>
VITE_AZURE_AD_TENANT_ID=<your-tenant-id>
VITE_AZURE_AD_REDIRECT_URI=http://localhost:3000

# API Configuration
VITE_API_BASE_URL=http://localhost:7071/api

# Environment
VITE_ENVIRONMENT=development
```

### Azure AD App Registration Setup

If you didn't create it via the provisioning script, create it manually:

#### 1. Create App Registration

1. Go to **Azure Portal** → **Azure Active Directory** → **App registrations**
2. Click **New registration**
3. Name: `smartproof-dev`
4. Supported account types: **Accounts in this organizational directory only**
5. Click **Register**

#### 2. Configure Authentication

1. Go to **Authentication** → **Add a platform** → **Single-page application**
2. Add redirect URIs:
   - `http://localhost:3000` (for local dev)
   - `https://smartproof-web-dev.azurewebsites.net` (for Azure deployment)
3. Enable **ID tokens** under Implicit grant
4. Click **Save**

#### 3. Get Client ID and Tenant ID

1. Go to **Overview** tab
2. Copy **Application (client) ID** → Use in `frontend/.env` as `VITE_AZURE_AD_CLIENT_ID`
3. Copy **Directory (tenant) ID** → Use in `frontend/.env` as `VITE_AZURE_AD_TENANT_ID`

#### 4. Configure API Permissions (Optional)

1. Go to **API permissions**
2. Add **Microsoft Graph** → **User.Read** (should be there by default)
3. Grant admin consent if required

---

## Configuration File Locations

### Local Development

```
smartproof-poc/
├── frontend/
│   └── .env                          # Frontend config (create from .env.example)
├── backend/
│   └── local.settings.json           # Backend config (create from .example)
└── config-dev.txt                    # Generated by provisioning script
```

### Azure Deployment

Configuration is set via Azure Portal or deployment script:
- **Function App** → Configuration → Application settings
- **App Service** → Configuration → Application settings

---

## Testing the Setup

### 1. Test Backend Locally

```bash
cd backend
npm start

# Test health endpoint (if you create one)
curl http://localhost:7071/api/health

# Test upload endpoint (requires authentication in production)
curl -X POST http://localhost:7071/api/assets/upload \
  -F "file=@test.pdf" \
  -F "model=Camry"
```

### 2. Test Frontend Locally

```bash
cd frontend
npm run dev

# Open browser to http://localhost:3000
# You should see the SmartProof UI
```

### 3. Test End-to-End Flow

1. **Login** - Use Azure AD credentials
2. **Navigate to Upload** - Upload a sample PDF
3. **Check Dashboard** - Should see upload appear
4. **Navigate to Compliance** - Should see processing status
5. **Check Backend Logs** - Should see agent workflow executing

---

## Common Configuration Issues

### Issue 1: Azure Functions won't start

**Error:** `AzureWebJobsStorage` connection string is invalid

**Solution:**
```bash
# Verify storage connection string
az storage account show-connection-string \
  --name <storage-account-name> \
  --resource-group <resource-group>

# Copy output to local.settings.json
```

### Issue 2: Frontend can't connect to backend

**Error:** CORS error in browser console

**Solution:**
- Ensure backend is running on `http://localhost:7071`
- Check `VITE_API_BASE_URL` in `frontend/.env`
- Verify Function App CORS settings allow `http://localhost:3000`

### Issue 3: Azure AD authentication fails

**Error:** Redirect URI mismatch

**Solution:**
1. Check `frontend/.env` has correct `VITE_AZURE_AD_REDIRECT_URI`
2. Verify redirect URI is added in Azure Portal app registration
3. Ensure URL matches exactly (including trailing slashes)

### Issue 4: AI services return 401/403 errors

**Error:** Unauthorized or forbidden

**Solution:**
- Verify API keys in `local.settings.json`
- Regenerate keys if necessary:
  ```bash
  az cognitiveservices account keys list \
    --name <service-name> \
    --resource-group <resource-group>
  ```

---

## Environment-Specific Configuration

### Development Environment

```bash
# Provision dev resources
./scripts/provision-azure-resources.sh dev

# Use config-dev.txt for configuration
```

### Staging Environment

```bash
# Provision staging resources
./scripts/provision-azure-resources.sh staging

# Use config-staging.txt for configuration
```

### Production Environment

```bash
# Provision production resources
./scripts/provision-azure-resources.sh prod

# Use config-prod.txt for configuration
# Enable additional security:
# - Managed Identity instead of keys
# - Private endpoints
# - Network restrictions
```

---

## Security Best Practices

### Local Development
- ✅ Never commit `local.settings.json` or `.env` to Git
- ✅ Use separate Azure AD app for each environment
- ✅ Rotate keys regularly
- ✅ Use `.gitignore` to exclude sensitive files

### Azure Deployment
- ✅ Use **Managed Identity** instead of API keys where possible
- ✅ Enable **Key Vault** for secrets management
- ✅ Configure **Private Endpoints** for production
- ✅ Enable **diagnostic logging**
- ✅ Set up **Azure Monitor alerts**

---

## Quick Reference

### Get Azure Resource Information

```bash
# List all resources in resource group
az resource list \
  --resource-group smartproof-rg-dev \
  --output table

# Get Storage connection string
az storage account show-connection-string \
  --name <storage-name> \
  --resource-group <rg-name>

# Get AI Search admin key
az search admin-key show \
  --service-name <search-name> \
  --resource-group <rg-name>

# Get Cognitive Services key
az cognitiveservices account keys list \
  --name <service-name> \
  --resource-group <rg-name>
```

### Update Function App Settings

```bash
# Set a single app setting
az functionapp config appsettings set \
  --name <function-app-name> \
  --resource-group <rg-name> \
  --settings "KEY=VALUE"

# Set multiple settings from file
az functionapp config appsettings set \
  --name <function-app-name> \
  --resource-group <rg-name> \
  --settings @appsettings.json
```

---

## Next Steps After Configuration

1. ✅ **Verify all environment variables are set**
2. ✅ **Test local development setup**
3. ✅ **Seed AI Search index** with sample product data
4. ✅ **Test Azure Functions** endpoints
5. ✅ **Test frontend authentication** flow
6. ✅ **Run end-to-end workflow** test
7. ✅ **Deploy to Azure** using deployment scripts

---

## Support

For issues or questions:
- Review [QUICKSTART.md](../QUICKSTART.md)
- Check [BUILD_COMPLETE.md](../BUILD_COMPLETE.md)
- See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)

---

**Last Updated:** 2025-10-23
**Version:** 1.0.0
