import mongoose from 'mongoose';

const equipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    category: { type: String, required: true, default: 'General' },
    description: { type: String, default: '' },
    totalQuantity: { type: Number, required: true, min: 0, default: 10 },
    image: { type: String, default: '' },
    status: { type: String, enum: ['Available', 'Maintenance'], default: 'Available' },
  },
  { timestamps: true }
);

const Equipment = mongoose.model('Equipment', equipmentSchema);
export default Equipment;
