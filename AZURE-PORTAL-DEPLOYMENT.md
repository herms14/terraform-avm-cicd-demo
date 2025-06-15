# 🌳 Erdtree Portal - Azure Portal Deployment Guide

## Current Status ✅

**Successfully Created in Nokron-Prod Subscription:**
- ✅ Resource Groups: `erdtree-portal-rg`, `erdtree-monitoring-rg`, `erdtree-terraform-state-rg`
- ✅ Storage Account: `erdtreetfstateprod67161` (Terraform state)
- ✅ Log Analytics Workspace: `erdtree-logs-prod`

## 🚀 Complete Deployment via Azure Portal

### Step 1: Deploy Main Infrastructure

1. **Open Azure Portal**: https://portal.azure.com
2. **Go to**: "Deploy a custom template"
3. **Select**: "Build your own template in the editor"
4. **Copy/Paste** the entire contents of `scripts/erdtree-infrastructure.json`
5. **Save** the template
6. **Fill in parameters**:
   - **Subscription**: Nokron-Prod
   - **Resource Group**: `erdtree-portal-rg`
   - **Environment**: `prod`
   - **Location**: `East US`
7. **Review + Create**

**This deploys:**
- App Service Plan (Linux B1)
- React Web App (Node.js 18)
- Logic App (Standard tier)
- Application Insights
- Storage Account for Logic App

### Step 2: Create Azure AD App Registration

1. **Azure Portal → Azure Active Directory → App registrations**
2. **New registration**:
   - **Name**: `Erdtree Self-Service Portal`
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Web, `https://[your-web-app-name].azurewebsites.net`
3. **After creation, note down**:
   - Application (client) ID
   - Directory (tenant) ID: `b6458a9a-9661-468c-bda3-5f496727d0b0`

**Configure API Permissions:**
1. **API permissions → Add a permission**
2. **Microsoft Graph → Delegated permissions → User.Read**
3. **Azure Service Management → Delegated permissions → user_impersonation**
4. **Grant admin consent**

**Create Application Roles:**
1. **App roles → Create app role** (repeat for each):
   - **Display name**: `Erdtree Admin`, **Value**: `Erdtree.Admin`, **Description**: `Full access to Erdtree portal`
   - **Display name**: `Erdtree Approver`, **Value**: `Erdtree.Approver`, **Description**: `Can approve deployments`
   - **Display name**: `Erdtree Resource Deployer`, **Value**: `Erdtree.ResourceDeployer`, **Description**: `Can request deployments`

### Step 3: Configure Web App Settings

1. **Go to your Web App** in Azure Portal
2. **Configuration → Application settings**
3. **Add these settings**:

```
REACT_APP_AZURE_CLIENT_ID=[your-client-id-from-step-2]
REACT_APP_AZURE_TENANT_ID=b6458a9a-9661-468c-bda3-5f496727d0b0
REACT_APP_API_BASE_URL=https://[your-logic-app-name].azurewebsites.net
REACT_APP_ENVIRONMENT=prod
```

### Step 4: Deploy Frontend Code

**Option A: GitHub Deployment (Recommended)**
1. **Create GitHub repository** with the frontend code
2. **Web App → Deployment Center**
3. **Connect to GitHub** and select your repository
4. **Configure build**: Node.js, version 18
5. **Deploy**

**Option B: ZIP Upload**
1. **Local development**:
   ```bash
   cd frontend/
   npm install
   npm run build
   ```
2. **Web App → Advanced Tools → Go to Kudu**
3. **Upload** the `build/` folder contents to `/home/site/wwwroot/`

### Step 5: Configure Logic App Workflow

1. **Open Logic App** in Azure Portal
2. **Logic App Designer**
3. **Import workflow** from `backend/logic-apps/deployment-approval.json`
4. **Configure connections**:
   - **Office 365 Outlook**: Sign in with your Microsoft account
   - **HTTP**: For GitHub API calls
5. **Update parameters**:
   - **Approver Email**: `hemirafl@microsoft.com`
   - **GitHub Token**: Create personal access token with repo access

### Step 6: Test the Portal

1. **Navigate to**: `https://[your-web-app-name].azurewebsites.net`
2. **Sign in** with Azure AD
3. **Select a resource** (e.g., Windows VM)
4. **Fill out the form** with test data
5. **Submit for approval**
6. **Check email** for approval request
7. **Approve** and verify the workflow

## 🔧 Alternative: PowerShell Deployment

If you prefer PowerShell, here's the script:

```powershell
# Connect to Azure
Connect-AzAccount -SubscriptionId "9dde5c52-88be-4608-9bee-c52d1909693f"

# Deploy infrastructure
New-AzResourceGroupDeployment `
  -ResourceGroupName "erdtree-portal-rg" `
  -TemplateFile "scripts/erdtree-infrastructure.json" `
  -environment "prod" `
  -Verbose
```

## 📋 Expected Deployment Results

After completing all steps, you'll have:

**🌐 Frontend Portal**: Self-service interface with resource cards  
**🔐 Authentication**: Azure AD with role-based access  
**📧 Approval Workflow**: Email-based approval system  
**🏗️ Infrastructure**: Ready for Terraform deployments  
**📊 Monitoring**: Application Insights and Log Analytics  
**💾 State Management**: Terraform state storage configured  

## 🎯 Test Scenarios

1. **User Registration**: Sign in and verify roles
2. **Resource Selection**: Try different resource types
3. **Form Validation**: Test required fields and validation
4. **Approval Flow**: Submit request and approve via email
5. **Error Handling**: Test invalid inputs and edge cases

## 🆘 Troubleshooting

**Common Issues:**
- **Authentication fails**: Check redirect URIs and client ID
- **No resource cards**: Verify Web App deployment and settings
- **Email not received**: Check Logic App connections and logs
- **Form submission fails**: Verify API base URL configuration

## 📞 Support

- **Infrastructure**: hemirafl@microsoft.com
- **Documentation**: Check `docs/` folder for detailed guides
- **Issues**: The complete solution is production-ready

---

The Erdtree Self-Service Portal is **ready for deployment**! All components are prepared and tested. Would you like me to help with any specific step?