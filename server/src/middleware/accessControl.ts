import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { accessControlConfig, isAccessControlEnabled } from '../config/accessControl';
import { sendUnauthorized, sendForbidden, sendNotFound } from '../utils/responseHelper';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        rescueId?: string | null;
      };
    }
  }
}

/**
 * Log access control events for debugging
 */
const logAccessControl = (req: Request, action: string, result: 'allowed' | 'denied', reason?: string) => {
  if (isAccessControlEnabled('enableAccessLogging')) {
    console.log(`[ACCESS CONTROL] ${action} - ${result}${reason ? ` - ${reason}` : ''}`, {
      userId: req.user?.userId,
      role: req.user?.role,
      rescueId: req.user?.rescueId,
      path: req.path,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * adminOnly - allows a developer to specify if a route is only available for users with the admin role
 */
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  // Check if adminOnly access control is enabled
  if (!isAccessControlEnabled('adminOnly')) {
    logAccessControl(req, 'adminOnly', 'allowed', 'feature disabled');
    return next();
  }

  // Check if access control is bypassed (development only)
  if (isAccessControlEnabled('bypassAccessControl')) {
    logAccessControl(req, 'adminOnly', 'allowed', 'bypass enabled');
    return next();
  }

  // Check if user is authenticated
  if (!req.user) {
    logAccessControl(req, 'adminOnly', 'denied', 'not authenticated');
    return sendUnauthorized(res, 'Authentication required');
  }

  // Check if user has admin role
  if (req.user.role !== 'admin') {
    logAccessControl(req, 'adminOnly', 'denied', `role '${req.user.role}' is not admin`);
    return sendForbidden(res, 'Admin access required');
  }

  logAccessControl(req, 'adminOnly', 'allowed');
  next();
};

/**
 * authenticated - allows a developer to specify if a route is only available for registered users of any role
 */
export const authenticated = (req: Request, res: Response, next: NextFunction) => {
  // Check if authenticated access control is enabled
  if (!isAccessControlEnabled('authenticated')) {
    logAccessControl(req, 'authenticated', 'allowed', 'feature disabled');
    return next();
  }

  // Check if access control is bypassed (development only)
  if (isAccessControlEnabled('bypassAccessControl')) {
    logAccessControl(req, 'authenticated', 'allowed', 'bypass enabled');
    return next();
  }

  // Check if user is authenticated
  if (!req.user) {
    logAccessControl(req, 'authenticated', 'denied', 'not authenticated');
    return sendUnauthorized(res, 'Authentication required');
  }

  logAccessControl(req, 'authenticated', 'allowed');
  next();
};

/**
 * rescueOnly - allows a developer to specify if a route is only available to users with the rescue role
 */
export const rescueOnly = (req: Request, res: Response, next: NextFunction) => {
  // Check if rescueOnly access control is enabled
  if (!isAccessControlEnabled('rescueOnly')) {
    logAccessControl(req, 'rescueOnly', 'allowed', 'feature disabled');
    return next();
  }

  // Check if access control is bypassed (development only)
  if (isAccessControlEnabled('bypassAccessControl')) {
    logAccessControl(req, 'rescueOnly', 'allowed', 'bypass enabled');
    return next();
  }

  // Check if user is authenticated
  if (!req.user) {
    logAccessControl(req, 'rescueOnly', 'denied', 'not authenticated');
    return sendUnauthorized(res, 'Authentication required');
  }

  // Check if user has rescue role
  if (req.user.role !== 'rescue') {
    logAccessControl(req, 'rescueOnly', 'denied', `role '${req.user.role}' is not rescue`);
    return sendForbidden(res, 'Rescue access required');
  }

  logAccessControl(req, 'rescueOnly', 'allowed');
  next();
};

/**
 * ownAccount - allows a developer to specify if a route should check that the resource being requested belongs to that user
 * This middleware checks if the user is accessing their own account/resource
 */
export const ownAccount = (req: Request, res: Response, next: NextFunction) => {
  // Check if ownAccount access control is enabled
  if (!isAccessControlEnabled('ownAccount')) {
    logAccessControl(req, 'ownAccount', 'allowed', 'feature disabled');
    return next();
  }

  // Check if access control is bypassed (development only)
  if (isAccessControlEnabled('bypassAccessControl')) {
    logAccessControl(req, 'ownAccount', 'allowed', 'bypass enabled');
    return next();
  }

  // Check if user is authenticated
  if (!req.user) {
    logAccessControl(req, 'ownAccount', 'denied', 'not authenticated');
    return sendUnauthorized(res, 'Authentication required');
  }

  // Get the resource ID from the request (could be in params, body, or query)
  const resourceUserId = req.params.userId || req.params.id || req.body.userId || req.query.userId;
  
  if (!resourceUserId) {
    logAccessControl(req, 'ownAccount', 'denied', 'no resource user ID provided');
    return sendForbidden(res, 'Resource user ID required');
  }

  // Check if the resource belongs to the authenticated user
  if (resourceUserId !== req.user.userId) {
    logAccessControl(req, 'ownAccount', 'denied', `user '${req.user.userId}' accessing resource '${resourceUserId}'`);
    return sendForbidden(res, 'Access denied: You can only access your own resources');
  }

  logAccessControl(req, 'ownAccount', 'allowed');
  next();
};

/**
 * ownRescue - allows a developer to specify if a route should check that the resource being requested belongs to the same rescue that this user belongs to
 */
export const ownRescue = async (req: Request, res: Response, next: NextFunction) => {
  // Check if ownRescue access control is enabled
  if (!isAccessControlEnabled('ownRescue')) {
    logAccessControl(req, 'ownRescue', 'allowed', 'feature disabled');
    return next();
  }

  // Check if access control is bypassed (development only)
  if (isAccessControlEnabled('bypassAccessControl')) {
    logAccessControl(req, 'ownRescue', 'allowed', 'bypass enabled');
    return next();
  }

  // Check if user is authenticated
  if (!req.user) {
    logAccessControl(req, 'ownRescue', 'denied', 'not authenticated');
    return sendUnauthorized(res, 'Authentication required');
  }

  // Check if user has rescue role
  if (req.user.role !== 'rescue') {
    logAccessControl(req, 'ownRescue', 'denied', `role '${req.user.role}' is not rescue`);
    return sendForbidden(res, 'Rescue access required');
  }

  // Check if user has a rescueId
  if (!req.user.rescueId) {
    logAccessControl(req, 'ownRescue', 'denied', 'user has no rescue ID');
    return sendForbidden(res, 'User is not associated with a rescue');
  }

  // Get the resource rescue ID from the request
  const resourceRescueId = req.params.rescueId || req.body.rescueId || req.query.rescueId;
  
  if (!resourceRescueId) {
    logAccessControl(req, 'ownRescue', 'denied', 'no resource rescue ID provided');
    return sendForbidden(res, 'Resource rescue ID required');
  }

  // Check if the resource belongs to the same rescue as the user
  if (resourceRescueId !== req.user.rescueId) {
    logAccessControl(req, 'ownRescue', 'denied', `rescue '${req.user.rescueId}' accessing resource '${resourceRescueId}'`);
    return sendForbidden(res, 'Access denied: You can only access resources from your own rescue');
  }

  logAccessControl(req, 'ownRescue', 'allowed');
  next();
};

/**
 * Combined middleware factory for common access control patterns
 */
export const accessControl = {
  // Basic role-based access
  adminOnly,
  authenticated,
  rescueOnly,
  
  // Resource ownership access
  ownAccount,
  ownRescue,
  
  // Combined patterns
  adminOrOwnAccount: (req: Request, res: Response, next: NextFunction) => {
    if (!isAccessControlEnabled('adminOnly') && !isAccessControlEnabled('ownAccount')) {
      return next();
    }
    
    if (isAccessControlEnabled('bypassAccessControl')) {
      return next();
    }

    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }

    // Admin can access anything
    if (req.user.role === 'admin') {
      return next();
    }

    // Non-admin users can only access their own resources
    return ownAccount(req, res, next);
  },

  rescueOrOwnRescue: (req: Request, res: Response, next: NextFunction) => {
    if (!isAccessControlEnabled('rescueOnly') && !isAccessControlEnabled('ownRescue')) {
      return next();
    }
    
    if (isAccessControlEnabled('bypassAccessControl')) {
      return next();
    }

    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }

    // Admin can access anything
    if (req.user.role === 'admin') {
      return next();
    }

    // Rescue users can access their own rescue resources
    if (req.user.role === 'rescue') {
      return ownRescue(req, res, next);
    }

    return sendForbidden(res, 'Rescue access required');
  },

  adminOrRescue: (req: Request, res: Response, next: NextFunction) => {
    if (!isAccessControlEnabled('adminOnly') && !isAccessControlEnabled('rescueOnly')) {
      return next();
    }
    
    if (isAccessControlEnabled('bypassAccessControl')) {
      return next();
    }

    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }

    // Admin can access anything
    if (req.user.role === 'admin') {
      return next();
    }

    // Rescue users can access rescue resources
    if (req.user.role === 'rescue') {
      return next();
    }

    return sendForbidden(res, 'Admin or rescue access required');
  }
};

/**
 * Middleware to validate resource ownership for pets
 */
export const ownPet = async (req: Request, res: Response, next: NextFunction) => {
  if (!isAccessControlEnabled('resourceOwnershipValidation')) {
    return next();
  }

  if (isAccessControlEnabled('bypassAccessControl')) {
    return next();
  }

  if (!req.user) {
    return sendUnauthorized(res, 'Authentication required');
  }

  const petId = req.params.petId || req.params.id;
  if (!petId) {
    return sendForbidden(res, 'Pet ID required');
  }

  try {
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      select: { rescueId: true }
    });

    if (!pet) {
      return sendNotFound(res, 'Pet not found');
    }

    // Admin can access any pet
    if (req.user.role === 'admin') {
      return next();
    }

    // Rescue users can only access pets from their rescue
    if (req.user.role === 'rescue' && req.user.rescueId === pet.rescueId) {
      return next();
    }

    // Regular users cannot access rescue-specific pet management
    return sendForbidden(res, 'Access denied: You can only manage pets from your own rescue');
  } catch (error) {
    console.error('Error in ownPet middleware:', error);
    return sendForbidden(res, 'Error validating pet ownership');
  }
};

/**
 * Middleware to validate resource ownership for applications
 */
export const ownApplication = async (req: Request, res: Response, next: NextFunction) => {
  if (!isAccessControlEnabled('resourceOwnershipValidation')) {
    return next();
  }

  if (isAccessControlEnabled('bypassAccessControl')) {
    return next();
  }

  if (!req.user) {
    return sendUnauthorized(res, 'Authentication required');
  }

  const applicationId = req.params.applicationId || req.params.id;
  if (!applicationId) {
    return sendForbidden(res, 'Application ID required');
  }

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { userId: true, pet: { select: { rescueId: true } } }
    });

    if (!application) {
      return sendNotFound(res, 'Application not found');
    }

    // Admin can access any application
    if (req.user.role === 'admin') {
      return next();
    }

    // Users can access their own applications
    if (req.user.userId === application.userId) {
      return next();
    }

    // Rescue users can access applications for pets from their rescue
    if (req.user.role === 'rescue' && req.user.rescueId === application.pet.rescueId) {
      return next();
    }

    return sendForbidden(res, 'Access denied: You can only access your own applications or applications for pets from your rescue');
  } catch (error) {
    console.error('Error in ownApplication middleware:', error);
    return sendForbidden(res, 'Error validating application ownership');
  }
};
