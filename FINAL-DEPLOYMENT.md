# 🎉 Azure CLI Fixed - Final Deployment Steps

## ✅ **COMPLETED SUCCESSFULLY:**
- ✅ **Azure CLI Installed**: Working Linux installation 
- ✅ **Logged In**: Connected to Nokron-Prod subscription
- ✅ **Azure AD App Created**: Client ID `bddf94ca-ff1f-4cc9-aac9-4fd51d3af064`
- ✅ **Resource Groups**: Already exist from previous steps

## 🚀 **FINAL STEPS TO COMPLETE DEPLOYMENT:**

### **Step 1: Deploy Infrastructure via Azure Portal**

1. **Open Azure Portal**: https://portal.azure.com
2. **Navigate to**: "Deploy a custom template" (search for it)
3. **Click**: "Build your own template in the editor"
4. **Copy and paste** the ARM template from: `scripts/erdtree-infrastructure.json`
5. **Set parameters**:
   - **Subscription**: Nokron-Prod
   - **Resource Group**: `erdtree-portal-rg` (already exists)
   - **Environment**: `prod`
   - **Location**: `East US`
6. **Deploy** - takes 5-10 minutes

### **Step 2: Configure Azure AD Permissions**

Run these commands in your terminal:

```bash
# Get the app object ID
APP_OBJECT_ID=$(~/.local/bin/az ad app show --id bddf94ca-ff1f-4cc9-aac9-4fd51d3af064 --query id --output tsv)

# Add Microsoft Graph User.Read permission
~/.local/bin/az ad app permission add \
  --id $APP_OBJECT_ID \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope

# Add Azure Service Management permission
~/.local/bin/az ad app permission add \
  --id $APP_OBJECT_ID \
  --api 797f4846-ba00-40b5-8e19-c17db4b99645 \
  --api-permissions 41094075-9dad-400e-a0bd-54e686782033=Scope

# Grant admin consent
~/.local/bin/az ad app permission admin-consent --id $APP_OBJECT_ID
```

### **Step 3: Configure Web App (After ARM Deployment)**

After the ARM template deploys, you'll get a Web App name. Use it in these commands:

```bash
# Replace [WEB-APP-NAME] with actual name from deployment output
WEB_APP_NAME="[WEB-APP-NAME-FROM-STEP-1]"

# Configure app settings
~/.local/bin/az webapp config appsettings set \
  --name $WEB_APP_NAME \
  --resource-group erdtree-portal-rg \
  --settings \
  REACT_APP_AZURE_CLIENT_ID=bddf94ca-ff1f-4cc9-aac9-4fd51d3af064 \
  REACT_APP_AZURE_TENANT_ID=b6458a9a-9661-468c-bda3-5f496727d0b0 \
  REACT_APP_API_BASE_URL=https://[LOGIC-APP-NAME].azurewebsites.net \
  REACT_APP_ENVIRONMENT=prod
```

### **Step 4: Deploy Frontend Code**

Option A - Quick Test:
```bash
cd frontend/
npm install
npm run build

# Deploy build folder to Web App (use Kudu or VS Code extension)
```

Option B - GitHub Deployment:
1. Create GitHub repository with the frontend code
2. Configure GitHub Actions for automatic deployment

### **Step 5: Test the Portal**

1. **Open**: `https://[WEB-APP-NAME].azurewebsites.net`
2. **Sign in** with Azure AD
3. **Test** resource selection and forms
4. **Verify** complete workflow

---

## 📋 **KEY INFORMATION:**

- **Client ID**: `bddf94ca-ff1f-4cc9-aac9-4fd51d3af064`
- **Tenant ID**: `b6458a9a-9661-468c-bda3-5f496727d0b0`
- **Subscription**: `Nokron-Prod (9dde5c52-88be-4608-9bee-c52d1909693f)`
- **Resource Group**: `erdtree-portal-rg`

## 🎯 **EXPECTED RESULT:**

After completing these steps, you'll have:
- ✅ **Working self-service portal**
- ✅ **Azure AD authentication**
- ✅ **Resource deployment forms**
- ✅ **Complete approval workflow ready**
- ✅ **Monitoring and logging configured**

## 🆘 **IF YOU NEED HELP:**

The ARM template in `scripts/erdtree-infrastructure.json` is ready to deploy. All frontend code is in the `frontend/` folder. The Azure CLI is now working perfectly for any additional configuration needed.

**Estimated Time**: 20-30 minutes to complete all steps

🎉 **You're almost there - just a few more steps to have a fully working portal!**