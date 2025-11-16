import express from 'express';
import cors from 'cors';
import { checkHealth } from './routes/health';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.get('/', (req, res) => {
  res.send('Backend API is running');
});

app.get('/health', checkHealth);

// Export app for testing
export default app;