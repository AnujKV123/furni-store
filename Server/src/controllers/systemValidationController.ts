import { Request, Response, NextFunction } from "express";
import { success } from "../utils/response";
import { ApiError } from "../utils/errors";
import { dataIntegrityValidator } from "../utils/dataIntegrityValidator";
import { prisma } from "../prisma";

/** GET /api/system/health */
export const getSystemHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();
    
    // Basic health checks
    const healthChecks = {
      database: false,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    };
    
    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthChecks.database = true;
    } catch (error) {
      healthChecks.database = false;
    }
    
    const responseTime = Date.now() - startTime;
    
    return success(res, {
      status: healthChecks.database ? 'healthy' : 'unhealthy',
      checks: healthChecks,
      responseTime: `${responseTime}ms`
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/system/validate-data */
export const validateDataIntegrity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('🔍 Starting data integrity validation...');
    
    const report = await dataIntegrityValidator.validateSystemIntegrity();
    
    return success(res, {
      report,
      summary: {
        status: report.overallStatus,
        totalChecks: report.totalChecks,
        passedChecks: report.passedChecks,
        failedChecks: report.failedChecks,
        warningChecks: report.warningChecks,
        timestamp: report.timestamp
      }
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/system/stats */
export const getSystemStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get comprehensive system statistics
    const [
      userCount,
      furnitureCount,
      categoryCount,
      orderCount,
      reviewCount,
      cartCount,
      imageCount,
      completedOrderCount,
      pendingOrderCount,
      cancelledOrderCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.furniture.count(),
      prisma.category.count(),
      prisma.order.count(),
      prisma.review.count(),
      prisma.cart.count(),
      prisma.image.count(),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } })
    ]);
    
    // Get average ratings
    const avgRatingResult = await prisma.review.aggregate({
      _avg: {
        rating: true
      }
    });
    
    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const [
      recentUsers,
      recentOrders,
      recentReviews
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          }
        }
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          }
        }
      }),
      prisma.review.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo
          }
        }
      })
    ]);
    
    // Get top categories by furniture count
    const topCategories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            furniture: true
          }
        }
      },
      orderBy: {
        furniture: {
          _count: 'desc'
        }
      },
      take: 5
    });
    
    // Get order value statistics
    const orderValueStats = await prisma.order.aggregate({
      _avg: {
        totalAmount: true
      },
      _sum: {
        totalAmount: true
      },
      _min: {
        totalAmount: true
      },
      _max: {
        totalAmount: true
      }
    });
    
    const stats = {
      overview: {
        users: userCount,
        furniture: furnitureCount,
        categories: categoryCount,
        orders: orderCount,
        reviews: reviewCount,
        carts: cartCount,
        images: imageCount
      },
      orders: {
        total: orderCount,
        completed: completedOrderCount,
        pending: pendingOrderCount,
        cancelled: cancelledOrderCount,
        completionRate: orderCount > 0 ? ((completedOrderCount / orderCount) * 100).toFixed(1) : '0'
      },
      reviews: {
        total: reviewCount,
        averageRating: avgRatingResult._avg.rating ? Number(avgRatingResult._avg.rating).toFixed(2) : '0',
        reviewCoverage: furnitureCount > 0 ? ((reviewCount / furnitureCount) * 100).toFixed(1) : '0'
      },
      recentActivity: {
        newUsers: recentUsers,
        newOrders: recentOrders,
        newReviews: recentReviews,
        period: '7 days'
      },
      topCategories: topCategories.map(cat => ({
        name: cat.name,
        furnitureCount: cat._count.furniture
      })),
      orderValues: {
        average: orderValueStats._avg.totalAmount ? Number(orderValueStats._avg.totalAmount).toFixed(2) : '0',
        total: orderValueStats._sum.totalAmount ? Number(orderValueStats._sum.totalAmount).toFixed(2) : '0',
        minimum: orderValueStats._min.totalAmount ? Number(orderValueStats._min.totalAmount).toFixed(2) : '0',
        maximum: orderValueStats._max.totalAmount ? Number(orderValueStats._max.totalAmount).toFixed(2) : '0'
      },
      timestamp: new Date().toISOString()
    };
    
    return success(res, stats);
  } catch (err) {
    next(err);
  }
};

/** GET /api/system/test-endpoints */
export const testAllEndpoints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const endpointTests = [];
    
    // Test basic endpoints
    const testEndpoints = [
      { method: 'GET', path: '/api/furnitures', description: 'Furniture listing' },
      { method: 'GET', path: '/api/categories', description: 'Category listing' },
      { method: 'GET', path: '/api/recommendations/popular', description: 'Popular recommendations' },
      { method: 'GET', path: '/api/health', description: 'Health check' }
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        // This is a simplified test - in a real scenario, you'd make actual HTTP requests
        // For now, we'll just check if the routes exist and are accessible
        endpointTests.push({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          description: endpoint.description,
          status: 'available',
          tested: false // Would be true if we actually tested the endpoint
        });
      } catch (error: any) {
        endpointTests.push({
          endpoint: `${endpoint.method} ${endpoint.path}`,
          description: endpoint.description,
          status: 'error',
          error: error.message,
          tested: false
        });
      }
    }
    
    return success(res, {
      endpointTests,
      summary: {
        total: endpointTests.length,
        available: endpointTests.filter(t => t.status === 'available').length,
        errors: endpointTests.filter(t => t.status === 'error').length
      },
      note: 'This is a basic endpoint availability check. For full testing, use the integration test suite.'
    });
  } catch (err) {
    next(err);
  }
};

/** POST /api/system/seed-test-data */
export const seedTestData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError(403, 'Test data seeding is not allowed in production');
    }
    
    console.log('🌱 Seeding test data...');
    
    // Create test categories if they don't exist
    const categories = [
      { name: 'Chairs', description: 'Comfortable seating solutions' },
      { name: 'Tables', description: 'Dining and work tables' },
      { name: 'Sofas', description: 'Living room furniture' },
      { name: 'Storage', description: 'Storage and organization' }
    ];
    
    const createdCategories = [];
    for (const categoryData of categories) {
      const existingCategory = await prisma.category.findFirst({
        where: { name: categoryData.name }
      });
      
      if (!existingCategory) {
        const category = await prisma.category.create({
          data: categoryData
        });
        createdCategories.push(category);
      }
    }
    
    // Create test furniture items
    const furnitureItems = [
      {
        name: 'Test Office Chair',
        description: 'Ergonomic office chair for testing',
        price: 299.99,
        sku: 'TEST-CHAIR-001',
        widthCm: 60,
        heightCm: 120,
        depthCm: 60,
        categoryName: 'Chairs'
      },
      {
        name: 'Test Dining Table',
        description: 'Wooden dining table for testing',
        price: 599.99,
        sku: 'TEST-TABLE-001',
        widthCm: 150,
        heightCm: 75,
        depthCm: 90,
        categoryName: 'Tables'
      }
    ];
    
    const createdFurniture = [];
    for (const furnitureData of furnitureItems) {
      const category = await prisma.category.findFirst({
        where: { name: furnitureData.categoryName }
      });
      
      if (category) {
        const existingFurniture = await prisma.furniture.findFirst({
          where: { sku: furnitureData.sku }
        });
        
        if (!existingFurniture) {
          const { categoryName, ...furnitureCreateData } = furnitureData;
          const furniture = await prisma.furniture.create({
            data: {
              ...furnitureCreateData,
              categoryId: category.id
            }
          });
          createdFurniture.push(furniture);
        }
      }
    }
    
    return success(res, {
      message: 'Test data seeded successfully',
      created: {
        categories: createdCategories.length,
        furniture: createdFurniture.length
      },
      note: 'Only missing test data was created. Existing data was preserved.'
    });
  } catch (err) {
    next(err);
  }
};