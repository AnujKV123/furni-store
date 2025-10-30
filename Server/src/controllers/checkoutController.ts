import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";
import { success } from "../utils/response";
import { ApiError } from "../utils/errors";

export const placeOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, "Authentication required for checkout");

    const { items: directItems } = req.body;

    let itemsData = [];
    let total = 0;
    let shouldClearCart = false;

    // Check if items are provided directly (for direct purchase)
    if (directItems && Array.isArray(directItems) && directItems.length > 0) {
      // Direct purchase with provided items
      const furnitureIds = directItems.map((item: any) => item.furnitureId);
      const furnitureList = await prisma.furniture.findMany({
        where: { id: { in: furnitureIds } }
      });

      if (furnitureList.length !== furnitureIds.length) {
        const foundIds = furnitureList.map(f => f.id);
        const missingIds = furnitureIds.filter(id => !foundIds.includes(id));
        throw new ApiError(404, `Furniture items not found: ${missingIds.join(', ')}`);
      }

      const furnitureMap = new Map(furnitureList.map(f => [f.id, f]));

      for (const item of directItems) {
        const furniture = furnitureMap.get(item.furnitureId);
        if (!furniture) continue;
        
        const unitPrice = Number(furniture.price);
        total += unitPrice * item.quantity;
        itemsData.push({
          furnitureId: item.furnitureId,
          quantity: item.quantity,
          unitPrice: unitPrice
        });
      }
    } else {
      // Cart-based purchase
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: { furniture: true } } }
      });
      
      if (!cart || cart.items.length === 0) {
        throw new ApiError(400, "Cart is empty and no items provided");
      }

      itemsData = cart.items.map(ci => {
        const unitPrice = Number(ci.furniture.price);
        total += unitPrice * ci.quantity;
        return {
          furnitureId: ci.furnitureId,
          quantity: ci.quantity,
          unitPrice
        };
      });
      
      shouldClearCart = true;
    }

    if (itemsData.length === 0) {
      throw new ApiError(400, "No items to order");
    }

    // create order and its items atomically
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount: total,
        status: "COMPLETED", // skip payment flow for now
        items: { create: itemsData }
      },
      include: { 
        items: { 
          include: { 
            furniture: {
              include: {
                images: {
                  take: 1
                },
                category: true
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

    // clear cart only if this was a cart-based purchase
    if (shouldClearCart) {
      const cart = await prisma.cart.findUnique({ where: { userId } });
      if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      }
    }

    return success(res, order, 201);
  } catch (err) {
    next(err);
  }
};

export const guestCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Guest checkout is disabled - require authentication
    throw new ApiError(401, "Authentication required. Please create an account or login to make a purchase.");
  } catch (err) {
    next(err);
  }
};
