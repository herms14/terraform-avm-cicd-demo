output "vnet_eastus_id" {
  value = module.vnet["eastus"].resource_id
}

output "vnet_westeurope_id" {
  value = module.vnet["westeurope"].resource_id
}

output "vnet_southeastasia_id" {
  value = module.vnet["southeastasia"].resource_id
}