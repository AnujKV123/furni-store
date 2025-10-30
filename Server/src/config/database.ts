import { PrismaClient } from '@prisma/client';

export interface DatabaseConfig {
  connectionLimit: number;
  connectionTimeout: number;
  queryTimeout: number;
  logLevel: 'query' | 'info' | 'warn' | 'error';
}

export const getDatabaseConfig = (): DatabaseConfig => {
  return {
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '10000'),
    logLevel: (process.env.DB_LOG_LEVEL as any) || 'error'
  };
};

export const createOptimizedPrismaClient = (config: DatabaseConfig) => {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Parse the connection string and add connection pooling parameters
  const url = new URL(connectionString);
  url.searchParams.set('connection_limit', config.connectionLimit.toString());
  url.searchParams.set('pool_timeout', (config.connectionTimeout / 1000).toString());
  
  return new PrismaClient({
    datasources: {
      db: {
        url: url.toString(),
      },
    },
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : [config.logLevel],
  });
};

// Query optimization utilities
export const withQueryOptimization = <T>(
  queryFn: () => Promise<T>,
  timeout: number = 10000
): Promise<T> => {
  return Promise.race([
    queryFn(),
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), timeout)
    )
  ]);
};

// Connection health check
export const checkDatabaseHealth = async (prisma: PrismaClient): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};