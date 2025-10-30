import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/errors";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log error details for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Handle custom API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.statusCode.toString(),
        ...(err.errors.length > 0 && { details: { validationErrors: err.errors } })
      }
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationErrors = err.errors.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code
    }));

    return res.status(400).json({
      success: false,
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: { validationErrors }
      }
    });
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        const field = err.meta?.target as string[] | undefined;
        return res.status(409).json({
          success: false,
          error: {
            message: `${field ? field.join(', ') : 'Field'} already exists`,
            code: "DUPLICATE_ENTRY",
            field: field?.[0]
          }
        });
      
      case 'P2025':
        // Record not found
        return res.status(404).json({
          success: false,
          error: {
            message: "Record not found",
            code: "NOT_FOUND"
          }
        });
      
      case 'P2003':
        // Foreign key constraint violation
        return res.status(400).json({
          success: false,
          error: {
            message: "Invalid reference to related record",
            code: "FOREIGN_KEY_VIOLATION"
          }
        });
      
      default:
        return res.status(500).json({
          success: false,
          error: {
            message: "Database operation failed",
            code: "DATABASE_ERROR"
          }
        });
    }
  }

  // Handle Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Invalid data provided",
        code: "VALIDATION_ERROR"
      }
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        message: "Invalid token",
        code: "INVALID_TOKEN"
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        message: "Token expired",
        code: "TOKEN_EXPIRED"
      }
    });
  }

  // Handle multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: {
        message: "File too large",
        code: "FILE_TOO_LARGE"
      }
    });
  }

  // Handle syntax errors in JSON
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Invalid JSON format",
        code: "INVALID_JSON"
      }
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: "INTERNAL_ERROR",
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};
