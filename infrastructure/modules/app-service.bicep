// App Service Module (Frontend)
param location string
param environment string
param baseName string
param tags object

var appServiceName = '${baseName}-web-${environment}'
var appServicePlanName = '${baseName}-webplan-${environment}'

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  properties: {
    reserved: true // Linux
  }
}

// App Service (Frontend)
resource appService 'Microsoft.Web/sites@2022-09-01' = {
  name: appServiceName
  location: location
  tags: tags
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      appCommandLine: 'pm2 serve /home/site/wwwroot --spa --no-daemon'
      appSettings: [
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~18'
        }
      ]
    }
    httpsOnly: true
  }
}

output appServiceName string = appService.name
output appServiceId string = appService.id
output appServiceHostName string = appService.properties.defaultHostName
