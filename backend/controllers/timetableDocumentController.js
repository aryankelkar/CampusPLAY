import path from 'path';
import TimetableDocument from '../models/TimetableDocument.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { ERROR_MESSAGES } from '../constants/index.js';
import { normalizeAcademicYear } from '../services/timetableConflictService.js';
import { 
  saveDocumentBuffer, 
  getDocumentBuffer, 
  deleteDocumentFile,
  detectFileTypeFromBuffer,
  MAX_FILE_SIZE 
} from '../services/storageService.js';

/**
 * GET /api/timetables/documents
 * Query filter: branch, academicYear, classYear, division, semester, status
 */
export const getTimetableDocuments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.branch) filter.branch = String(req.query.branch).trim().toUpperCase();
    if (req.query.academicYear || req.query.classYear) {
      filter.academicYear = normalizeAcademicYear(req.query.academicYear || req.query.classYear);
    }
    if (req.query.division) filter.division = String(req.query.division).trim().toUpperCase();
    if (req.query.semester) filter.semester = Number(req.query.semester);
    if (req.query.status) {
      filter.status = req.query.status;
    } else {
      filter.status = { $ne: 'deactivated' }; // default: published & archived
    }

    const documents = await TimetableDocument.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return sendSuccess(res, { documents, count: documents.length }, 'Timetable documents fetched');
  } catch (err) {
    console.error('Error fetching timetable documents:', err);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * GET /api/timetables/documents/:id
 */
export const getTimetableDocumentById = async (req, res) => {
  try {
    const document = await TimetableDocument.findById(req.params.id);
    if (!document) return sendError(res, 'Document not found', 404);
    return sendSuccess(res, { document }, 'Document fetched');
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * GET /api/timetables/documents/:id/file
 * Secure file streaming with authorization and appropriate headers
 */
export const serveDocumentFile = async (req, res) => {
  try {
    const document = await TimetableDocument.findById(req.params.id);
    if (!document) return sendError(res, 'Document not found', 404);

    const fileData = await getDocumentBuffer(document.storageIdentifier);
    if (!fileData) {
      return sendError(res, 'File not found on storage server.', 404);
    }

    const isDownload = req.query.download === 'true';
    const disposition = isDownload ? 'attachment' : 'inline';
    const safeFilename = encodeURIComponent(document.originalFilename || 'timetable-document');

    res.removeHeader('X-Frame-Options');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', document.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${safeFilename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    return res.send(fileData.buffer);
  } catch (err) {
    console.error('Error serving document file:', err);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * POST /api/timetables/documents/upload
 * Handles multipart file upload OR base64 payload
 */
export const uploadTimetableDocument = async (req, res) => {
  try {
    let fileBuffer = null;
    let originalFilename = '';

    // Case 1: Multer uploaded file
    if (req.file && req.file.buffer) {
      fileBuffer = req.file.buffer;
      originalFilename = req.file.originalname || 'document';
    } 
    // Case 2: Base64 JSON payload
    else if (req.body.fileBase64) {
      const base64Data = req.body.fileBase64.replace(/^data:.*?;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
      originalFilename = req.body.filename || req.body.originalFilename || 'document';
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return sendError(res, 'No file content uploaded.', 400);
    }

    const {
      branch,
      academicYear,
      classYear,
      division,
      semester,
      documentTitle,
      description = '',
      timetableVersion = 'v1.0',
    } = req.body;

    const normBranch = branch ? String(branch).trim().toUpperCase() : '';
    const normYear = normalizeAcademicYear(academicYear || classYear);
    const normDiv = division ? String(division).trim().toUpperCase() : '';
    const parsedSem = semester ? Number(semester) : undefined;

    if (!normBranch || !normYear || !normDiv || !documentTitle) {
      return sendError(res, 'Branch, academic year, division, and document title are required.', 400);
    }

    // Save to persistent storage with magic byte validation
    const saved = await saveDocumentBuffer({
      buffer: fileBuffer,
      originalFilename,
      branch: normBranch,
      academicYear: normYear,
      division: normDiv,
    });

    const adminName = req.user?.name || req.user?.email || 'admin';
    const adminEmail = req.user?.email || '';

    // Archive previous published document for this exact group (non-destructive replacement)
    await TimetableDocument.updateMany(
      {
        branch: normBranch,
        academicYear: normYear,
        division: normDiv,
        status: 'published',
      },
      {
        $set: {
          status: 'archived',
        },
      }
    );

    // Create MongoDB document metadata record
    const docRecord = await TimetableDocument.create({
      branch: normBranch,
      academicYear: normYear,
      classYear: normYear,
      semester: parsedSem,
      division: normDiv,
      documentTitle: String(documentTitle).trim(),
      documentType: saved.documentType,
      mimeType: saved.mimeType,
      fileSize: saved.fileSize,
      description: String(description).trim(),
      storageProvider: saved.storageProvider,
      storageIdentifier: saved.storageIdentifier,
      fileUrl: `/api/timetables/documents/temp/file`, // placeholder, updated with _id
      originalFilename,
      uploadedBy: req.user?._id,
      uploadedByName: adminName,
      uploadedByEmail: adminEmail,
      status: 'published',
      timetableVersion,
    });

    // Update actual fileUrl with document _id
    docRecord.fileUrl = `/api/timetables/documents/${docRecord._id}/file`;
    await docRecord.save();

    return sendSuccess(res, { document: docRecord }, 'Official academic timetable document uploaded successfully', 201);
  } catch (err) {
    console.error('Upload Error:', err);
    return sendError(res, err.message || 'Failed to upload document.', 400);
  }
};

/**
 * PATCH /api/timetables/documents/:id
 * Admin updates metadata or status
 */
export const updateTimetableDocument = async (req, res) => {
  try {
    const document = await TimetableDocument.findById(req.params.id);
    if (!document) return sendError(res, 'Document not found', 404);

    if (req.body.documentTitle) document.documentTitle = String(req.body.documentTitle).trim();
    if (req.body.description !== undefined) document.description = String(req.body.description).trim();
    if (req.body.timetableVersion) document.timetableVersion = String(req.body.timetableVersion).trim();
    if (req.body.status && ['published', 'archived', 'deactivated'].includes(req.body.status)) {
      document.status = req.body.status;
    }

    await document.save();
    return sendSuccess(res, { document }, 'Document updated successfully');
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * DELETE /api/timetables/documents/:id
 * Admin deactivates or removes document
 */
export const deleteTimetableDocument = async (req, res) => {
  try {
    const document = await TimetableDocument.findById(req.params.id);
    if (!document) return sendError(res, 'Document not found', 404);

    if (req.query.permanent === 'true') {
      await deleteDocumentFile(document.storageIdentifier);
      await TimetableDocument.findByIdAndDelete(req.params.id);
      return sendSuccess(res, { document }, 'Document permanently deleted');
    }

    document.status = 'deactivated';
    await document.save();
    return sendSuccess(res, { document }, 'Document deactivated');
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};
