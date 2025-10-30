import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../prisma";
import { signJwt, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { success } from "../utils/response";
import { ApiError } from "../utils/errors";
import { 
  registerSchema, 
  loginSchema, 
  updateProfileSchema, 
  changePasswordSchema, 
  refreshTokenSchema 
} from "../utils/validation";

const SALT_ROUNDS = 10;

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validation is handled by middleware, so req.body is already validated
    const { email, password, name } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw ApiError.conflict("Email already registered", "email");
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({ 
      data: { email, password: hashed, name },
      select: { id: true, email: true, name: true, createdAt: true }
    });

    // create empty cart
    await prisma.cart.create({ data: { userId: user.id } });

    const token = signJwt({ id: user.id, email: user.email });
    const refreshToken = signRefreshToken({ id: user.id, email: user.email });
    
    return success(res, { 
      token, 
      refreshToken, 
      user 
    }, 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validation is handled by middleware
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw ApiError.unauthorized("Invalid credentials");
    }

    const token = signJwt({ id: user.id, email: user.email });
    const refreshToken = signRefreshToken({ id: user.id, email: user.email });
    
    return success(res, { 
      token, 
      refreshToken, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      } 
    });
  } catch (err) {
    next(err);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // authMiddleware can attach req.user
    // we assume authMiddleware used at route level
    const anyReq: any = req;
    if (!anyReq.user) throw new ApiError(401, "Unauthorized");
    const user = await prisma.user.findUnique({ 
      where: { id: anyReq.user.id }, 
      select: { id: true, email: true, name: true, createdAt: true } 
    });
    if (!user) throw new ApiError(404, "User not found");
    return success(res, user);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const anyReq: any = req;
    if (!anyReq.user) throw ApiError.unauthorized();
    
    // Validation is handled by middleware
    const { name, email } = req.body;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== anyReq.user.id) {
        throw ApiError.conflict("Email already in use", "email");
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: anyReq.user.id },
      data: {
        ...(name && { name }),
        ...(email && { email })
      },
      select: { id: true, email: true, name: true, createdAt: true }
    });

    return success(res, updatedUser);
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const anyReq: any = req;
    if (!anyReq.user) throw ApiError.unauthorized();
    
    // Validation is handled by middleware
    const { currentPassword, newPassword } = req.body;

    // Get current user with password
    const user = await prisma.user.findUnique({ where: { id: anyReq.user.id } });
    if (!user) throw ApiError.notFound("User not found");

    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      throw ApiError.badRequest("Current password is incorrect", [
        { field: "currentPassword", message: "Current password is incorrect" }
      ]);
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: anyReq.user.id },
      data: { password: hashedNewPassword }
    });

    return success(res, { message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validation is handled by middleware
    const { refreshToken } = req.body;

    const payload: any = verifyRefreshToken(refreshToken);
    if (!payload?.id) throw ApiError.unauthorized("Invalid refresh token");

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) throw ApiError.unauthorized("User not found");

    const newToken = signJwt({ id: user.id, email: user.email });
    const newRefreshToken = signRefreshToken({ id: user.id, email: user.email });

    return success(res, { token: newToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};
