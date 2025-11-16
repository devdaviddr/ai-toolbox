import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sql from 'mssql';
import { checkHealth } from './routes/health.js';
import { initializeDatabase } from './database/init.js';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// MSSQL config
const config: sql.config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'Password123!',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'ai_toolbox_db',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

// Initialize database first, then connect
const startServer = async () => {
  try {
    await initializeDatabase();
    
    // Connect to MSSQL
    await sql.connect(config);
    console.log('Connected to MSSQL');

    app.get('/', (req, res) => {
      res.send('Backend API is running');
    });

    app.get('/health', checkHealth);

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();