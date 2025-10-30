import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";
import { success } from "../utils/response";
import { ApiError } from "../utils/errors";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";

// Validation schemas
const createOrderSchema = z.object({
  items: z.array(z.object({
    furnitureId: z.number().int().positive("Furniture ID must be a positive integer"),
    quantity: z.number().int().positive("Quantity must be a positive integer")
  })).min(1, "Order must contain at least one item"),
  guestInfo: z.object({
    email: z.string().email("Invalid email format"),
    name: z.string().optional()
  }).optional()
});

const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, {
    errorMap: () => ({ message: "Status must be PENDING, COMPLETED, or CANCELLED" })
  })
});

const orderIdSchema = z.object({
  id: z.string().transform(val => {
    const num = parseInt(val);
    if (isNaN(num)) throw new Error("Invalid ID");
    return num;
  })
});

const getUserOrdersSchema = z.object({
  page: z.string().optional().transform(val => {
    if (!val) return 1;
    const num = parseInt(val);
    return isNaN(num) ? 1 : Math.max(1, num);
  }),
  limit: z.string().optional().transform(val => {
    if (!val) return 10;
    const num = parseInt(val);
    return isNaN(num) ? 10 : Math.min(Math.max(1, num), 50);
  }),
  status: z.nativeEnum(OrderStatus).optional()
});

interface OrderItemData {
  furnitureId: number;
  quantity: number;
  unitPrice: number;
}


/** POST /api/orders */
export const createOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    // Validate request data
    const validatedData = createOrderSchema.parse(req.body);
    const { items, guestInfo } = validatedData;

    // Determine user ID from auth middleware or request body
    let finalUserId: number | undefined = req.user?.id;
    
    // If no authenticated user but guestInfo is available, handle guest checkout
    if (!finalUserId && !guestInfo) {
      throw new ApiError(400, "Either authentication or guest information must be provided");
    }

    // If userId is provided, verify user exists (this should always be true if auth middleware worked)
    if (finalUserId) {
      const user = await prisma.user.findUnique({
        where: { id: finalUserId }
      });
      if (!user) {
        throw new ApiError(404, "User not found");
      }
    }

    // Fetch all furniture items to validate and get prices
    const furnitureIds = items.map(item => item.furnitureId);
    const furnitureList = await prisma.furniture.findMany({
      where: { id: { in: furnitureIds } }
    });

    if (furnitureList.length !== furnitureIds.length) {
      const foundIds = furnitureList.map(f => f.id);
      const missingIds = furnitureIds.filter(id => !foundIds.includes(id));
      throw new ApiError(404, `Furniture items not found: ${missingIds.join(', ')}`);
    }

    const furnitureMap = new Map(furnitureList.map(f => [f.id, f]));

    // Calculate total amount and prepare order items
    let totalAmount = 0;
    const orderItemsData: OrderItemData[] = [];

    for (const item of items) {
      const furniture = furnitureMap.get(item.furnitureId)!;
      const unitPrice = Number(furniture.price);
      const itemTotal = unitPrice * item.quantity;
      
      totalAmount += itemTotal;
      orderItemsData.push({
        furnitureId: item.furnitureId,
        quantity: item.quantity,
        unitPrice: unitPrice
      });
    }

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: finalUserId,
          totalAmount: totalAmount,
          status: 'PENDING',
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: {
            include: {
              furniture: {
                select: {
                  name: true,
                  price: true,
                  images: {
                    take: 1,
                    select: {
                      url: true
                    }
                  }
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // If this was a cart-based order, clear the user's cart
      if (finalUserId) {
        await tx.cartItem.deleteMany({
          where: {
            cart: {
              userId: finalUserId
            }
          }
        });
      }

      return newOrder;
    });

    return success(res, order, 201);
  } catch (err) {
    // if (err instanceof z.ZodError) {
    //   return next(new ApiError(400, "Invalid order data", err.errors));
    // }
    next(err);
  }
};

/** GET /api/orders/:id */
export const getOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = orderIdSchema.parse(req.params);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            furniture: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                sku: true,
                widthCm: true,
                heightCm: true,
                depthCm: true,
                images: {
                  take: 1,
                  select: {
                    url: true
                  }
                },
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!order) throw new ApiError(404, "Order not found");

    // If user is authenticated, check if they own this order
    if (req.user && order.userId && order.userId !== req.user.id) {
      throw new ApiError(403, "Access denied");
    }

    return success(res, order);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new ApiError(400, "Invalid order ID"));
    }
    next(err);
  }
};

/** PATCH /api/orders/:id/status */
export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = orderIdSchema.parse(req.params);
    const { status } = updateOrderStatusSchema.parse(req.body);

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });
    if (!existingOrder) throw new ApiError(404, "Order not found");

    // Validate status transition
    if (existingOrder.status === 'COMPLETED' && status !== 'COMPLETED') {
      throw new ApiError(400, "Cannot change status of completed order");
    }
    if (existingOrder.status === 'CANCELLED' && status !== 'CANCELLED') {
      throw new ApiError(400, "Cannot change status of cancelled order");
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            furniture: {
              select: {
                name: true,
                price: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return success(res, updatedOrder);
  } catch (err) {
    // if (err instanceof z.ZodError) {
    //   return next(new ApiError(400, "Invalid request data", err.errors));
    // }
    next(err);
  }
};

/** GET /api/orders/user/:userId */
export const getUserOrders = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) throw new ApiError(400, "Invalid user ID");

    // Check if authenticated user is requesting their own orders
    if (req.user.id !== userId) {
      throw new ApiError(403, "Access denied");
    }

    const validatedQuery = getUserOrdersSchema.parse(req.query);
    const { page, limit, status } = validatedQuery;

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
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    // Get orders and total count
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              furniture: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: {
                    take: 1,
                    select: {
                      url: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return success(res, {
      orders,
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
    //   return next(new ApiError(400, "Invalid query parameters", err.errors));
    // }
    next(err);
  }
};

/** GET /api/orders */
export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedQuery = getUserOrdersSchema.parse(req.query);
    const { page, limit, status } = validatedQuery;

    // Validate pagination
    if (page < 1) throw new ApiError(400, "Page must be greater than 0");
    if (limit < 1 || limit > 50) throw new ApiError(400, "Limit must be between 1 and 50");

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    // Get orders and total count
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              furniture: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return success(res, {
      orders,
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
    //   return next(new ApiError(400, "Invalid query parameters", err.errors));
    // }
    next(err);
  }
};

/** GET /api/orders/my-orders */
export const getMyOrders = async (req: any, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      throw new ApiError(401, "Authentication required");
    }
    
    const userId = req.user.id;
    const validatedQuery = getUserOrdersSchema.parse(req.query);
    const { page, limit, status } = validatedQuery;

    // Validate pagination
    if (page < 1) throw new ApiError(400, "Page must be greater than 0");
    if (limit < 1 || limit > 50) throw new ApiError(400, "Limit must be between 1 and 50");

    // Build where clause
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    // Get orders and total count
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              furniture: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: {
                    take: 1,
                    select: {
                      url: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return success(res, {
      orders,
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
    //   return next(new ApiError(400, "Invalid query parameters", err.errors));
    // }
    next(err);
  }
};