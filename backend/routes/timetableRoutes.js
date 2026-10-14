import express from 'express';
import { body } from 'express-validator';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
  getTimetables,
  getTimetableById,
  createSession,
  updateSession,
  deleteSession,
  previewCsvImport,
  commitCsvImport,
  getImportHistory,
  downloadCsvTemplate,
  getBookingAcademicVerification,
} from '../controllers/timetableController.js';
import multer from 'multer';
import {
  getTimetableDocuments,
  getTimetableDocumentById,
  serveDocumentFile,
  uploadTimetableDocument,
  updateTimetableDocument,
  deleteTimetableDocument,
} from '../controllers/timetableDocumentController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();

// Document Routes (PDF + Images)
router.get('/documents', protect, getTimetableDocuments);
router.get('/documents/:id', protect, getTimetableDocumentById);
router.get('/documents/:id/file', serveDocumentFile);
router.post('/documents/upload', protect, adminOnly, upload.single('file'), uploadTimetableDocument);
router.patch('/documents/:id', protect, adminOnly, updateTimetableDocument);
router.delete('/documents/:id', protect, adminOnly, deleteTimetableDocument);

// Public / Authenticated route to view timetable
router.get('/', protect, getTimetables);
router.get('/template', protect, adminOnly, downloadCsvTemplate);
router.get('/import/history', protect, adminOnly, getImportHistory);
router.get('/:id', protect, getTimetableById);

// Admin-only management endpoints
router.post(
  '/',
  protect,
  adminOnly,
  [
    body('branch').notEmpty().withMessage('Branch is required'),
    body('academicYear').notEmpty().withMessage('Academic year is required'),
    body('division').notEmpty().withMessage('Division is required'),
    body('day').notEmpty().withMessage('Day is required'),
    body('startTime').notEmpty().withMessage('Start time is required'),
    body('endTime').notEmpty().withMessage('End time is required'),
    body('subjectName').notEmpty().withMessage('Subject name is required'),
  ],
  createSession
);

router.patch('/:id', protect, adminOnly, updateSession);
router.delete('/:id', protect, adminOnly, deleteSession);

// Admin-only CSV Import endpoints
router.post(
  '/import/preview',
  protect,
  adminOnly,
  [body('csvContent').notEmpty().withMessage('CSV content is required')],
  previewCsvImport
);

router.post(
  '/import/commit',
  protect,
  adminOnly,
  [body('records').isArray({ min: 1 }).withMessage('Records array is required')],
  commitCsvImport
);

// Booking academic verification endpoint
router.get('/booking-verification/:id', protect, adminOnly, getBookingAcademicVerification);

export default router;
