variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "resource_type" {
  description = "Type of resource to deploy"
  type        = string
  validation {
    condition = contains([
      "virtual-machine-windows",
      "virtual-machine-linux", 
      "virtual-network",
      "storage-account",
      "web-app",
      "load-balancer",
      "application-gateway"
    ], var.resource_type)
    error_message = "Resource type must be one of the supported types."
  }
}

variable "deployment_id" {
  description = "Unique deployment identifier"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be either 'dev' or 'prod'."
  }
}

# Common variables
variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region for deployment"
  type        = string
  default     = "East US"
}

# Virtual Machine variables
variable "vm_name" {
  description = "Name of the virtual machine"
  type        = string
  default     = null
  validation {
    condition = var.vm_name == null || (
      length(var.vm_name) >= 1 && 
      length(var.vm_name) <= 64 &&
      can(regex("^[a-zA-Z0-9-._]+$", var.vm_name))
    )
    error_message = "VM name must be 1-64 characters and contain only letters, numbers, hyphens, periods, or underscores."
  }
}

variable "vm_size" {
  description = "Size of the virtual machine"
  type        = string
  default     = "Standard_B2s"
}

variable "admin_username" {
  description = "Administrator username"
  type        = string
  default     = null
  validation {
    condition = var.admin_username == null || (
      length(var.admin_username) >= 1 && 
      length(var.admin_username) <= 20 &&
      can(regex("^[a-zA-Z][a-zA-Z0-9]*$", var.admin_username))
    )
    error_message = "Admin username must be 1-20 characters, start with a letter, and contain only letters and numbers."
  }
}

variable "admin_password" {
  description = "Administrator password"
  type        = string
  default     = null
  sensitive   = true
  validation {
    condition = var.admin_password == null || (
      length(var.admin_password) >= 12 && 
      length(var.admin_password) <= 123
    )
    error_message = "Admin password must be 12-123 characters long."
  }
}

variable "ssh_public_key" {
  description = "SSH public key for Linux VMs"
  type        = string
  default     = null
}

variable "os_disk_size_gb" {
  description = "OS disk size in GB"
  type        = number
  default     = null
  validation {
    condition = var.os_disk_size_gb == null || (
      var.os_disk_size_gb >= 30 && 
      var.os_disk_size_gb <= 4095
    )
    error_message = "OS disk size must be between 30 and 4095 GB."
  }
}

variable "enable_accelerated_networking" {
  description = "Enable accelerated networking"
  type        = bool
  default     = false
}

variable "linux_distribution" {
  description = "Linux distribution"
  type        = string
  default     = "Ubuntu"
  validation {
    condition     = contains(["Ubuntu", "RHEL", "CentOS", "SLES"], var.linux_distribution)
    error_message = "Linux distribution must be one of: Ubuntu, RHEL, CentOS, SLES."
  }
}

# Storage Account variables
variable "storage_account_name" {
  description = "Name of the storage account"
  type        = string
  default     = null
  validation {
    condition = var.storage_account_name == null || (
      length(var.storage_account_name) >= 3 && 
      length(var.storage_account_name) <= 24 &&
      can(regex("^[a-z0-9]+$", var.storage_account_name))
    )
    error_message = "Storage account name must be 3-24 characters, lowercase letters and numbers only."
  }
}

variable "account_tier" {
  description = "Storage account tier"
  type        = string
  default     = "Standard"
  validation {
    condition     = contains(["Standard", "Premium"], var.account_tier)
    error_message = "Account tier must be either 'Standard' or 'Premium'."
  }
}

variable "account_replication_type" {
  description = "Storage account replication type"
  type        = string
  default     = "LRS"
  validation {
    condition     = contains(["LRS", "GRS", "RAGRS", "ZRS", "GZRS", "RAGZRS"], var.account_replication_type)
    error_message = "Replication type must be one of: LRS, GRS, RAGRS, ZRS, GZRS, RAGZRS."
  }
}

variable "enable_blob_encryption" {
  description = "Enable blob encryption"
  type        = bool
  default     = true
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}