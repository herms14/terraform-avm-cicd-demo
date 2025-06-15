# Manual Deployment Guide for Erdtree Portal

## Issue: Azure CLI Extension Problem
Azure CLI is having permission issues with extensions. Here's how to complete the deployment manually.

## Step 1: Deploy Infrastructure via Azure Portal

1. **Go to Azure Portal**: https://portal.azure.com
2. **Navigate to**: Deploy a custom template
3. **Click**: "Build your own template in the editor"
4. **Copy and paste** the contents of `scripts/erdtree-infrastructure.json`
5. **Set parameters**:
   - Resource Group: `erdtree-portal-rg`
   - Environment: `prod`
   - Location: `East US`
6. **Click**: Review + Create

This will deploy:
- App Service Plan (Linux B1)
- React Web App (Node.js 18)
- Logic App (Standard)
- Application Insights
- Storage Account

## Step 2: Deploy Frontend Code

### Option A: GitHub Actions (Recommended)
1. Create GitHub repository with the frontend code
2. Set up GitHub Actions for automatic deployment to Azure App Service

### Option B: Manual Upload
1. Build the frontend locally:
   ```bash
   cd frontend/
   npm install
   npm run build
   ```
2. Upload the `build/` folder to the Web App using:
   - Azure Portal (Advanced Tools → Kudu)
   - VS Code Azure extension
   - Azure CLI (when fixed)

## Step 3: Configure Azure AD App Registration

1. **Azure Portal → Azure Active Directory → App registrations**
2. **New registration**:
   - Name: `Erdtree Self-Service Portal`
   - Redirect URI: `https://[your-web-app-name].azurewebsites.net`
3. **API Permissions**:
   - Microsoft Graph: `User.Read`
   - Azure Service Management: `user_impersonation`
4. **Create Application Roles**:
   - `Erdtree.Admin`
   - `Erdtree.Approver` 
   - `Erdtree.ResourceDeployer`

## Step 4: Configure Web App Settings

Add these application settings to your Web App:

```
REACT_APP_AZURE_CLIENT_ID=[your-client-id]
REACT_APP_AZURE_TENANT_ID=b6458a9a-9661-468c-bda3-5f496727d0b0
REACT_APP_API_BASE_URL=[logic-app-trigger-url]
REACT_APP_ENVIRONMENT=prod
```

## Step 5: Configure Logic App

1. **Open Logic App in Azure Portal**
2. **Import workflow** from `backend/logic-apps/deployment-approval.json`
3. **Configure connections**:
   - Office 365 Outlook (for email)
   - HTTP (for GitHub API)
4. **Set application settings**:
   - `GITHUB_TOKEN`
   - `APPROVER_EMAIL=hemirafl@microsoft.com`

## Step 6: Test the Portal

1. Navigate to your Web App URL
2. Sign in with Azure AD
3. Select a resource type
4. Fill out the form
5. Submit for approval
6. Check email for approval
7. Approve and verify workflow

## Alternative: Use Azure PowerShell

If Azure CLI continues to have issues, you can use Azure PowerShell:

```powershell
# Connect to Azure
Connect-AzAccount

# Deploy ARM template
New-AzResourceGroupDeployment `
  -ResourceGroupName "erdtree-portal-rg" `
  -TemplateFile "scripts/erdtree-infrastructure.json" `
  -environment "prod"
```

## Resources Created Successfully ✅

- Resource Groups: `erdtree-portal-rg`, `erdtree-monitoring-rg`, `erdtree-terraform-state-rg`
- Storage Account: `erdtreetfstateprod67161` (Terraform state)
- Log Analytics: `erdtree-logs-prod`

## Next Steps After Manual Deployment

1. **Configure GitHub repository** with deployment secrets
2. **Set up monitoring alerts** in Azure Monitor
3. **Configure budget alerts** for cost management
4. **Test end-to-end deployment workflow**
5. **Train users** on the portal interface

The solution architecture is complete and ready for deployment!