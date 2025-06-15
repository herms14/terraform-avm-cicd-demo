export interface AzureResource {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'compute' | 'network' | 'storage' | 'web';
}

export interface TerraformVariable {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
  validation?: {
    condition: string;
    error_message: string;
  };
}

export interface ResourceConfig {
  resourceType: string;
  variables: TerraformVariable[];
}

export interface DeploymentRequest {
  id: string;
  resourceType: string;
  environment: 'dev' | 'prod';
  subscription: 'FireGiants-Prod' | 'Nokron-Prod';
  tfvars: Record<string, any>;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'deploying' | 'deployed' | 'failed';
  approvedBy?: string;
  approvedAt?: string;
  deployedAt?: string;
  errorMessage?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}