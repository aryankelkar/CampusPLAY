import mongoose from 'mongoose';

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const SESSION_TYPES = [
  'Lecture',
  'Practical',
  'Tutorial',
  'Lab',
  'Seminar',
  'Workshop',
  'Other',
];

const timetableSchema = new mongoose.Schema(
  {
    branch: { 
      type: String, 
      required: [true, 'Branch is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    academicYear: { 
      type: String, 
      required: [true, 'Academic year is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    semester: { 
      type: Number, 
      min: 1, 
      max: 8,
      index: true,
    },
    division: { 
      type: String, 
      required: [true, 'Division is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    day: { 
      type: String, 
      enum: DAYS_OF_WEEK, 
      required: [true, 'Day of week is required'],
      index: true,
    },
    startTime: { 
      type: String, 
      required: [true, 'Start time is required (HH:mm)'],
      validate: {
        validator: function(v) {
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: 'Start time must be in HH:mm 24-hour format'
      }
    },
    endTime: { 
      type: String, 
      required: [true, 'End time is required (HH:mm)'],
      validate: {
        validator: function(v) {
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: 'End time must be in HH:mm 24-hour format'
      }
    },
    subjectName: { 
      type: String, 
      required: [true, 'Subject name is required'],
      trim: true,
    },
    subjectCode: { 
      type: String, 
      trim: true, 
      uppercase: true,
      default: '' 
    },
    sessionType: { 
      type: String, 
      enum: SESSION_TYPES, 
      default: 'Lecture' 
    },
    faculty: { 
      type: String, 
      trim: true, 
      default: '' 
    },
    room: { 
      type: String, 
      trim: true, 
      default: '' 
    },
    timetableVersion: { 
      type: String, 
      default: 'v1.0',
      trim: true,
      index: true,
    },
    active: { 
      type: Boolean, 
      default: true,
      index: true,
    },
    source: { 
      type: String, 
      enum: ['manual', 'csv_import', 'system'], 
      default: 'manual' 
    },
    // Optional date-specific override / exception (e.g., holiday, exam, special lecture)
    exceptionDate: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true;
          return /^\d{4}-\d{2}-\d{2}$/.test(v);
        },
        message: 'Exception date must be YYYY-MM-DD'
      }
    },
    exceptionType: {
      type: String,
      enum: ['holiday', 'exam', 'special_lecture', 'college_event', 'rescheduled', 'none', null],
      default: null,
    },
    createdBy: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

// Validation: startTime must be earlier than endTime
timetableSchema.pre('validate', function(next) {
  if (this.startTime && this.endTime) {
    if (this.startTime >= this.endTime) {
      this.invalidate('endTime', 'End time must be strictly after start time');
    }
  }
  next();
});

// Primary compound query index for fast conflict checking & timetable view
timetableSchema.index({ branch: 1, academicYear: 1, division: 1, day: 1, active: 1 });
timetableSchema.index({ branch: 1, academicYear: 1, semester: 1, division: 1, day: 1, active: 1 });

const Timetable = mongoose.model('Timetable', timetableSchema);
export default Timetable;
