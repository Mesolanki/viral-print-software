import express from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Setup Prisma Client with Postgres adapter (Prisma 7 style)
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    res.json({
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: String(error) });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
