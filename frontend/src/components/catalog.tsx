/**
 * Dynamic AVM Catalog Component
 * Displays Azure Verified Modules as interactive cards with filtering and search
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ModuleSchema, CategoryInfo, CATEGORIES, MATURITY_LEVELS } from '../types/schema';
import schemaLoader from '../services/schema-loader';

interface CatalogProps {
  onModuleSelect: (schema: ModuleSchema) => void;
  className?: string;
  featured?: boolean;
  category?: string;
  limit?: number;
}

interface CatalogState {
  schemas: ModuleSchema[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategories: string[];
  selectedMaturity: string[];
  showFeaturedOnly: boolean;
  sortBy: 'name' | 'downloads' | 'updated' | 'category';
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
}

const Catalog: React.FC<CatalogProps> = ({
  onModuleSelect,
  className = '',
  featured = false,
  category,
  limit
}) => {
  const [state, setState] = useState<CatalogState>({
    schemas: [],
    loading: true,
    error: null,
    searchQuery: '',
    selectedCategories: category ? [category] : [],
    selectedMaturity: [],
    showFeaturedOnly: featured,
    sortBy: 'downloads',
    sortOrder: 'desc',
    viewMode: 'grid'
  });

  const [categories, setCategories] = useState<Record<string, number>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load schemas on component mount and when filters change
  useEffect(() => {
    loadSchemas();
  }, [state.selectedCategories, state.selectedMaturity, state.showFeaturedOnly]);

  // Load categories data
  useEffect(() => {
    loadCategories();
  }, []);

  const loadSchemas = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const filters: any = {};
      if (state.selectedCategories.length === 1) {
        filters.category = state.selectedCategories[0];
      }
      if (state.showFeaturedOnly) {
        filters.featured = true;
      }

      const schemas = await schemaLoader.getFilteredSchemas({
        categories: state.selectedCategories.length > 1 ? state.selectedCategories : undefined,
        maturity: state.selectedMaturity.length > 0 ? state.selectedMaturity : undefined,
        featured: state.showFeaturedOnly,
        search: state.searchQuery || undefined,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        limit
      });

      setState(prev => ({ ...prev, schemas, loading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to load schemas' 
      }));
    }
  };

  const loadCategories = async () => {
    try {
      const data = await schemaLoader.getCategories();
      setCategories(data.categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  // Filtered and sorted schemas
  const filteredSchemas = useMemo(() => {
    let filtered = [...state.schemas];

    // Apply search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(schema =>
        schema.name.toLowerCase().includes(query) ||
        schema.description.toLowerCase().includes(query) ||
        schema.metadata.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [state.schemas, state.searchQuery]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
    
    // Debounced search
    const timeoutId = setTimeout(() => {
      if (query !== state.searchQuery) {
        loadSchemas();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [state.searchQuery]);

  // Handle category filter
  const toggleCategory = (categoryName: string) => {
    setState(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(categoryName)
        ? prev.selectedCategories.filter(c => c !== categoryName)
        : [...prev.selectedCategories, categoryName]
    }));
  };

  // Handle maturity filter
  const toggleMaturity = (maturity: string) => {
    setState(prev => ({
      ...prev,
      selectedMaturity: prev.selectedMaturity.includes(maturity)
        ? prev.selectedMaturity.filter(m => m !== maturity)
        : [...prev.selectedMaturity, maturity]
    }));
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    schemaLoader.clearCache();
    await loadSchemas();
    await loadCategories();
    setIsRefreshing(false);
  };

  // Render module card
  const renderModuleCard = (schema: ModuleSchema) => {
    const categoryInfo = CATEGORIES[schema.category] || CATEGORIES.other;
    const maturityInfo = MATURITY_LEVELS[schema.metadata.maturity];

    return (
      <div
        key={schema.moduleId}
        onClick={() => onModuleSelect(schema)}
        className={`
          relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
          transform hover:scale-105 hover:shadow-lg
          ${categoryInfo.color === 'blue' ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300' : ''}
          ${categoryInfo.color === 'green' ? 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300' : ''}
          ${categoryInfo.color === 'yellow' ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300' : ''}
          ${categoryInfo.color === 'purple' ? 'bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300' : ''}
          ${categoryInfo.color === 'red' ? 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300' : ''}
          ${categoryInfo.color === 'indigo' ? 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300' : ''}
          ${categoryInfo.color === 'pink' ? 'bg-pink-50 border-pink-200 hover:bg-pink-100 hover:border-pink-300' : ''}
          ${categoryInfo.color === 'teal' ? 'bg-teal-50 border-teal-200 hover:bg-teal-100 hover:border-teal-300' : ''}
          ${categoryInfo.color === 'orange' ? 'bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300' : ''}
          ${categoryInfo.color === 'gray' ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300' : ''}
        `}
      >
        {/* Featured badge */}
        {schema.featured && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold">
            ⭐ Featured
          </div>
        )}

        {/* Maturity badge */}
        <div className={`
          absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium
          ${maturityInfo.color === 'green' ? 'bg-green-100 text-green-800' : ''}
          ${maturityInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' : ''}
          ${maturityInfo.color === 'red' ? 'bg-red-100 text-red-800' : ''}
        `}>
          {maturityInfo.icon} {maturityInfo.label}
        </div>

        {/* Module content */}
        <div className="mt-8">
          <div className="flex items-start space-x-4 mb-4">
            <div className="text-4xl">{schema.icon}</div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {schema.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {schema.description}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="inline-block px-2 py-1 bg-white rounded-full font-medium">
              {categoryInfo.displayName}
            </span>
            <div className="flex items-center space-x-2">
              <span>📥 {schema.downloads.toLocaleString()}</span>
              <span>v{schema.version}</span>
            </div>
          </div>

          {/* Tags */}
          {schema.metadata.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {schema.metadata.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-white text-gray-600 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
              {schema.metadata.tags.length > 3 && (
                <span className="px-2 py-1 bg-white text-gray-400 rounded text-xs">
                  +{schema.metadata.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render list item
  const renderModuleListItem = (schema: ModuleSchema) => {
    const categoryInfo = CATEGORIES[schema.category] || CATEGORIES.other;
    const maturityInfo = MATURITY_LEVELS[schema.metadata.maturity];

    return (
      <div
        key={schema.moduleId}
        onClick={() => onModuleSelect(schema)}
        className="flex items-center p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        <div className="text-3xl mr-4">{schema.icon}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {schema.name}
            </h3>
            {schema.featured && (
              <span className="text-yellow-500 text-sm">⭐</span>
            )}
            <span className={`
              px-2 py-1 rounded text-xs font-medium
              ${maturityInfo.color === 'green' ? 'bg-green-100 text-green-800' : ''}
              ${maturityInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' : ''}
              ${maturityInfo.color === 'red' ? 'bg-red-100 text-red-800' : ''}
            `}>
              {maturityInfo.label}
            </span>
          </div>
          <p className="text-gray-600 text-sm line-clamp-1 mb-2">
            {schema.description}
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>{categoryInfo.displayName}</span>
            <span>📥 {schema.downloads.toLocaleString()}</span>
            <span>v{schema.version}</span>
            <span>Updated {new Date(schema.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="ml-4">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    );
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Azure Verified Modules...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold">Failed to Load Modules</h3>
        </div>
        <p className="text-red-700 mb-4">{state.error}</p>
        <button
          onClick={loadSchemas}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with search and filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="flex-1 lg:max-w-lg">
            <div className="relative">
              <input
                type="text"
                placeholder="Search modules..."
                value={state.searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* View mode toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setState(prev => ({ ...prev, viewMode: 'grid' }))}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  state.viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, viewMode: 'list' }))}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  state.viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                List
              </button>
            </div>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 space-y-4">
          {/* Category filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Categories</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORIES).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => toggleCategory(key)}
                  className={`
                    px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${state.selectedCategories.includes(key)
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {category.icon} {category.displayName}
                  {categories[key] ? ` (${categories[key]})` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Maturity filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Maturity</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(MATURITY_LEVELS).map(([key, maturity]) => (
                <button
                  key={key}
                  onClick={() => toggleMaturity(key)}
                  className={`
                    px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${state.selectedMaturity.includes(key)
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {maturity.icon} {maturity.label}
                </button>
              ))}
            </div>
          </div>

          {/* Featured toggle */}
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={state.showFeaturedOnly}
                onChange={(e) => setState(prev => ({ ...prev, showFeaturedOnly: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Show featured only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            {filteredSchemas.length} module{filteredSchemas.length !== 1 ? 's' : ''} found
          </p>
          
          {/* Sort options */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={`${state.sortBy}-${state.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                setState(prev => ({ 
                  ...prev, 
                  sortBy: sortBy as any, 
                  sortOrder: sortOrder as any 
                }));
              }}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="downloads-desc">Most Popular</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="updated-desc">Recently Updated</option>
              <option value="category-asc">Category</option>
            </select>
          </div>
        </div>

        {/* Module grid/list */}
        {filteredSchemas.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No modules found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : state.viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemas.map(renderModuleCard)}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSchemas.map(renderModuleListItem)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalog;