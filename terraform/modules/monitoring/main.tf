terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
  }
}

# Log Analytics Workspace for centralized logging
resource "azurerm_log_analytics_workspace" "erdtree" {
  name                = "erdtree-logs-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = var.log_retention_days

  tags = var.tags
}

# Application Insights for application monitoring
resource "azurerm_application_insights" "erdtree" {
  name                = "erdtree-appinsights-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  application_type    = "web"
  workspace_id        = azurerm_log_analytics_workspace.erdtree.id

  tags = var.tags
}

# Action Group for alert notifications
resource "azurerm_monitor_action_group" "erdtree" {
  name                = "erdtree-alerts-${var.environment}"
  resource_group_name = var.resource_group_name
  short_name          = "erdtree"

  email_receiver {
    name          = "infrastructure-team"
    email_address = var.alert_email
  }

  webhook_receiver {
    name        = "teams-webhook"
    service_uri = var.teams_webhook_url
  }

  tags = var.tags
}

# Activity Log Alert for resource deployments
resource "azurerm_monitor_activity_log_alert" "deployment_success" {
  name                = "erdtree-deployment-success-${var.environment}"
  resource_group_name = var.resource_group_name
  scopes              = ["/subscriptions/${var.subscription_id}"]
  description         = "Alert when Erdtree deployment succeeds"

  criteria {
    category    = "Administrative"
    operation_name = "Microsoft.Resources/deployments/write"
    level       = "Informational"
    status      = "Succeeded"
  }

  action {
    action_group_id = azurerm_monitor_action_group.erdtree.id
  }

  tags = var.tags
}

resource "azurerm_monitor_activity_log_alert" "deployment_failure" {
  name                = "erdtree-deployment-failure-${var.environment}"
  resource_group_name = var.resource_group_name
  scopes              = ["/subscriptions/${var.subscription_id}"]
  description         = "Alert when Erdtree deployment fails"

  criteria {
    category    = "Administrative"
    operation_name = "Microsoft.Resources/deployments/write"
    level       = "Error"
    status      = "Failed"
  }

  action {
    action_group_id = azurerm_monitor_action_group.erdtree.id
  }

  tags = var.tags
}

# Diagnostic Settings for Azure Logic Apps
resource "azurerm_monitor_diagnostic_setting" "logic_app" {
  count                      = length(var.logic_app_ids)
  name                       = "erdtree-logicapp-diagnostics"
  target_resource_id         = var.logic_app_ids[count.index]
  log_analytics_workspace_id = azurerm_log_analytics_workspace.erdtree.id

  enabled_log {
    category = "WorkflowRuntime"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

# Cost Alert for budget management
resource "azurerm_consumption_budget_subscription" "erdtree" {
  name            = "erdtree-budget-${var.environment}"
  subscription_id = "/subscriptions/${var.subscription_id}"
  amount          = var.monthly_budget
  time_grain      = "Monthly"

  time_period {
    start_date = formatdate("YYYY-MM-01", timestamp())
    end_date   = "2030-12-31"
  }

  filter {
    tag {
      name = "application"
      values = ["erdtree-portal"]
    }
  }

  notification {
    enabled        = true
    threshold      = 80
    operator       = "EqualTo"
    threshold_type = "Actual"
    contact_emails = [var.alert_email]
  }

  notification {
    enabled        = true
    threshold      = 100
    operator       = "EqualTo"
    threshold_type = "Forecasted"
    contact_emails = [var.alert_email]
  }
}

# Custom Queries for audit logging
resource "azurerm_log_analytics_saved_search" "deployment_audit" {
  name                       = "ErdtreeDeploymentAudit"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.erdtree.id
  category                   = "Erdtree"
  display_name              = "Erdtree Deployment Audit Trail"
  
  query = <<-EOT
    AzureActivity
    | where ResourceProvider == "Microsoft.Resources"
    | where OperationNameValue == "Microsoft.Resources/deployments/write"
    | where Properties contains "erdtree"
    | extend DeploymentId = tostring(Properties.deploymentId)
    | extend ResourceType = tostring(Properties.resourceType)
    | extend RequestedBy = tostring(Caller)
    | project TimeGenerated, Caller, ActivityStatusValue, DeploymentId, ResourceType, ResourceGroup, SubscriptionId
    | order by TimeGenerated desc
  EOT
}

resource "azurerm_log_analytics_saved_search" "approval_audit" {
  name                       = "ErdtreeApprovalAudit"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.erdtree.id
  category                   = "Erdtree"
  display_name              = "Erdtree Approval Audit Trail"
  
  query = <<-EOT
    AzureDiagnostics
    | where ResourceProvider == "MICROSOFT.LOGIC"
    | where OperationName == "Microsoft.Logic/workflows/runs/write"
    | extend WorkflowName = Resource
    | extend Status = ResultType
    | extend ApprovalStatus = tostring(properties_d.approval_status)
    | extend DeploymentId = tostring(properties_d.deployment_id)
    | extend ApprovedBy = tostring(properties_d.approved_by)
    | project TimeGenerated, WorkflowName, Status, ApprovalStatus, DeploymentId, ApprovedBy
    | order by TimeGenerated desc
  EOT
}

# Workbook for Erdtree Dashboard
resource "azurerm_application_insights_workbook" "erdtree_dashboard" {
  name                = "erdtree-dashboard-${var.environment}"
  resource_group_name = var.resource_group_name
  location            = var.location
  display_name        = "Erdtree Self-Service Portal Dashboard"
  
  data_json = jsonencode({
    version: "Notebook/1.0",
    items: [
      {
        type: 1,
        content: {
          json: "# Erdtree Self-Service Portal Dashboard\n\nMonitoring dashboard for Azure infrastructure self-service deployments."
        }
      },
      {
        type: 3,
        content: {
          version: "KqlItem/1.0",
          query: "AzureActivity | where ResourceProvider == \"Microsoft.Resources\" | where Properties contains \"erdtree\" | summarize Count=count() by bin(TimeGenerated, 1d) | render timechart",
          size: 0,
          title: "Daily Deployment Activity"
        }
      },
      {
        type: 3,
        content: {
          version: "KqlItem/1.0",
          query: "AzureActivity | where ResourceProvider == \"Microsoft.Resources\" | where Properties contains \"erdtree\" | summarize Count=count() by ActivityStatusValue | render piechart",
          size: 0,
          title: "Deployment Success Rate"
        }
      }
    ]
  })

  tags = var.tags
}