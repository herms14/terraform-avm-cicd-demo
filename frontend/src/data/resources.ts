import { AzureResource, ResourceConfig } from '../types';

export const AZURE_RESOURCES: AzureResource[] = [
  {
    id: 'virtual-machine-windows',
    name: 'Windows Virtual Machine',
    description: 'Deploy Windows Server VMs with customizable configurations',
    icon: '🖥️',
    category: 'compute'
  },
  {
    id: 'virtual-machine-linux',
    name: 'Linux Virtual Machine',
    description: 'Deploy Linux VMs with various distributions',
    icon: '🐧',
    category: 'compute'
  },
  {
    id: 'virtual-network',
    name: 'Virtual Network',
    description: 'Create VNets with subnets and network security groups',
    icon: '🌐',
    category: 'network'
  },
  {
    id: 'storage-account',
    name: 'Storage Account',
    description: 'Deploy storage accounts with blob, file, and queue services',
    icon: '💾',
    category: 'storage'
  },
  {
    id: 'web-app',
    name: 'Web App (App Service)',
    description: 'Host web applications with built-in CI/CD',
    icon: '🌍',
    category: 'web'
  },
  {
    id: 'load-balancer',
    name: 'Load Balancer',
    description: 'Distribute traffic across multiple resources',
    icon: '⚖️',
    category: 'network'
  },
  {
    id: 'application-gateway',
    name: 'Application Gateway',
    description: 'Layer 7 load balancer with SSL termination',
    icon: '🚪',
    category: 'network'
  }
];

export const RESOURCE_CONFIGS: Record<string, ResourceConfig> = {
  'virtual-machine-windows': {
    resourceType: 'virtual-machine-windows',
    variables: [
      {
        name: 'resource_group_name',
        type: 'string',
        description: 'Name of the resource group',
        required: true
      },
      {
        name: 'location',
        type: 'string',
        description: 'Azure region for deployment',
        required: true,
        default: 'East US'
      },
      {
        name: 'vm_name',
        type: 'string',
        description: 'Name of the virtual machine',
        required: true,
        validation: {
          condition: 'length(var.vm_name) <= 15',
          error_message: 'VM name must be 15 characters or less.'
        }
      },
      {
        name: 'vm_size',
        type: 'string',
        description: 'Size of the virtual machine',
        required: true,
        default: 'Standard_B2s'
      },
      {
        name: 'admin_username',
        type: 'string',
        description: 'Administrator username',
        required: true
      },
      {
        name: 'admin_password',
        type: 'string',
        description: 'Administrator password',
        required: true
      },
      {
        name: 'os_disk_size_gb',
        type: 'number',
        description: 'OS disk size in GB',
        required: false,
        default: 127
      },
      {
        name: 'enable_accelerated_networking',
        type: 'bool',
        description: 'Enable accelerated networking',
        required: false,
        default: false
      }
    ]
  },
  'virtual-machine-linux': {
    resourceType: 'virtual-machine-linux',
    variables: [
      {
        name: 'resource_group_name',
        type: 'string',
        description: 'Name of the resource group',
        required: true
      },
      {
        name: 'location',
        type: 'string',
        description: 'Azure region for deployment',
        required: true,
        default: 'East US'
      },
      {
        name: 'vm_name',
        type: 'string',
        description: 'Name of the virtual machine',
        required: true,
        validation: {
          condition: 'length(var.vm_name) <= 64',
          error_message: 'VM name must be 64 characters or less.'
        }
      },
      {
        name: 'vm_size',
        type: 'string',
        description: 'Size of the virtual machine',
        required: true,
        default: 'Standard_B2s'
      },
      {
        name: 'admin_username',
        type: 'string',
        description: 'Administrator username',
        required: true
      },
      {
        name: 'ssh_public_key',
        type: 'string',
        description: 'SSH public key for authentication',
        required: true
      },
      {
        name: 'os_disk_size_gb',
        type: 'number',
        description: 'OS disk size in GB',
        required: false,
        default: 30
      },
      {
        name: 'linux_distribution',
        type: 'string',
        description: 'Linux distribution',
        required: false,
        default: 'Ubuntu'
      }
    ]
  },
  'storage-account': {
    resourceType: 'storage-account',
    variables: [
      {
        name: 'resource_group_name',
        type: 'string',
        description: 'Name of the resource group',
        required: true
      },
      {
        name: 'location',
        type: 'string',
        description: 'Azure region for deployment',
        required: true,
        default: 'East US'
      },
      {
        name: 'storage_account_name',
        type: 'string',
        description: 'Name of the storage account (must be globally unique)',
        required: true,
        validation: {
          condition: 'length(var.storage_account_name) >= 3 && length(var.storage_account_name) <= 24',
          error_message: 'Storage account name must be between 3 and 24 characters.'
        }
      },
      {
        name: 'account_tier',
        type: 'string',
        description: 'Storage account tier',
        required: false,
        default: 'Standard'
      },
      {
        name: 'account_replication_type',
        type: 'string',
        description: 'Storage account replication type',
        required: false,
        default: 'LRS'
      },
      {
        name: 'enable_blob_encryption',
        type: 'bool',
        description: 'Enable blob encryption',
        required: false,
        default: true
      }
    ]
  }
};