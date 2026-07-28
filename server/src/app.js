import express from 'express';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import categoryRouter from './routes/category.routes.js';
import productRouter from './routes/product.routes.js';
import taskRouter from './routes/task.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// ── 1. Parser Middlewares ───────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── 2. CORS (LAN / Offline Friendly) ───────────────────────
// Allows requests from any origin on the local network.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ── 3. Health Check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    message: 'Viral Print Media server is running',
    timestamp: new Date().toISOString(),
  });
});

// ── 4. API Routes ────────────────────────────────────────────
// Auth: login, /me, change-password
app.use('/api/auth', authRouter);

// User Management (Admin only — permission: manage_users)
app.use('/api/users', userRouter);

// Other modules (existing)
app.use('/api/categories', categoryRouter);
app.use('/api/products', productRouter);
app.use('/api/tasks', taskRouter);

// ── 5. 404 Handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── 6. Global Error Handler ──────────────────────────────────
app.use(errorHandler);

export default app;
