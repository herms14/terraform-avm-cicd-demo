/**
 * Schemas API
 * RESTful endpoints for managing AVM module schemas
 */

import express from 'express';
import TerraformRegistryClient from '../schema-sync/terraform-registry-client';
import SchemaManager from '../schema-sync/schema-manager';

const router = express.Router();
const registryClient = new TerraformRegistryClient();
const schemaManager = new SchemaManager();

// Middleware for error handling
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware for admin authentication (implement based on your auth system)
const requireAdmin = (req: any, res: any, next: any) => {
  // TODO: Implement proper admin check
  // For now, allowing all authenticated users
  next();
};

/**
 * GET /api/schemas
 * Retrieve all schemas with optional filtering
 */
router.get('/', asyncHandler(async (req: any, res: any) => {
  const { category, featured, maturity, search } = req.query;
  
  try {
    let schemas;
    
    if (search) {
      schemas = await schemaManager.searchSchemas(search);
    } else {
      const filters: any = {};
      if (category) filters.category = category;
      if (featured !== undefined) filters.featured = featured === 'true';
      if (maturity) filters.maturity = maturity;
      
      schemas = await schemaManager.getAllSchemas(filters);
    }

    res.json({
      success: true,
      data: schemas,
      meta: {
        total: schemas.length,
        filters: { category, featured, maturity, search }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve schemas',
      message: error.message
    });
  }
}));

/**
 * GET /api/schemas/categories
 * Get available categories and counts
 */
router.get('/categories', asyncHandler(async (req: any, res: any) => {
  try {
    const index = await schemaManager.getIndex();
    
    res.json({
      success: true,
      data: {
        categories: index.categories,
        totalModules: index.totalModules,
        featured: index.featured
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve categories',
      message: error.message
    });
  }
}));

/**
 * GET /api/schemas/featured
 * Get featured schemas
 */
router.get('/featured', asyncHandler(async (req: any, res: any) => {
  try {
    const schemas = await schemaManager.getFeaturedSchemas();
    
    res.json({
      success: true,
      data: schemas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve featured schemas',
      message: error.message
    });
  }
}));

/**
 * GET /api/schemas/:moduleId
 * Get specific schema by module ID
 */
router.get('/:moduleId', asyncHandler(async (req: any, res: any) => {
  try {
    const { moduleId } = req.params;
    const schema = await schemaManager.getSchema(moduleId);
    
    if (!schema) {
      return res.status(404).json({
        success: false,
        error: 'Schema not found',
        message: `Module ${moduleId} not found`
      });
    }

    res.json({
      success: true,
      data: schema
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve schema',
      message: error.message
    });
  }
}));

/**
 * POST /api/schemas/sync
 * Trigger full schema sync from Terraform Registry
 */
router.post('/sync', requireAdmin, asyncHandler(async (req: any, res: any) => {
  try {
    console.log('Starting manual schema sync...');
    
    // Start sync in background
    const syncPromise = registryClient.syncAllModules();
    
    // Return immediately with sync started response
    res.json({
      success: true,
      message: 'Schema sync started',
      data: {
        syncId: Date.now().toString(),
        startedAt: new Date().toISOString()
      }
    });

    // Continue sync in background
    try {
      const schemas = await syncPromise;
      await schemaManager.storeSchemas(schemas);
      console.log(`✅ Background sync completed: ${schemas.length} schemas updated`);
    } catch (syncError) {
      console.error('❌ Background sync failed:', syncError);
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start sync',
      message: error.message
    });
  }
}));

/**
 * POST /api/schemas/sync/:moduleId
 * Sync specific module
 */
router.post('/sync/:moduleId', requireAdmin, asyncHandler(async (req: any, res: any) => {
  try {
    const { moduleId } = req.params;
    
    // Parse module ID to get namespace, name, provider
    const parts = moduleId.split('-');
    if (parts.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid module ID format'
      });
    }

    // This is a simplified approach - in production you'd need better parsing
    const namespace = parts[0];
    const provider = parts[parts.length - 1];
    const name = parts.slice(1, -1).join('-');

    // Fetch modules and find the specific one
    const modules = await registryClient.fetchAzureModules();
    const targetModule = modules.find(m => 
      m.namespace === namespace && 
      m.name === name && 
      m.provider === provider
    );

    if (!targetModule) {
      return res.status(404).json({
        success: false,
        error: 'Module not found in registry'
      });
    }

    const schema = await registryClient.generateModuleSchema(targetModule);
    await schemaManager.storeSchema(schema);

    res.json({
      success: true,
      message: `Module ${moduleId} synced successfully`,
      data: schema
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to sync module',
      message: error.message
    });
  }
}));

/**
 * GET /api/schemas/stats
 * Get cache statistics
 */
router.get('/stats', asyncHandler(async (req: any, res: any) => {
  try {
    const stats = await schemaManager.getCacheStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve stats',
      message: error.message
    });
  }
}));

/**
 * POST /api/schemas/cleanup
 * Clean up old or invalid schemas
 */
router.post('/cleanup', requireAdmin, asyncHandler(async (req: any, res: any) => {
  try {
    const { olderThanDays, removeInvalid } = req.body;
    
    const result = await schemaManager.cleanup({
      olderThanDays: olderThanDays ? parseInt(olderThanDays) : undefined,
      removeInvalid: removeInvalid === true
    });

    res.json({
      success: true,
      message: 'Cleanup completed',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Cleanup failed',
      message: error.message
    });
  }
}));

/**
 * GET /api/schemas/export
 * Export all schemas for backup
 */
router.get('/export', requireAdmin, asyncHandler(async (req: any, res: any) => {
  try {
    const backup = await schemaManager.exportSchemas();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="avm-schemas-${Date.now()}.json"`);
    res.json(backup);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Export failed',
      message: error.message
    });
  }
}));

/**
 * POST /api/schemas/import
 * Import schemas from backup
 */
router.post('/import', requireAdmin, asyncHandler(async (req: any, res: any) => {
  try {
    const backup = req.body;
    
    if (!backup.schemas || !Array.isArray(backup.schemas)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backup format'
      });
    }

    await schemaManager.importSchemas(backup);

    res.json({
      success: true,
      message: `Imported ${backup.schemas.length} schemas`,
      data: {
        imported: backup.schemas.length,
        timestamp: backup.timestamp
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message
    });
  }
}));

// Error handler middleware
router.use((error: any, req: any, res: any, next: any) => {
  console.error('Schema API Error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

export default router;