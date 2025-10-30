import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";
import { success } from "../utils/response";
import { ApiError } from "../utils/errors";
import { z } from "zod";

// Validation schemas
const createReviewSchema = z.object({
  furnitureId: z.number().int().positive("Furniture ID must be a positive integer"),
  userId: z.number().int().positive("User ID must be a positive integer"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().max(1000, "Comment must be less than 1000 characters").optional()
});

const updateReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5").optional(),
  comment: z.string().max(1000, "Comment must be less than 1000 characters").optional()
});

const reviewIdSchema = z.object({
  id: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num)) throw new Error("Invalid ID");
    return num;
  })
});

const furnitureIdSchema = z.object({
  id: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num)) throw new Error("Invalid ID");
    return num;
  })
});

const userIdSchema = z.object({
  userId: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num)) throw new Error("Invalid ID");
    return num;
  })
});

const getReviewsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  rating: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  sortBy: z.enum(['createdAt', 'rating']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

/** POST /api/reviews */
export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createReviewSchema.parse(req.body);
    const { furnitureId, userId, rating, comment } = validatedData;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) throw new ApiError(404, "User not found");

    // Check if furniture exists
    const furniture = await prisma.furniture.findUnique({
      where: { id: furnitureId }
    });
    if (!furniture) throw new ApiError(404, "Furniture not found");

    // Verify user has purchased this furniture item
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        furnitureId: furnitureId,
        order: {
          userId: userId,
          status: 'COMPLETED'
        }
      }
    });

    if (!hasPurchased) {
      throw new ApiError(403, "You can only review furniture items you have purchased");
    }

    // Check if user has already reviewed this furniture
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_furnitureId: {
          userId: userId,
          furnitureId: furnitureId
        }
      }
    });

    if (existingReview) {
      throw new ApiError(400, "You have already reviewed this furniture item");
    }

    // Create the review
    const newReview = await prisma.review.create({
      data: {
        rating,
        comment,
        userId,
        furnitureId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        furniture: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return success(res, newReview, 201);
  } catch (err) {
    // if (err instanceof z.ZodError) {
    //   return next(new ApiError(400, "Invalid review data", err.errors));
    // }
    next(err);
  }
};

/** GET /api/reviews/furniture/:id */
export const getReviewsForFurniture = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: furnitureId } = furnitureIdSchema.parse(req.params);
    const validatedQuery = getReviewsSchema.parse(req.query);
    const { page, limit, rating, sortBy, sortOrder } = validatedQuery;

    // Validate pagination
    if (page < 1) throw new ApiError(400, "Page must be greater than 0");
    if (limit < 1 || limit > 50) throw new ApiError(400, "Limit must be between 1 and 50");

    // Check if furniture exists
    const furniture = await prisma.furniture.findUnique({
      where: { id: furnitureId }
    });
    if (!furniture) throw new ApiError(404, "Furniture not found");

    // Build where clause
    const where: any = { furnitureId };
    if (rating !== undefined) {
      where.rating = rating;
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const skip = (page - 1) * limit;

    // Get reviews and total count
    const [reviews, totalCount, averageRating] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where: { furnitureId },
        _avg: {
          rating: true
        }
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return success(res, {
      reviews,
      averageRating: averageRating._avg.rating,
      totalReviews: totalCount,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    // if (err instanceof z.ZodError) {
    //   return next(new ApiError(400, "Invalid request parameters", err.errors));
    // }
    next(err);
  }
};

/** GET /api/reviews/user/:userId */
export const getUserReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = userIdSchema.parse(req.params);
    const validatedQuery = getReviewsSchema.parse(req.query);
    const { page, limit, rating, sortBy, sortOrder } = validatedQuery;

    // Validate pagination
    if (page < 1) throw new ApiError(400, "Page must be greater than 0");
    if (limit < 1 || limit > 50) throw new ApiError(400, "Limit must be between 1 and 50");

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) throw new ApiError(404, "User not found");

    // Build where clause
    const where: any = { userId };
    if (rating !== undefined) {
      where.rating = rating;
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const skip = (page - 1) * limit;

    // Get reviews and total count
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          furniture: {
            select: {
              id: true,
              name: true,
              images: {
                take: 1,
                select: {
                  url: true
                }
              }
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.review.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return success(res, {
      reviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    // if (err instanceof z.ZodError) {
    //   return next(new ApiError(400, "Invalid request parameters", err.errors));
    // }
    next(err);
  }
};

/** PUT /api/reviews/:id */
export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = reviewIdSchema.parse(req.params);
    const validatedData = updateReviewSchema.parse(req.body);

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    if (!existingReview) throw new ApiError(404, "Review not found");

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        furniture: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return success(res, updatedReview);
  } catch (err) {
    // if (err instanceof z.ZodError) {
    //   return next(new ApiError(400, "Invalid review data", err.errors));
    // }
    next(err);
  }
};

/** DELETE /api/reviews/:id */
export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = reviewIdSchema.parse(req.params);

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id }
    });
    if (!existingReview) throw new ApiError(404, "Review not found");

    await prisma.review.delete({
      where: { id }
    });

    return success(res, { message: "Review deleted successfully" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(400, "Invalid review ID"));
    }
    next(err);
  }
};

/** GET /api/reviews/can-review/:userId/:furnitureId */
export const canUserReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.userId);
    const furnitureId = parseInt(req.params.furnitureId);

    if (isNaN(userId) || isNaN(furnitureId)) {
      throw new ApiError(400, "Invalid user ID or furniture ID");
    }

    // Check if user has purchased this furniture item
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        furnitureId: furnitureId,
        order: {
          userId: userId,
          status: 'COMPLETED'
        }
      }
    });

    // Check if user has already reviewed this furniture
    const hasReviewed = await prisma.review.findUnique({
      where: {
        userId_furnitureId: {
          userId: userId,
          furnitureId: furnitureId
        }
      }
    });

    const canReview = hasPurchased && !hasReviewed;

    return success(res, {
      canReview,
      hasPurchased: !!hasPurchased,
      hasReviewed: !!hasReviewed
    });
  } catch (err) {
    next(err);
  }
};
