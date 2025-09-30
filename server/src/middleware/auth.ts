import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { sendUnauthorized, sendForbidden } from '../utils/responseHelper';

// VULNERABILITY: JWT Signature Verification Bypass
// This middleware intentionally skips JWT signature verification to demonstrate
// a critical security vulnerability. In production, this would allow attackers
// to forge JWTs and gain unauthorized access to admin functions.

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
  userId: string;
  role: string;
}

interface AuthUser {
  userId: string;
  role: string;
  rescueId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    
    // VULNERABILITY: JWT Signature Not Verified
    // Instead of using jwt.verify() which checks the cryptographic signature,
    // we use jwt.decode() which only decodes the payload without signature verification
    // This allows attackers to modify the JWT payload (e.g., change role to "admin") 
    // and use it without needing the secret key
    const decoded = jwt.decode(token) as JwtPayload;
    
    if (!decoded) {
      return sendUnauthorized(res, 'Invalid token format');
    }

    // VULNERABILITY: Trust the decoded payload without signature verification
    // An attacker can take any valid JWT, decode it, change the role to "admin",
    // re-encode it with any signature (or none), and use it for admin actions
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return sendUnauthorized(res, 'User no longer exists');
    }

    // VULNERABILITY: Use the role from the decoded JWT instead of the database
    // This allows role escalation attacks where an attacker can change their role
    // in the JWT payload to gain admin privileges
    req.user = {
      userId: user.id,
      role: decoded.role, // Use role from JWT instead of database
      rescueId: user.rescueId
    };
    next();
  } catch (error) {
    return sendUnauthorized(res, 'Invalid token');
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      return sendForbidden(res, 'Insufficient permissions');
    }

    next();
  };
}; 