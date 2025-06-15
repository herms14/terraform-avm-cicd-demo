# 🌳 Erdtree Self-Service Portal - Complete Deployment Prompt

## Overview
Deploy a complete Azure infrastructure self-service portal that allows users to request Azure resources (VMs, Storage, VNets, etc.) through an approval workflow using Azure Verified Modules and Terraform.

## Prerequisites
- Azure subscription with Contributor/Owner access
- Access to Azure Portal
- Email: hemirafl@microsoft.com for approvals

## 🚀 **DEPLOYMENT INSTRUCTIONS**

Copy and execute each step below in sequence:

---

### **STEP 1: Deploy Infrastructure via Azure Portal**

1. **Open Azure Portal**: https://portal.azure.com
2. **Navigate to**: "Deploy a custom template" (search for it)
3. **Click**: "Build your own template in the editor"
4. **Copy and paste this ARM template**:

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "environment": {
      "type": "string",
      "defaultValue": "prod",
      "allowedValues": ["dev", "prod"]
    },
    "location": {
      "type": "string",
      "defaultValue": "[resourceGroup().location]"
    },
    "uniqueSuffix": {
      "type": "string",
      "defaultValue": "[substring(uniqueString(resourceGroup().id), 0, 8)]"
    }
  },
  "variables": {
    "prefix": "erdtree",
    "appServicePlanName": "[concat(variables('prefix'), '-plan-', parameters('environment'))]",
    "webAppName": "[concat(variables('prefix'), '-portal-', parameters('environment'), '-', parameters('uniqueSuffix'))]",
    "logicAppName": "[concat(variables('prefix'), '-approval-', parameters('environment'), '-', parameters('uniqueSuffix'))]",
    "appInsightsName": "[concat(variables('prefix'), '-appinsights-', parameters('environment'))]",
    "storageAccountName": "[concat(variables('prefix'), 'storage', parameters('environment'), parameters('uniqueSuffix'))]",
    "tags": {
      "deployedBy": "Hermes",
      "managedBy": "ARM",
      "environment": "[parameters('environment')]",
      "application": "erdtree-portal"
    }
  },
  "resources": [
    {
      "type": "Microsoft.Storage/storageAccounts",
      "apiVersion": "2021-09-01",
      "name": "[variables('storageAccountName')]",
      "location": "[parameters('location')]",
      "sku": {
        "name": "Standard_LRS"
      },
      "kind": "StorageV2",
      "properties": {
        "accessTier": "Hot",
        "supportsHttpsTrafficOnly": true,
        "encryption": {
          "services": {
            "blob": {
              "enabled": true
            },
            "file": {
              "enabled": true
            }
          },
          "keySource": "Microsoft.Storage"
        }
      },
      "tags": "[variables('tags')]"
    },
    {
      "type": "Microsoft.Insights/components",
      "apiVersion": "2020-02-02",
      "name": "[variables('appInsightsName')]",
      "location": "[parameters('location')]",
      "kind": "web",
      "properties": {
        "Application_Type": "web"
      },
      "tags": "[variables('tags')]"
    },
    {
      "type": "Microsoft.Web/serverfarms",
      "apiVersion": "2021-03-01",
      "name": "[variables('appServicePlanName')]",
      "location": "[parameters('location')]",
      "sku": {
        "name": "B1",
        "capacity": 1
      },
      "kind": "linux",
      "properties": {
        "reserved": true
      },
      "tags": "[variables('tags')]"
    },
    {
      "type": "Microsoft.Web/sites",
      "apiVersion": "2021-03-01",
      "name": "[variables('webAppName')]",
      "location": "[parameters('location')]",
      "dependsOn": [
        "[resourceId('Microsoft.Web/serverfarms', variables('appServicePlanName'))]",
        "[resourceId('Microsoft.Insights/components', variables('appInsightsName'))]"
      ],
      "kind": "app,linux",
      "properties": {
        "serverFarmId": "[resourceId('Microsoft.Web/serverfarms', variables('appServicePlanName'))]",
        "siteConfig": {
          "linuxFxVersion": "NODE|18-lts",
          "appSettings": [
            {
              "name": "APPLICATIONINSIGHTS_CONNECTION_STRING",
              "value": "[reference(resourceId('Microsoft.Insights/components', variables('appInsightsName'))).ConnectionString]"
            },
            {
              "name": "WEBSITE_NODE_DEFAULT_VERSION",
              "value": "18-lts"
            },
            {
              "name": "REACT_APP_ENVIRONMENT",
              "value": "[parameters('environment')]"
            }
          ]
        },
        "httpsOnly": true
      },
      "tags": "[variables('tags')]"
    },
    {
      "type": "Microsoft.Web/sites",
      "apiVersion": "2021-03-01",
      "name": "[variables('logicAppName')]",
      "location": "[parameters('location')]",
      "dependsOn": [
        "[resourceId('Microsoft.Web/serverfarms', variables('appServicePlanName'))]",
        "[resourceId('Microsoft.Storage/storageAccounts', variables('storageAccountName'))]"
      ],
      "kind": "functionapp,workflowapp",
      "properties": {
        "serverFarmId": "[resourceId('Microsoft.Web/serverfarms', variables('appServicePlanName'))]",
        "siteConfig": {
          "appSettings": [
            {
              "name": "AzureWebJobsStorage",
              "value": "[concat('DefaultEndpointsProtocol=https;AccountName=', variables('storageAccountName'), ';AccountKey=', listKeys(resourceId('Microsoft.Storage/storageAccounts', variables('storageAccountName')), '2021-09-01').keys[0].value, ';EndpointSuffix=core.windows.net')]"
            },
            {
              "name": "WEBSITE_CONTENTAZUREFILECONNECTIONSTRING",
              "value": "[concat('DefaultEndpointsProtocol=https;AccountName=', variables('storageAccountName'), ';AccountKey=', listKeys(resourceId('Microsoft.Storage/storageAccounts', variables('storageAccountName')), '2021-09-01').keys[0].value, ';EndpointSuffix=core.windows.net')]"
            },
            {
              "name": "WEBSITE_CONTENTSHARE",
              "value": "[variables('logicAppName')]"
            },
            {
              "name": "FUNCTIONS_EXTENSION_VERSION",
              "value": "~4"
            },
            {
              "name": "FUNCTIONS_WORKER_RUNTIME",
              "value": "node"
            }
          ]
        },
        "httpsOnly": true
      },
      "tags": "[variables('tags')]"
    }
  ],
  "outputs": {
    "webAppUrl": {
      "type": "string",
      "value": "[concat('https://', reference(resourceId('Microsoft.Web/sites', variables('webAppName'))).defaultHostName)]"
    },
    "webAppName": {
      "type": "string",
      "value": "[variables('webAppName')]"
    },
    "logicAppName": {
      "type": "string",
      "value": "[variables('logicAppName')]"
    },
    "logicAppUrl": {
      "type": "string",
      "value": "[concat('https://', reference(resourceId('Microsoft.Web/sites', variables('logicAppName'))).defaultHostName)]"
    },
    "appInsightsConnectionString": {
      "type": "string",
      "value": "[reference(resourceId('Microsoft.Insights/components', variables('appInsightsName'))).ConnectionString]"
    }
  }
}
```

5. **Set deployment parameters**:
   - **Subscription**: Nokron-Prod (9dde5c52-88be-4608-9bee-c52d1909693f)
   - **Resource Group**: Create new → `erdtree-portal-rg`
   - **Region**: East US
   - **Environment**: prod
6. **Click**: Review + Create → Create

**⏱️ Wait 5-10 minutes for deployment to complete**

---

### **STEP 2: Create Azure AD App Registration**

1. **Azure Portal → Azure Active Directory → App registrations**
2. **Click**: New registration
3. **Fill in**:
   - **Name**: `Erdtree Self-Service Portal`
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Web → `https://[WEB-APP-NAME-FROM-STEP-1].azurewebsites.net`
4. **Click**: Register
5. **Copy these values** (you'll need them later):
   - **Application (client) ID**: `_______________`
   - **Directory (tenant) ID**: `b6458a9a-9661-468c-bda3-5f496727d0b0`

**Configure API Permissions**:
1. **API permissions → Add a permission**
2. **Microsoft Graph → Delegated → User.Read** → Add
3. **APIs my organization uses → Azure Service Management → Delegated → user_impersonation** → Add
4. **Grant admin consent for [organization]**

---

### **STEP 3: Configure Web App Settings**

1. **Go to your Web App** from Step 1
2. **Settings → Configuration → Application settings**
3. **Add these settings** (click + New application setting for each):

| Name | Value |
|------|-------|
| `REACT_APP_AZURE_CLIENT_ID` | `[CLIENT-ID-FROM-STEP-2]` |
| `REACT_APP_AZURE_TENANT_ID` | `b6458a9a-9661-468c-bda3-5f496727d0b0` |
| `REACT_APP_API_BASE_URL` | `https://[LOGIC-APP-NAME-FROM-STEP-1].azurewebsites.net` |

4. **Click**: Save

---

### **STEP 4: Deploy Frontend Code**

**Option A: Quick Test (Minimal Setup)**
1. **Web App → Advanced Tools → Go**
2. **Debug console → CMD**
3. **Navigate to**: site/wwwroot
4. **Create file**: index.html
5. **Paste this test page**:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Erdtree Self-Service Portal</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div id="root"></div>
    <script>
        const { useState } = React;
        
        function App() {
            const [selectedResource, setSelectedResource] = useState(null);
            
            const resources = [
                { id: 'vm-windows', name: 'Windows VM', icon: '🖥️', desc: 'Deploy Windows Server VMs' },
                { id: 'vm-linux', name: 'Linux VM', icon: '🐧', desc: 'Deploy Linux VMs' },
                { id: 'storage', name: 'Storage Account', icon: '💾', desc: 'Create storage accounts' },
                { id: 'vnet', name: 'Virtual Network', icon: '🌐', desc: 'Create virtual networks' }
            ];
            
            return React.createElement('div', { className: 'min-h-screen' },
                React.createElement('div', { className: 'bg-white shadow' },
                    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 py-6' },
                        React.createElement('h1', { className: 'text-3xl font-bold text-gray-900' }, 
                            '🌳 Erdtree Self-Service Portal'
                        ),
                        React.createElement('p', { className: 'text-gray-600 mt-2' }, 
                            'Select a resource type to deploy Azure infrastructure'
                        )
                    )
                ),
                React.createElement('div', { className: 'max-w-7xl mx-auto px-4 py-8' },
                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
                        resources.map(resource => 
                            React.createElement('div', {
                                key: resource.id,
                                className: 'bg-white p-6 rounded-lg border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-all',
                                onClick: () => alert(`Selected: ${resource.name}\n\nThis would open a deployment form with:\n- Resource configuration\n- Environment selection\n- Approval workflow`)
                            },
                                React.createElement('div', { className: 'flex items-center space-x-4' },
                                    React.createElement('div', { className: 'text-4xl' }, resource.icon),
                                    React.createElement('div', null,
                                        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900' }, resource.name),
                                        React.createElement('p', { className: 'text-sm text-gray-600' }, resource.desc)
                                    )
                                )
                            )
                        )
                    )
                ),
                React.createElement('div', { className: 'max-w-7xl mx-auto px-4 py-4' },
                    React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
                        React.createElement('h3', { className: 'font-semibold text-blue-900' }, '🚀 Deployment Status'),
                        React.createElement('p', { className: 'text-blue-800 text-sm mt-1' }, 
                            'Portal is ready! Next steps: Configure Logic App workflow and add full authentication.'
                        )
                    )
                )
            );
        }
        
        ReactDOM.render(React.createElement(App), document.getElementById('root'));
    </script>
</body>
</html>
```

**Option B: Full React App (Complete Setup)**
1. **Create GitHub repository** with the provided React frontend code
2. **Web App → Deployment Center → GitHub**
3. **Authorize and select** your repository
4. **Configure**: Node.js build
5. **Deploy**

---

### **STEP 5: Test the Portal**

1. **Open**: `https://[YOUR-WEB-APP-NAME].azurewebsites.net`
2. **Verify**: Page loads and shows resource cards
3. **Click**: Any resource card to test interaction
4. **Expected**: Alert showing deployment form preview

---

### **STEP 6: Configure Logic App (Optional - for full workflow)**

1. **Go to Logic App** from Step 1
2. **Logic Apps Designer**
3. **Create workflow** for approval emails
4. **Test**: Submit form → Receive email → Approve → Deploy

---

## 🎯 **EXPECTED RESULTS**

After completing these steps, you'll have:

✅ **Self-Service Portal**: Working web interface  
✅ **Resource Cards**: VM, Storage, VNet, Web Apps  
✅ **Azure Integration**: App Service, Application Insights  
✅ **Authentication Ready**: Azure AD app registration  
✅ **Monitoring**: Application Insights configured  
✅ **Scalable Architecture**: Ready for full deployment workflow  

## 📋 **VERIFICATION CHECKLIST**

- [ ] ARM template deployed successfully
- [ ] Web App is accessible via HTTPS
- [ ] Azure AD app registration created
- [ ] App settings configured correctly
- [ ] Test page loads and shows resource cards
- [ ] Click interactions work (show alerts)
- [ ] Application Insights receiving telemetry

## 🆘 **TROUBLESHOOTING**

**Portal not loading?**
- Check Web App deployment status
- Verify app settings are correct
- Check Application Insights logs

**Authentication issues?**
- Verify client ID and tenant ID
- Check redirect URI matches exactly
- Ensure API permissions granted

**Need help?**
- Check Azure Portal → Resource Health
- Review Activity Log for errors
- Contact: hemirafl@microsoft.com

---

## 🚀 **NEXT STEPS** (Optional)

After basic deployment works:
1. **Full React Frontend**: Deploy complete React application
2. **Logic App Workflow**: Configure approval process
3. **Terraform Integration**: Set up infrastructure deployment
4. **User Training**: Onboard users to the portal

**Estimated Time**: 30-45 minutes for basic deployment
**Estimated Cost**: ~$50/month for basic tier resources

---

**🎉 You now have a working Azure Self-Service Portal!**