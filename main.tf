module "regions" {
  source  = "Azure/regions/azurerm"
  version = "~> 0.3"
}

module "naming" {
  source  = "Azure/naming/azurerm"
  version = "~> 0.3"
}
resource "azurerm_resource_group" "this" {
  for_each = var.region_cidrs
  location = each.key
  name     = "${var.prefix}-${terraform.workspace}-${each.key}-rg"

  tags = {
    managedBy    = "Terraform"
    CostCenter   = "12345"
    Environment  = terraform.workspace
    Owner        = "Hermes Miraflor"
    Project      = "Multi-Region VNet Peering"
    CreationDate = formatdate("YYYY-MM-DD", timestamp())
  }
}
module "vnet" {
  source              = "Azure/avm-res-network-virtualnetwork/azurerm"
  version             = "0.8.1"
  for_each            = var.region_cidrs
  resource_group_name = azurerm_resource_group.this[each.key].name
  location            = each.key
  name                = "${var.prefix}-${each.key}-vnet-${terraform.workspace}"
  address_space       = [each.value]

  encryption = {
    enabled     = true
    enforcement = "AllowUnencrypted"
  }

  tags = {

    managedBy    = "Terraform"
    CostCenter   = "12345"
    Environment  = terraform.workspace
    Owner        = "Hermes Miraflor"
    Project      = "Multi-Region VNet Peering"
    CreationDate = formatdate("YYYY-MM-DD", timestamp())

  }
}
locals {
  vnet_keys = keys(module.vnet)

  vnet_pairs = flatten([
    for i, a in local.vnet_keys : [
      for j, b in local.vnet_keys :
      {
        vnet_a = a
        vnet_b = b
      } if j > i
    ]
  ])
}
module "vnet_peerings" {
  for_each = {
    for pair in local.vnet_pairs :
    "${pair.vnet_a}-to-${pair.vnet_b}" => pair
  }

  source = "Azure/avm-res-network-virtualnetwork/azurerm//modules/peering"

  virtual_network = {
    resource_id = module.vnet[each.value.vnet_a].resource_id
  }

  remote_virtual_network = {
    resource_id = module.vnet[each.value.vnet_b].resource_id
  }

  name                                 = "${var.prefix}-peering-${each.value.vnet_a}-to-${each.value.vnet_b}-${terraform.workspace}"
  allow_forwarded_traffic              = true
  allow_gateway_transit                = true
  allow_virtual_network_access         = true
  use_remote_gateways                  = false
  create_reverse_peering               = true
  reverse_name                         = "${var.prefix}-peering-${each.value.vnet_b}-to-${each.value.vnet_a}-${terraform.workspace}"
  reverse_allow_forwarded_traffic      = true
  reverse_allow_gateway_transit        = false
  reverse_allow_virtual_network_access = true
  reverse_use_remote_gateways          = false

  depends_on = [module.vnet]
}
