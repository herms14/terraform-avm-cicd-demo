#!/bin/bash

# Deploy Frontend to Azure App Service
# This script builds and deploys the React frontend

set -e

echo "🌐 Deploying Erdtree Portal Frontend"
echo "===================================="

# Check if deployment results exist
if [ ! -f "deployment-results.json" ]; then
    echo "❌ deployment-results.json not found. Please run fix-cli-and-deploy.sh first."
    exit 1
fi

# Read deployment results
WEB_APP_NAME=$(jq -r '.webAppName' deployment-results.json)
RESOURCE_GROUP=$(jq -r '.resourceGroup' deployment-results.json)
CLIENT_ID=$(jq -r '.clientId' deployment-results.json)
TENANT_ID=$(jq -r '.tenantId' deployment-results.json)

echo "📱 Deploying to: $WEB_APP_NAME"

# Check if Node.js is available
if ! command -v npm &> /dev/null; then
    echo "❌ Node.js/npm not found. Installing Node.js..."
    
    # Install Node.js using NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    if ! command -v npm &> /dev/null; then
        echo "❌ Failed to install Node.js. Please install manually."
        echo "1. Install Node.js 18+ from https://nodejs.org"
        echo "2. Run this script again"
        exit 1
    fi
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Navigate to frontend directory
cd frontend/

echo "📦 Installing dependencies..."
npm install

# Update environment variables for production
echo "⚙️ Configuring environment variables..."
cat > .env.production << EOF
REACT_APP_AZURE_CLIENT_ID=$CLIENT_ID
REACT_APP_AZURE_TENANT_ID=$TENANT_ID
REACT_APP_API_BASE_URL=https://$WEB_APP_NAME.azurewebsites.net
REACT_APP_ENVIRONMENT=prod
EOF

echo "🏗️ Building React application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    
    # Deploy using Azure CLI
    echo "🚀 Deploying to Azure App Service..."
    
    # Create deployment package
    cd build/
    zip -r ../deployment.zip .
    cd ..
    
    # Deploy to Azure
    az webapp deployment source config-zip \
        --resource-group $RESOURCE_GROUP \
        --name $WEB_APP_NAME \
        --src deployment.zip
    
    if [ $? -eq 0 ]; then
        echo "✅ Frontend deployed successfully!"
        
        # Update app settings to ensure React routing works
        echo "⚙️ Configuring SPA routing..."
        az webapp config set \
            --resource-group $RESOURCE_GROUP \
            --name $WEB_APP_NAME \
            --startup-file "pm2 serve /home/site/wwwroot --no-daemon --spa"
        
        echo "🎉 Deployment completed!"
        echo "📱 Your portal is available at: https://$WEB_APP_NAME.azurewebsites.net"
        
    else
        echo "❌ Deployment failed"
        exit 1
    fi
    
else
    echo "❌ Build failed"
    exit 1
fi

# Return to project root
cd ..

echo "✅ Frontend deployment completed!"
echo "🔗 Portal URL: https://$WEB_APP_NAME.azurewebsites.net"