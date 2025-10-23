// SmartProof AI - Main Infrastructure Template
// Deploys all Azure resources for the SmartProof PoC

@description('Environment name (dev, staging, prod)')
param environment string = 'dev'

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Base name for all resources')
param baseName string = 'smartproof'

@description('Tags for all resources')
param tags object = {
  Environment: environment
  Project: 'SmartProof AI'
  ManagedBy: 'Bicep'
}

// Storage Account
module storage 'modules/storage.bicep' = {
  name: 'storage-deployment'
  params: {
    location: location
    environment: environment
    baseName: baseName
    tags: tags
  }
}

// Function App (Backend)
module functionApp 'modules/function-app.bicep' = {
  name: 'function-app-deployment'
  params: {
    location: location
    environment: environment
    baseName: baseName
    storageAccountName: storage.outputs.storageAccountName
    tags: tags
  }
}

// App Service (Frontend)
module appService 'modules/app-service.bicep' = {
  name: 'app-service-deployment'
  params: {
    location: location
    environment: environment
    baseName: baseName
    tags: tags
  }
}

// AI Search
module aiSearch 'modules/ai-search.bicep' = {
  name: 'ai-search-deployment'
  params: {
    location: location
    environment: environment
    baseName: baseName
    tags: tags
  }
}

// Document Intelligence
module documentIntelligence 'modules/document-intelligence.bicep' = {
  name: 'doc-intel-deployment'
  params: {
    location: location
    environment: environment
    baseName: baseName
    tags: tags
  }
}

// Computer Vision
module computerVision 'modules/computer-vision.bicep' = {
  name: 'computer-vision-deployment'
  params: {
    location: location
    environment: environment
    baseName: baseName
    tags: tags
  }
}

// AI Foundry (OpenAI)
module aiFoundry 'modules/ai-foundry.bicep' = {
  name: 'ai-foundry-deployment'
  params: {
    location: location
    environment: environment
    baseName: baseName
    tags: tags
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${baseName}-insights-${environment}'
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    RetentionInDays: 90
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Outputs
output storageAccountName string = storage.outputs.storageAccountName
output functionAppName string = functionApp.outputs.functionAppName
output appServiceName string = appService.outputs.appServiceName
output aiSearchName string = aiSearch.outputs.searchServiceName
output appInsightsName string = appInsights.name
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
