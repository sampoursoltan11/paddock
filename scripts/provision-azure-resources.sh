#!/bin/bash

# SmartProof AI - Azure Resource Provisioning Script
# This script provisions all required Azure resources for the SmartProof PoC
# Usage: ./provision-azure-resources.sh [--environment dev|staging|prod]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="${1:-dev}"
LOCATION="eastus"
RESOURCE_GROUP="smartproof-rg-${ENVIRONMENT}"
BASE_NAME="smartproof"

echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}SmartProof AI - Azure Resource Provisioning${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""
echo -e "Environment: ${GREEN}${ENVIRONMENT}${NC}"
echo -e "Location: ${GREEN}${LOCATION}${NC}"
echo -e "Resource Group: ${GREEN}${RESOURCE_GROUP}${NC}"
echo ""

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

# Check if logged into Azure
print_section "Checking Azure CLI login"
if ! az account show > /dev/null 2>&1; then
    print_error "Not logged into Azure CLI"
    echo "Please login first: az login"
    exit 1
fi

ACCOUNT_NAME=$(az account show --query name -o tsv)
print_success "Logged in as: $ACCOUNT_NAME"

# Create Resource Group
print_section "Creating Resource Group"
if az group create \
    --name "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --tags Environment="${ENVIRONMENT}" Project="SmartProof AI" ManagedBy="Script" \
    --output none; then
    print_success "Resource group created: ${RESOURCE_GROUP}"
else
    print_warning "Resource group may already exist: ${RESOURCE_GROUP}"
fi

# Deploy Infrastructure using Bicep
print_section "Deploying Azure Infrastructure (this may take 10-15 minutes)"
echo "Deploying Bicep template..."

DEPLOYMENT_NAME="smartproof-deployment-$(date +%Y%m%d-%H%M%S)"

if az deployment group create \
    --name "${DEPLOYMENT_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --template-file infrastructure/main.bicep \
    --parameters environment="${ENVIRONMENT}" location="${LOCATION}" baseName="${BASE_NAME}" \
    --output none; then
    print_success "Infrastructure deployment completed"
else
    print_error "Infrastructure deployment failed"
    exit 1
fi

# Get deployment outputs
print_section "Retrieving Resource Information"

STORAGE_ACCOUNT=$(az deployment group show \
    --name "${DEPLOYMENT_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query properties.outputs.storageAccountName.value -o tsv)

FUNCTION_APP=$(az deployment group show \
    --name "${DEPLOYMENT_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query properties.outputs.functionAppName.value -o tsv)

APP_SERVICE=$(az deployment group show \
    --name "${DEPLOYMENT_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query properties.outputs.appServiceName.value -o tsv)

AI_SEARCH=$(az deployment group show \
    --name "${DEPLOYMENT_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query properties.outputs.aiSearchName.value -o tsv)

APP_INSIGHTS=$(az deployment group show \
    --name "${DEPLOYMENT_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query properties.outputs.appInsightsName.value -o tsv)

print_success "Retrieved resource names"

# Get resource endpoints and keys
print_section "Retrieving Connection Strings and Keys"

# Storage Account
STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
    --name "${STORAGE_ACCOUNT}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query connectionString -o tsv)

# AI Search
SEARCH_ENDPOINT="https://${AI_SEARCH}.search.windows.net"
SEARCH_KEY=$(az search admin-key show \
    --service-name "${AI_SEARCH}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query primaryKey -o tsv)

# Document Intelligence
DOC_INTEL_NAME="${BASE_NAME}-docintel-${ENVIRONMENT}"
DOC_INTEL_ENDPOINT=$(az cognitiveservices account show \
    --name "${DOC_INTEL_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query properties.endpoint -o tsv)
DOC_INTEL_KEY=$(az cognitiveservices account keys list \
    --name "${DOC_INTEL_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query key1 -o tsv)

# Computer Vision
VISION_NAME="${BASE_NAME}-vision-${ENVIRONMENT}"
VISION_ENDPOINT=$(az cognitiveservices account show \
    --name "${VISION_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query properties.endpoint -o tsv)
VISION_KEY=$(az cognitiveservices account keys list \
    --name "${VISION_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query key1 -o tsv)

# Azure OpenAI
OPENAI_NAME="${BASE_NAME}-openai-${ENVIRONMENT}"
OPENAI_ENDPOINT=$(az cognitiveservices account show \
    --name "${OPENAI_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query properties.endpoint -o tsv)
OPENAI_KEY=$(az cognitiveservices account keys list \
    --name "${OPENAI_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query key1 -o tsv)

# Application Insights
APPINSIGHTS_KEY=$(az monitor app-insights component show \
    --app "${APP_INSIGHTS}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query instrumentationKey -o tsv)

print_success "Retrieved all connection strings and keys"

# Create configuration file
print_section "Creating Configuration File"

CONFIG_FILE="config-${ENVIRONMENT}.txt"

cat > "${CONFIG_FILE}" << EOF
#################################################
# SmartProof AI - Azure Configuration
# Environment: ${ENVIRONMENT}
# Generated: $(date)
#################################################

RESOURCE_GROUP=${RESOURCE_GROUP}

# Storage Account
STORAGE_ACCOUNT_NAME=${STORAGE_ACCOUNT}
AZURE_STORAGE_CONNECTION_STRING=${STORAGE_CONNECTION_STRING}

# Azure Functions
FUNCTION_APP_NAME=${FUNCTION_APP}

# App Service (Frontend)
APP_SERVICE_NAME=${APP_SERVICE}

# Azure AI Search
AZURE_AI_SEARCH_ENDPOINT=${SEARCH_ENDPOINT}
AZURE_AI_SEARCH_KEY=${SEARCH_KEY}
AZURE_AI_SEARCH_INDEX_NAME=smartproof-product-info

# Document Intelligence
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=${DOC_INTEL_ENDPOINT}
AZURE_DOCUMENT_INTELLIGENCE_KEY=${DOC_INTEL_KEY}

# Computer Vision
AZURE_COMPUTER_VISION_ENDPOINT=${VISION_ENDPOINT}
AZURE_COMPUTER_VISION_KEY=${VISION_KEY}

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=${OPENAI_ENDPOINT}
AZURE_OPENAI_KEY=${OPENAI_KEY}
AZURE_OPENAI_DEPLOYMENT_GPT4=gpt-4
AZURE_OPENAI_DEPLOYMENT_GPT4_VISION=gpt-4-vision

# Application Insights
APPINSIGHTS_INSTRUMENTATIONKEY=${APPINSIGHTS_KEY}

# Blob Containers (auto-created by deployment)
BLOB_CONTAINER_UPLOADS=uploads
BLOB_CONTAINER_PROCESSED=processed
BLOB_CONTAINER_REPORTS=reports
BLOB_CONTAINER_STATE=state

#################################################
# Next Steps:
# 1. Copy values to backend/local.settings.json
# 2. Set up Azure AD app registration
# 3. Configure frontend/.env with Azure AD details
#################################################
EOF

print_success "Configuration saved to: ${CONFIG_FILE}"

# Create Azure AD app registration (optional)
print_section "Azure AD App Registration"
echo "Would you like to create an Azure AD app registration for authentication? (y/n)"
read -r CREATE_AD_APP

if [[ "$CREATE_AD_APP" =~ ^[Yy]$ ]]; then
    APP_NAME="smartproof-${ENVIRONMENT}"

    # Create app registration
    AD_APP_ID=$(az ad app create \
        --display-name "${APP_NAME}" \
        --sign-in-audience AzureADMyOrg \
        --query appId -o tsv)

    # Get tenant ID
    TENANT_ID=$(az account show --query tenantId -o tsv)

    print_success "Azure AD app created: ${AD_APP_ID}"

    echo ""
    echo "Add the following to frontend/.env:"
    echo "VITE_AZURE_AD_CLIENT_ID=${AD_APP_ID}"
    echo "VITE_AZURE_AD_TENANT_ID=${TENANT_ID}"
    echo ""
    echo "NOTE: You need to configure redirect URIs in Azure Portal:"
    echo "1. Go to Azure Portal > Azure Active Directory > App registrations"
    echo "2. Find '${APP_NAME}'"
    echo "3. Add redirect URI: http://localhost:3000"
    echo "4. Add redirect URI: https://${APP_SERVICE}.azurewebsites.net"
fi

# Summary
print_section "Provisioning Complete!"
echo ""
echo -e "${GREEN}✓ All Azure resources have been provisioned${NC}"
echo ""
echo "Resources created:"
echo "  • Resource Group: ${RESOURCE_GROUP}"
echo "  • Storage Account: ${STORAGE_ACCOUNT}"
echo "  • Function App: ${FUNCTION_APP}"
echo "  • App Service: ${APP_SERVICE}"
echo "  • AI Search: ${AI_SEARCH}"
echo "  • Document Intelligence: ${DOC_INTEL_NAME}"
echo "  • Computer Vision: ${VISION_NAME}"
echo "  • Azure OpenAI: ${OPENAI_NAME}"
echo "  • Application Insights: ${APP_INSIGHTS}"
echo ""
echo -e "${YELLOW}Configuration file created: ${CONFIG_FILE}${NC}"
echo ""
echo "Next steps:"
echo "  1. Review and copy values from ${CONFIG_FILE}"
echo "  2. Update backend/local.settings.json (see CONFIGURATION_GUIDE.md)"
echo "  3. Update frontend/.env (see CONFIGURATION_GUIDE.md)"
echo "  4. Run ./scripts/setup-local.sh"
echo "  5. Start development: cd frontend && npm run dev"
echo ""
echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}For detailed configuration instructions, see:${NC}"
echo -e "${BLUE}docs/CONFIGURATION_GUIDE.md${NC}"
echo -e "${BLUE}=================================================${NC}"
