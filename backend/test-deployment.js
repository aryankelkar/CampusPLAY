/**
 * Deployment Validation Script
 * Run this to test backend configuration before deployment
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
};

async function validateEnvironment() {
  console.log('\n🔍 Validating Environment Variables...\n');

  const required = ['MONGO_URI', 'JWT_SECRET', 'PORT'];
  const optional = ['CORS_ORIGIN', 'ADMIN_EMAIL', 'NODE_ENV'];

  let hasErrors = false;

  // Check required variables
  required.forEach((varName) => {
    if (process.env[varName]) {
      log.success(`${varName} is set`);
    } else {
      log.error(`${varName} is missing (REQUIRED)`);
      hasErrors = true;
    }
  });

  // Check optional variables
  optional.forEach((varName) => {
    if (process.env[varName]) {
      log.success(`${varName} is set: ${process.env[varName]}`);
    } else {
      log.warning(`${varName} is not set (optional)`);
    }
  });

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    log.warning('JWT_SECRET should be at least 32 characters for security');
  }

  // Validate MONGO_URI format
  if (process.env.MONGO_URI && !process.env.MONGO_URI.startsWith('mongodb')) {
    log.error('MONGO_URI should start with mongodb:// or mongodb+srv://');
    hasErrors = true;
  }

  return !hasErrors;
}

async function testDatabaseConnection() {
  console.log('\n🔍 Testing MongoDB Connection...\n');

  try {
    if (!process.env.MONGO_URI) {
      log.error('MONGO_URI not set, skipping database test');
      return false;
    }

    log.info('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    log.success('MongoDB connection successful');
    log.info(`Connected to: ${mongoose.connection.host}`);

    await mongoose.connection.close();
    log.success('MongoDB connection closed cleanly');

    return true;
  } catch (error) {
    log.error(`MongoDB connection failed: ${error.message}`);
    if (error.message.includes('ENOTFOUND')) {
      log.warning('Check your MONGO_URI and internet connection');
    } else if (error.message.includes('authentication')) {
      log.warning('Check your MongoDB username and password');
    } else if (error.message.includes('timeout')) {
      log.warning('Check MongoDB Atlas IP whitelist (add 0.0.0.0/0)');
    }
    return false;
  }
}

async function testCORSConfiguration() {
  console.log('\n🔍 Validating CORS Configuration...\n');

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  log.info(`CORS Origin: ${corsOrigin}`);

  if (corsOrigin.endsWith('/')) {
    log.warning('CORS_ORIGIN should not have trailing slash');
  }

  if (process.env.NODE_ENV === 'production' && corsOrigin.includes('localhost')) {
    log.warning('Production environment with localhost CORS origin');
  }

  log.success('CORS configuration validated');
  return true;
}

async function runTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  CampusPlay Deployment Validation     ║');
  console.log('╚════════════════════════════════════════╝\n');

  const envValid = await validateEnvironment();
  const dbValid = await testDatabaseConnection();
  const corsValid = await testCORSConfiguration();

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║           Test Summary                 ║');
  console.log('╚════════════════════════════════════════╝\n');

  console.log(`Environment Variables: ${envValid ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database Connection:   ${dbValid ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`CORS Configuration:    ${corsValid ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = envValid && dbValid && corsValid;

  if (allPassed) {
    console.log('\n🎉 All tests passed! Ready for deployment.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Fix issues before deploying.\n');
    process.exit(1);
  }
}

runTests();
