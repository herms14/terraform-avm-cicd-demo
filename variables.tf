variable "region_map" {
  type = map(string)
  default = {
    "eastus"        = "dev"
    "westeurope"    = "prod"
    "southeastasia" = "test"
  }
}


variable "prefix" {
  default = "bdo"
}

variable "region_cidrs" {
  default = {
    "eastus"        = "10.0.0.0/16"
    "westeurope"    = "10.1.0.0/16"
    "southeastasia" = "10.2.0.0/16"
  }
}


//create peering across regions
variable "peerings" {
  type = map(object({
    remote_region = string
    remote_vnet   = string
  }))
  default = {
    "eastus-westeurope" = {
      remote_region = "westeurope"
      remote_vnet   = "vnet-westeurope"
    },
    "eastus-southeastasia" = {
      remote_region = "southeastasia"
      remote_vnet   = "vnet-southeastasia"
    },
    "westeurope-southeastasia" = {
      remote_region = "southeastasia"
      remote_vnet   = "vnet-southeastasia"
    }
  }
}

