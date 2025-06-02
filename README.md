<!-- BEGIN_TF_DOCS -->
# This is simple Terraform demo to deploy a complete CI/CD pipeline on Azure

<!-- markdownlint-disable MD033 -->
## Requirements

| Name | Version |
|------|---------|
| <a name="requirement_terraform"></a> [terraform](#requirement\_terraform) | >= 1.9, < 2.0 |
| <a name="requirement_azurerm"></a> [azurerm](#requirement\_azurerm) | ~> 3.74 |
| <a name="requirement_http"></a> [http](#requirement\_http) | ~> 3.4 |
| <a name="requirement_random"></a> [random](#requirement\_random) | ~> 3.5 |

## Resources

| Name | Type |
|------|------|
| [azurerm_resource_group.this](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/resource_group) | resource |

<!-- markdownlint-disable MD013 -->
## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| <a name="input_peerings"></a> [peerings](#input\_peerings) | create peering across regions | <pre>map(object({<br/>    remote_region = string<br/>    remote_vnet   = string<br/>  }))</pre> | <pre>{<br/>  "eastus-southeastasia": {<br/>    "remote_region": "southeastasia",<br/>    "remote_vnet": "vnet-southeastasia"<br/>  },<br/>  "eastus-westeurope": {<br/>    "remote_region": "westeurope",<br/>    "remote_vnet": "vnet-westeurope"<br/>  },<br/>  "westeurope-southeastasia": {<br/>    "remote_region": "southeastasia",<br/>    "remote_vnet": "vnet-southeastasia"<br/>  }<br/>}</pre> | no |
| <a name="input_prefix"></a> [prefix](#input\_prefix) | n/a | `string` | `"bdo"` | no |
| <a name="input_region_cidrs"></a> [region\_cidrs](#input\_region\_cidrs) | n/a | `map` | <pre>{<br/>  "eastus": "10.0.0.0/16",<br/>  "southeastasia": "10.2.0.0/16",<br/>  "westeurope": "10.1.0.0/16"<br/>}</pre> | no |
| <a name="input_region_map"></a> [region\_map](#input\_region\_map) | n/a | `map(string)` | <pre>{<br/>  "eastus": "dev",<br/>  "southeastasia": "test",<br/>  "westeurope": "prod"<br/>}</pre> | no |

## Outputs

| Name | Description |
|------|-------------|
| <a name="output_vnet_eastus_id"></a> [vnet\_eastus\_id](#output\_vnet\_eastus\_id) | n/a |
| <a name="output_vnet_southeastasia_id"></a> [vnet\_southeastasia\_id](#output\_vnet\_southeastasia\_id) | n/a |
| <a name="output_vnet_westeurope_id"></a> [vnet\_westeurope\_id](#output\_vnet\_westeurope\_id) | n/a |

## Modules

| Name | Source | Version |
|------|--------|---------|
| <a name="module_naming"></a> [naming](#module\_naming) | Azure/naming/azurerm | ~> 0.3 |
| <a name="module_regions"></a> [regions](#module\_regions) | Azure/regions/azurerm | ~> 0.3 |
| <a name="module_vnet"></a> [vnet](#module\_vnet) | Azure/avm-res-network-virtualnetwork/azurerm | 0.8.1 |
| <a name="module_vnet_peerings"></a> [vnet\_peerings](#module\_vnet\_peerings) | Azure/avm-res-network-virtualnetwork/azurerm//modules/peering | n/a |

Data Collection
The software may collect information about you and your use of the software and send it to Microsoft. Microsoft may use this information to provide services and improve our products and services. You may turn off the telemetry as described in the repository. There are also some features in the software that may enable you and Microsoft to collect data from users of your applications. If you use these features, you must comply with applicable law, including providing appropriate notices to users of your applications together with a copy of Microsoft’s privacy statement. Our privacy statement is located at https://go.microsoft.com/fwlink/?LinkID=824704. You can learn more about data collection and use in the help documentation and our privacy statement. Your use of the software operates as your consent to these practices.
<!-- END_TF_DOCS -->