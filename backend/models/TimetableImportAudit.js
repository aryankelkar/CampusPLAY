import mongoose from 'mongoose';

const timetableImportAuditSchema = new mongoose.Schema(
  {
    timetableVersion: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    importedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    importedByName: { type: String, default: '' },
    importedByEmail: { type: String, default: '' },
    sourceFilename: { type: String, default: '' },
    targetAcademicGroup: {
      branch: { type: String, trim: true },
      academicYear: { type: String, trim: true },
      semester: { type: Number },
      division: { type: String, trim: true },
    },
    totalRecords: { type: Number, default: 0 },
    validRecords: { type: Number, default: 0 },
    invalidRecords: { type: Number, default: 0 },
    duplicateRecords: { type: Number, default: 0 },
    overlappingRecords: { type: Number, default: 0 },
    insertedCount: { type: Number, default: 0 },
    updatedCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['previewed', 'committed', 'failed'],
      default: 'committed',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

timetableImportAuditSchema.index({ createdAt: -1 });

const TimetableImportAudit = mongoose.model('TimetableImportAudit', timetableImportAuditSchema);
export default TimetableImportAudit;
