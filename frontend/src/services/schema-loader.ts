/**
 * Schema Loader Service
 * Frontend service for fetching and caching AVM module schemas
 */

import { ModuleSchema } from '../types/schema';

export interface SchemaFilters {
  category?: string;
  featured?: boolean;
  maturity?: string;
  search?: string;
}

export interface SchemaResponse {
  success: boolean;
  data: ModuleSchema[];
  meta?: {
    total: number;
    filters?: SchemaFilters;
  };
  error?: string;
  message?: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: {
    categories: Record<string, number>;
    totalModules: number;
    featured: string[];
  };
}

export interface StatsResponse {
  success: boolean;
  data: {
    totalSchemas: number;
    categories: Record<string, number>;
    lastUpdated: string;
    diskUsage: number;
  };
}

class SchemaLoaderService {
  private readonly baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(baseUrl: string = '/api/schemas') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all schemas with optional filtering
   */
  async getSchemas(filters: SchemaFilters = {}): Promise<ModuleSchema[]> {
    const cacheKey = `schemas-${JSON.stringify(filters)}`;
    
    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const queryParams = new URLSearchParams();
      
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.featured !== undefined) queryParams.append('featured', filters.featured.toString());
      if (filters.maturity) queryParams.append('maturity', filters.maturity);
      if (filters.search) queryParams.append('search', filters.search);

      const url = `${this.baseUrl}?${queryParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: SchemaResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch schemas');
      }

      // Cache the result
      this.setCachedData(cacheKey, result.data);
      
      return result.data;
    } catch (error) {
      console.error('Failed to fetch schemas:', error);
      throw error;
    }
  }

  /**
   * Get schema by module ID
   */
  async getSchema(moduleId: string): Promise<ModuleSchema> {
    const cacheKey = `schema-${moduleId}`;
    
    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/${moduleId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Schema not found: ${moduleId}`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch schema');
      }

      // Cache the result
      this.setCachedData(cacheKey, result.data);
      
      return result.data;
    } catch (error) {
      console.error(`Failed to fetch schema ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Get featured schemas
   */
  async getFeaturedSchemas(): Promise<ModuleSchema[]> {
    return this.getSchemas({ featured: true });
  }

  /**
   * Get schemas by category
   */
  async getSchemasByCategory(category: string): Promise<ModuleSchema[]> {
    return this.getSchemas({ category });
  }

  /**
   * Search schemas
   */
  async searchSchemas(query: string): Promise<ModuleSchema[]> {
    return this.getSchemas({ search: query });
  }

  /**
   * Get available categories and counts
   */
  async getCategories(): Promise<CategoriesResponse['data']> {
    const cacheKey = 'categories';
    
    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${this.baseUrl}/categories`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: CategoriesResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch categories');
      }

      // Cache the result
      this.setCachedData(cacheKey, result.data);
      
      return result.data;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<StatsResponse['data']> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: StatsResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stats');
      }

      return result.data;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      throw error;
    }
  }

  /**
   * Trigger schema sync (admin only)
   */
  async triggerSync(): Promise<{ syncId: string; startedAt: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to trigger sync');
      }

      // Clear cache after sync
      this.clearCache();
      
      return result.data;
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      throw error;
    }
  }

  /**
   * Sync specific module (admin only)
   */
  async syncModule(moduleId: string): Promise<ModuleSchema> {
    try {
      const response = await fetch(`${this.baseUrl}/sync/${moduleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to sync module');
      }

      // Clear relevant cache
      this.clearCache();
      
      return result.data;
    } catch (error) {
      console.error(`Failed to sync module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Get filtered and sorted schemas with advanced options
   */
  async getFilteredSchemas(options: {
    categories?: string[];
    maturity?: string[];
    featured?: boolean;
    search?: string;
    sortBy?: 'name' | 'downloads' | 'updated' | 'category';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
  } = {}): Promise<ModuleSchema[]> {
    let schemas = await this.getSchemas();

    // Apply filters
    if (options.categories && options.categories.length > 0) {
      schemas = schemas.filter(schema => options.categories!.includes(schema.category));
    }

    if (options.maturity && options.maturity.length > 0) {
      schemas = schemas.filter(schema => 
        options.maturity!.includes(schema.metadata.maturity)
      );
    }

    if (options.featured !== undefined) {
      schemas = schemas.filter(schema => schema.featured === options.featured);
    }

    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      schemas = schemas.filter(schema =>
        schema.name.toLowerCase().includes(searchTerm) ||
        schema.description.toLowerCase().includes(searchTerm) ||
        schema.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    if (options.sortBy) {
      schemas.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (options.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'downloads':
            aValue = a.downloads;
            bValue = b.downloads;
            break;
          case 'updated':
            aValue = new Date(a.lastUpdated);
            bValue = new Date(b.lastUpdated);
            break;
          case 'category':
            aValue = a.category.toLowerCase();
            bValue = b.category.toLowerCase();
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'string') {
          return options.sortOrder === 'desc' 
            ? bValue.localeCompare(aValue)
            : aValue.localeCompare(bValue);
        }

        return options.sortOrder === 'desc' 
          ? bValue - aValue 
          : aValue - bValue;
      });
    }

    // Apply limit
    if (options.limit && options.limit > 0) {
      schemas = schemas.slice(0, options.limit);
    }

    return schemas;
  }

  /**
   * Get schema suggestions based on query
   */
  async getSuggestions(query: string, limit: number = 5): Promise<{
    name: string;
    moduleId: string;
    category: string;
    description: string;
  }[]> {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const schemas = await this.searchSchemas(query);
      
      return schemas.slice(0, limit).map(schema => ({
        name: schema.name,
        moduleId: schema.moduleId,
        category: schema.category,
        description: schema.description
      }));
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }

  /**
   * Prefetch schemas for better performance
   */
  async prefetchData(): Promise<void> {
    try {
      // Prefetch commonly used data
      await Promise.all([
        this.getCategories(),
        this.getFeaturedSchemas(),
        this.getSchemas() // All schemas
      ]);
    } catch (error) {
      console.warn('Failed to prefetch data:', error);
    }
  }

  // Cache management
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.cacheTimeout;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for specific key pattern
   */
  clearCachePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
const schemaLoader = new SchemaLoaderService();

export default schemaLoader;