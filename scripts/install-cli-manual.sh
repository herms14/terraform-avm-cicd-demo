#!/bin/bash

# Manual Azure CLI Installation without sudo
# This installs Azure CLI to user directory

set -e

echo "🔧 Installing Azure CLI manually (no sudo required)"
echo "=================================================="

# Create local directories
mkdir -p ~/.local/bin
mkdir -p ~/.local/lib

# Download Azure CLI
echo "📥 Downloading Azure CLI..."
cd ~/.local/lib

# Download the latest Azure CLI
if [ ! -d "azure-cli" ]; then
    echo "Downloading Azure CLI package..."
    wget -q https://aka.ms/InstallAzureCliLinux -O install-cli.sh
    
    # Make it executable
    chmod +x install-cli.sh
    
    # Try to run without sudo (might fail but worth trying)
    echo "Attempting installation..."
    ./install-cli.sh || echo "Standard installation failed, trying alternative..."
fi

# Alternative: Try using pip to install azure-cli
echo "🐍 Trying pip installation..."
if command -v pip3 &> /dev/null; then
    pip3 install --user azure-cli
    
    # Add to PATH
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    export PATH="$HOME/.local/bin:$PATH"
    
    echo "✅ Azure CLI installed via pip"
    
elif command -v pip &> /dev/null; then
    pip install --user azure-cli
    
    # Add to PATH
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
    export PATH="$HOME/.local/bin:$PATH"
    
    echo "✅ Azure CLI installed via pip"
else
    echo "❌ Neither pip3 nor pip available. Cannot install Azure CLI."
    echo "Please install Python3 and pip3 first:"
    echo "sudo apt update && sudo apt install python3-pip"
    exit 1
fi

# Test installation
echo "🧪 Testing Azure CLI installation..."
if az version &> /dev/null; then
    echo "✅ Azure CLI installed successfully!"
    az version
else
    echo "❌ Azure CLI installation failed"
    exit 1
fi

echo "🎉 Azure CLI ready for use!"
echo "Now you can run: az login"