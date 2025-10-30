import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt";
import { prisma } from "../prisma";
import { ApiError } from "../utils/errors";

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: { code: "MISSING_TOKEN", message: "Authorization token required" } });
    }
    
    const token = header.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, error: { code: "MISSING_TOKEN", message: "Authorization token required" } });
    }

    const payload: any = verifyJwt(token);
    if (!payload?.id) {
      return res.status(401).json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid or expired token" } });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(401).json({ success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } });
    }
    
    req.user = { id: user.id, email: user.email, name: user.name };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: { code: "TOKEN_EXPIRED", message: "Token has expired" } });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid token" } });
    }
    next(err);
  }
};

// Optional auth middleware - doesn't fail if no token provided
export const optionalAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }
    
    const token = header.split(" ")[1];
    if (!token) {
      req.user = null;
      return next();
    }

    const payload: any = verifyJwt(token);
    if (!payload?.id) {
      req.user = null;
      return next();
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      req.user = null;
      return next();
    }
    
    req.user = { id: user.id, email: user.email, name: user.name };
    next();
  } catch (err: any) {
    // If token is invalid or expired, just continue without user
    req.user = null;
    next();
  }
};
