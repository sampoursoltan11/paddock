// Azure OpenAI (AI Foundry) Module
param location string
param environment string
param baseName string
param tags object

var openAIName = '${baseName}-openai-${environment}'

resource openAI 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: openAIName
  location: location
  tags: tags
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: openAIName
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
}

// GPT-4 Deployment
resource gpt4Deployment 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = {
  parent: openAI
  name: 'gpt-4'
  sku: {
    name: 'Standard'
    capacity: 10
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4'
      version: '1106-Preview'
    }
  }
}

// GPT-4 Vision Deployment
resource gpt4VisionDeployment 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = {
  parent: openAI
  name: 'gpt-4-vision'
  sku: {
    name: 'Standard'
    capacity: 10
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4-vision-preview'
      version: '1106-Preview'
    }
  }
  dependsOn: [
    gpt4Deployment
  ]
}

output openAIName string = openAI.name
output openAIId string = openAI.id
output openAIEndpoint string = openAI.properties.endpoint
