import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuditService } from '../services/auditService';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to generate JWT token
const generateToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '24h' });
};

// Register a new user
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role, rescueId, profileInfo } = req.body;

    // Validate required fields
    if (!username || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate role
    const validRoles = ['user', 'rescue', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Check if rescueId is provided for rescue role
    if (role === 'rescue' && !rescueId) {
      return res.status(400).json({
        success: false,
        message: 'Rescue ID is required for rescue role'
      });
    }

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role,
        rescueId,
        profileInfo
      }
    });

    // Log user registration
    await AuditService.logUserCreated('system', user.id, user.username, user.role, req.ip, req.get('User-Agent'));

    // Update last login (since they're automatically logged in)
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Log the automatic login
    await AuditService.logLogin(user.id, req.ip, req.get('User-Agent'));

    // Generate token
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        rescueId: user.rescueId,
        token
      }
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Log the login
    await AuditService.logLogin(user.id, req.ip, req.get('User-Agent'));

    // Generate token
    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        rescueId: user.rescueId,
        token
      }
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        rescueId: true,
        createdAt: true,
        lastLogin: true,
        profileInfo: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ data: user });
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { username, email, profileInfo, currentPassword, newPassword } = req.body;

    // Check for username/email conflicts
    if (username || email) {
      const conflictUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(username ? [{ username }] : []),
            ...(email ? [{ email }] : []),
          ],
          NOT: { id: userId },
        },
      });

      if (conflictUser) {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        });
      }
    }

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        rescueId: true,
        profileInfo: true,
        passwordHash: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle password change if provided
    if (currentPassword && newPassword) {
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, currentUser.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      // Log password change
      await AuditService.logPasswordChanged(
        userId,
        currentUser.username,
        currentPassword,
        newPassword,
        req.ip,
        req.get('User-Agent')
      );

      // Update user with new password
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          ...(username && { username }),
          ...(email && { email }),
          ...(profileInfo && { profileInfo: JSON.stringify(profileInfo) }),
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          rescueId: true,
          profileInfo: true,
          createdAt: true,
          lastLogin: true,
        },
      });

      // Log profile update (excluding password details)
      await AuditService.logUserUpdated(
        userId, 
        userId, 
        updatedUser.username, 
        { username, email, profileInfo, passwordChanged: true }, 
        req.ip, 
        req.get('User-Agent')
      );

      res.json({
        success: true,
        data: updatedUser,
      });
    } else {
      // No password change, just update other fields
      const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
        ...(email && { email }),
        ...(profileInfo && { profileInfo: JSON.stringify(profileInfo) }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        rescueId: true,
        profileInfo: true,
        createdAt: true,
        lastLogin: true,
      },
    });

      // Log profile update
      await AuditService.logUserUpdated(
        userId, 
        userId, 
        updatedUser.username, 
        { username, email, profileInfo }, 
        req.ip, 
        req.get('User-Agent')
      );

    res.json({
      success: true,
      data: updatedUser,
    });
    }
  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user profile (alias for getProfile)
export const getUserProfile = async (req: Request, res: Response) => {
  return getProfile(req, res);
};

// Update user profile (alias for updateProfile)
export const updateUserProfile = async (req: Request, res: Response) => {
  return updateProfile(req, res);
};

// Get user applications
export const getUserApplications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        skip,
        take: limit,
        where: { userId },
        include: {
          pet: {
            include: {
              rescue: {
                select: {
                  id: true,
                  name: true,
                  location: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.application.count({ where: { userId } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: applications,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error in getUserApplications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Request rescue upgrade
export const requestRescueUpgrade = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { reason, rescueName, rescueLocation, couponCode } = req.body;

    // Validate required fields
    if (!reason || !rescueName || !rescueLocation) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if user already has a pending request
    const existingRequest = await prisma.rescueRequest.findFirst({
      where: {
        userId,
        status: 'pending',
      },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending rescue request'
      });
    }

    // Calculate required fee (placeholder - in real implementation, this would be configurable)
    const requiredFee = 50.0; // $50 fee for rescue upgrade

    const rescueRequest = await prisma.rescueRequest.create({
      data: {
        userId,
        reason,
        rescueName,
        rescueLocation,
        couponCode,
        requiredFee,
        amountPaid: 0,
        status: 'pending',
      },
    });

    res.status(201).json({
      success: true,
      data: rescueRequest,
    });
  } catch (error) {
    console.error('Error in requestRescueUpgrade:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      message: 'Internal server error',
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
};

// Request password reset
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Return success even if user doesn't exist for security
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link'
      });
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const resetTokenHash = await bcrypt.hash(resetToken, salt);

    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: resetTokenHash,
      }
    });

    // TODO: Send email with reset token
    // For now, just return the token (in production, this should be sent via email)
    res.json({
      success: true,
      message: 'Password reset instructions sent to email',
      data: { resetToken } // Remove this in production
    });
  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.passwordResetTokenHash) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Verify reset token
    const isValidToken = await bcrypt.compare(resetToken, user.passwordResetTokenHash);
    if (!isValidToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Log password reset
    await AuditService.logPasswordChanged(
      user.id,
      user.username,
      'RESET_TOKEN', // Since we don't have the old password
      newPassword,
      req.ip,
      req.get('User-Agent')
    );

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
      }
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
};

// Check if user has been recently promoted to rescue
export const checkRescuePromotion = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        rescue: true,
        rescueRequests: {
          where: {
            status: 'approved',
            approvalDate: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          orderBy: {
            approvalDate: 'desc'
          },
          take: 1
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user was recently promoted to rescue
    const recentlyPromoted = user.role === 'rescue' && 
                            user.rescueRequests.length > 0 &&
                            user.rescueRequests[0].approvalDate &&
                            new Date(user.rescueRequests[0].approvalDate).getTime() > Date.now() - 24 * 60 * 60 * 1000;

    res.json({
      recentlyPromoted,
      rescueId: user.rescueId,
      rescueName: user.rescue?.name || null
    });
  } catch (error) {
    console.error('Error checking rescue promotion:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      message: 'Internal server error',
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
}; 