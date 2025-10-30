import { PrismaClient } from "@prisma/client";
import { createOptimizedPrismaClient, getDatabaseConfig, checkDatabaseHealth } from "./config/database";

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client with optimized configuration
const createPrismaClient = () => {
  const config = getDatabaseConfig();
  return createOptimizedPrismaClient(config);
};

// Use global variable in development to prevent multiple instances
// In production, create a new instance
export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Initialize database connection and health check
const initializeDatabase = async () => {
  try {
    await prisma.$connect();
    const isHealthy = await checkDatabaseHealth(prisma);
    if (!isHealthy) {
      console.warn('Database health check failed during initialization');
    } else {
      console.log('Database connection established successfully');
    }
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
  }
};

// Initialize on startup
initializeDatabase();

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down database connection...');
  await prisma.$disconnect();
  console.log('Database connection closed');
};

process.on('beforeExit', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
