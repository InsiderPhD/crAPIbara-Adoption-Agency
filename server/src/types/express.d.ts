import { User } from '../generated/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
} 