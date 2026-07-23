import express from 'express';
import dotenv from 'dotenv';
import { prisma } from './config/database.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Register API Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);

app.get('/api/health', async (req, res) => {
  try {
    // Query database to ensure connection is working
    const companyCount = await prisma.company.count();
    res.json({
      status: 'ok',
      message: 'Server is running and database is connected',
      database: 'connected',
      companyCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: String(error)
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
