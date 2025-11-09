// Database connection for Vercel serverless functions
import { Pool } from 'pg';

// Global connection pool for serverless functions
let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      // Optimized for serverless
      max: 1, // Limit connections for serverless
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Helper to close connections (for cleanup)
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}