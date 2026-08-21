// Loaded first so every imported module sees the .env values.
import 'dotenv/config';
import crypto from 'crypto';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import { USER_ROLES } from './constants/index.js';
import { validatePassword } from './utils/passwordValidator.js';

/**
 * Admin provisioning.
 *
 * The administrator is created here (never through public registration).
 * Credentials come from ADMIN_EMAIL / ADMIN_PASSWORD. In non-production runs
 * without ADMIN_PASSWORD a random development-only password is generated and
 * printed once; it is not a production credential.
 */
const generateDevPassword = () => `Dev${crypto.randomBytes(9).toString('base64url')}1a`;

const seed = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@campusplay.com';
    const adminRoll = process.env.ADMIN_ROLL || 'ADMIN000';
    let adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ ADMIN_PASSWORD must be set when seeding in production.');
        process.exit(1);
      }
      adminPassword = generateDevPassword();
      console.log('⚠️  ADMIN_PASSWORD not set. Generated a development-only password:');
      console.log(`    ${adminPassword}`);
      console.log('    Set ADMIN_PASSWORD in your .env for a stable credential.');
    }

    const validation = validatePassword(adminPassword);
    if (!validation.valid) {
      console.error(`❌ ADMIN_PASSWORD rejected: ${validation.message}`);
      process.exit(1);
    }

    await connectDB();

    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        role: USER_ROLES.ADMIN,
        roll: adminRoll,
        branch: 'INFT',
        division: 'A',
        classYear: 'BE',
      });
      console.log(`✅ Admin user created: ${adminEmail}`);
    } else {
      console.log('ℹ️  Admin user already exists');
    }
  } catch (e) {
    console.error('❌ Error creating admin user:', e.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    process.exit(process.exitCode || 0);
  }
};

seed();
