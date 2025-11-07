import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    game: { type: String, required: true },
    ground: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending' },
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

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
