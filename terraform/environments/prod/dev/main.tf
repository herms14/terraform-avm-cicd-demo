terraform {
  required_version = ">= 1.6.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.45"
    }
  }
  backend "azurerm" {
    # Backend configuration provided via init command
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
    virtual_machine {
      delete_os_disk_on_deletion     = true
      graceful_shutdown              = false
      skip_shutdown_and_force_delete = false
    }
  }
}

# Data sources for common resources
data "azurerm_client_config" "current" {}

data "azurerm_subscription" "current" {}

# Standard tags for all resources
locals {
  standard_tags = {
    deployedBy    = "Hermes"
    managedBy     = "Terraform"
    environment   = var.environment
    application   = "erdtree-portal"
    resourceType  = var.resource_type
    deploymentId  = var.deployment_id
    createdDate   = formatdate("YYYY-MM-DD", timestamp())
    subscription  = data.azurerm_subscription.current.display_name
  }
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
  tags     = local.standard_tags
}

# Conditional resource deployment based on resource type
module "virtual_machine_windows" {
  count  = var.resource_type == "virtual-machine-windows" ? 1 : 0
  source = "Azure/avm-res-compute-virtualmachine/azurerm"
  version = "~> 0.15"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  
  name            = var.vm_name
  admin_username  = var.admin_username
  admin_password  = var.admin_password
  size           = var.vm_size

  os_type = "Windows"
  source_image_reference = {
    publisher = "MicrosoftWindowsServer"
    offer     = "WindowsServer"
    sku       = "2022-datacenter-azure-edition"
    version   = "latest"
  }

  os_disk = {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb        = var.os_disk_size_gb
  }

  network_interfaces = {
    network_interface_1 = {
      name = "${var.vm_name}-nic"
      ip_configurations = {
        ip_configuration_1 = {
          name                          = "internal"
          private_ip_address_allocation = "Dynamic"
          subnet_id                    = module.virtual_network[0].subnets["subnet1"].resource_id
        }
      }
    }
  }

  tags = local.standard_tags
}

module "virtual_machine_linux" {
  count  = var.resource_type == "virtual-machine-linux" ? 1 : 0
  source = "Azure/avm-res-compute-virtualmachine/azurerm"
  version = "~> 0.15"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  
  name            = var.vm_name
  admin_username  = var.admin_username
  size           = var.vm_size

  os_type = "Linux"
  source_image_reference = {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  os_disk = {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb        = var.os_disk_size_gb
  }

  network_interfaces = {
    network_interface_1 = {
      name = "${var.vm_name}-nic"
      ip_configurations = {
        ip_configuration_1 = {
          name                          = "internal"
          private_ip_address_allocation = "Dynamic"
          subnet_id                    = module.virtual_network[0].subnets["subnet1"].resource_id
        }
      }
    }
  }

  admin_ssh_keys = var.ssh_public_key != null ? [
    {
      public_key = var.ssh_public_key
      username   = var.admin_username
    }
  ] : []

  tags = local.standard_tags
}

module "virtual_network" {
  count  = contains(["virtual-machine-windows", "virtual-machine-linux", "virtual-network"], var.resource_type) ? 1 : 0
  source = "Azure/avm-res-network-virtualnetwork/azurerm"
  version = "~> 0.4"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  
  name          = "${var.vm_name != null ? var.vm_name : "erdtree"}-vnet"
  address_space = ["10.0.0.0/16"]

  subnets = {
    subnet1 = {
      name             = "internal"
      address_prefixes = ["10.0.1.0/24"]
    }
  }

  tags = local.standard_tags
}

module "storage_account" {
  count  = var.resource_type == "storage-account" ? 1 : 0
  source = "Azure/avm-res-storage-storageaccount/azurerm"
  version = "~> 0.2"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  
  name                     = var.storage_account_name
  account_tier            = var.account_tier
  account_replication_type = var.account_replication_type
  
  blob_properties = var.enable_blob_encryption ? {
    versioning_enabled = true
    change_feed_enabled = true
    delete_retention_policy = {
      days = 7
    }
  } : null

  tags = local.standard_tags
}