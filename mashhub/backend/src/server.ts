import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import songRoutes from './routes/songRoutes';
import importRoutes from './routes/importRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/songs', songRoutes);
app.use('/api/import', importRoutes);

// Error handling
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  void next;
  const stack = err instanceof Error ? err.stack : String(err);
  console.error(stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
