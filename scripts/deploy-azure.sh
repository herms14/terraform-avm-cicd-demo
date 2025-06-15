#!/bin/bash

# Erdtree Self-Service Portal Deployment Script
# Target: Nokron-Prod Subscription (9dde5c52-88be-4608-9bee-c52d1909693f)

set -e

# Configuration
SUBSCRIPTION_ID="9dde5c52-88be-4608-9bee-c52d1909693f"
LOCATION="East US"
ENVIRONMENT="prod"
PREFIX="erdtree"

# Resource Groups
RG_PORTAL="${PREFIX}-portal-rg"
RG_MONITORING="${PREFIX}-monitoring-rg"
RG_TERRAFORM="${PREFIX}-terraform-state-rg"

echo "🌳 Starting Erdtree Self-Service Portal Deployment"
echo "📋 Subscription: Nokron-Prod ($SUBSCRIPTION_ID)"
echo "📍 Location: $LOCATION"
echo "🏗️ Environment: $ENVIRONMENT"

# Set Azure subscription context
echo "🔧 Setting Azure subscription context..."
az account set --subscription $SUBSCRIPTION_ID

# Verify subscription
CURRENT_SUB=$(az account show --query id -o tsv)
if [ "$CURRENT_SUB" != "$SUBSCRIPTION_ID" ]; then
    echo "❌ Failed to set subscription context"
    exit 1
fi

echo "✅ Subscription context set successfully"

# Create Resource Groups
echo "🏗️ Creating resource groups..."

az group create --name $RG_PORTAL --location "$LOCATION" --tags \
    deployedBy=Hermes \
    managedBy=AzureCLI \
    environment=$ENVIRONMENT \
    application=erdtree-portal \
    purpose=main-portal

az group create --name $RG_MONITORING --location "$LOCATION" --tags \
    deployedBy=Hermes \
    managedBy=AzureCLI \
    environment=$ENVIRONMENT \
    application=erdtree-portal \
    purpose=monitoring

az group create --name $RG_TERRAFORM --location "$LOCATION" --tags \
    deployedBy=Hermes \
    managedBy=AzureCLI \
    environment=$ENVIRONMENT \
    application=erdtree-portal \
    purpose=terraform-state

echo "✅ Resource groups created successfully"

# Create Terraform State Storage
echo "🗄️ Creating Terraform state storage..."

STORAGE_ACCOUNT_NAME="${PREFIX}tfstate${ENVIRONMENT}$(date +%s | tail -c 6)"

az storage account create \
    --name $STORAGE_ACCOUNT_NAME \
    --resource-group $RG_TERRAFORM \
    --location "$LOCATION" \
    --sku Standard_LRS \
    --kind StorageV2 \
    --access-tier Hot \
    --encryption-services blob \
    --tags \
    deployedBy=Hermes \
    managedBy=AzureCLI \
    environment=$ENVIRONMENT \
    application=erdtree-portal \
    purpose=terraform-state

# Create blob container for Terraform state
az storage container create \
    --name tfstate \
    --account-name $STORAGE_ACCOUNT_NAME \
    --auth-mode login

echo "✅ Terraform state storage created: $STORAGE_ACCOUNT_NAME"

# Create Log Analytics Workspace
echo "📊 Creating monitoring infrastructure..."

WORKSPACE_NAME="${PREFIX}-logs-${ENVIRONMENT}"

az monitor log-analytics workspace create \
    --resource-group $RG_MONITORING \
    --workspace-name $WORKSPACE_NAME \
    --location "$LOCATION" \
    --sku PerGB2018 \
    --retention-time 90 \
    --tags \
    deployedBy=Hermes \
    managedBy=AzureCLI \
    environment=$ENVIRONMENT \
    application=erdtree-portal

# Create Application Insights
APP_INSIGHTS_NAME="${PREFIX}-appinsights-${ENVIRONMENT}"

az monitor app-insights component create \
    --app $APP_INSIGHTS_NAME \
    --location "$LOCATION" \
    --resource-group $RG_MONITORING \
    --kind web \
    --application-type web \
    --workspace $WORKSPACE_NAME \
    --tags \
    deployedBy=Hermes \
    managedBy=AzureCLI \
    environment=$ENVIRONMENT \
    application=erdtree-portal

echo "✅ Monitoring infrastructure created"

# Create App Service Plan
echo "🌐 Creating App Service infrastructure..."

APP_SERVICE_PLAN="${PREFIX}-plan-${ENVIRONMENT}"

az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RG_PORTAL \
    --location "$LOCATION" \
    --sku B1 \
    --is-linux \
    --tags \
    deployedBy=Hermes \
    managedBy=AzureCLI \
    environment=$ENVIRONMENT \
    application=erdtree-portal

# Create Web App
WEB_APP_NAME="${PREFIX}-portal-${ENVIRONMENT}-$(date +%s | tail -c 6)"

az webapp create \
    --name $WEB_APP_NAME \
    --resource-group $RG_PORTAL \
    --plan $APP_SERVICE_PLAN \
    --runtime "NODE|18-lts" \
    --tags \
    deployedBy=Hermes \
    managedBy=AzureCLI \
    environment=$ENVIRONMENT \
    application=erdtree-portal

echo "✅ App Service created: $WEB_APP_NAME"

# Get Application Insights connection string
APP_INSIGHTS_CONNECTION_STRING=$(az monitor app-insights component show \
    --app $APP_INSIGHTS_NAME \
    --resource-group $RG_MONITORING \
    --query connectionString -o tsv)

# Configure Web App settings
echo "⚙️ Configuring Web App settings..."

az webapp config appsettings set \
    --name $WEB_APP_NAME \
    --resource-group $RG_PORTAL \
    --settings \
    REACT_APP_ENVIRONMENT=$ENVIRONMENT \
    APPLICATIONINSIGHTS_CONNECTION_STRING="$APP_INSIGHTS_CONNECTION_STRING" \
    WEBSITE_NODE_DEFAULT_VERSION="18-lts"

echo "✅ Web App configured"

# Create Logic App
echo "🔄 Creating Logic App for approval workflow..."

LOGIC_APP_NAME="${PREFIX}-approval-${ENVIRONMENT}"

# Create Standard Logic App
az logicapp create \
    --name $LOGIC_APP_NAME \
    --resource-group $RG_PORTAL \
    --plan $APP_SERVICE_PLAN \
    --storage-account $STORAGE_ACCOUNT_NAME \
    --functions-version 4 \
    --tags \
    deployedBy=Hermes \
    managedBy=AzureCLI \
    environment=$ENVIRONMENT \
    application=erdtree-portal \
    purpose=approval-workflow

echo "✅ Logic App created: $LOGIC_APP_NAME"

# Output deployment information
echo ""
echo "🎉 Deployment completed successfully!"
echo "================================================="
echo "📋 Deployment Summary:"
echo "================================================="
echo "🔗 Web App URL: https://${WEB_APP_NAME}.azurewebsites.net"
echo "🔄 Logic App: $LOGIC_APP_NAME"
echo "📊 Application Insights: $APP_INSIGHTS_NAME"
echo "🗄️ Storage Account: $STORAGE_ACCOUNT_NAME"
echo "📍 Resource Groups:"
echo "   - Portal: $RG_PORTAL"
echo "   - Monitoring: $RG_MONITORING" 
echo "   - Terraform State: $RG_TERRAFORM"
echo ""
echo "🔧 Next Steps:"
echo "1. Configure Azure AD App Registration"
echo "2. Deploy frontend code to Web App"
echo "3. Configure Logic App workflow"
echo "4. Set up GitHub repository and secrets"
echo ""

# Save deployment info to file
cat > deployment-info.txt << EOF
# Erdtree Portal Deployment Information
# Generated: $(date)

SUBSCRIPTION_ID=$SUBSCRIPTION_ID
ENVIRONMENT=$ENVIRONMENT
LOCATION=$LOCATION

# Resource Names
WEB_APP_NAME=$WEB_APP_NAME
LOGIC_APP_NAME=$LOGIC_APP_NAME
APP_INSIGHTS_NAME=$APP_INSIGHTS_NAME
STORAGE_ACCOUNT_NAME=$STORAGE_ACCOUNT_NAME
WORKSPACE_NAME=$WORKSPACE_NAME

# Resource Groups
RG_PORTAL=$RG_PORTAL
RG_MONITORING=$RG_MONITORING
RG_TERRAFORM=$RG_TERRAFORM

# URLs
WEB_APP_URL=https://${WEB_APP_NAME}.azurewebsites.net
LOGIC_APP_URL=https://${LOGIC_APP_NAME}.azurewebsites.net

# Application Insights
APP_INSIGHTS_CONNECTION_STRING=$APP_INSIGHTS_CONNECTION_STRING
EOF

echo "💾 Deployment information saved to deployment-info.txt"