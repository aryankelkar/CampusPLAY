import mongoose from 'mongoose';

const equipmentBookingSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
    quantity: { type: Number, required: true, min: 1 },
    date: { type: String, required: true },
    collectionTime: { type: String, required: true },
    returnTime: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending', index: true },
    // Student snapshot
    studentName: { type: String },
    studentEmail: { type: String },
    studentRoll: { type: String },
    branch: { type: String },
    division: { type: String },
    classYear: { type: String },
    // Equipment snapshot
    equipmentName: { type: String },
    equipmentCategory: { type: String },
    groundBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    // Admin audit
    rejectionReason: { type: String, default: '' },
    approvedBy: { type: String },
    rejectedBy: { type: String },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    canceledAt: { type: Date },
  },
  { timestamps: true }
);

equipmentBookingSchema.index({ equipment: 1, date: 1, status: 1 });
equipmentBookingSchema.index({ student: 1, status: 1 });

const EquipmentBooking = mongoose.model('EquipmentBooking', equipmentBookingSchema);
export default EquipmentBooking;
