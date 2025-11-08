import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
    const adminEmail = 'admin@campusplay.com';
    const adminRoll = 'ADMIN000'; // Changed to alphanumeric only (no hyphen)

    let existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      await User.create({ 
        name: 'Admin', 
        email: adminEmail, 
        password: 'admin123', 
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
