variable "environment" {
  description = "Environment name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 90
}

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
  default     = "hemirafl@microsoft.com"
}

variable "teams_webhook_url" {
  description = "Microsoft Teams webhook URL for notifications"
  type        = string
  default     = ""
}

variable "logic_app_ids" {
  description = "List of Logic App resource IDs to monitor"
  type        = list(string)
  default     = []
}

variable "monthly_budget" {
  description = "Monthly budget limit for cost alerts"
  type        = number
  default     = 1000
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}