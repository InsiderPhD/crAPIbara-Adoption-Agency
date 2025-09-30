/**
 * Access Control Configuration
 * 
 * This configuration allows developers to easily turn on/off various access control features.
 * Set any feature to false to disable that particular access control check.
 */

export interface AccessControlConfig {
  // Core authentication features
  adminOnly: boolean;
  authenticated: boolean;
  rescueOnly: boolean;
  
  // Resource ownership features
  ownAccount: boolean;
  ownRescue: boolean;
  
  // Additional security features
  strictRoleValidation: boolean;
  resourceOwnershipValidation: boolean;
  
  // Debugging and development features
  enableAccessLogging: boolean;
  bypassAccessControl: boolean; // DANGER: Only for development/testing
}

export const accessControlConfig: AccessControlConfig = {
  // Core authentication features
  adminOnly: true,
  authenticated: true,
  rescueOnly: true,
  
  // Resource ownership features
  ownAccount: true,
  ownRescue: true,
  
  // Additional security features
  strictRoleValidation: true,
  resourceOwnershipValidation: true,
  
  // Debugging and development features
  enableAccessLogging: false,
  bypassAccessControl: false, // Set to true to disable all access control (DEVELOPMENT ONLY)
};

/**
 * Helper function to check if a specific access control feature is enabled
 */
export const isAccessControlEnabled = (feature: keyof AccessControlConfig): boolean => {
  return accessControlConfig[feature];
};

/**
 * Helper function to get all enabled access control features
 */
export const getEnabledFeatures = (): string[] => {
  return Object.entries(accessControlConfig)
    .filter(([_, enabled]) => enabled)
    .map(([feature, _]) => feature);
};

/**
 * Helper function to temporarily disable access control for testing
 * WARNING: This should only be used in development/testing environments
 */
export const disableAccessControl = (): void => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot disable access control in production environment');
  }
  accessControlConfig.bypassAccessControl = true;
};

/**
 * Helper function to re-enable access control
 */
export const enableAccessControl = (): void => {
  accessControlConfig.bypassAccessControl = false;
};
