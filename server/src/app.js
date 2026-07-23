import express from 'express';
import authRouter from './routes/auth.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// 1. Parser Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Custom Lightweight CORS Middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 3. API Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 4. Mount Routes
app.use('/api/auth', authRouter);

// 5. Catch 404 (Not Found) Route
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `API Route not found: ${req.originalUrl}`
  });
});

// 6. Mount Global Error Handler Middleware
app.use(errorHandler);

export default app;
