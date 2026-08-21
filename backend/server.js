// Loaded first so every imported module sees the .env values.
import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { createApp } from './app.js';
import { initializeSocket } from './services/socketService.js';

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('💡 Please check your .env file');
  process.exit(1);
}

const app = createApp();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
});

initializeSocket(io);

// DB
connectDB();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io enabled`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
