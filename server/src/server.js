import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';

const startServer = async () => {
  try {
    // Test database connection
    console.log('Connecting to the database...');
    await prisma.$connect();
    console.log('Database connection established successfully!');

    // Start Express server
    const server = app.listen(env.port, () => {
      console.log(`=================================`);
      console.log(`Server is running in ${env.nodeEnv} mode`);
      console.log(`Listening at http://localhost:${env.port}`);
      console.log(`=================================`);
    });

    // Handle graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        await prisma.$disconnect();
        console.log('Database connection disconnected.');
        process.exit(0);
      });
      
      // Force exit after 10s if graceful shutdown hangs
      setTimeout(() => {
        console.error('Graceful shutdown timed out, force exiting.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
