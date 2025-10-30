import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";
import { success } from "../utils/response";
import { ApiError, ValidationError } from "../utils/errors";
import { z } from "zod";

// Helper function to convert Zod errors to ValidationError format
const convertZodErrors = (zodErrors: z.ZodIssue[]): ValidationError[] => {
  return zodErrors.map(error => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code
  }));
};

// Validation schemas
const userIdSchema = z.object({
  userId: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num)) throw new Error("Invalid ID");
    return num;
  })
});

const categoryIdSchema = z.object({
  categoryId: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num)) throw new Error("Invalid ID");
    return num;
  })
});

const recommendationQuerySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  excludeId: z.string().optional().transform(val => val ? parseInt(val) : undefined)
});

/** GET /api/recommendations/user/:userId */
export const getUserRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = userIdSchema.parse(req.params);
    const { limit, excludeId } = recommendationQuerySchema.parse(req.query);

    // Validate limit
    if (limit < 1 || limit > 50) throw new ApiError(400, "Limit must be between 1 and 50");

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) throw new ApiError(404, "User not found");

    // Get user's purchase history
    const userOrders = await prisma.orderItem.findMany({
      where: {
        order: {
          userId: userId,
          status: 'COMPLETED'
        }
      },
      include: {
        furniture: {
          select: {
            categoryId: true
          }
        }
      }
    });

    let recommendations: any[] = [];

    if (userOrders.length > 0) {
      // User has purchase history - use collaborative filtering
      recommendations = await getCollaborativeRecommendations(userId, limit, excludeId);
      
      // If not enough recommendations, supplement with category-based
      if (recommendations.length < limit) {
        const categoryRecommendations = await getCategoryBasedRecommendations(
          userOrders, 
          limit - recommendations.length, 
          excludeId,
          recommendations.map(r => r.id)
        );
        recommendations = [...recommendations, ...categoryRecommendations];
      }
    }

    // If still not enough recommendations, add popular items
    if (recommendations.length < limit) {
      const popularRecommendations = await getPopularRecommendationsHelper(
        limit - recommendations.length,
        excludeId,
        recommendations.map(r => r.id)
      );
      recommendations = [...recommendations, ...popularRecommendations];
    }

    return success(res, {
      recommendations: recommendations.slice(0, limit),
      algorithm: userOrders.length > 0 ? 'hybrid' : 'popular'
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(400, "Invalid request parameters", convertZodErrors(err.errors)));
    }
    next(err);
  }
};

/** GET /api/recommendations/popular */
export const getPopularItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit, excludeId } = recommendationQuerySchema.parse(req.query);

    // Validate limit
    if (limit < 1 || limit > 50) throw new ApiError(400, "Limit must be between 1 and 50");

    const recommendations = await getPopularRecommendationsHelper(limit, excludeId);

    return success(res, {
      recommendations,
      algorithm: 'popular'
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(400, "Invalid request parameters", convertZodErrors(err.errors)));
    }
    next(err);
  }
};

/** GET /api/recommendations/category/:categoryId */
export const getCategoryRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId } = categoryIdSchema.parse(req.params);
    const { limit, excludeId } = recommendationQuerySchema.parse(req.query);

    // Validate limit
    if (limit < 1 || limit > 50) throw new ApiError(400, "Limit must be between 1 and 50");

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    if (!category) throw new ApiError(404, "Category not found");

    const where: any = { categoryId };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const recommendations = await prisma.furniture.findMany({
      where,
      include: {
        images: true,
        reviews: {
          select: {
            rating: true
          }
        },
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        {
          reviews: {
            _count: 'desc'
          }
        },
        {
          createdAt: 'desc'
        }
      ],
      take: limit
    });

    // Add average ratings
    const recommendationsWithRatings = recommendations.map(item => ({
      ...item,
      averageRating: item.reviews.length > 0 
        ? item.reviews.reduce((sum, review) => sum + review.rating, 0) / item.reviews.length 
        : null,
      reviewCount: item.reviews.length,
      reviews: undefined
    }));

    return success(res, {
      recommendations: recommendationsWithRatings,
      algorithm: 'category-based'
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(400, "Invalid request parameters", convertZodErrors(err.errors)));
    }
    next(err);
  }
};

/** GET /api/recommendations/similar/:furnitureId */
export const getSimilarRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const furnitureId = parseInt(req.params.furnitureId);
    if (isNaN(furnitureId)) throw new ApiError(400, "Invalid furniture ID");

    const { limit } = recommendationQuerySchema.parse(req.query);

    // Validate limit
    if (limit < 1 || limit > 50) throw new ApiError(400, "Limit must be between 1 and 50");

    // Get the current furniture item
    const currentFurniture = await prisma.furniture.findUnique({
      where: { id: furnitureId },
      select: {
        categoryId: true,
        price: true
      }
    });

    if (!currentFurniture) throw new ApiError(404, "Furniture not found");

    // Find similar items in the same category with similar price range
    const priceRange = Number(currentFurniture.price) * 0.3; // 30% price range
    const minPrice = Number(currentFurniture.price) - priceRange;
    const maxPrice = Number(currentFurniture.price) + priceRange;

    const recommendations = await prisma.furniture.findMany({
      where: {
        categoryId: currentFurniture.categoryId,
        id: { not: furnitureId },
        price: {
          gte: minPrice,
          lte: maxPrice
        }
      },
      include: {
        images: true,
        reviews: {
          select: {
            rating: true
          }
        },
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        {
          reviews: {
            _count: 'desc'
          }
        },
        {
          createdAt: 'desc'
        }
      ],
      take: limit
    });

    // Add average ratings
    const recommendationsWithRatings = recommendations.map(item => ({
      ...item,
      averageRating: item.reviews.length > 0 
        ? item.reviews.reduce((sum, review) => sum + review.rating, 0) / item.reviews.length 
        : null,
      reviewCount: item.reviews.length,
      reviews: undefined
    }));

    return success(res, {
      recommendations: recommendationsWithRatings,
      algorithm: 'content-based'
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(400, "Invalid request parameters", convertZodErrors(err.errors)));
    }
    next(err);
  }
};

// Helper function for collaborative filtering - optimized version
async function getCollaborativeRecommendations(
  userId: number, 
  limit: number, 
  excludeId?: number
): Promise<any[]> {
  // Simplified approach - get furniture from same categories as user's purchases
  const userOrders = await prisma.orderItem.findMany({
    where: {
      order: {
        userId: userId,
        status: 'COMPLETED'
      }
    },
    include: {
      furniture: {
        select: {
          categoryId: true
        }
      }
    }
  });

  if (userOrders.length === 0) {
    return [];
  }

  // Get unique category IDs from user's purchases
  const categoryIds = [...new Set(userOrders.map(order => order.furniture.categoryId))];
  
  // Get furniture from those categories that user hasn't purchased
  const purchasedFurnitureIds = userOrders.map(order => order.furnitureId);
  const excludeIds = excludeId ? [...purchasedFurnitureIds, excludeId] : purchasedFurnitureIds;
  
  const result = await prisma.furniture.findMany({
    where: {
      categoryId: { in: categoryIds },
      id: { notIn: excludeIds }
    },
    include: {
      images: true,
      reviews: {
        select: {
          rating: true
        }
      },
      category: {
        select: {
          name: true
        }
      }
    },
    orderBy: [
      {
        reviews: {
          _count: 'desc'
        }
      },
      {
        createdAt: 'desc'
      }
    ],
    take: limit
  });

  // Add average ratings
  return result.map(item => ({
    ...item,
    averageRating: item.reviews.length > 0 
      ? item.reviews.reduce((sum, review) => sum + review.rating, 0) / item.reviews.length 
      : null,
    reviewCount: item.reviews.length,
    reviews: undefined
  }));
}

// Helper function for category-based recommendations
async function getCategoryBasedRecommendations(
  userOrders: any[], 
  limit: number, 
  excludeId?: number,
  excludeIds: number[] = []
): Promise<any[]> {
  // Get user's preferred categories
  const categoryCount = new Map();
  userOrders.forEach(order => {
    const categoryId = order.furniture.categoryId;
    categoryCount.set(categoryId, (categoryCount.get(categoryId) || 0) + 1);
  });

  const preferredCategories = Array.from(categoryCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  if (preferredCategories.length === 0) {
    return [];
  }

  const where: any = {
    categoryId: { in: preferredCategories },
    id: { notIn: excludeIds }
  };

  if (excludeId) {
    where.id.notIn.push(excludeId);
  }

  const recommendations = await prisma.furniture.findMany({
    where,
    include: {
      images: true,
      reviews: {
        select: {
          rating: true
        }
      },
      category: {
        select: {
          name: true
        }
      }
    },
    orderBy: [
      {
        reviews: {
          _count: 'desc'
        }
      },
      {
        createdAt: 'desc'
      }
    ],
    take: limit
  });

  return recommendations.map(item => ({
    ...item,
    averageRating: item.reviews.length > 0 
      ? item.reviews.reduce((sum, review) => sum + review.rating, 0) / item.reviews.length 
      : null,
    reviewCount: item.reviews.length,
    reviews: undefined
  }));
}

// Helper function for popular recommendations - optimized version
async function getPopularRecommendationsHelper(
  limit: number, 
  excludeId?: number,
  excludeIds: number[] = []
): Promise<any[]> {
  const excludeList = excludeId ? [...excludeIds, excludeId] : excludeIds;
  
  // Simplified approach for popular items
  const result = await prisma.furniture.findMany({
    where: {
      id: { notIn: excludeList }
    },
    include: {
      images: true,
      reviews: {
        select: {
          rating: true
        }
      },
      category: {
        select: {
          name: true
        }
      },
      _count: {
        select: {
          orderItems: true
        }
      }
    },
    orderBy: [
      {
        orderItems: {
          _count: 'desc'
        }
      },
      {
        reviews: {
          _count: 'desc'
        }
      },
      {
        createdAt: 'desc'
      }
    ],
    take: limit
  });

  // Add average ratings and order count
  return result.map(item => ({
    ...item,
    averageRating: item.reviews.length > 0 
      ? item.reviews.reduce((sum, review) => sum + review.rating, 0) / item.reviews.length 
      : null,
    reviewCount: item.reviews.length,
    orderCount: item._count.orderItems,
    reviews: undefined,
    _count: undefined
  }));
}