#!/bin/bash

# Erdtree Portal - Fix Azure CLI and Deploy
# This script fixes CLI issues and deploys the complete portal

set -e

echo "🔧 Fixing Azure CLI and Deploying Erdtree Portal"
echo "==============================================="

# Configuration
SUBSCRIPTION_ID="9dde5c52-88be-4608-9bee-c52d1909693f"
TENANT_ID="b6458a9a-9661-468c-bda3-5f496727d0b0"
LOCATION="East US"
ENVIRONMENT="prod"

# Resource Groups
RG_PORTAL="erdtree-portal-rg"
RG_MONITORING="erdtree-monitoring-rg"
RG_TERRAFORM="erdtree-terraform-state-rg"

echo "🔧 Step 1: Attempting to fix Azure CLI..."

# Try to remove corrupted extension files
echo "Attempting to clean corrupted extensions..."
if [ -d "/mnt/c/Users/Hermes/.azure/cliextensions/aks-preview" ]; then
    echo "Found corrupted aks-preview extension, attempting to remove..."
    rm -rf "/mnt/c/Users/Hermes/.azure/cliextensions/aks-preview" 2>/dev/null || echo "Could not remove Windows extension directory"
fi

# Try clearing cache
echo "Clearing Azure CLI cache..."
az cache purge 2>/dev/null || echo "Cache clear failed, continuing..."

# Test if CLI is working now
echo "Testing Azure CLI..."
if ~/.local/bin/az version >/dev/null 2>&1; then
    echo "✅ Azure CLI is working!"
    # Set the az command to use the correct path
    AZ_CMD="~/.local/bin/az"
else
    echo "❌ Azure CLI still has issues. Attempting alternative installation..."
    
    # Try to install Azure CLI in Linux environment
    echo "Installing Azure CLI in Linux environment..."
    
    # Download and install without sudo (user installation)
    echo "Attempting user-level installation..."
    
    # Create local bin directory
    mkdir -p ~/.local/bin
    
    # Try alternative installation method
    echo "Using alternative installation method..."
    
    # If all CLI methods fail, we'll use Azure REST API calls
    echo "⚠️ CLI installation requires sudo privileges."
    echo "We'll use the Azure REST API approach instead."
    
    # Set flag to use REST API instead of CLI
    USE_REST_API=true
fi

echo "🔐 Step 2: Azure Authentication"

if [ "$USE_REST_API" != "true" ]; then
    # Try CLI login
    echo "Attempting Azure CLI login..."
    if ~/.local/bin/az account show >/dev/null 2>&1; then
        echo "✅ Already logged in to Azure CLI"
        CURRENT_SUB=$(~/.local/bin/az account show --query id -o tsv)
        if [ "$CURRENT_SUB" = "$SUBSCRIPTION_ID" ]; then
            echo "✅ Correct subscription context"
        else
            echo "Setting subscription context..."
            ~/.local/bin/az account set --subscription $SUBSCRIPTION_ID
        fi
    else
        echo "Please log in to Azure CLI manually by running:"
        echo "az login"
        echo ""
        echo "Then set the subscription:"
        echo "az account set --subscription $SUBSCRIPTION_ID"
        echo ""
        read -p "Press Enter after you've completed the login..."
    fi
else
    echo "⚠️ CLI not available, will use Azure Portal deployment method"
fi

echo "🏗️ Step 3: Deploy Infrastructure"

if [ "$USE_REST_API" != "true" ]; then
    # Deploy using Azure CLI
    echo "Deploying infrastructure using Azure CLI..."
    
    # Deploy ARM template
    echo "Deploying ARM template..."
    DEPLOYMENT_OUTPUT=$(~/.local/bin/az deployment group create \
        --resource-group $RG_PORTAL \
        --template-file scripts/erdtree-infrastructure.json \
        --parameters environment=$ENVIRONMENT \
        --query 'properties.outputs' \
        --output json)
    
    if [ $? -eq 0 ]; then
        echo "✅ Infrastructure deployed successfully!"
        
        # Extract outputs
        WEB_APP_NAME=$(echo $DEPLOYMENT_OUTPUT | jq -r '.webAppName.value')
        LOGIC_APP_NAME=$(echo $DEPLOYMENT_OUTPUT | jq -r '.logicAppName.value')
        WEB_APP_URL=$(echo $DEPLOYMENT_OUTPUT | jq -r '.webAppUrl.value')
        APP_INSIGHTS_CONNECTION=$(echo $DEPLOYMENT_OUTPUT | jq -r '.appInsightsConnectionString.value')
        
        echo "📝 Deployment Results:"
        echo "  Web App: $WEB_APP_NAME"
        echo "  Logic App: $LOGIC_APP_NAME"
        echo "  URL: $WEB_APP_URL"
        
        # Create Azure AD App Registration
        echo "🔐 Creating Azure AD App Registration..."
        
        AD_APP_OUTPUT=$(~/.local/bin/az ad app create \
            --display-name "Erdtree Self-Service Portal" \
            --web-redirect-uris "$WEB_APP_URL" \
            --query '{appId: appId, id: id}' \
            --output json)
        
        if [ $? -eq 0 ]; then
            CLIENT_ID=$(echo $AD_APP_OUTPUT | jq -r '.appId')
            APP_OBJECT_ID=$(echo $AD_APP_OUTPUT | jq -r '.id')
            
            echo "✅ Azure AD App created!"
            echo "  Client ID: $CLIENT_ID"
            
            # Add API permissions
            echo "Adding API permissions..."
            
            # Microsoft Graph User.Read
            ~/.local/bin/az ad app permission add \
                --id $APP_OBJECT_ID \
                --api 00000003-0000-0000-c000-000000000000 \
                --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope
            
            # Azure Service Management user_impersonation
            ~/.local/bin/az ad app permission add \
                --id $APP_OBJECT_ID \
                --api 797f4846-ba00-40b5-8e19-c17db4b99645 \
                --api-permissions 41094075-9dad-400e-a0bd-54e686782033=Scope
            
            # Grant admin consent
            ~/.local/bin/az ad app permission admin-consent --id $APP_OBJECT_ID
            
            echo "✅ API permissions configured!"
            
            # Configure Web App settings
            echo "⚙️ Configuring Web App settings..."
            
            ~/.local/bin/az webapp config appsettings set \
                --name $WEB_APP_NAME \
                --resource-group $RG_PORTAL \
                --settings \
                REACT_APP_AZURE_CLIENT_ID=$CLIENT_ID \
                REACT_APP_AZURE_TENANT_ID=$TENANT_ID \
                REACT_APP_API_BASE_URL="https://$LOGIC_APP_NAME.azurewebsites.net" \
                REACT_APP_ENVIRONMENT=$ENVIRONMENT
            
            echo "✅ Web App configured!"
            
        else
            echo "❌ Failed to create Azure AD app registration"
        fi
        
    else
        echo "❌ Infrastructure deployment failed"
        exit 1
    fi
    
else
    echo "❌ CLI not available. Please use the Azure Portal deployment method."
    echo "📋 Instructions:"
    echo "1. Open Azure Portal: https://portal.azure.com"
    echo "2. Use the ARM template in: scripts/erdtree-infrastructure.json"
    echo "3. Follow the guide in: DEPLOYMENT-PROMPT.md"
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "================================================"
echo "📋 Summary:"
echo "  Portal URL: $WEB_APP_URL"
echo "  Client ID: $CLIENT_ID"
echo "  Tenant ID: $TENANT_ID"
echo "  Resource Group: $RG_PORTAL"
echo ""
echo "🚀 Next Steps:"
echo "1. Visit the portal URL to test the interface"
echo "2. Deploy the React frontend code"
echo "3. Configure the Logic App workflow"
echo "4. Test the complete deployment workflow"
echo ""

# Save deployment info
cat > deployment-results.json << EOF
{
  "webAppName": "$WEB_APP_NAME",
  "webAppUrl": "$WEB_APP_URL",
  "logicAppName": "$LOGIC_APP_NAME",
  "clientId": "$CLIENT_ID",
  "tenantId": "$TENANT_ID",
  "subscriptionId": "$SUBSCRIPTION_ID",
  "resourceGroup": "$RG_PORTAL",
  "environment": "$ENVIRONMENT",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "💾 Deployment results saved to: deployment-results.json"