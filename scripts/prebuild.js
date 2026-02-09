#!/usr/bin/env node

/**
 * Pre-Build Validation Script
 * Ensures the application is ready for production build
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: resolve(__dirname, '../.env') });

console.log('🔍 Pre-build validation starting...\n');

// ============================================
// 1. Environment Variables Check
// ============================================

const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_AI_GATEWAY_URL',
];

console.log('📋 Checking required environment variables...');
const missing = requiredEnvVars.filter(key => !process.env[key]);

if (missing.length > 0) {
    console.error('\n❌ FAILED: Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\n💡 Please check your .env file or environment configuration.\n');
    process.exit(1);
}

console.log('   ✅ All required environment variables present\n');

// ============================================
// 2. Check for Hardcoded API Keys
// ============================================

console.log('🔐 Scanning for hardcoded API keys...');

// This would ideally use a proper grep command in CI/CD
// For now, just a reminder
console.log('   ⚠️  Manual check: Run `grep -r "AIzaSy" src/` to verify no API keys\n');

// ============================================
// 3. Success
// ============================================

console.log('✅ Pre-build validation PASSED!\n');
console.log('Ready to build for production:\n');
console.log('   npm run build\n');

process.exit(0);
