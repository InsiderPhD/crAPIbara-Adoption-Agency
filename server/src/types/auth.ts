import { Request } from 'express';

interface User {
  userId: string;
  role: 'user' | 'rescue' | 'admin';
  rescueId?: string | null;
}

export interface AuthRequest extends Request {
  user?: User;
} 