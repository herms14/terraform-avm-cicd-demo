# 🔧 Azure CLI Fix and Installation Guide

## Current Issue
The Windows Azure CLI installation has a corrupted `aks-preview` extension that prevents all commands from running.

## 🚀 **RECOMMENDED SOLUTIONS** (Choose One)

### **Option 1: Install Fresh Azure CLI in WSL Linux (Recommended)**

Run these commands in your WSL terminal:

```bash
# Remove any existing installation
sudo apt remove azure-cli -y

# Install Azure CLI for Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Set subscription context
az account set --subscription "9dde5c52-88be-4608-9bee-c52d1909693f"

# Verify connection
az account show
```

### **Option 2: Fix Windows Azure CLI Extension**

Open **PowerShell as Administrator** and run:

```powershell
# Remove corrupted extension directory
Remove-Item -Path "$env:USERPROFILE\.azure\cliextensions\aks-preview" -Recurse -Force

# Clear Azure CLI cache
az cache purge

# Login
az login

# Set subscription
az account set --subscription "9dde5c52-88be-4608-9bee-c52d1909693f"
```

### **Option 3: Use Azure PowerShell Instead**

Open **PowerShell as Administrator**:

```powershell
# Install Azure PowerShell if not installed
Install-Module -Name Az -AllowClobber -Scope CurrentUser

# Connect to Azure
Connect-AzAccount

# Set subscription context
Set-AzContext -SubscriptionId "9dde5c52-88be-4608-9bee-c52d1909693f"

# Deploy infrastructure using PowerShell
New-AzResourceGroupDeployment `
  -ResourceGroupName "erdtree-portal-rg" `
  -TemplateFile "scripts/erdtree-infrastructure.json" `
  -environment "prod"
```

### **Option 4: Continue with Azure Portal (No CLI Needed)**

Since we've already created the foundation infrastructure, you can complete the deployment entirely through Azure Portal using the comprehensive guide in `DEPLOYMENT-PROMPT.md`.

---

## 🚀 **CONTINUE DEPLOYMENT** (After CLI is Fixed)

Once you have working Azure CLI, you can continue with the automated deployment:

```bash
# Navigate to project directory
cd /home/hermes-admin/ClaudeCodes/azure-self-service

# Deploy the ARM template
az deployment group create \
  --resource-group erdtree-portal-rg \
  --template-file scripts/erdtree-infrastructure.json \
  --parameters environment=prod

# Create Azure AD app registration
az ad app create \
  --display-name "Erdtree Self-Service Portal" \
  --web-redirect-uris "https://[web-app-name].azurewebsites.net"

# Configure web app settings
az webapp config appsettings set \
  --name [web-app-name] \
  --resource-group erdtree-portal-rg \
  --settings \
  REACT_APP_AZURE_CLIENT_ID=[client-id] \
  REACT_APP_AZURE_TENANT_ID=b6458a9a-9661-468c-bda3-5f496727d0b0
```

---

## 📋 **WHAT'S ALREADY CREATED**

✅ **Resource Groups**: `erdtree-portal-rg`, `erdtree-monitoring-rg`, `erdtree-terraform-state-rg`  
✅ **Storage Account**: `erdtreetfstateprod67161` (Terraform state)  
✅ **Log Analytics**: `erdtree-logs-prod` (monitoring)  

---

## 🎯 **RECOMMENDED APPROACH**

**For fastest deployment:**
1. **Use Option 1** (Fresh Linux CLI installation) - Most reliable
2. **Follow DEPLOYMENT-PROMPT.md** - Complete step-by-step guide
3. **Deploy via Azure Portal** - No CLI dependency

**For automation:**
1. **Fix CLI first** using any of the options above
2. **Run deployment scripts** we've prepared
3. **Test the complete workflow**

---

## 🆘 **IF ALL ELSE FAILS**

The **DEPLOYMENT-PROMPT.md** contains a complete Azure Portal deployment guide that requires **no CLI at all**. You can:

1. Deploy infrastructure via ARM template in Portal
2. Configure Azure AD via Portal
3. Set up the complete working portal
4. Test the self-service workflow

**Estimated time**: 30-45 minutes for complete deployment

The solution is ready to deploy regardless of CLI issues!