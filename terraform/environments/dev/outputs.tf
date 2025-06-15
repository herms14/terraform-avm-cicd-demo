output "deployment_summary" {
  description = "Deployment summary information"
  value = {
    deployment_id    = var.deployment_id
    resource_type    = var.resource_type
    environment      = var.environment
    resource_group   = azurerm_resource_group.main.name
    location         = azurerm_resource_group.main.location
    subscription_id  = data.azurerm_subscription.current.subscription_id
    deployment_time  = timestamp()
  }
}

output "resource_group" {
  description = "Resource group information"
  value = {
    name     = azurerm_resource_group.main.name
    location = azurerm_resource_group.main.location
    id       = azurerm_resource_group.main.id
  }
}

# Virtual Machine Outputs
output "virtual_machine_windows" {
  description = "Windows VM information"
  value = var.resource_type == "virtual-machine-windows" ? {
    name                = module.virtual_machine_windows[0].name
    resource_id         = module.virtual_machine_windows[0].resource_id
    private_ip_address  = module.virtual_machine_windows[0].network_interfaces["network_interface_1"].private_ip_address
    size               = var.vm_size
    admin_username     = var.admin_username
  } : null
  sensitive = true
}

output "virtual_machine_linux" {
  description = "Linux VM information"
  value = var.resource_type == "virtual-machine-linux" ? {
    name                = module.virtual_machine_linux[0].name
    resource_id         = module.virtual_machine_linux[0].resource_id
    private_ip_address  = module.virtual_machine_linux[0].network_interfaces["network_interface_1"].private_ip_address
    size               = var.vm_size
    admin_username     = var.admin_username
    distribution       = var.linux_distribution
  } : null
  sensitive = true
}

# Virtual Network Outputs
output "virtual_network" {
  description = "Virtual network information"
  value = contains(["virtual-machine-windows", "virtual-machine-linux", "virtual-network"], var.resource_type) ? {
    name            = module.virtual_network[0].name
    resource_id     = module.virtual_network[0].resource_id
    address_space   = module.virtual_network[0].address_space
    subnets         = module.virtual_network[0].subnets
  } : null
}

# Storage Account Outputs
output "storage_account" {
  description = "Storage account information"
  value = var.resource_type == "storage-account" ? {
    name                     = module.storage_account[0].name
    resource_id             = module.storage_account[0].resource_id
    primary_blob_endpoint   = module.storage_account[0].primary_blob_endpoint
    primary_access_key      = module.storage_account[0].primary_access_key
    account_tier           = var.account_tier
    replication_type       = var.account_replication_type
  } : null
  sensitive = true
}

# Cost Estimation (placeholder for FinOps)
output "cost_estimation" {
  description = "Estimated monthly cost information"
  value = {
    resource_type = var.resource_type
    region       = var.location
    environment  = var.environment
    note         = "Use Azure Cost Management for accurate cost tracking"
  }
}

# Compliance and Governance
output "compliance_info" {
  description = "Compliance and governance information"
  value = {
    tags_applied = local.standard_tags
    managed_by   = "Terraform"
    deployed_by  = "Hermes"
    backup_required = var.resource_type == "virtual-machine-windows" || var.resource_type == "virtual-machine-linux"
    monitoring_enabled = true
  }
}