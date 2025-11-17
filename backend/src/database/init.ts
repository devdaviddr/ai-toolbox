import sql from 'mssql';
import logger from '../logger.js';

// Embedded SQL for database initialization
const INIT_SQL = `
-- Create users table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
CREATE TABLE users (
    oid NVARCHAR(36) PRIMARY KEY,  -- Azure AD Object ID
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) UNIQUE NOT NULL,
    preferred_username NVARCHAR(255),
    tenant_id NVARCHAR(36),
    roles NVARCHAR(MAX),  -- JSON array of roles
    claims NVARCHAR(MAX), -- JSON object of all claims
    first_login DATETIME2 DEFAULT GETDATE(),
    last_login DATETIME2 DEFAULT GETDATE(),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Create indexes for better performance if they don't exist
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_email' AND object_id = OBJECT_ID('users'))
CREATE INDEX idx_users_email ON users(email);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_tenant_id' AND object_id = OBJECT_ID('users'))
CREATE INDEX idx_users_tenant_id ON users(tenant_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_last_login' AND object_id = OBJECT_ID('users'))
CREATE INDEX idx_users_last_login ON users(last_login);
`;

export function getInitConfig(): sql.config {
  return {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Password123!',
    server: process.env.DB_SERVER || 'localhost',
    database: 'master', // Connect to master to create the database
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  };
}

export const initializeDatabase = async () => {
  try {
    const initConfig = getInitConfig();
    const pool = new sql.ConnectionPool(initConfig);
    await pool.connect();

    // Create database if it doesn't exist
    await pool.request().query(`
      IF DB_ID('ai_toolbox_db') IS NULL
      BEGIN
        CREATE DATABASE ai_toolbox_db;
      END
    `);

    await pool.close();

    // Now connect to the created database and run the schema
    const dbConfig = {
      ...initConfig,
      database: 'ai_toolbox_db',
    };
    const dbPool = new sql.ConnectionPool(dbConfig);
    await dbPool.connect();

    // Execute the embedded initialization SQL
    // Split by GO statements and execute each batch
    const batches = INIT_SQL.split(/\bGO\b/i).filter((batch) => batch.trim().length > 0);

    for (const batch of batches) {
      if (batch.trim()) {
        await dbPool.request().query(batch);
      }
    }

    await dbPool.close();
    logger.info('Database initialization complete');
  } catch (error) {
    logger.error('Database initialization failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
