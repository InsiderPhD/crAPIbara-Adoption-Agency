import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import userMeRoutes from './routes/userMeRoutes';
import petRoutes from './routes/petRoutes';
import applicationRoutes from './routes/applicationRoutes';
import adminRoutes from './routes/adminRoutes';
import rescueMeRoutes from './routes/rescueMeRoutes';
import rescueRequestRoutes from './routes/rescueRequestRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/users', userMeRoutes);
app.use('/api/v1/pets', petRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/rescues', rescueMeRoutes);
app.use('/api/v1/rescue-requests', rescueRequestRoutes);

// Error handling
app.use(errorHandler);

export default app; 