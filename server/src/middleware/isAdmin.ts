import { Request, Response, NextFunction } from 'express';
import { User } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';
import { sendUnauthorized, sendForbidden } from '../utils/responseHelper';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & Partial<User>;
    }
  }
}

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return sendUnauthorized(res, 'Authentication required');
  }

  if (req.user.role !== 'admin') {
    return sendForbidden(res, 'Admin access required');
  }

  next();
}; 