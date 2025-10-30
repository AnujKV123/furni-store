import { Router } from "express";
import {
  getSystemHealth,
  validateDataIntegrity,
  getSystemStats,
  testAllEndpoints,
  seedTestData
} from "../controllers/systemValidationController";

const router = Router();

// System health check
router.get("/health", getSystemHealth);

// Data integrity validation
router.get("/validate-data", validateDataIntegrity);

// System statistics
router.get("/stats", getSystemStats);

// Test all endpoints
router.get("/test-endpoints", testAllEndpoints);

// Seed test data (development only)
router.post("/seed-test-data", seedTestData);

export default router;