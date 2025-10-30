import { Router } from 'express';
import { getPerformanceStats, getHealthCheck, clearPerformanceData } from '../controllers/performanceController';

const router = Router();

// GET /api/performance/stats - Get performance statistics
router.get('/stats', getPerformanceStats);

// GET /api/performance/health - Get health check status
router.get('/health', getHealthCheck);

// POST /api/performance/clear - Clear old performance data (admin only)
router.post('/clear', clearPerformanceData);

export default router;