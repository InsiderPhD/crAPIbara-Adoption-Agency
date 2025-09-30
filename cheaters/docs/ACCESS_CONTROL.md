# Access Control Middleware System

This document explains how to use the new access control middleware system that allows developers to easily turn on/off various access control features.

## Overview

The access control system provides five main middleware functions that can be easily applied to routes:

- `adminOnly` - Only users with admin role can access
- `authenticated` - Only registered users of any role can access  
- `rescueOnly` - Only users with rescue role can access
- `ownAccount` - Users can only access their own resources
- `ownRescue` - Rescue users can only access resources from their rescue

## Configuration

All access control features can be easily enabled/disabled through the configuration file:

```typescript
// server/src/config/accessControl.ts
export const accessControlConfig: AccessControlConfig = {
  adminOnly: true,           // Enable/disable admin-only access control
  authenticated: true,       // Enable/disable authentication requirement
  rescueOnly: true,          // Enable/disable rescue-only access control
  ownAccount: true,          // Enable/disable own account validation
  ownRescue: true,          // Enable/disable own rescue validation
  strictRoleValidation: true,
  resourceOwnershipValidation: true,
  enableAccessLogging: false, // Enable/disable access control logging
  bypassAccessControl: false, // DANGER: Disable all access control (dev only)
};
```

## Basic Usage

### 1. Admin Only Routes

```typescript
import { accessControl } from '../middleware/accessControl';

// Only admin users can access this route
router.get('/admin/dashboard', 
  authenticate,
  accessControl.adminOnly,
  (req, res) => {
    res.json({ message: 'Admin dashboard' });
  }
);
```

### 2. Authenticated Routes

```typescript
// Any authenticated user can access this route
router.get('/profile',
  authenticate,
  accessControl.authenticated,
  (req, res) => {
    res.json({ message: 'User profile' });
  }
);
```

### 3. Rescue Only Routes

```typescript
// Only rescue users can access this route
router.get('/rescue/pets',
  authenticate,
  accessControl.rescueOnly,
  (req, res) => {
    res.json({ message: 'Rescue pets' });
  }
);
```

### 4. Own Account Routes

```typescript
// Users can only access their own account
router.get('/users/:userId/profile',
  authenticate,
  accessControl.ownAccount,
  (req, res) => {
    res.json({ message: 'User profile' });
  }
);
```

### 5. Own Rescue Routes

```typescript
// Rescue users can only access resources from their rescue
router.get('/rescues/:rescueId/pets',
  authenticate,
  accessControl.ownRescue,
  (req, res) => {
    res.json({ message: 'Rescue pets' });
  }
);
```

## Combined Patterns

The system also provides combined middleware for common patterns:

### Admin or Own Account

```typescript
// Admins can access anything, users can only access their own resources
router.get('/users/:userId/applications',
  authenticate,
  accessControl.adminOrOwnAccount,
  (req, res) => {
    res.json({ message: 'User applications' });
  }
);
```

### Rescue or Own Rescue

```typescript
// Admins can access anything, rescue users can only access their rescue
router.get('/rescues/:rescueId/applications',
  authenticate,
  accessControl.rescueOrOwnRescue,
  (req, res) => {
    res.json({ message: 'Rescue applications' });
  }
);
```

## Multiple Middleware Layers

You can combine multiple middleware for complex access control:

```typescript
// Requires authentication AND admin role AND own account validation
router.delete('/users/:userId',
  authenticate,           // Must be authenticated
  accessControl.adminOnly, // Must be admin
  accessControl.ownAccount, // Must be accessing own account
  (req, res) => {
    res.json({ message: 'User deleted' });
  }
);
```

## Resource-Specific Middleware

The system also includes resource-specific middleware:

### Pet Ownership

```typescript
import { ownPet } from '../middleware/accessControl';

// Validates that the pet belongs to the user's rescue
router.put('/pets/:petId',
  authenticate,
  ownPet,
  (req, res) => {
    res.json({ message: 'Pet updated' });
  }
);
```

### Application Ownership

```typescript
import { ownApplication } from '../middleware/accessControl';

// Validates application ownership
router.get('/applications/:applicationId',
  authenticate,
  ownApplication,
  (req, res) => {
    res.json({ message: 'Application data' });
  }
);
```

## Enabling/Disabling Features

### Disable Specific Features

To disable a specific access control feature, simply set it to `false` in the configuration:

```typescript
// Disable admin-only access control
accessControlConfig.adminOnly = false;

// Disable own account validation
accessControlConfig.ownAccount = false;
```

### Disable All Access Control (Development Only)

```typescript
import { disableAccessControl, enableAccessControl } from '../config/accessControl';

// Disable all access control (DEVELOPMENT ONLY)
disableAccessControl();

// Re-enable access control
enableAccessControl();
```

### Enable Access Logging

```typescript
// Enable detailed access control logging
accessControlConfig.enableAccessLogging = true;
```

## Response Format

All access control middleware uses the standardized response format:

### Error Responses

```json
{
  "result": "error",
  "error_code": 401,
  "error_message": "Authentication required"
}
```

### Success Responses

```json
{
  "id": "user-id",
  "username": "jane_doe",
  "role": "user"
}
```

## Migration from Old System

### Before (Old System)

```typescript
// Old way - using authorize middleware
router.get('/admin/users',
  authenticate,
  authorize('admin'),
  getAllUsers
);
```

### After (New System)

```typescript
// New way - using access control middleware
router.get('/admin/users',
  authenticate,
  accessControl.adminOnly,
  getAllUsers
);
```

## Best Practices

1. **Always authenticate first**: Use `authenticate` middleware before any access control middleware
2. **Use specific middleware**: Choose the most specific middleware for your use case
3. **Combine when needed**: Use multiple middleware layers for complex access control
4. **Test thoroughly**: Test all access control scenarios when enabling/disabling features
5. **Log access**: Enable access logging during development to debug access control issues

## Examples

See `server/src/routes/accessControlExamples.ts` for comprehensive examples of how to use all the access control middleware patterns.

## Security Considerations

- Never disable access control in production
- Always test access control changes thoroughly
- Use the bypass feature only for development/testing
- Monitor access logs for suspicious activity
- Keep the configuration secure and version-controlled
