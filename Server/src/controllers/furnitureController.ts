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

// Validation is now handled by middleware

/** GET /api/furnitures */
export const listFurnitures = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Query parameters are validated by middleware
    const { page, limit, category, minPrice, maxPrice, sortBy, sortOrder, search } = req.query as any;

    // Build where clause
    const where: any = {};
    
    if (category) {
      // Find category by name
      const categoryRecord = await prisma.category.findFirst({
        where: { name: { contains: category, mode: 'insensitive' } }
      });
      if (categoryRecord) {
        where.categoryId = categoryRecord.id;
      }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [items, totalCount] = await Promise.all([
      prisma.furniture.findMany({
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
        orderBy,
        skip,
        take: limit
      }),
      prisma.furniture.count({ where })
    ]);

    // Calculate average ratings
    const itemsWithRatings = items.map(item => ({
      ...item,
      averageRating: item.reviews.length > 0 
        ? item.reviews.reduce((sum, review) => sum + review.rating, 0) / item.reviews.length 
        : null,
      reviewCount: item.reviews.length,
      reviews: undefined // Remove detailed reviews from list view
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return success(res, {
      items: itemsWithRatings,
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
    next(err);
  }
};

/** GET /api/furnitures/:id */
export const getFurniture = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // ID parameter is validated by middleware
    const { id } = req.params as any;

    const item = await prisma.furniture.findUnique({
      where: { id },
      include: { 
        images: true, 
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        category: {
          select: {
            name: true,
            description: true
          }
        }
      }
    });

    if (!item) throw ApiError.notFound("Furniture not found");

    // Calculate average rating
    const averageRating = item.reviews.length > 0 
      ? item.reviews.reduce((sum, review) => sum + review.rating, 0) / item.reviews.length 
      : null;

    const itemWithRating = {
      ...item,
      averageRating,
      reviewCount: item.reviews.length
    };

    return success(res, itemWithRating);
  } catch (err) {
    next(err);
  }
};

/** GET recommendations - simple: same category most purchased */
// export const getRecommendations = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const id = Number(req.params.id);
//     if (isNaN(id)) throw new ApiError(400, "Invalid furniture ID");

//     const current = await prisma.furniture.findUnique({ where: { id } });
//     if (!current) throw new ApiError(404, "Furniture not found");

//     const recommended = await prisma.furniture.findMany({
//       where: { category: current.category, id: { not: id } },
//       include: { reviews: true, images: true },
//       take: 4,
//     });

//     return success(res, recommended);
//   } catch (err) {
//     next(err);
//   }
// };

// Validation schema for creating/updating furniture
const createFurnitureSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  sku: z.string().min(1, "SKU is required").max(50, "SKU too long"),
  widthCm: z.number().positive("Width must be positive"),
  heightCm: z.number().positive("Height must be positive"),
  depthCm: z.number().positive("Depth must be positive"),
  categoryId: z.number().int().positive("Category ID must be a positive integer"),
  images: z.array(z.object({
    url: z.string().url("Invalid image URL")
  })).optional()
});

const updateFurnitureSchema = createFurnitureSchema.partial();

// Validation schema for furniture ID parameter
const furnitureIdSchema = z.object({
  id: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num)) throw new Error("Invalid ID");
    return num;
  })
});

/** POST /api/furnitures */
export const createFurniture = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = createFurnitureSchema.parse(req.body);

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: validatedData.categoryId }
    });
    if (!category) throw new ApiError(400, "Category not found");

    // Check if SKU already exists
    const existingSku = await prisma.furniture.findUnique({
      where: { sku: validatedData.sku }
    });
    if (existingSku) throw new ApiError(400, "SKU already exists");

    const { images, ...furnitureData } = validatedData;

    const furniture = await prisma.furniture.create({
      data: {
        ...furnitureData,
        images: images ? {
          create: images
        } : undefined
      },
      include: {
        images: true,
        category: {
          select: {
            name: true
          }
        }
      }
    });

    return success(res, furniture, 201);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(400, "Invalid furniture data", convertZodErrors(err.errors)));
    }
    next(err);
  }
};

/** PUT /api/furnitures/:id */
export const updateFurniture = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = furnitureIdSchema.parse(req.params);
    const validatedData = updateFurnitureSchema.parse(req.body);

    // Check if furniture exists
    const existingFurniture = await prisma.furniture.findUnique({
      where: { id }
    });
    if (!existingFurniture) throw new ApiError(404, "Furniture not found");

    // Check if category exists (if provided)
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId }
      });
      if (!category) throw new ApiError(400, "Category not found");
    }

    // Check if SKU already exists (if provided and different)
    if (validatedData.sku && validatedData.sku !== existingFurniture.sku) {
      const existingSku = await prisma.furniture.findUnique({
        where: { sku: validatedData.sku }
      });
      if (existingSku) throw new ApiError(400, "SKU already exists");
    }

    const { images, ...furnitureData } = validatedData;

    const furniture = await prisma.furniture.update({
      where: { id },
      data: {
        ...furnitureData,
        ...(images && {
          images: {
            deleteMany: {},
            create: images
          }
        })
      },
      include: {
        images: true,
        category: {
          select: {
            name: true
          }
        }
      }
    });

    return success(res, furniture);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(400, "Invalid furniture data", convertZodErrors(err.errors)));
    }
    next(err);
  }
};

/** DELETE /api/furnitures/:id */
export const deleteFurniture = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = furnitureIdSchema.parse(req.params);

    // Check if furniture exists
    const existingFurniture = await prisma.furniture.findUnique({
      where: { id },
      include: {
        orderItems: true
      }
    });
    if (!existingFurniture) throw new ApiError(404, "Furniture not found");

    // Check if furniture is referenced in any orders
    if (existingFurniture.orderItems.length > 0) {
      throw new ApiError(400, "Cannot delete furniture that has been ordered");
    }

    await prisma.furniture.delete({
      where: { id }
    });

    return success(res, { message: "Furniture deleted successfully" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(400, "Invalid furniture ID"));
    }
    next(err);
  }
};

export const getRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = furnitureIdSchema.parse(req.params);

    // Find the current furniture item to get its categoryId
    const current = await prisma.furniture.findUnique({
      where: { id },
      select: { categoryId: true }
    });

    if (!current) {
      throw new ApiError(404, 'Furniture not found');
    }

    // Find other furniture items with the same categoryId
    const recommended = await prisma.furniture.findMany({
      where: {
        categoryId: current.categoryId,
        id: { not: id }
      },
      include: {
        reviews: {
          select: {
            rating: true
          }
        },
        images: true,
        category: {
          select: {
            name: true
          }
        }
      },
      take: 4,
    });

    // Add average ratings
    const recommendedWithRatings = recommended.map(item => ({
      ...item,
      averageRating: item.reviews.length > 0 
        ? item.reviews.reduce((sum, review) => sum + review.rating, 0) / item.reviews.length 
        : null,
      reviewCount: item.reviews.length,
      reviews: undefined
    }));

    return success(res, recommendedWithRatings);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(400, "Invalid furniture ID"));
    }
    next(err);
  }
};
/** G
ET /api/furnitures/categories */
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            furniture: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return success(res, categories);
  } catch (err) {
    next(err);
  }
};