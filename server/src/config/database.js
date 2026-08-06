import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { env } from './env.js';

// Parse MySQL connection URL: mysql://user:pass@host:port/database
const url = new URL(env.databaseUrl);

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: decodeURIComponent(url.password),
  database: url.pathname.replace('/', ''),
});

// Local MySQL via XAMPP - fully offline, no internet required
export const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});
