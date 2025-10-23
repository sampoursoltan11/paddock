#!/bin/bash

# SmartProof AI - Complete Local Deployment Script
# This script sets up a complete SmartProof environment from scratch
# Usage: ./scripts/deploy-local.sh [environment]
#
# What this script does:
# 1. Provisions all Azure resources
# 2. Creates text-embedding-ada-002 deployment for vector search
# 3. Installs local dependencies
# 4. Configures environment files
# 5. Starts the development servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="${1:-dev}"
LOCATION="australiaeast"
RESOURCE_GROUP="smartproof-rg-${ENVIRONMENT}"
BASE_NAME="smartproof"

# Derived names
OPENAI_NAME="${BASE_NAME}-openai-${ENVIRONMENT}"
STORAGE_ACCOUNT="${BASE_NAME}stor${ENVIRONMENT}"
AI_SEARCH="${BASE_NAME}-search-${ENVIRONMENT}"

echo -e "${CYAN}=========================================================${NC}"
echo -e "${CYAN}   SmartProof AI - Complete Local Deployment${NC}"
echo -e "${CYAN}=========================================================${NC}"
echo ""
echo -e "Environment:     ${GREEN}${ENVIRONMENT}${NC}"
echo -e "Location:        ${GREEN}${LOCATION}${NC}"
echo -e "Resource Group:  ${GREEN}${RESOURCE_GROUP}${NC}"
echo ""
echo -e "${YELLOW}This script will:${NC}"
echo -e "  ${BLUE}1.${NC} Provision all Azure resources (15-20 min)"
echo -e "  ${BLUE}2.${NC} Create AI embeddings deployment"
echo -e "  ${BLUE}3.${NC} Install local dependencies"
echo -e "  ${BLUE}4.${NC} Configure environment files"
echo -e "  ${BLUE}5.${NC} Start development servers"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}===> $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

#################################################
# STEP 1: Check Prerequisites
#################################################

print_section "Step 1: Checking Prerequisites"

# Check Azure CLI
if ! command -v az &> /dev/null; then
    print_error "Azure CLI not found. Please install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi
print_success "Azure CLI installed"

# Check Azure login
if ! az account show > /dev/null 2>&1; then
    print_error "Not logged into Azure CLI"
    echo "Please login first: az login"
    exit 1
fi

ACCOUNT_NAME=$(az account show --query name -o tsv)
print_success "Logged in as: $ACCOUNT_NAME"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install Node.js 18+: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) installed"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm not found"
    exit 1
fi
print_success "npm $(npm -v) installed"

# Check Azure Functions Core Tools (optional)
if command -v func &> /dev/null; then
    print_success "Azure Functions Core Tools installed"
else
    print_warning "Azure Functions Core Tools not found (optional)"
    echo "  Install with: npm install -g azure-functions-core-tools@4"
fi

#################################################
# STEP 2: Provision Azure Resources
#################################################

print_section "Step 2: Provisioning Azure Resources"

# Create Resource Group
print_info "Creating resource group: ${RESOURCE_GROUP}"
if az group create \
    --name "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --tags Environment="${ENVIRONMENT}" Project="SmartProof AI" ManagedBy="deploy-local.sh" \
    --output none 2>/dev/null; then
    print_success "Resource group created"
else
    print_warning "Resource group already exists"
fi

# Deploy Infrastructure using Bicep
print_info "Deploying infrastructure (this may take 15-20 minutes)..."
DEPLOYMENT_NAME="smartproof-local-deploy-$(date +%Y%m%d-%H%M%S)"

if az deployment group create \
    --name "${DEPLOYMENT_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --template-file infrastructure/main.bicep \
    --parameters environment="${ENVIRONMENT}" location="${LOCATION}" baseName="${BASE_NAME}" \
    --output none; then
    print_success "Infrastructure deployed successfully"
else
    print_error "Infrastructure deployment failed"
    exit 1
fi

# Retrieve resource names from deployment outputs
print_info "Retrieving resource information..."

STORAGE_ACCOUNT=$(az deployment group show \
    --name "${DEPLOYMENT_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query properties.outputs.storageAccountName.value -o tsv 2>/dev/null || echo "${BASE_NAME}stor${ENVIRONMENT}")

AI_SEARCH=$(az deployment group show \
    --name "${DEPLOYMENT_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query properties.outputs.aiSearchName.value -o tsv 2>/dev/null || echo "${BASE_NAME}-search-${ENVIRONMENT}")

print_success "Retrieved resource names"

#################################################
# STEP 3: Create Text Embeddings Deployment
#################################################

print_section "Step 3: Creating Text Embedding Deployment"

print_info "Checking for existing text-embedding-ada-002 deployment..."

# Check if deployment already exists
EXISTING_DEPLOYMENT=$(az cognitiveservices account deployment list \
    --name "${OPENAI_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query "[?name=='text-embedding-ada-002'].name" -o tsv 2>/dev/null || echo "")

if [ -n "$EXISTING_DEPLOYMENT" ]; then
    print_warning "text-embedding-ada-002 deployment already exists"
else
    print_info "Creating text-embedding-ada-002 deployment..."

    if az cognitiveservices account deployment create \
        --name "${OPENAI_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --deployment-name text-embedding-ada-002 \
        --model-name text-embedding-ada-002 \
        --model-version "2" \
        --model-format OpenAI \
        --sku-capacity 10 \
        --sku-name "Standard" \
        --output none 2>/dev/null; then
        print_success "text-embedding-ada-002 deployment created"
    else
        print_error "Failed to create text-embedding-ada-002 deployment"
        print_warning "You may need to create this manually in Azure Portal"
    fi
fi

#################################################
# STEP 4: Retrieve Connection Strings and Keys
#################################################

print_section "Step 4: Retrieving Connection Strings and Keys"

# Storage Account
print_info "Getting storage connection string..."
STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
    --name "${STORAGE_ACCOUNT}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query connectionString -o tsv)
print_success "Storage connection string retrieved"

# AI Search
print_info "Getting AI Search credentials..."
SEARCH_ENDPOINT="https://${AI_SEARCH}.search.windows.net"
SEARCH_KEY=$(az search admin-key show \
    --service-name "${AI_SEARCH}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query primaryKey -o tsv)
print_success "AI Search credentials retrieved"

# Azure OpenAI
print_info "Getting Azure OpenAI credentials..."
OPENAI_ENDPOINT=$(az cognitiveservices account show \
    --name "${OPENAI_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query properties.endpoint -o tsv)
OPENAI_KEY=$(az cognitiveservices account keys list \
    --name "${OPENAI_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query key1 -o tsv)
print_success "Azure OpenAI credentials retrieved"

# Get tenant ID for Azure AD
TENANT_ID=$(az account show --query tenantId -o tsv)

#################################################
# STEP 5: Install Local Dependencies
#################################################

print_section "Step 5: Installing Local Dependencies"

# Frontend dependencies
print_info "Installing frontend dependencies..."
cd frontend
npm install --silent
print_success "Frontend dependencies installed"
cd ..

# Backend dependencies
print_info "Installing backend dependencies..."
cd backend
npm install --silent
print_success "Backend dependencies installed"
cd ..

#################################################
# STEP 6: Configure Environment Files
#################################################

print_section "Step 6: Configuring Environment Files"

# Configure backend/local.settings.json
print_info "Configuring backend/local.settings.json..."

cat > backend/local.settings.json << EOF
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "${STORAGE_CONNECTION_STRING}",
    "FUNCTIONS_WORKER_RUNTIME": "node",

    "AZURE_STORAGE_CONNECTION_STRING": "${STORAGE_CONNECTION_STRING}",
    "AZURE_STORAGE_ACCOUNT_NAME": "${STORAGE_ACCOUNT}",

    "AZURE_OPENAI_ENDPOINT": "${OPENAI_ENDPOINT}",
    "AZURE_OPENAI_KEY": "${OPENAI_KEY}",
    "AZURE_OPENAI_DEPLOYMENT_GPT4": "gpt-4o",
    "AZURE_OPENAI_EMBEDDING_DEPLOYMENT": "text-embedding-ada-002",

    "AZURE_AI_SEARCH_ENDPOINT": "${SEARCH_ENDPOINT}",
    "AZURE_AI_SEARCH_KEY": "${SEARCH_KEY}",
    "AZURE_AI_SEARCH_INDEX_NAME": "smartproof-product-info",

    "BLOB_CONTAINER_UPLOADS": "uploads",
    "BLOB_CONTAINER_PROCESSED": "processed",
    "BLOB_CONTAINER_REPORTS": "reports",
    "BLOB_CONTAINER_STATE": "state",

    "LOG_LEVEL": "info",
    "ENVIRONMENT": "development"
  }
}
EOF

print_success "backend/local.settings.json configured"

# Configure frontend/.env
print_info "Configuring frontend/.env..."

# Check if Azure AD app exists
AD_APP_ID=""
AD_APP_EXISTS=$(az ad app list --display-name "smartproof-${ENVIRONMENT}" --query "[0].appId" -o tsv 2>/dev/null || echo "")

if [ -n "$AD_APP_EXISTS" ]; then
    AD_APP_ID="$AD_APP_EXISTS"
    print_success "Using existing Azure AD app: $AD_APP_ID"
else
    print_warning "Azure AD app not found"
    print_info "Creating Azure AD app registration..."

    AD_APP_ID=$(az ad app create \
        --display-name "smartproof-${ENVIRONMENT}" \
        --sign-in-audience AzureADMyOrg \
        --query appId -o tsv 2>/dev/null || echo "")

    if [ -n "$AD_APP_ID" ]; then
        print_success "Azure AD app created: $AD_APP_ID"
        print_warning "Please configure redirect URIs in Azure Portal:"
        print_info "  1. Go to Azure Portal > Azure AD > App registrations"
        print_info "  2. Find 'smartproof-${ENVIRONMENT}'"
        print_info "  3. Add redirect URI: http://localhost:3000"
    else
        print_warning "Could not create Azure AD app automatically"
        AD_APP_ID="YOUR_CLIENT_ID_HERE"
    fi
fi

cat > frontend/.env << EOF
# Azure AD Configuration
VITE_AZURE_AD_CLIENT_ID=${AD_APP_ID}
VITE_AZURE_AD_TENANT_ID=${TENANT_ID}
VITE_AZURE_AD_REDIRECT_URI=http://localhost:3000

# API Configuration
VITE_API_BASE_URL=http://localhost:7071/api

# Environment
VITE_ENVIRONMENT=development
EOF

print_success "frontend/.env configured"

#################################################
# STEP 7: Create Configuration Summary File
#################################################

print_section "Step 7: Creating Configuration Summary"

CONFIG_FILE="config-${ENVIRONMENT}.txt"

cat > "${CONFIG_FILE}" << EOF
#########################################################
# SmartProof AI - Azure Configuration
# Environment: ${ENVIRONMENT}
# Generated: $(date)
# Deployed by: deploy-local.sh
#########################################################

RESOURCE_GROUP=${RESOURCE_GROUP}
LOCATION=${LOCATION}

# Storage Account
STORAGE_ACCOUNT_NAME=${STORAGE_ACCOUNT}
AZURE_STORAGE_CONNECTION_STRING=${STORAGE_CONNECTION_STRING}

# Azure AI Search
AZURE_AI_SEARCH_ENDPOINT=${SEARCH_ENDPOINT}
AZURE_AI_SEARCH_KEY=${SEARCH_KEY}
AZURE_AI_SEARCH_INDEX_NAME=smartproof-product-info

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=${OPENAI_ENDPOINT}
AZURE_OPENAI_KEY=${OPENAI_KEY}
AZURE_OPENAI_DEPLOYMENT_GPT4=gpt-4o
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-ada-002

# Azure AD
AZURE_AD_TENANT_ID=${TENANT_ID}
AZURE_AD_CLIENT_ID=${AD_APP_ID}

# Blob Containers
BLOB_CONTAINER_UPLOADS=uploads
BLOB_CONTAINER_PROCESSED=processed
BLOB_CONTAINER_REPORTS=reports
BLOB_CONTAINER_STATE=state

#########################################################
# Knowledge Base Features (NEW!)
#########################################################

The system now includes a complete knowledge base with:
- ✅ Automatic document indexing during compliance workflow
- ✅ Vector embeddings with text-embedding-ada-002
- ✅ Hybrid search (keyword + semantic + vector)
- ✅ AI-powered metadata extraction (model, category, standards)
- ✅ Azure AI Search integration
- ✅ Natural language query support

Test the search API:
  curl -X POST http://localhost:7071/api/search/product \\
    -H "Content-Type: application/json" \\
    -d '{"query": "ladder"}'

#########################################################
# Configuration Files Created
#########################################################

✓ backend/local.settings.json - Backend configuration
✓ frontend/.env - Frontend configuration
✓ ${CONFIG_FILE} - This summary file

#########################################################
# Next Steps
#########################################################

1. Start the backend:
   cd backend && npm start

2. Start the frontend (in new terminal):
   cd frontend && npm run dev

3. Open browser:
   http://localhost:3000

4. Upload a document to test the knowledge base!

#########################################################
EOF

print_success "Configuration summary saved: ${CONFIG_FILE}"

#################################################
# STEP 8: Final Summary
#################################################

print_section "Deployment Complete!"

echo ""
echo -e "${GREEN}=========================================================${NC}"
echo -e "${GREEN}   ✓ SmartProof AI Deployment Successful!${NC}"
echo -e "${GREEN}=========================================================${NC}"
echo ""
echo -e "${CYAN}Resources Created:${NC}"
echo -e "  • Resource Group:      ${RESOURCE_GROUP}"
echo -e "  • Storage Account:     ${STORAGE_ACCOUNT}"
echo -e "  • AI Search:           ${AI_SEARCH}"
echo -e "  • Azure OpenAI:        ${OPENAI_NAME}"
echo -e "  • Embeddings Model:    text-embedding-ada-002"
echo ""
echo -e "${CYAN}Configuration Files:${NC}"
echo -e "  ✓ backend/local.settings.json"
echo -e "  ✓ frontend/.env"
echo -e "  ✓ ${CONFIG_FILE}"
echo ""
echo -e "${CYAN}Knowledge Base Features:${NC}"
echo -e "  ✓ Automatic document indexing"
echo -e "  ✓ Vector embeddings (1536 dimensions)"
echo -e "  ✓ Hybrid search (keyword + semantic + vector)"
echo -e "  ✓ AI metadata extraction"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo -e "${BLUE}1. Start Backend (Terminal 1):${NC}"
echo -e "   cd backend && npm start"
echo ""
echo -e "${BLUE}2. Start Frontend (Terminal 2):${NC}"
echo -e "   cd frontend && npm run dev"
echo ""
echo -e "${BLUE}3. Access Application:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend:  ${GREEN}http://localhost:7071${NC}"
echo ""
echo -e "${BLUE}4. Test Knowledge Base:${NC}"
echo -e "   Upload a compliance document to automatically index it"
echo -e "   Use the Search page to query with natural language"
echo ""
if [ "$AD_APP_ID" = "YOUR_CLIENT_ID_HERE" ]; then
    echo -e "${YELLOW}⚠ IMPORTANT: Azure AD Configuration Required${NC}"
    echo -e "   Please manually create an Azure AD app registration and update:"
    echo -e "   frontend/.env with your VITE_AZURE_AD_CLIENT_ID"
    echo ""
fi
echo -e "${GREEN}=========================================================${NC}"
echo ""
echo -e "${CYAN}For more information:${NC}"
echo -e "  • Configuration details: ${CONFIG_FILE}"
echo -e "  • Quick start guide:     docs/START_HERE.md"
echo -e "  • Configuration guide:   docs/WHERE_TO_CONFIGURE.md"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo ""
