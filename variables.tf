variable "prefix" {
  default = "bdo"
}

variable "region_cidrs" {
  type = map(string)
  default = {
    "eastus"        = "10.0.0.0/16"
    "westeurope"    = "10.1.0.0/16"
    "southeastasia" = "10.2.0.0/16"
  }
}
