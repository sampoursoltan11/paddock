#!/bin/bash

# SmartProof AI - Manual Azure Resource Provisioning
# This script creates resources using Azure CLI commands directly
# Usage: ./provision-manual.sh

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
RG="SamP-Sandbox"
LOCATION="australiaeast"
ENV="dev"
BASE="smartproof"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}SmartProof AI - Manual Provisioning${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Resource Group: $RG"
echo "Location: $LOCATION"
echo ""

# Storage Account
echo -e "${BLUE}Creating Storage Account...${NC}"
STORAGE_NAME="${BASE}stor${ENV}$(date +%s | tail -c 6)"
az storage account create \
  --name "$STORAGE_NAME" \
  --resource-group "$RG" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --https-only true \
  --min-tls-version TLS1_2

echo -e "${GREEN}✓ Storage Account created: $STORAGE_NAME${NC}"

# Create containers
echo -e "${BLUE}Creating blob containers...${NC}"
STORAGE_KEY=$(az storage account keys list --resource-group "$RG" --account-name "$STORAGE_NAME" --query '[0].value' -o tsv)

for container in uploads processed reports state; do
  az storage container create \
    --name "$container" \
    --account-name "$STORAGE_NAME" \
    --account-key "$STORAGE_KEY"
done

echo -e "${GREEN}✓ Blob containers created${NC}"

# Get connection string
STORAGE_CONN=$(az storage account show-connection-string --name "$STORAGE_NAME" --resource-group "$RG" --query connectionString -o tsv)

# Application Insights
echo -e "${BLUE}Creating Application Insights...${NC}"
APPINSIGHTS_NAME="${BASE}-insights-${ENV}"
az monitor app-insights component create \
  --app "$APPINSIGHTS_NAME" \
  --location "$LOCATION" \
  --resource-group "$RG" \
  --application-type web

APPINSIGHTS_KEY=$(az monitor app-insights component show --app "$APPINSIGHTS_NAME" --resource-group "$RG" --query instrumentationKey -o tsv)

echo -e "${GREEN}✓ Application Insights created${NC}"

# Azure Functions (Consumption Plan)
echo -e "${BLUE}Creating Azure Functions (Consumption)...${NC}"
FUNC_NAME="${BASE}-func-${ENV}"

# Create Function App with Consumption plan
az functionapp create \
  --name "$FUNC_NAME" \
  --resource-group "$RG" \
  --storage-account "$STORAGE_NAME" \
  --consumption-plan-location "$LOCATION" \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4 \
  --os-type Linux

echo -e "${GREEN}✓ Azure Functions created: $FUNC_NAME${NC}"

# App Service (Frontend)
echo -e "${BLUE}Creating App Service for frontend...${NC}"
APP_NAME="${BASE}-web-${ENV}"

# Create App Service Plan for frontend
WEBAPP_PLAN="${BASE}-webplan-${ENV}"
az appservice plan create \
  --name "$WEBAPP_PLAN" \
  --resource-group "$RG" \
  --location "$LOCATION" \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --name "$APP_NAME" \
  --resource-group "$RG" \
  --plan "$WEBAPP_PLAN" \
  --runtime "NODE:18-lts"

echo -e "${GREEN}✓ App Service created: $APP_NAME${NC}"

# Save configuration
CONFIG_FILE="config-dev.txt"

cat > "$CONFIG_FILE" << EOF
#################################################
# SmartProof AI - Azure Configuration
# Environment: ${ENV}
# Resource Group: ${RG}
# Location: ${LOCATION}
# Generated: $(date)
#################################################

RESOURCE_GROUP=${RG}
LOCATION=${LOCATION}

# Storage Account
STORAGE_ACCOUNT_NAME=${STORAGE_NAME}
AZURE_STORAGE_CONNECTION_STRING=${STORAGE_CONN}

# Azure Functions
FUNCTION_APP_NAME=${FUNC_NAME}

# App Service (Frontend)
APP_SERVICE_NAME=${APP_NAME}

# Application Insights
APPINSIGHTS_INSTRUMENTATIONKEY=${APPINSIGHTS_KEY}

# Blob Containers
BLOB_CONTAINER_UPLOADS=uploads
BLOB_CONTAINER_PROCESSED=processed
BLOB_CONTAINER_REPORTS=reports
BLOB_CONTAINER_STATE=state

#################################################
# AI SERVICES - Manual Setup Required
#################################################

# You'll need to create these manually in Azure Portal:
# 1. Azure OpenAI Service (with GPT-4o deployment for document parsing and vision)
# 2. AI Search (for knowledge base)

# NOTE: Document Intelligence and Computer Vision are NOT needed.
# GPT-4o handles all document parsing and image analysis tasks.

# After creating them, add their endpoints and keys here.

#################################################
# Next Steps:
# 1. Create AI services in Azure Portal (OpenAI and AI Search only)
# 2. Update this file with AI service credentials
# 3. Copy values to backend/local.settings.json
# 4. Copy values to frontend/.env
#################################################
EOF

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Provisioning Complete (Part 1)${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Created resources:"
echo "  • Storage: $STORAGE_NAME"
echo "  • Functions: $FUNC_NAME"
echo "  • Web App: $APP_NAME"
echo "  • App Insights: $APPINSIGHTS_NAME"
echo ""
echo -e "${YELLOW}Configuration saved to: $CONFIG_FILE${NC}"
echo ""
echo -e "${YELLOW}NOTE: AI Services need manual creation${NC}"
echo "Please create these in Azure Portal:"
echo "  1. Azure OpenAI (with GPT-4o deployment - handles document parsing and vision)"
echo "  2. AI Search (for knowledge base)"
echo ""
echo -e "${YELLOW}NOTE: Document Intelligence and Computer Vision are NOT needed${NC}"
echo "GPT-4o with vision capabilities handles all document and image analysis."
echo ""
echo "Then update $CONFIG_FILE with their credentials"
echo ""
