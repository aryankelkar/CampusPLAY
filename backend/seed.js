import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
    const adminEmail = 'admin@campusplay.com';
    const adminRoll = 'ADMIN-000';

    let existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      await User.create({ name: 'Admin', email: adminEmail, password: 'admin123', role: 'admin', roll: adminRoll });
      console.log('Admin user created');
    } else {
      if (!existing.roll) {
        existing.roll = adminRoll;
        await existing.save();
        console.log('Admin user updated with roll');
      } else {
        console.log('Admin user already exists');
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seed();
