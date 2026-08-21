import mongoose from 'mongoose';

const facilitySchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true,
      enum: ['Ground 1', 'Ground 2', 'Basketball Court', 'Badminton Court']
    },
    type: { 
      type: String, 
      enum: ['GROUND', 'COURT'], 
      required: true 
    },
    supportedSports: [
      { 
        type: String, 
        enum: ['Football', 'Cricket', 'Volleyball', 'Basketball', 'Badminton'], 
        required: true 
      }
    ],
    status: { 
      type: String, 
      enum: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'], 
      default: 'ACTIVE' 
    },
    capacity: { type: String, default: 'Standard' },
    location: { type: String, default: 'Campus Sports Complex' },
    operatingHours: { type: String, default: '08:00 AM - 06:00 PM' },
    description: { type: String, default: '' },
    image: { type: String, default: '' }
  },
  { timestamps: true }
);

const Facility = mongoose.model('Facility', facilitySchema);
export default Facility;
