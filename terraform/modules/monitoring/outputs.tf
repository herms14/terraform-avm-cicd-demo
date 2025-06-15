output "log_analytics_workspace_id" {
  description = "Log Analytics Workspace ID"
  value       = azurerm_log_analytics_workspace.erdtree.id
}

output "log_analytics_workspace_key" {
  description = "Log Analytics Workspace Key"
  value       = azurerm_log_analytics_workspace.erdtree.primary_shared_key
  sensitive   = true
}

output "application_insights_id" {
  description = "Application Insights ID"
  value       = azurerm_application_insights.erdtree.id
}

output "application_insights_key" {
  description = "Application Insights Instrumentation Key"
  value       = azurerm_application_insights.erdtree.instrumentation_key
  sensitive   = true
}

output "application_insights_connection_string" {
  description = "Application Insights Connection String"
  value       = azurerm_application_insights.erdtree.connection_string
  sensitive   = true
}

output "action_group_id" {
  description = "Action Group ID for alerts"
  value       = azurerm_monitor_action_group.erdtree.id
}

output "budget_id" {
  description = "Consumption Budget ID"
  value       = azurerm_consumption_budget_subscription.erdtree.id
}