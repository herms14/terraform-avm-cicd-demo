<!-- BEGIN_TF_DOCS -->
# This is simple Terraform demo to deploy a complete CI/CD pipeline on Azure

<!-- markdownlint-disable MD033 -->
## Requirements

The following requirements are needed by this module:

- <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) (>= 1.9, < 2.0)

- <a name="requirement_azurerm"></a> [azurerm](#requirement\_azurerm) (~> 3.74)

- <a name="requirement_http"></a> [http](#requirement\_http) (~> 3.4)

- <a name="requirement_random"></a> [random](#requirement\_random) (~> 3.5)

## Resources

The following resources are used by this module:

- [azurerm_resource_group.this](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/resource_group) (resource)

<!-- markdownlint-disable MD013 -->
## Required Inputs

No required inputs.

## Optional Inputs

The following input variables are optional (have default values):

### <a name="input_prefix"></a> [prefix](#input\_prefix)

Description: n/a

Type: `string`

Default: `"contoso"`

### <a name="input_region_cidrs"></a> [region\_cidrs](#input\_region\_cidrs)

Description: n/a

Type: `map(string)`

Default:

```json
{
  "eastus": "10.0.0.0/16",
  "southeastasia": "10.2.0.0/16",
  "westeurope": "10.1.0.0/16"
}
```

## Outputs

The following outputs are exported:

### <a name="output_vnet_ids"></a> [vnet\_ids](#output\_vnet\_ids)

Description: n/a

## Modules

The following Modules are called:

### <a name="module_naming"></a> [naming](#module\_naming)

Source: Azure/naming/azurerm

Version: ~> 0.3

### <a name="module_regions"></a> [regions](#module\_regions)

Source: Azure/regions/azurerm

Version: ~> 0.3

### <a name="module_vnet"></a> [vnet](#module\_vnet)

Source: Azure/avm-res-network-virtualnetwork/azurerm

Version: 0.8.1

### <a name="module_vnet_peerings"></a> [vnet\_peerings](#module\_vnet\_peerings)

Source: Azure/avm-res-network-virtualnetwork/azurerm//modules/peering

Version:

Data Collection
The software may collect information about you and your use of the software and send it to Microsoft. Microsoft may use this information to provide services and improve our products and services. You may turn off the telemetry as described in the repository. There are also some features in the software that may enable you and Microsoft to collect data from users of your applications. If you use these features, you must comply with applicable law, including providing appropriate notices to users of your applications together with a copy of Microsoft’s privacy statement. Our privacy statement is located at https://go.microsoft.com/fwlink/?LinkID=824704. You can learn more about data collection and use in the help documentation and our privacy statement. Your use of the software operates as your consent to these practices.
<!-- END_TF_DOCS -->