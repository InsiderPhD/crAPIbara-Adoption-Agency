import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { errorHandler } from './middleware/errorHandler';
import { responseHandler } from './middleware/responseHandler';
import rescueRoutes from './routes/rescueRoutes';
import petRoutes from './routes/petRoutes';
import userRoutes from './routes/userRoutes';
import userMeRoutes from './routes/userMeRoutes';
import applicationRoutes from './routes/applications';
import rescueRequestRoutes from './routes/rescueRequestRoutes';
import promotionRoutes from './routes/promotionRoutes';
import adminRoutes from './routes/adminRoutes';
import rescueMeRoutes from './routes/rescueMeRoutes';
import SchedulerService from './services/schedulerService';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors());
app.use(express.json());
app.use(responseHandler);

// API Routes
const apiVersion = 'v1';
app.use(`/api/${apiVersion}`, (req, res, next) => {
  // Add API version to request for logging/monitoring
  req.headers['x-api-version'] = apiVersion;
  next();
});

// Mount routes
// Mount public rescue routes first (listRescues, getRescue, etc.)
app.use(`/api/${apiVersion}/rescues`, rescueRoutes);

// Mount protected rescue management routes with specific path
app.use(`/api/${apiVersion}/rescues/me`, rescueMeRoutes);

app.use(`/api/${apiVersion}/pets`, petRoutes);
app.use(`/api/${apiVersion}/users`, userRoutes);
app.use(`/api/${apiVersion}/users`, userMeRoutes);
app.use(`/api/${apiVersion}/applications`, applicationRoutes);
app.use(`/api/${apiVersion}/rescue-requests`, rescueRequestRoutes);
app.use(`/api/${apiVersion}/promotions`, promotionRoutes);
app.use(`/api/${apiVersion}/admin`, adminRoutes);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Server is accessible from any IP address`);
  console.log(`API version: ${apiVersion}`);
  
  // Initialize scheduler service
  SchedulerService.getInstance();
  console.log('Scheduler service initialized');
}); 