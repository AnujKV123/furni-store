/**
 * Zod validation schemas for API endpoints
 */
import { z } from "zod";

// Common validation patterns
const emailSchema = z.string().email("Invalid email format");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters long");
const positiveIntSchema = z.number().int().positive("Must be a positive integer");
const nonEmptyStringSchema = z.string().min(1, "This field is required");

// Auth schemas
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().optional()
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required")
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: emailSchema.optional()
}).refine(data => data.name || data.email, {
  message: "At least one field (name or email) must be provided"
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required")
});

// Furniture schemas
export const createFurnitureSchema = z.object({
  name: nonEmptyStringSchema,
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  sku: nonEmptyStringSchema,
  widthCm: z.number().positive("Width must be positive"),
  heightCm: z.number().positive("Height must be positive"),
  depthCm: z.number().positive("Depth must be positive"),
  categoryId: positiveIntSchema,
  images: z.array(z.string().url("Invalid image URL")).optional()
});

export const updateFurnitureSchema = createFurnitureSchema.partial();

export const furnitureQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sortBy: z.enum(['name', 'price', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
});

// Review schemas
export const createReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  comment: z.string().min(10, "Comment must be at least 10 characters long").optional(),
  furnitureId: positiveIntSchema,
  userId: positiveIntSchema
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(10).optional()
}).refine(data => data.rating || data.comment, {
  message: "At least one field (rating or comment) must be provided"
});

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(5),
  sortBy: z.enum(['rating', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Cart schemas
export const addToCartSchema = z.object({
  furnitureId: positiveIntSchema,
  quantity: z.number().int().positive().default(1)
});

export const updateCartItemSchema = z.object({
  cartItemId: positiveIntSchema,
  quantity: z.number().int().positive("Quantity must be positive")
});

// Order schemas
export const createOrderSchema = z.object({
  items: z.array(z.object({
    furnitureId: positiveIntSchema,
    quantity: z.number().int().positive()
  })).min(1, "Order must contain at least one item"),
  guestInfo: z.object({
    email: emailSchema,
    name: z.string().optional()
  }).optional()
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  sortBy: z.enum(['createdAt', 'totalAmount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED'])
});

// Recommendation schemas
export const recommendationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
  excludeId: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive().optional()
});

// ID parameter validation
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("Invalid ID")
});

export const stringIdParamSchema = z.object({
  id: z.string().min(1, "ID is required")
});

// Validation middleware factory
export const validateBody = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateQuery = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateParams = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};