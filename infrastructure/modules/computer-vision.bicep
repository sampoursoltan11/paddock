// Azure Computer Vision Module
param location string
param environment string
param baseName string
param tags object

var visionName = '${baseName}-vision-${environment}'

resource computerVision 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: visionName
  location: location
  tags: tags
  kind: 'ComputerVision'
  sku: {
    name: 'S1'
  }
  properties: {
    customSubDomainName: visionName
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
}

output computerVisionName string = computerVision.name
output computerVisionId string = computerVision.id
output computerVisionEndpoint string = computerVision.properties.endpoint
