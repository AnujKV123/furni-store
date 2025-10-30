/**
 * Request logging middleware for debugging and monitoring
 */
import { Request, Response, NextFunction } from "express";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    ...(Object.keys(req.body).length > 0 && { body: req.body }),
    ...(Object.keys(req.query).length > 0 && { query: req.query }),
    ...(Object.keys(req.params).length > 0 && { params: req.params })
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    
    // Log error responses in detail
    if (res.statusCode >= 400) {
      console.error('Error response:', body);
    }
    
    return originalJson.call(this, body);
  };

  next();
};