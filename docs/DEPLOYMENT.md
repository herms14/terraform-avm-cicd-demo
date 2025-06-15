# Erdtree Self-Service Portal Deployment Guide

This guide provides step-by-step instructions for deploying the Erdtree Self-Service Portal in your Azure environment.

## Prerequisites

- Azure subscription with Owner or Contributor access
- Azure CLI installed and configured
- GitHub repository for infrastructure code
- Node.js 18+ for frontend development
- Terraform 1.6+ for infrastructure deployment

## 1. Azure AD App Registration

Create an Azure AD application for authentication:

```bash
# Create the app registration
az ad app create \
  --display-name "Erdtree Self-Service Portal" \
  --sign-in-audience "AzureADMyOrg" \
  --web-redirect-uris "https://erdtree-portal.azurewebsites.net"

# Note the Application (client) ID and Tenant ID from the output
```

Configure API permissions:
- Microsoft Graph: `User.Read`
- Azure Service Management: `user_impersonation`

Create application roles:
- `Erdtree.Admin`: Full access to portal and approvals
- `Erdtree.Approver`: Can approve deployment requests
- `Erdtree.ResourceDeployer`: Can request resource deployments

## 2. Service Principal Setup

Create a service principal for Terraform deployments:

```bash
# Create service principal
az ad sp create-for-rbac \
  --name "erdtree-terraform-sp" \
  --role "Contributor" \
  --scopes "/subscriptions/YOUR_SUBSCRIPTION_ID"

# Note the appId, password, and tenant from output
```

## 3. GitHub Repository Setup

### Fork/Clone Repository
```bash
git clone https://github.com/your-org/erdtree-infrastructure.git
cd erdtree-infrastructure
```

### Configure GitHub Secrets
Add the following secrets to your GitHub repository:

```
ARM_CLIENT_ID=<service-principal-app-id>
ARM_CLIENT_SECRET=<service-principal-password>
ARM_SUBSCRIPTION_ID=<your-subscription-id>
ARM_TENANT_ID=<your-tenant-id>
SMTP_USERNAME=<smtp-username-for-notifications>
SMTP_PASSWORD=<smtp-password>
```

### Configure Environments
Create GitHub environments:
- `dev`: Development environment
- `prod`: Production environment

Add environment-specific protection rules and approvals as needed.

## 4. Terraform State Storage

Create storage account for Terraform state:

```bash
# Create resource group
az group create --name erdtree-terraform-state --location "East US"

# Create storage account
az storage account create \
  --name erdtreetfstatedev \
  --resource-group erdtree-terraform-state \
  --location "East US" \
  --sku Standard_LRS

# Create container
az storage container create \
  --name tfstate \
  --account-name erdtreetfstatedev
```

Repeat for production environment with `erdtreetfstateprod`.

## 5. Deploy Infrastructure Monitoring

Deploy the monitoring infrastructure first:

```bash
cd terraform/modules/monitoring
terraform init
terraform plan -var="environment=dev" -var="subscription_id=YOUR_SUBSCRIPTION_ID"
terraform apply
```

## 6. Deploy Logic App

### Create Logic App
1. Go to Azure Portal
2. Create new Logic App (Standard)
3. Import the definition from `backend/logic-apps/deployment-approval.json`
4. Configure connections for:
   - Office 365 Outlook (for email notifications)
   - HTTP (for GitHub API calls)

### Configure Logic App Settings
Add application settings:
- `GITHUB_TOKEN`: Personal access token with repo access
- `GITHUB_REPO_URL`: Repository dispatch URL
- `APPROVER_EMAIL`: hemirafl@microsoft.com

## 7. Deploy Frontend Application

### Build and Deploy
```bash
cd frontend

# Install dependencies
npm install

# Build application
npm run build

# Deploy to Azure App Service
az webapp create \
  --resource-group erdtree-portal-rg \
  --plan erdtree-app-plan \
  --name erdtree-portal \
  --deployment-source-url https://github.com/your-org/erdtree-infrastructure \
  --deployment-source-branch main

# Configure app settings
az webapp config appsettings set \
  --resource-group erdtree-portal-rg \
  --name erdtree-portal \
  --settings \
  REACT_APP_AZURE_CLIENT_ID=<your-client-id> \
  REACT_APP_AZURE_TENANT_ID=<your-tenant-id> \
  REACT_APP_API_BASE_URL=<logic-app-trigger-url>
```

## 8. Configure DNS and SSL

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name erdtree-portal \
  --resource-group erdtree-portal-rg \
  --hostname erdtree-portal.yourdomain.com

# Enable SSL
az webapp config ssl bind \
  --certificate-thumbprint <cert-thumbprint> \
  --ssl-type SNI \
  --name erdtree-portal \
  --resource-group erdtree-portal-rg
```

## 9. Testing the Deployment

### Verify Frontend
1. Navigate to https://erdtree-portal.azurewebsites.net
2. Sign in with Azure AD credentials
3. Verify resource cards display correctly

### Test Deployment Flow
1. Select a resource type (e.g., Windows VM)
2. Fill out the deployment form
3. Submit for approval
4. Check email for approval request
5. Approve the deployment
6. Verify GitHub Actions pipeline triggers
7. Confirm resources are deployed

### Monitor Logs
- Check Logic App run history
- Review GitHub Actions workflow logs
- Monitor Application Insights for frontend telemetry
- Check Log Analytics for audit trails

## 10. Security Hardening

### Network Security
```bash
# Restrict App Service access
az webapp config access-restriction add \
  --resource-group erdtree-portal-rg \
  --name erdtree-portal \
  --rule-name "corporate-network" \
  --action Allow \
  --ip-address 10.0.0.0/8 \
  --priority 100
```

### Authentication
- Configure Conditional Access policies
- Enable MFA for portal users
- Set up Privileged Identity Management (PIM) for approvers

### Audit and Compliance
- Enable Azure Security Center
- Configure Microsoft Defender for Cloud
- Set up compliance policies for deployed resources

## 11. FinOps Configuration

### Cost Management
```bash
# Create budget alerts
az consumption budget create \
  --budget-name erdtree-monthly-budget \
  --amount 5000 \
  --category Cost \
  --time-grain Monthly \
  --time-period-start-date "$(date -d "first day of this month" +%Y-%m-%d)" \
  --time-period-end-date "2030-12-31"
```

### Resource Tagging Policy
Deploy Azure Policy to enforce standard tags on all Erdtree resources.

## 12. Maintenance and Updates

### Regular Tasks
- Update Terraform provider versions
- Review and update Azure Verified Module versions
- Monitor security advisories for dependencies
- Review access logs and user permissions

### Backup Strategy
- Export Logic App definitions regularly
- Backup Terraform state files
- Document configuration changes

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify Azure AD app registration
   - Check redirect URIs configuration
   - Confirm API permissions granted

2. **Deployment Failures**
   - Check service principal permissions
   - Verify Terraform state storage access
   - Review GitHub Actions secrets

3. **Email Notifications Not Working**
   - Verify Logic App connections
   - Check SMTP credentials
   - Confirm email addresses in action groups

### Support Contacts
- Infrastructure Team: hemirafl@microsoft.com
- GitHub Issues: https://github.com/your-org/erdtree-infrastructure/issues
- Azure Support: Create ticket via Azure Portal

## Next Steps

After successful deployment:
1. Train users on the portal interface
2. Set up monitoring dashboards
3. Implement additional resource types
4. Configure advanced approval workflows
5. Integrate with ITSM systems if needed