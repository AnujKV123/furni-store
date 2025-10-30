import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma";
import { success } from "../utils/response";
import { ApiError } from "../utils/errors";

export const getCart = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    if (!userId) throw new ApiError(401, "Authentication required");

    let cart = await prisma.cart.findUnique({
      where: { userId },
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
        } 
      }
    });
    
    if (!cart) {
      cart = await prisma.cart.create({ 
        data: { userId },
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
          } 
        }
      });
    }
    
    return success(res, cart);
  } catch (err) {
    next(err);
  }
};

export const addToCart = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { furnitureId, quantity = 1 } = req.body;
    const userId = req.user.id;
    
    if (!userId) throw new ApiError(401, "Authentication required");
    if (!furnitureId) throw new ApiError(400, "furnitureId required");
    if (quantity < 1) throw new ApiError(400, "Quantity must be at least 1");

    // Verify furniture exists
    const furniture = await prisma.furniture.findUnique({ where: { id: furnitureId } });
    if (!furniture) throw new ApiError(404, "Furniture not found");

    // Get or create cart
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // Check if item already exists in cart
    const existing = await prisma.cartItem.findFirst({ 
      where: { cartId: cart.id, furnitureId },
      include: { furniture: true }
    });
    
    if (existing) {
      const updated = await prisma.cartItem.update({ 
        where: { id: existing.id }, 
        data: { quantity: existing.quantity + quantity },
        include: { furniture: true }
      });
      return success(res, updated);
    } else {
      const created = await prisma.cartItem.create({ 
        data: { cartId: cart.id, furnitureId, quantity },
        include: { furniture: true }
      });
      return success(res, created, 201);
    }
  } catch (err) {
    next(err);
  }
};

export const updateCartItem = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { cartItemId, quantity } = req.body;
    const userId = req.user.id;
    
    if (!userId) throw new ApiError(401, "Authentication required");
    if (!cartItemId || typeof quantity !== "number") throw new ApiError(400, "cartItemId and quantity required");
    if (quantity < 1) throw new ApiError(400, "Quantity must be at least 1");

    // Verify the cart item belongs to the user
    const cartItem = await prisma.cartItem.findFirst({
      where: { 
        id: Number(cartItemId),
        cart: { userId }
      },
      include: { furniture: true }
    });
    
    if (!cartItem) throw new ApiError(404, "Cart item not found");

    const updated = await prisma.cartItem.update({ 
      where: { id: Number(cartItemId) }, 
      data: { quantity },
      include: { furniture: true }
    });
    
    return success(res, updated);
  } catch (err) {
    next(err);
  }
};

export const removeCartItem = async (req: any, res: Response, next: NextFunction) => {
  try {
    const cartItemId = Number(req.params.cartItemId);
    const userId = req.user.id;
    
    if (!userId) throw new ApiError(401, "Authentication required");
    if (isNaN(cartItemId)) throw new ApiError(400, "Invalid cart item ID");

    // Verify the cart item belongs to the user
    const cartItem = await prisma.cartItem.findFirst({
      where: { 
        id: cartItemId,
        cart: { userId }
      }
    });
    
    if (!cartItem) throw new ApiError(404, "Cart item not found");

    const removed = await prisma.cartItem.delete({ where: { id: cartItemId } });
    return success(res, removed);
  } catch (err) {
    next(err);
  }
};

export const clearCart = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    
    if (!userId) throw new ApiError(401, "Authentication required");

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new ApiError(404, "Cart not found");
    
    const deletedCount = await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return success(res, { message: "Cart cleared successfully", deletedCount: deletedCount.count });
  } catch (err) {
    next(err);
  }
};
