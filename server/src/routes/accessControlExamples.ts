import express from 'express';
import { authenticate } from '../middleware/auth';
import { accessControl } from '../middleware/accessControl';

const router = express.Router();

/**
 * Example routes demonstrating the new access control middleware system
 * 
 * This file shows how developers can easily apply different access control
 * patterns to their routes by simply adding the appropriate middleware.
 */

// ==================== ADMIN ONLY ROUTES ====================

/**
 * Admin-only route - only users with admin role can access
 * Usage: Simply add adminOnly middleware
 */
router.get('/admin/dashboard', 
  authenticate,           // First authenticate the user
  accessControl.adminOnly, // Then check if they're admin
  (req, res) => {
    res.json({ message: 'Admin dashboard data' });
  }
);

/**
 * Admin-only user management
 */
router.get('/admin/users',
  authenticate,
  accessControl.adminOnly,
  (req, res) => {
    res.json({ message: 'User management data' });
  }
);

// ==================== AUTHENTICATED ROUTES ====================

/**
 * Authenticated route - any registered user can access
 * Usage: Add authenticated middleware
 */
router.get('/profile',
  authenticate,           // First authenticate the user
  accessControl.authenticated, // Then check if they're authenticated
  (req, res) => {
    res.json({ message: 'User profile data' });
  }
);

/**
 * Authenticated route for user settings
 */
router.put('/settings',
  authenticate,
  accessControl.authenticated,
  (req, res) => {
    res.json({ message: 'Settings updated' });
  }
);

// ==================== RESCUE ONLY ROUTES ====================

/**
 * Rescue-only route - only users with rescue role can access
 * Usage: Add rescueOnly middleware
 */
router.get('/rescue/pets',
  authenticate,           // First authenticate the user
  accessControl.rescueOnly, // Then check if they're rescue
  (req, res) => {
    res.json({ message: 'Rescue pets data' });
  }
);

/**
 * Rescue-only pet management
 */
router.post('/rescue/pets',
  authenticate,
  accessControl.rescueOnly,
  (req, res) => {
    res.json({ message: 'Pet created' });
  }
);

// ==================== OWN ACCOUNT ROUTES ====================

/**
 * Own account route - users can only access their own resources
 * Usage: Add ownAccount middleware
 */
router.get('/users/:userId/profile',
  authenticate,           // First authenticate the user
  accessControl.ownAccount, // Then check if they're accessing their own account
  (req, res) => {
    res.json({ message: 'User profile data' });
  }
);

/**
 * Own account route for updating user data
 */
router.put('/users/:userId',
  authenticate,
  accessControl.ownAccount,
  (req, res) => {
    res.json({ message: 'User updated' });
  }
);

// ==================== OWN RESCUE ROUTES ====================

/**
 * Own rescue route - rescue users can only access resources from their rescue
 * Usage: Add ownRescue middleware
 */
router.get('/rescues/:rescueId/pets',
  authenticate,           // First authenticate the user
  accessControl.ownRescue, // Then check if they're accessing their own rescue
  (req, res) => {
    res.json({ message: 'Rescue pets data' });
  }
);

/**
 * Own rescue route for managing rescue data
 */
router.put('/rescues/:rescueId',
  authenticate,
  accessControl.ownRescue,
  (req, res) => {
    res.json({ message: 'Rescue updated' });
  }
);

// ==================== COMBINED ACCESS PATTERNS ====================

/**
 * Admin or own account - admins can access anything, users can only access their own
 * Usage: Use the combined middleware
 */
router.get('/users/:userId/applications',
  authenticate,
  accessControl.adminOrOwnAccount,
  (req, res) => {
    res.json({ message: 'User applications data' });
  }
);

/**
 * Rescue or own rescue - admins can access anything, rescue users can only access their rescue
 * Usage: Use the combined middleware
 */
router.get('/rescues/:rescueId/applications',
  authenticate,
  accessControl.rescueOrOwnRescue,
  (req, res) => {
    res.json({ message: 'Rescue applications data' });
  }
);

// ==================== MULTIPLE MIDDLEWARE COMBINATIONS ====================

/**
 * Complex access control - multiple middleware layers
 * This route requires authentication AND admin role AND own account validation
 */
router.delete('/users/:userId',
  authenticate,           // Must be authenticated
  accessControl.adminOnly, // Must be admin
  accessControl.ownAccount, // Must be accessing own account (though admin can access any)
  (req, res) => {
    res.json({ message: 'User deleted' });
  }
);

/**
 * Another complex example - rescue user managing their own rescue's pets
 */
router.put('/rescues/:rescueId/pets/:petId',
  authenticate,           // Must be authenticated
  accessControl.rescueOnly, // Must be rescue role
  accessControl.ownRescue, // Must be accessing own rescue
  (req, res) => {
    res.json({ message: 'Pet updated' });
  }
);

// ==================== PUBLIC ROUTES ====================

/**
 * Public route - no access control needed
 */
router.get('/public/pets', (req, res) => {
  res.json({ message: 'Public pets data' });
});

/**
 * Public route for rescue listings
 */
router.get('/public/rescues', (req, res) => {
  res.json({ message: 'Public rescues data' });
});

export default router;
