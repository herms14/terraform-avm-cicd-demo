/**
 * Terraform Registry Client
 * Handles fetching and parsing Azure Verified Modules from Terraform Registry
 */

import axios from 'axios';
import * as path from 'path';

// Types
export interface TerraformModule {
  name: string;
  namespace: string;
  provider: string;
  description: string;
  downloads: number;
  published_at: string;
  versions: string[];
}

export interface ModuleVersion {
  version: string;
  published_at: string;
  downloads: number;
  description: string;
  source: string;
  tag: string;
}

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
  };
}

export class TerraformRegistryClient {
  private readonly baseUrl = 'https://registry.terraform.io/v1';
  private readonly githubBaseUrl = 'https://api.github.com/repos';
  private readonly axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Erdtree-Portal/1.0',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Fetch all Azure Verified Modules from Terraform Registry
   */
  async fetchAzureModules(): Promise<TerraformModule[]> {
    try {
      console.log('Fetching Azure modules from Terraform Registry...');
      
      const response = await this.axiosInstance.get(
        `${this.baseUrl}/namespaces/Azure/modules`
      );

      const modules = response.data.modules || [];
      
      // Filter for AVM modules
      const avmModules = modules.filter((module: TerraformModule) => 
        module.name.startsWith('avm-') && 
        module.provider === 'azurerm'
      );

      console.log(`Found ${avmModules.length} AVM modules`);
      return avmModules;

    } catch (error) {
      console.error('Failed to fetch Azure modules:', error);
      throw new Error(`Registry API error: ${error.message}`);
    }
  }

  /**
   * Get the latest version of a module
   */
  async getModuleVersion(namespace: string, name: string, provider: string): Promise<ModuleVersion> {
    try {
      const response = await this.axiosInstance.get(
        `${this.baseUrl}/modules/${namespace}/${name}/${provider}`
      );

      const moduleData = response.data;
      return {
        version: moduleData.version,
        published_at: moduleData.published_at,
        downloads: moduleData.downloads,
        description: moduleData.description,
        source: moduleData.source,
        tag: moduleData.tag
      };

    } catch (error) {
      console.error(`Failed to fetch module version for ${namespace}/${name}/${provider}:`, error);
      throw error;
    }
  }

  /**
   * Parse variables.tf content into structured format
   */
  parseVariablesTf(content: string): TerraformVariable[] {
    const variables: TerraformVariable[] = [];
    
    // Enhanced regex to match Terraform variable blocks
    const variableRegex = /variable\s+"([^"]+)"\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
    
    let match;
    while ((match = variableRegex.exec(content)) !== null) {
      const name = match[1];
      const block = match[2];
      
      const variable: TerraformVariable = {
        name,
        type: this.extractAttribute(block, 'type') || 'string',
        description: this.extractAttribute(block, 'description')?.replace(/^"|"$/g, ''),
        required: !block.includes('default'),
        sensitive: block.includes('sensitive = true')
      };

      // Extract default value
      const defaultMatch = block.match(/default\s*=\s*([^]*?)(?=\n\s*[a-z]|\n\s*}|$)/);
      if (defaultMatch) {
        variable.default = this.parseDefaultValue(defaultMatch[1].trim());
        variable.required = false;
      }

      // Extract validation rules
      const validationBlocks = this.extractValidationBlocks(block);
      if (validationBlocks.length > 0) {
        variable.validation = validationBlocks;
      }

      variables.push(variable);
    }

    return variables;
  }

  /**
   * Fetch variables.tf from GitHub repository
   */
  async fetchVariablesTf(sourceUrl: string): Promise<string> {
    try {
      // Extract GitHub repo info from source URL
      const repoMatch = sourceUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
      if (!repoMatch) {
        throw new Error('Invalid GitHub source URL');
      }

      const repoPath = repoMatch[1];
      const apiUrl = `${this.githubBaseUrl}/${repoPath}/contents/variables.tf`;

      const response = await this.axiosInstance.get(apiUrl);
      
      if (response.data.encoding === 'base64') {
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
      }
      
      return response.data.content;

    } catch (error) {
      console.error(`Failed to fetch variables.tf from ${sourceUrl}:`, error);
      
      // Try alternative paths
      const alternativePaths = ['main.tf', 'variables.tf.json'];
      for (const altPath of alternativePaths) {
        try {
          const repoMatch = sourceUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
          const repoPath = repoMatch[1];
          const apiUrl = `${this.githubBaseUrl}/${repoPath}/contents/${altPath}`;
          
          const response = await this.axiosInstance.get(apiUrl);
          if (response.data.encoding === 'base64') {
            return Buffer.from(response.data.content, 'base64').toString('utf-8');
          }
          return response.data.content;
        } catch (altError) {
          continue;
        }
      }
      
      throw error;
    }
  }

  /**
   * Generate module schema from Terraform module data
   */
  async generateModuleSchema(module: TerraformModule): Promise<ModuleSchema> {
    try {
      console.log(`Generating schema for ${module.name}...`);

      // Get latest version info
      const version = await this.getModuleVersion(module.namespace, module.name, module.provider);
      
      // Fetch and parse variables.tf
      let variables: TerraformVariable[] = [];
      try {
        const variablesTfContent = await this.fetchVariablesTf(version.source);
        variables = this.parseVariablesTf(variablesTfContent);
      } catch (error) {
        console.warn(`Could not fetch variables for ${module.name}:`, error.message);
        variables = this.generateFallbackVariables(module.name);
      }

      // Categorize and add metadata
      const category = this.categorizeModule(module.name);
      const icon = this.getModuleIcon(category);
      
      const schema: ModuleSchema = {
        moduleId: `${module.namespace}-${module.name}-${module.provider}`,
        name: this.formatModuleName(module.name),
        namespace: module.namespace,
        provider: module.provider,
        version: version.version,
        description: module.description || version.description || `Deploy ${this.formatModuleName(module.name)}`,
        category,
        icon,
        featured: this.isFeaturedModule(module.name),
        lastUpdated: version.published_at,
        downloads: module.downloads,
        variables,
        examples: this.generateExamples(module.name, variables),
        metadata: {
          sourceUrl: version.source,
          documentationUrl: `https://registry.terraform.io/modules/${module.namespace}/${module.name}/${module.provider}`,
          tags: this.generateTags(module.name, category),
          maturity: this.determineMaturity(module.name, version.version)
        }
      };

      return schema;

    } catch (error) {
      console.error(`Failed to generate schema for ${module.name}:`, error);
      throw error;
    }
  }

  /**
   * Sync all Azure Verified Modules and generate schemas
   */
  async syncAllModules(): Promise<ModuleSchema[]> {
    console.log('Starting full AVM sync...');
    
    const modules = await this.fetchAzureModules();
    const schemas: ModuleSchema[] = [];
    
    // Process modules in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < modules.length; i += batchSize) {
      const batch = modules.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (module) => {
        try {
          const schema = await this.generateModuleSchema(module);
          console.log(`✅ Generated schema for ${module.name}`);
          return schema;
        } catch (error) {
          console.error(`❌ Failed to generate schema for ${module.name}:`, error.message);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      schemas.push(...batchResults.filter(Boolean));
      
      // Rate limiting delay
      if (i + batchSize < modules.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ Sync complete: ${schemas.length} modules processed`);
    return schemas;
  }

  // Helper methods
  private extractAttribute(block: string, attribute: string): string | null {
    const regex = new RegExp(`${attribute}\\s*=\\s*"([^"]*)"`, 'i');
    const match = block.match(regex);
    return match ? match[1] : null;
  }

  private extractValidationBlocks(block: string): any[] {
    const validations = [];
    const validationRegex = /validation\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
    
    let match;
    while ((match = validationRegex.exec(block)) !== null) {
      const validationBlock = match[1];
      const condition = this.extractAttribute(validationBlock, 'condition');
      const errorMessage = this.extractAttribute(validationBlock, 'error_message');
      
      if (condition && errorMessage) {
        validations.push({ condition, error_message: errorMessage });
      }
    }
    
    return validations;
  }

  private parseDefaultValue(value: string): any {
    value = value.trim();
    
    if (value === 'null') return null;
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        return JSON.parse(value.replace(/'/g, '"'));
      } catch {
        return value;
      }
    }
    if (value.startsWith('{') && value.endsWith('}')) {
      try {
        return JSON.parse(value.replace(/'/g, '"'));
      } catch {
        return value;
      }
    }
    
    const numberValue = Number(value);
    if (!isNaN(numberValue)) return numberValue;
    
    return value;
  }

  private categorizeModule(name: string): string {
    const categories = {
      'compute': ['vm', 'vmss', 'container', 'batch', 'function'],
      'network': ['vnet', 'subnet', 'nsg', 'route', 'dns', 'firewall', 'gateway', 'lb', 'pip'],
      'storage': ['storage', 'disk', 'backup', 'file'],
      'database': ['sql', 'cosmos', 'redis', 'mysql', 'postgres'],
      'security': ['keyvault', 'security', 'identity', 'rbac'],
      'monitoring': ['monitor', 'insight', 'log', 'alert'],
      'integration': ['logic', 'api', 'service-bus', 'event'],
      'web': ['app-service', 'webapp', 'static-web'],
      'ai': ['cognitive', 'machine-learning', 'ai']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => name.toLowerCase().includes(keyword))) {
        return category;
      }
    }
    
    return 'other';
  }

  private getModuleIcon(category: string): string {
    const icons = {
      compute: '🖥️',
      network: '🌐',
      storage: '💾',
      database: '🗄️',
      security: '🔒',
      monitoring: '📊',
      integration: '🔗',
      web: '🌍',
      ai: '🤖',
      other: '📦'
    };
    
    return icons[category] || '📦';
  }

  private formatModuleName(name: string): string {
    return name
      .replace(/^avm-(res|ptn|utl)-/, '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private isFeaturedModule(name: string): boolean {
    const featuredModules = [
      'avm-res-compute-virtualmachine',
      'avm-res-storage-storageaccount',
      'avm-res-network-virtualnetwork',
      'avm-res-web-site',
      'avm-res-keyvault-vault'
    ];
    
    return featuredModules.includes(name);
  }

  private generateTags(name: string, category: string): string[] {
    const tags = [category];
    
    if (name.includes('preview')) tags.push('preview');
    if (name.includes('experimental')) tags.push('experimental');
    if (this.isFeaturedModule(name)) tags.push('featured');
    
    return tags;
  }

  private determineMaturity(name: string, version: string): 'stable' | 'preview' | 'experimental' {
    if (version.includes('preview') || version.startsWith('0.')) return 'preview';
    if (name.includes('experimental')) return 'experimental';
    return 'stable';
  }

  private generateFallbackVariables(moduleName: string): TerraformVariable[] {
    // Generate basic variables when we can't fetch the actual ones
    return [
      {
        name: 'name',
        type: 'string',
        description: 'The name of the resource',
        required: true
      },
      {
        name: 'location',
        type: 'string',
        description: 'The Azure region where the resource will be deployed',
        required: true,
        default: 'East US'
      },
      {
        name: 'resource_group_name',
        type: 'string',
        description: 'The name of the resource group',
        required: true
      },
      {
        name: 'tags',
        type: 'map(string)',
        description: 'A map of tags to assign to the resource',
        required: false,
        default: {}
      }
    ];
  }

  private generateExamples(moduleName: string, variables: TerraformVariable[]): Record<string, any>[] {
    const basicExample: Record<string, any> = {};
    
    variables.forEach(variable => {
      if (variable.required) {
        switch (variable.name) {
          case 'name':
            basicExample[variable.name] = `my-${moduleName.replace('avm-res-', '').replace('-', '')}`;
            break;
          case 'location':
            basicExample[variable.name] = 'East US';
            break;
          case 'resource_group_name':
            basicExample[variable.name] = 'my-resource-group';
            break;
          default:
            basicExample[variable.name] = variable.default || this.getExampleValue(variable.type);
        }
      }
    });

    return [{ name: 'basic', values: basicExample }];
  }

  private getExampleValue(type: string): any {
    switch (type.toLowerCase()) {
      case 'string': return 'example-value';
      case 'number': return 1;
      case 'bool': return true;
      case 'list(string)': return ['example1', 'example2'];
      case 'map(string)': return { key: 'value' };
      default: return null;
    }
  }
}

export default TerraformRegistryClient;