output "vnet_ids" {
  value = {
    for region, mod in module.vnet :
    region => mod.resource_id
  }
}
