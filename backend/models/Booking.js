import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    game: { type: String, required: true },
    ground: { type: String, required: true },
    facility: { type: String, required: true },
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility' },
    date: { type: String, required: true },
    timeSlots: [{ type: String, required: true }], // Array of time slots (1-2 slots)
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending', index: true },
    // Snapshot of student details at the time of booking
    name: { type: String },
    email: { type: String },
    phone: { type: String, trim: true },
    alternatePhone: { type: String, trim: true },
    roll: { type: String },
    branch: { type: String },
    division: { type: String },
    classYear: { type: String },
    semester: { type: Number },
    academicVerificationStatus: { 
      type: String, 
      enum: ['VERIFIED', 'UNVERIFIED', 'PENDING_REVIEW'], 
      default: 'UNVERIFIED' 
    },
    timetableVerification: {
      status: {
        type: String,
        enum: [
          'CONFLICT DETECTED',
          'NO CONFLICT FOUND',
          'REFERENCE DOCUMENT AVAILABLE',
          'STRUCTURED TIMETABLE AVAILABLE',
          'TIMETABLE NOT AVAILABLE',
          'TIMETABLE UNAVAILABLE',
          'ACADEMIC INFORMATION INCOMPLETE',
          'VERIFICATION REQUIRES REVIEW',
          'UNCHECKED'
        ],
        default: 'UNCHECKED'
      },
      conflictCount: { type: Number, default: 0 },
      timetableVersion: { type: String },
      checkedAt: { type: Date },
      note: { type: String }
    },
    teamMembers: [
      {
        name: { type: String, required: true },
        roll: { type: String, required: true },
        email: { type: String, required: true },
        branch: { type: String },
        division: { type: String },
        classYear: { type: String },
        semester: { type: Number },
        verifiedUser: { type: Boolean, default: false },
        verificationStatus: { type: String },
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

// Regular index for query performance
bookingSchema.index({ ground: 1, date: 1, status: 1 });
bookingSchema.index({ facility: 1, date: 1, status: 1 });
bookingSchema.index({ date: 1, timeSlots: 1, status: 1 });
bookingSchema.index({ student: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
