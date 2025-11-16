import sql from 'mssql';

const initConfig: sql.config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Password123!',
  server: process.env.DB_SERVER || 'localhost',
  database: 'master', // Connect to master to create the database
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

export const initializeDatabase = async () => {
  try {
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
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
};