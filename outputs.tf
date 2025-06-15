output "vnet_ids" {
  value = {
    for region, mod in module.vnet :
    region => mod.resource_id
  }
}

output "vnet_eastus_id" {
  value = module.vnet["eastus"].resource_id
}
