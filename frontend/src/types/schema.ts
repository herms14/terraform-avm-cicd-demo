/**
 * TypeScript types for AVM Module Schemas
 */

export interface TerraformVariable {
  name: string;
  type: string;
  description?: string;
  default?: any;
  required: boolean;
  sensitive?: boolean;
  validation?: {
    condition: string;
    error_message: string;
  }[];
}

export interface ModuleSchema {
  moduleId: string;
  name: string;
  namespace: string;
  provider: string;
  version: string;
  description: string;
  category: string;
  icon: string;
  featured: boolean;
  lastUpdated: string;
  downloads: number;
  variables: TerraformVariable[];
  examples: Record<string, any>[];
  metadata: {
    sourceUrl: string;
    documentationUrl: string;
    tags: string[];
    maturity: 'stable' | 'preview' | 'experimental';
    storedAt?: string;
    schemaVersion?: string;
  };
}

export interface SchemaFormData {
  [variableName: string]: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  default?: any;
  description?: string;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => string | null;
  };
  conditional?: {
    dependsOn: string;
    showWhen: (dependentValue: any) => boolean;
  };
  sensitive?: boolean;
  category?: 'basic' | 'advanced' | 'security' | 'networking';
}

export type FormFieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'json'
  | 'password'
  | 'array'
  | 'object'
  | 'location'
  | 'resourceGroup';

export interface DeploymentRequest {
  deploymentId: string;
  moduleId: string;
  moduleName: string;
  moduleVersion: string;
  environment: string;
  subscription: string;
  resourceGroup: string;
  location: string;
  requestedBy: string;
  variables: SchemaFormData;
  tags: Record<string, string>;
  timestamp: string;
}

export interface DeploymentStatus {
  deploymentId: string;
  status: 'pending' | 'approved' | 'rejected' | 'deploying' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  lastUpdated: string;
  logs?: string[];
  outputs?: Record<string, any>;
}

export interface CategoryInfo {
  name: string;
  displayName: string;
  icon: string;
  description: string;
  count: number;
  color: string;
}

export interface FilterOptions {
  categories: CategoryInfo[];
  maturityLevels: Array<{
    value: 'stable' | 'preview' | 'experimental';
    label: string;
    count: number;
  }>;
  tags: Array<{
    name: string;
    count: number;
  }>;
}

export interface SearchSuggestion {
  name: string;
  moduleId: string;
  category: string;
  description: string;
  type: 'module' | 'category' | 'tag';
}

export interface CatalogState {
  schemas: ModuleSchema[];
  loading: boolean;
  error: string | null;
  filters: {
    categories: string[];
    maturity: string[];
    search: string;
    featured: boolean | null;
    sortBy: 'name' | 'downloads' | 'updated' | 'category';
    sortOrder: 'asc' | 'desc';
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface FormState {
  schema: ModuleSchema | null;
  data: SchemaFormData;
  errors: ValidationError[];
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  showAdvanced: boolean;
  activeCategory: string | null;
}

// Utility types for Azure-specific fields
export interface AzureLocation {
  name: string;
  displayName: string;
  regionalDisplayName?: string;
  metadata?: {
    regionType?: string;
    regionCategory?: string;
    pairedRegion?: Array<{
      name: string;
      id: string;
    }>;
  };
}

export interface AzureSubscription {
  subscriptionId: string;
  displayName: string;
  state: string;
  subscriptionPolicies?: {
    locationPlacementId: string;
    quotaId: string;
    spendingLimit: string;
  };
}

export interface AzureResourceGroup {
  name: string;
  location: string;
  managedBy?: string;
  tags?: Record<string, string>;
  properties?: {
    provisioningState: string;
  };
}

// Constants
export const CATEGORIES: Record<string, CategoryInfo> = {
  compute: {
    name: 'compute',
    displayName: 'Compute',
    icon: '🖥️',
    description: 'Virtual machines, containers, and compute services',
    count: 0,
    color: 'blue'
  },
  network: {
    name: 'network',
    displayName: 'Networking',
    icon: '🌐',
    description: 'Virtual networks, load balancers, and connectivity',
    count: 0,
    color: 'green'
  },
  storage: {
    name: 'storage',
    displayName: 'Storage',
    icon: '💾',
    description: 'Storage accounts, disks, and data services',
    count: 0,
    color: 'yellow'
  },
  database: {
    name: 'database',
    displayName: 'Database',
    icon: '🗄️',
    description: 'SQL, NoSQL, and managed database services',
    count: 0,
    color: 'purple'
  },
  security: {
    name: 'security',
    displayName: 'Security',
    icon: '🔒',
    description: 'Key vaults, identity, and security services',
    count: 0,
    color: 'red'
  },
  monitoring: {
    name: 'monitoring',
    displayName: 'Monitoring',
    icon: '📊',
    description: 'Application insights, logging, and observability',
    count: 0,
    color: 'indigo'
  },
  integration: {
    name: 'integration',
    displayName: 'Integration',
    icon: '🔗',
    description: 'Logic apps, service bus, and integration services',
    count: 0,
    color: 'pink'
  },
  web: {
    name: 'web',
    displayName: 'Web',
    icon: '🌍',
    description: 'App services, static web apps, and web hosting',
    count: 0,
    color: 'teal'
  },
  ai: {
    name: 'ai',
    displayName: 'AI & ML',
    icon: '🤖',
    description: 'Cognitive services, machine learning, and AI',
    count: 0,
    color: 'orange'
  },
  other: {
    name: 'other',
    displayName: 'Other',
    icon: '📦',
    description: 'Miscellaneous Azure services',
    count: 0,
    color: 'gray'
  }
};

export const MATURITY_LEVELS = {
  stable: {
    label: 'Stable',
    description: 'Production-ready modules',
    color: 'green',
    icon: '✅'
  },
  preview: {
    label: 'Preview',
    description: 'Beta/preview modules',
    color: 'orange',
    icon: '🔶'
  },
  experimental: {
    label: 'Experimental',
    description: 'Early-stage modules',
    color: 'red',
    icon: '🧪'
  }
};

export const TERRAFORM_TYPES = {
  'string': 'text',
  'number': 'number',
  'bool': 'boolean',
  'list(string)': 'array',
  'map(string)': 'object',
  'object': 'json',
  'any': 'json'
} as const;

export type TerraformType = keyof typeof TERRAFORM_TYPES;
export type FormFieldMapping = typeof TERRAFORM_TYPES[TerraformType];