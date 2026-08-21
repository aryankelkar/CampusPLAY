import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@vit.edu.in';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminRoll = 'ADMIN000'; // Changed to alphanumeric only (no hyphen)

    // Delete any existing admin users with old email
    await User.deleteMany({ $or: [{ email: 'admin@campusplay.com' }, { role: 'admin' }] });
    console.log('🗑️  Removed old admin users');

    let existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      await User.create({ 
        name: 'Admin', 
        email: adminEmail, 
        password: adminPassword, 
        role: 'admin', 
        roll: adminRoll,
        branch: 'INFT',      // Required field
        division: 'A',       // Required field
        classYear: 'BE'      // Required field
      });
      console.log('✅ Admin user created successfully');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
  } catch (e) {
    console.error('❌ Error creating admin user:', e.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seed();
