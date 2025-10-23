#!/bin/bash

# SmartProof AI - Deployment Script
# Usage: ./deploy.sh [--environment dev|staging|prod] [--deploy-infra] [--deploy-backend] [--deploy-frontend]

set -e

# Default values
ENVIRONMENT="dev"
DEPLOY_INFRA=false
DEPLOY_BACKEND=false
DEPLOY_FRONTEND=false
RESOURCE_GROUP="smartproof-rg"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --deploy-infra)
      DEPLOY_INFRA=true
      shift
      ;;
    --deploy-backend)
      DEPLOY_BACKEND=true
      shift
      ;;
    --deploy-frontend)
      DEPLOY_FRONTEND=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo "================================================="
echo "SmartProof AI Deployment"
echo "================================================="
echo "Environment: $ENVIRONMENT"
echo "Deploy Infrastructure: $DEPLOY_INFRA"
echo "Deploy Backend: $DEPLOY_BACKEND"
echo "Deploy Frontend: $DEPLOY_FRONTEND"
echo "================================================="

# Check if logged into Azure
echo "Checking Azure CLI login..."
az account show > /dev/null 2>&1 || { echo "Please login to Azure CLI first: az login"; exit 1; }

# Deploy Infrastructure
if [ "$DEPLOY_INFRA" = true ]; then
  echo ""
  echo "Deploying infrastructure..."

  # Create resource group if it doesn't exist
  az group create \
    --name "${RESOURCE_GROUP}-${ENVIRONMENT}" \
    --location eastus \
    --tags Environment=$ENVIRONMENT Project="SmartProof AI"

  # Deploy Bicep template
  az deployment group create \
    --resource-group "${RESOURCE_GROUP}-${ENVIRONMENT}" \
    --template-file infrastructure/main.bicep \
    --parameters infrastructure/parameters/${ENVIRONMENT}.parameters.json \
    --verbose

  echo "Infrastructure deployment completed!"
fi

# Deploy Backend (Azure Functions)
if [ "$DEPLOY_BACKEND" = true ]; then
  echo ""
  echo "Deploying backend..."

  cd backend

  # Install dependencies
  echo "Installing backend dependencies..."
  npm ci

  # Build TypeScript
  echo "Building backend..."
  npm run build

  # Get function app name from deployment
  FUNCTION_APP_NAME="smartproof-func-${ENVIRONMENT}"

  # Deploy to Azure Functions
  echo "Deploying to Azure Functions: $FUNCTION_APP_NAME"
  func azure functionapp publish $FUNCTION_APP_NAME --typescript

  cd ..

  echo "Backend deployment completed!"
fi

# Deploy Frontend
if [ "$DEPLOY_FRONTEND" = true ]; then
  echo ""
  echo "Deploying frontend..."

  cd frontend

  # Install dependencies
  echo "Installing frontend dependencies..."
  npm ci

  # Build production bundle
  echo "Building frontend..."
  npm run build

  # Get app service name from deployment
  APP_SERVICE_NAME="smartproof-web-${ENVIRONMENT}"

  # Create deployment package
  cd dist
  zip -r ../frontend.zip .
  cd ..

  # Deploy to Azure App Service
  echo "Deploying to Azure App Service: $APP_SERVICE_NAME"
  az webapp deployment source config-zip \
    --resource-group "${RESOURCE_GROUP}-${ENVIRONMENT}" \
    --name $APP_SERVICE_NAME \
    --src frontend.zip

  # Clean up
  rm frontend.zip

  cd ..

  echo "Frontend deployment completed!"
fi

echo ""
echo "================================================="
echo "Deployment Complete!"
echo "================================================="
echo "Next steps:"
echo "1. Configure environment variables in Azure Portal"
echo "2. Set up Azure AD app registration"
echo "3. Test the deployed application"
echo "================================================="
