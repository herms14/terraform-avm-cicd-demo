/**
 * Schema Manager
 * Handles storing, retrieving, and managing AVM module schemas
 */

import * as fs from 'fs';
import * as path from 'path';
import { ModuleSchema } from './terraform-registry-client';

export interface SchemaIndex {
  lastUpdated: string;
  totalModules: number;
  categories: Record<string, number>;
  featured: string[];
  modules: {
    [moduleId: string]: {
      name: string;
      category: string;
      version: string;
      lastUpdated: string;
      featured: boolean;
      downloads: number;
    };
  };
}

export class SchemaManager {
  private readonly schemasDir: string;
  private readonly indexPath: string;

  constructor(baseDir: string = './schemas') {
    this.schemasDir = path.resolve(baseDir);
    this.indexPath = path.join(this.schemasDir, 'index.json');
    this.ensureDirectoryExists();
  }

  /**
   * Store module schema to filesystem
   */
  async storeSchema(schema: ModuleSchema): Promise<void> {
    try {
      const filename = `${schema.moduleId}.json`;
      const filepath = path.join(this.schemasDir, filename);
      
      // Add timestamp
      const enrichedSchema = {
        ...schema,
        _metadata: {
          ...schema.metadata,
          storedAt: new Date().toISOString(),
          schemaVersion: '1.0'
        }
      };

      await fs.promises.writeFile(
        filepath, 
        JSON.stringify(enrichedSchema, null, 2), 
        'utf-8'
      );

      console.log(`✅ Stored schema: ${schema.name} (${schema.moduleId})`);
    } catch (error) {
      console.error(`❌ Failed to store schema ${schema.moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Store multiple schemas in batch
   */
  async storeSchemas(schemas: ModuleSchema[]): Promise<void> {
    console.log(`Storing ${schemas.length} schemas...`);
    
    const results = await Promise.allSettled(
      schemas.map(schema => this.storeSchema(schema))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ Successfully stored: ${successful} schemas`);
    if (failed > 0) {
      console.warn(`⚠️ Failed to store: ${failed} schemas`);
    }

    // Update index after storing schemas
    await this.updateIndex(schemas);
  }

  /**
   * Retrieve schema by module ID
   */
  async getSchema(moduleId: string): Promise<ModuleSchema | null> {
    try {
      const filename = `${moduleId}.json`;
      const filepath = path.join(this.schemasDir, filename);
      
      if (!fs.existsSync(filepath)) {
        return null;
      }

      const content = await fs.promises.readFile(filepath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Failed to retrieve schema ${moduleId}:`, error);
      return null;
    }
  }

  /**
   * Get all schemas with optional filtering
   */
  async getAllSchemas(filters?: {
    category?: string;
    featured?: boolean;
    maturity?: string;
  }): Promise<ModuleSchema[]> {
    try {
      const files = await fs.promises.readdir(this.schemasDir);
      const schemaFiles = files.filter(file => 
        file.endsWith('.json') && file !== 'index.json'
      );

      const schemas: ModuleSchema[] = [];
      
      for (const file of schemaFiles) {
        try {
          const content = await fs.promises.readFile(
            path.join(this.schemasDir, file), 
            'utf-8'
          );
          const schema = JSON.parse(content);
          
          // Apply filters
          if (filters) {
            if (filters.category && schema.category !== filters.category) continue;
            if (filters.featured !== undefined && schema.featured !== filters.featured) continue;
            if (filters.maturity && schema.metadata?.maturity !== filters.maturity) continue;
          }
          
          schemas.push(schema);
        } catch (error) {
          console.warn(`Failed to parse schema file ${file}:`, error);
        }
      }

      // Sort by downloads (popularity) and name
      return schemas.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return b.downloads - a.downloads || a.name.localeCompare(b.name);
      });

    } catch (error) {
      console.error('Failed to retrieve schemas:', error);
      return [];
    }
  }

  /**
   * Get schema index for quick lookups
   */
  async getIndex(): Promise<SchemaIndex> {
    try {
      if (fs.existsSync(this.indexPath)) {
        const content = await fs.promises.readFile(this.indexPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn('Failed to read index, regenerating:', error);
    }

    // Generate fresh index if not found
    return this.regenerateIndex();
  }

  /**
   * Update the schema index
   */
  async updateIndex(schemas: ModuleSchema[]): Promise<void> {
    try {
      const categories: Record<string, number> = {};
      const featured: string[] = [];
      const modules: SchemaIndex['modules'] = {};

      schemas.forEach(schema => {
        // Count categories
        categories[schema.category] = (categories[schema.category] || 0) + 1;
        
        // Collect featured modules
        if (schema.featured) {
          featured.push(schema.moduleId);
        }
        
        // Add to modules index
        modules[schema.moduleId] = {
          name: schema.name,
          category: schema.category,
          version: schema.version,
          lastUpdated: schema.lastUpdated,
          featured: schema.featured,
          downloads: schema.downloads
        };
      });

      const index: SchemaIndex = {
        lastUpdated: new Date().toISOString(),
        totalModules: schemas.length,
        categories,
        featured,
        modules
      };

      await fs.promises.writeFile(
        this.indexPath,
        JSON.stringify(index, null, 2),
        'utf-8'
      );

      console.log(`✅ Updated index with ${schemas.length} modules`);
    } catch (error) {
      console.error('Failed to update index:', error);
      throw error;
    }
  }

  /**
   * Regenerate index from existing schema files
   */
  async regenerateIndex(): Promise<SchemaIndex> {
    console.log('Regenerating schema index...');
    const allSchemas = await this.getAllSchemas();
    await this.updateIndex(allSchemas);
    return this.getIndex();
  }

  /**
   * Get schemas by category
   */
  async getSchemasByCategory(category: string): Promise<ModuleSchema[]> {
    return this.getAllSchemas({ category });
  }

  /**
   * Get featured schemas
   */
  async getFeaturedSchemas(): Promise<ModuleSchema[]> {
    return this.getAllSchemas({ featured: true });
  }

  /**
   * Search schemas by name or description
   */
  async searchSchemas(query: string): Promise<ModuleSchema[]> {
    const allSchemas = await this.getAllSchemas();
    const searchTerm = query.toLowerCase();
    
    return allSchemas.filter(schema => 
      schema.name.toLowerCase().includes(searchTerm) ||
      schema.description.toLowerCase().includes(searchTerm) ||
      schema.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalSchemas: number;
    categories: Record<string, number>;
    lastUpdated: string;
    diskUsage: number;
  }> {
    const index = await this.getIndex();
    const stats = await fs.promises.stat(this.schemasDir);
    
    // Calculate disk usage
    const files = await fs.promises.readdir(this.schemasDir);
    let totalSize = 0;
    
    for (const file of files) {
      const filePath = path.join(this.schemasDir, file);
      const stat = await fs.promises.stat(filePath);
      totalSize += stat.size;
    }

    return {
      totalSchemas: index.totalModules,
      categories: index.categories,
      lastUpdated: index.lastUpdated,
      diskUsage: totalSize
    };
  }

  /**
   * Clean up old or invalid schemas
   */
  async cleanup(options?: {
    olderThanDays?: number;
    removeInvalid?: boolean;
  }): Promise<{ removed: number; errors: string[] }> {
    console.log('Starting schema cleanup...');
    
    const files = await fs.promises.readdir(this.schemasDir);
    const schemaFiles = files.filter(file => 
      file.endsWith('.json') && file !== 'index.json'
    );

    let removed = 0;
    const errors: string[] = [];
    const cutoffDate = options?.olderThanDays 
      ? new Date(Date.now() - options.olderThanDays * 24 * 60 * 60 * 1000)
      : null;

    for (const file of schemaFiles) {
      try {
        const filePath = path.join(this.schemasDir, file);
        const content = await fs.promises.readFile(filePath, 'utf-8');
        
        // Check if file is parseable
        if (options?.removeInvalid) {
          try {
            JSON.parse(content);
          } catch {
            await fs.promises.unlink(filePath);
            removed++;
            console.log(`🗑️ Removed invalid schema: ${file}`);
            continue;
          }
        }

        // Check age
        if (cutoffDate) {
          const stats = await fs.promises.stat(filePath);
          if (stats.mtime < cutoffDate) {
            await fs.promises.unlink(filePath);
            removed++;
            console.log(`🗑️ Removed old schema: ${file}`);
          }
        }

      } catch (error) {
        errors.push(`Failed to process ${file}: ${error.message}`);
      }
    }

    if (removed > 0) {
      await this.regenerateIndex();
    }

    console.log(`✅ Cleanup complete: ${removed} schemas removed`);
    return { removed, errors };
  }

  /**
   * Export schemas to JSON for backup or migration
   */
  async exportSchemas(): Promise<{
    timestamp: string;
    version: string;
    schemas: ModuleSchema[];
  }> {
    const schemas = await this.getAllSchemas();
    
    return {
      timestamp: new Date().toISOString(),
      version: '1.0',
      schemas
    };
  }

  /**
   * Import schemas from backup
   */
  async importSchemas(backup: {
    timestamp: string;
    version: string;
    schemas: ModuleSchema[];
  }): Promise<void> {
    console.log(`Importing ${backup.schemas.length} schemas from backup...`);
    await this.storeSchemas(backup.schemas);
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.schemasDir)) {
      fs.mkdirSync(this.schemasDir, { recursive: true });
      console.log(`📁 Created schemas directory: ${this.schemasDir}`);
    }
  }
}

export default SchemaManager;