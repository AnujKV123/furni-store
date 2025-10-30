import { Request, Response, NextFunction } from 'express';
import { PerformanceMonitor } from '../middleware/performanceMonitor';
import { success } from '../utils/response';
import { ApiError } from '../utils/errors';

/** GET /api/performance/stats */
export const getPerformanceStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const timeWindow = parseInt(req.query.timeWindow as string) || 3600000; // Default: 1 hour
    
    if (timeWindow < 60000 || timeWindow > 86400000) {
      throw new ApiError(400, 'Time window must be between 1 minute and 24 hours');
    }

    const monitor = PerformanceMonitor.getInstance();
    const apiStats = monitor.getApiStats(timeWindow);
    const queryStats = monitor.getQueryStats(timeWindow);

    return success(res, {
      timeWindow: timeWindow / 1000 / 60, // Convert to minutes
      api: apiStats,
      database: queryStats,
      timestamp: new Date()
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/performance/health */
export const getHealthCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const monitor = PerformanceMonitor.getInstance();
    const recentStats = monitor.getApiStats(300000); // Last 5 minutes
    const queryStats = monitor.getQueryStats(300000);

    // Define health thresholds
    const healthStatus = {
      status: 'healthy' as 'healthy' | 'warning' | 'critical',
      checks: {
        responseTime: {
          status: 'healthy' as 'healthy' | 'warning' | 'critical',
          value: recentStats.averageResponseTime,
          threshold: 1000,
          message: 'Average response time is acceptable'
        },
        errorRate: {
          status: 'healthy' as 'healthy' | 'warning' | 'critical',
          value: recentStats.errorRate,
          threshold: 5,
          message: 'Error rate is within acceptable limits'
        },
        databasePerformance: {
          status: 'healthy' as 'healthy' | 'warning' | 'critical',
          value: queryStats.averageQueryTime,
          threshold: 500,
          message: 'Database performance is good'
        }
      },
      timestamp: new Date()
    };

    // Check response time
    if (recentStats.averageResponseTime > 2000) {
      healthStatus.checks.responseTime.status = 'critical';
      healthStatus.checks.responseTime.message = 'Average response time is too high';
      healthStatus.status = 'critical';
    } else if (recentStats.averageResponseTime > 1000) {
      healthStatus.checks.responseTime.status = 'warning';
      healthStatus.checks.responseTime.message = 'Average response time is elevated';
      if (healthStatus.status === 'healthy') healthStatus.status = 'warning';
    }

    // Check error rate
    if (recentStats.errorRate > 10) {
      healthStatus.checks.errorRate.status = 'critical';
      healthStatus.checks.errorRate.message = 'Error rate is too high';
      healthStatus.status = 'critical';
    } else if (recentStats.errorRate > 5) {
      healthStatus.checks.errorRate.status = 'warning';
      healthStatus.checks.errorRate.message = 'Error rate is elevated';
      if (healthStatus.status === 'healthy') healthStatus.status = 'warning';
    }

    // Check database performance
    if (queryStats.averageQueryTime > 1000) {
      healthStatus.checks.databasePerformance.status = 'critical';
      healthStatus.checks.databasePerformance.message = 'Database queries are too slow';
      healthStatus.status = 'critical';
    } else if (queryStats.averageQueryTime > 500) {
      healthStatus.checks.databasePerformance.status = 'warning';
      healthStatus.checks.databasePerformance.message = 'Database queries are slower than optimal';
      if (healthStatus.status === 'healthy') healthStatus.status = 'warning';
    }

    const statusCode = healthStatus.status === 'critical' ? 503 : 200;
    return res.status(statusCode).json({
      success: true,
      data: healthStatus
    });
  } catch (err) {
    next(err);
  }
};

/** POST /api/performance/clear */
export const clearPerformanceData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const olderThan = parseInt(req.body.olderThan as string) || 86400000; // Default: 24 hours
    
    if (olderThan < 3600000) {
      throw new ApiError(400, 'Cannot clear data newer than 1 hour');
    }

    const monitor = PerformanceMonitor.getInstance();
    monitor.clearOldMetrics(olderThan);

    return success(res, {
      message: 'Performance data cleared successfully',
      clearedDataOlderThan: olderThan / 1000 / 60 / 60 // Convert to hours
    });
  } catch (err) {
    next(err);
  }
};