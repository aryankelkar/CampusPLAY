import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    game: { type: String, required: true },
    ground: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending', index: true },
    // Snapshot of student details at the time of booking (optional)
    name: { type: String },
    email: { type: String },
    roll: { type: String },
    branch: { type: String, enum: ['INFT', 'CMPN', 'EXTC', 'EXCS', 'BIOMED'] },
    division: { type: String, enum: ['A', 'B', 'C'] },
    classYear: { type: String, enum: ['FE', 'SE', 'TE', 'BE'] },
    teamMembers: [
      {
        name: { type: String, required: true },
        roll: { type: String, required: true },
        email: { type: String, required: true },
      },
    ],
    // Admin action metadata
    rejectionReason: { type: String, default: '' },
    approvedBy: { type: String },
    rejectedBy: { type: String },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    canceledAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index to prevent double bookings on same ground, date, time with active status
// Only one Pending or Approved booking allowed per slot
bookingSchema.index(
  { ground: 1, date: 1, time: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { 
      status: { $in: ['Pending', 'Approved'] } 
    },
    name: 'unique_active_booking_per_slot'
  }
);

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
