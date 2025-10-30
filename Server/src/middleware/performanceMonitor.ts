import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

interface DatabaseQueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private queryMetrics: DatabaseQueryMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics in memory

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Record API response time
  recordApiMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only the last N metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow requests (> 1 second)
    if (metric.responseTime > 1000) {
      console.warn(`Slow API request detected: ${metric.method} ${metric.endpoint} - ${metric.responseTime}ms`);
    }
  }

  // Record database query performance
  recordQueryMetric(metric: DatabaseQueryMetrics) {
    this.queryMetrics.push(metric);
    
    // Keep only the last N metrics
    if (this.queryMetrics.length > this.maxMetrics) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetrics);
    }

    // Log slow queries (> 500ms)
    if (metric.duration > 500) {
      console.warn(`Slow database query detected: ${metric.duration}ms - ${metric.query.substring(0, 100)}...`);
    }
  }

  // Get API performance statistics
  getApiStats(timeWindow: number = 3600000): {
    totalRequests: number;
    averageResponseTime: number;
    slowRequests: number;
    errorRate: number;
    endpointStats: Record<string, {
      count: number;
      averageTime: number;
      errorCount: number;
    }>;
  } {
    const cutoff = new Date(Date.now() - timeWindow);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowRequests: 0,
        errorRate: 0,
        endpointStats: {}
      };
    }

    const totalRequests = recentMetrics.length;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const slowRequests = recentMetrics.filter(m => m.responseTime > 1000).length;
    const errorRequests = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorRequests / totalRequests) * 100;

    // Group by endpoint
    const endpointStats: Record<string, { count: number; averageTime: number; errorCount: number }> = {};
    
    recentMetrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpointStats[key]) {
        endpointStats[key] = { count: 0, averageTime: 0, errorCount: 0 };
      }
      
      endpointStats[key].count++;
      endpointStats[key].averageTime = (endpointStats[key].averageTime * (endpointStats[key].count - 1) + metric.responseTime) / endpointStats[key].count;
      
      if (metric.statusCode >= 400) {
        endpointStats[key].errorCount++;
      }
    });

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      slowRequests,
      errorRate: Math.round(errorRate * 100) / 100,
      endpointStats
    };
  }

  // Get database performance statistics
  getQueryStats(timeWindow: number = 3600000): {
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: number;
    failedQueries: number;
    topSlowQueries: Array<{ query: string; averageTime: number; count: number }>;
  } {
    const cutoff = new Date(Date.now() - timeWindow);
    const recentQueries = this.queryMetrics.filter(q => q.timestamp > cutoff);

    if (recentQueries.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        slowQueries: 0,
        failedQueries: 0,
        topSlowQueries: []
      };
    }

    const totalQueries = recentQueries.length;
    const averageQueryTime = recentQueries.reduce((sum, q) => sum + q.duration, 0) / totalQueries;
    const slowQueries = recentQueries.filter(q => q.duration > 500).length;
    const failedQueries = recentQueries.filter(q => !q.success).length;

    // Group queries and find slowest
    const queryGroups: Record<string, { times: number[]; count: number }> = {};
    
    recentQueries.forEach(query => {
      const key = query.query.substring(0, 50); // Group by first 50 chars
      if (!queryGroups[key]) {
        queryGroups[key] = { times: [], count: 0 };
      }
      queryGroups[key].times.push(query.duration);
      queryGroups[key].count++;
    });

    const topSlowQueries = Object.entries(queryGroups)
      .map(([query, data]) => ({
        query,
        averageTime: Math.round(data.times.reduce((sum, time) => sum + time, 0) / data.times.length),
        count: data.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);

    return {
      totalQueries,
      averageQueryTime: Math.round(averageQueryTime),
      slowQueries,
      failedQueries,
      topSlowQueries
    };
  }

  // Clear old metrics
  clearOldMetrics(olderThan: number = 86400000) { // Default: 24 hours
    const cutoff = new Date(Date.now() - olderThan);
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.queryMetrics = this.queryMetrics.filter(q => q.timestamp > cutoff);
  }
}

// Express middleware for API performance monitoring
export const apiPerformanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const monitor = PerformanceMonitor.getInstance();

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    
    monitor.recordApiMetric({
      endpoint: req.route?.path || req.path,
      method: req.method,
      responseTime,
      statusCode: res.statusCode,
      timestamp: new Date(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Database query performance wrapper
export const monitorDatabaseQuery = async <T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const monitor = PerformanceMonitor.getInstance();
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    monitor.recordQueryMetric({
      query: queryName,
      duration,
      timestamp: new Date(),
      success: true
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    monitor.recordQueryMetric({
      query: queryName,
      duration,
      timestamp: new Date(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
};

export { PerformanceMonitor };