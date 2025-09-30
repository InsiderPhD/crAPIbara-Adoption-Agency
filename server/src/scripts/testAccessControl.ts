#!/usr/bin/env node

/**
 * Access Control Configuration Test Script
 * 
 * This script demonstrates how to enable/disable various access control features
 * and shows the impact on API responses.
 */

import { accessControlConfig, disableAccessControl, enableAccessControl } from './config/accessControl';

console.log('🔐 Access Control Configuration Test\n');

// Show current configuration
console.log('📋 Current Configuration:');
console.log('========================');
Object.entries(accessControlConfig).forEach(([feature, enabled]) => {
  const status = enabled ? '✅ ENABLED' : '❌ DISABLED';
  console.log(`${feature.padEnd(25)}: ${status}`);
});

console.log('\n🔧 Testing Feature Toggle:\n');

// Test disabling adminOnly
console.log('1. Disabling adminOnly access control...');
accessControlConfig.adminOnly = false;
console.log(`   adminOnly: ${accessControlConfig.adminOnly ? 'ENABLED' : 'DISABLED'}`);

// Test disabling authenticated
console.log('2. Disabling authenticated access control...');
accessControlConfig.authenticated = false;
console.log(`   authenticated: ${accessControlConfig.authenticated ? 'ENABLED' : 'DISABLED'}`);

// Test enabling access logging
console.log('3. Enabling access control logging...');
accessControlConfig.enableAccessLogging = true;
console.log(`   enableAccessLogging: ${accessControlConfig.enableAccessLogging ? 'ENABLED' : 'DISABLED'}`);

console.log('\n📊 Updated Configuration:');
console.log('========================');
Object.entries(accessControlConfig).forEach(([feature, enabled]) => {
  const status = enabled ? '✅ ENABLED' : '❌ DISABLED';
  console.log(`${feature.padEnd(25)}: ${status}`);
});

console.log('\n⚠️  WARNING: Disabling access control features reduces security!');
console.log('   Only disable features in development/testing environments.\n');

// Test bypass functionality (development only)
if (process.env.NODE_ENV !== 'production') {
  console.log('🚨 Testing bypass functionality (DEVELOPMENT ONLY)...');
  disableAccessControl();
  console.log(`   bypassAccessControl: ${accessControlConfig.bypassAccessControl ? 'ENABLED' : 'DISABLED'}`);
  
  console.log('\n🔄 Re-enabling access control...');
  enableAccessControl();
  console.log(`   bypassAccessControl: ${accessControlConfig.bypassAccessControl ? 'ENABLED' : 'DISABLED'}`);
} else {
  console.log('🔒 Production environment detected - bypass functionality disabled');
}

console.log('\n✅ Access control configuration test completed!');
console.log('\n📖 For more information, see: server/src/docs/ACCESS_CONTROL.md');
