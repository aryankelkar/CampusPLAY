import mongoose from 'mongoose';

const timetableDocumentSchema = new mongoose.Schema(
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
    classYear: {
      type: String,
      trim: true,
      uppercase: true,
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
    documentTitle: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
    },
    documentType: {
      type: String,
      enum: ['pdf', 'image'],
      required: [true, 'Document type is required (pdf or image)'],
      index: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    storageProvider: {
      type: String,
      enum: ['local', 'cloudinary'],
      default: 'local',
    },
    storageIdentifier: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    uploadedByName: {
      type: String,
      default: '',
    },
    uploadedByEmail: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['published', 'archived', 'deactivated'],
      default: 'published',
      index: true,
    },
    timetableVersion: {
      type: String,
      default: 'v1.0',
      trim: true,
      index: true,
    },
  },
  { timestamps: true }
);

timetableDocumentSchema.index({ branch: 1, academicYear: 1, division: 1, status: 1 });
timetableDocumentSchema.index({ branch: 1, academicYear: 1, semester: 1, division: 1, status: 1 });
timetableDocumentSchema.index({ createdAt: -1 });

const TimetableDocument = mongoose.model('TimetableDocument', timetableDocumentSchema);
export default TimetableDocument;
