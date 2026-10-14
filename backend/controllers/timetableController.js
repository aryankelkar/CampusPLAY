import Timetable, { DAYS_OF_WEEK, SESSION_TYPES } from '../models/Timetable.js';
import TimetableImportAudit from '../models/TimetableImportAudit.js';
import Booking from '../models/Booking.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { ERROR_MESSAGES } from '../constants/index.js';
import { 
  normalizeAcademicYear, 
  checkAcademicTimetableConflict, 
  verifyBookingAcademicTimetable,
  intervalsOverlap 
} from '../services/timetableConflictService.js';
import { 
  generateCsvTemplate, 
  parseCsvContent, 
  validateTimetableRecords 
} from '../services/timetableImportService.js';

/**
 * GET /api/timetables
 * Query filter: branch, academicYear/classYear, division, semester, day, active
 */
export const getTimetables = async (req, res) => {
  try {
    const filter = {};
    if (req.query.branch) filter.branch = String(req.query.branch).trim().toUpperCase();
    if (req.query.academicYear || req.query.classYear) {
      filter.academicYear = normalizeAcademicYear(req.query.academicYear || req.query.classYear);
    }
    if (req.query.division) filter.division = String(req.query.division).trim().toUpperCase();
    if (req.query.semester) filter.semester = Number(req.query.semester);
    if (req.query.day) filter.day = req.query.day;
    if (req.query.active !== undefined) {
      filter.active = req.query.active === 'true' || req.query.active === true;
    } else {
      filter.active = true; // default active only
    }

    const sessions = await Timetable.find(filter)
      .sort({ day: 1, startTime: 1 })
      .lean();

    return sendSuccess(res, { sessions, count: sessions.length }, 'Timetables fetched successfully');
  } catch (err) {
    console.error('Error fetching timetables:', err);
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * GET /api/timetables/:id
 */
export const getTimetableById = async (req, res) => {
  try {
    const session = await Timetable.findById(req.params.id);
    if (!session) return sendError(res, 'Timetable session not found', 404);
    return sendSuccess(res, { session }, 'Timetable session fetched');
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * POST /api/timetables
 * Admin-only manual session creation
 */
export const createSession = async (req, res) => {
  try {
    const {
      branch,
      academicYear,
      classYear,
      division,
      semester,
      day,
      startTime,
      endTime,
      subjectName,
      subjectCode,
      sessionType,
      faculty,
      room,
      timetableVersion = 'v1.0',
    } = req.body;

    const normBranch = branch ? String(branch).trim().toUpperCase() : '';
    const normYear = normalizeAcademicYear(academicYear || classYear);
    const normDiv = division ? String(division).trim().toUpperCase() : '';

    if (!normBranch || !normYear || !normDiv || !day || !startTime || !endTime || !subjectName) {
      return sendError(res, 'Branch, academic year, division, day, startTime, endTime, and subjectName are required.', 400);
    }

    if (!DAYS_OF_WEEK.includes(day)) {
      return sendError(res, `Invalid day of week: ${day}. Must be one of: ${DAYS_OF_WEEK.join(', ')}`, 400);
    }

    if (startTime >= endTime) {
      return sendError(res, 'Start time must be strictly earlier than end time.', 400);
    }

    // Check for overlapping sessions for this academic group on this day
    const existingSessions = await Timetable.find({
      branch: normBranch,
      academicYear: normYear,
      division: normDiv,
      day,
      active: true,
    });

    const overlapping = existingSessions.filter(s => intervalsOverlap(startTime, endTime, s.startTime, s.endTime));
    if (overlapping.length > 0) {
      const overlapInfo = overlapping.map(s => `${s.subjectName} (${s.startTime}-${s.endTime})`).join(', ');
      // Still allow if force flag is passed, otherwise report warning
      if (!req.body.force) {
        return res.status(409).json({
          success: false,
          message: `This session overlaps with existing session(s): ${overlapInfo}. Provide force: true to save anyway.`,
          overlapping,
        });
      }
    }

    const session = await Timetable.create({
      branch: normBranch,
      academicYear: normYear,
      division: normDiv,
      semester: semester ? Number(semester) : undefined,
      day,
      startTime,
      endTime,
      subjectName: subjectName.trim(),
      subjectCode: subjectCode ? String(subjectCode).trim().toUpperCase() : '',
      sessionType: sessionType || 'Lecture',
      faculty: faculty ? String(faculty).trim() : '',
      room: room ? String(room).trim() : '',
      timetableVersion,
      active: true,
      source: 'manual',
      createdBy: req.user?.email || req.user?.name || 'admin',
    });

    return sendSuccess(res, { session }, 'Timetable session created successfully', 201);
  } catch (err) {
    console.error('Error creating timetable session:', err);
    return sendError(res, err.message || ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * PATCH /api/timetables/:id
 * Admin-only session update
 */
export const updateSession = async (req, res) => {
  try {
    const session = await Timetable.findById(req.params.id);
    if (!session) return sendError(res, 'Timetable session not found', 404);

    const updatable = [
      'branch',
      'academicYear',
      'division',
      'semester',
      'day',
      'startTime',
      'endTime',
      'subjectName',
      'subjectCode',
      'sessionType',
      'faculty',
      'room',
      'active',
      'timetableVersion',
    ];

    for (const key of updatable) {
      if (req.body[key] !== undefined) {
        if (key === 'branch') session.branch = String(req.body[key]).trim().toUpperCase();
        else if (key === 'academicYear') session.academicYear = normalizeAcademicYear(req.body[key]);
        else if (key === 'division') session.division = String(req.body[key]).trim().toUpperCase();
        else if (key === 'semester') session.semester = req.body[key] ? Number(req.body[key]) : undefined;
        else if (key === 'subjectCode') session.subjectCode = String(req.body[key]).trim().toUpperCase();
        else session[key] = req.body[key];
      }
    }

    if (session.startTime >= session.endTime) {
      return sendError(res, 'Start time must be strictly earlier than end time.', 400);
    }

    session.updatedBy = req.user?.email || req.user?.name || 'admin';
    await session.save();

    return sendSuccess(res, { session }, 'Timetable session updated successfully');
  } catch (err) {
    return sendError(res, err.message || ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * DELETE /api/timetables/:id
 * Admin-only soft deactivate or delete
 */
export const deleteSession = async (req, res) => {
  try {
    const session = await Timetable.findById(req.params.id);
    if (!session) return sendError(res, 'Timetable session not found', 404);

    if (req.query.permanent === 'true') {
      await Timetable.findByIdAndDelete(req.params.id);
      return sendSuccess(res, { session }, 'Timetable session permanently deleted');
    }

    // Default: Soft deactivation
    session.active = false;
    session.updatedBy = req.user?.email || req.user?.name || 'admin';
    await session.save();
    return sendSuccess(res, { session }, 'Timetable session deactivated');
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * POST /api/timetables/import/preview
 * Admin-only: parse CSV, validate records, detect duplicates/overlaps without modifying database
 */
export const previewCsvImport = async (req, res) => {
  try {
    const { csvContent, timetableVersion = 'v1.0' } = req.body;
    if (!csvContent || typeof csvContent !== 'string') {
      return sendError(res, 'csvContent is required (raw CSV string).', 400);
    }

    // Limit upload payload size (max 2MB text ~ 20,000 lines)
    if (csvContent.length > 2 * 1024 * 1024) {
      return sendError(res, 'CSV file exceeds maximum allowed size (2MB).', 400);
    }

    const rows = parseCsvContent(csvContent);
    const validationResult = validateTimetableRecords(rows, timetableVersion);

    // Also check for overlaps against existing database records for these groups
    const dbOverlaps = [];
    const validRecs = validationResult.validRecords;
    if (validRecs.length > 0) {
      // Group by academic group & day to query efficiently
      const groupDayMap = new Map();
      for (const r of validRecs) {
        const key = `${r.branch}|${r.academicYear}|${r.division}|${r.day}`;
        if (!groupDayMap.has(key)) groupDayMap.set(key, []);
        groupDayMap.get(key).push(r);
      }

      for (const [key, records] of groupDayMap.entries()) {
        const [branch, academicYear, division, day] = key.split('|');
        const existing = await Timetable.find({
          branch,
          academicYear,
          division,
          day,
          active: true,
        }).lean();

        for (const newRec of records) {
          for (const ex of existing) {
            if (intervalsOverlap(newRec.startTime, newRec.endTime, ex.startTime, ex.endTime)) {
              dbOverlaps.push({
                row: newRec._rowNumber,
                newSession: `${newRec.subjectName} (${newRec.startTime}-${newRec.endTime})`,
                existingSession: `${ex.subjectName} (${ex.startTime}-${ex.endTime})`,
                academicGroup: `${branch} ${academicYear} Div ${division} on ${day}`,
                message: `Overlaps with existing scheduled session '${ex.subjectName}' (${ex.startTime}-${ex.endTime})`,
              });
            }
          }
        }
      }
    }

    return sendSuccess(res, {
      ...validationResult,
      existingDatabaseOverlaps: dbOverlaps,
      existingDatabaseOverlapCount: dbOverlaps.length,
      timetableVersion,
    }, 'CSV parsed and validated successfully (Preview Mode)');
  } catch (err) {
    console.error('CSV Preview Error:', err);
    return sendError(res, err.message || 'Failed to parse CSV.', 400);
  }
};

/**
 * POST /api/timetables/import/commit
 * Admin-only: Save validated records from preview into the database safely
 */
export const commitCsvImport = async (req, res) => {
  try {
    const { 
      records, 
      timetableVersion = 'v1.0', 
      sourceFilename = 'import.csv',
      deactivatePrevious = false,
      notes = '' 
    } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return sendError(res, 'No records provided to commit.', 400);
    }

    // Limit commit batch size
    if (records.length > 5000) {
      return sendError(res, 'Batch size exceeds 5,000 records limit.', 400);
    }

    // Validate one more time server-side before persisting
    const validationResult = validateTimetableRecords(records, timetableVersion);
    if (validationResult.validRecords.length === 0) {
      return sendError(res, 'No valid records found in import payload.', 400);
    }

    const adminName = req.user?.name || req.user?.email || 'admin';
    const adminEmail = req.user?.email || '';

    // If requested to replace / deactivate previous version for these academic groups:
    if (deactivatePrevious) {
      const groupPairs = new Set();
      for (const r of validationResult.validRecords) {
        groupPairs.add(`${r.branch}|${r.academicYear}|${r.division}`);
      }
      for (const pair of groupPairs) {
        const [branch, academicYear, division] = pair.split('|');
        await Timetable.updateMany(
          { branch, academicYear, division, active: true },
          { $set: { active: false, updatedBy: adminName } }
        );
      }
    }

    // Attach administrative metadata to inserted documents
    const documentsToInsert = validationResult.validRecords.map(r => ({
      ...r,
      timetableVersion,
      source: 'csv_import',
      createdBy: adminName,
      updatedBy: adminName,
    }));

    const insertedDocs = await Timetable.insertMany(documentsToInsert, { ordered: false });

    // Record Audit History
    const audit = await TimetableImportAudit.create({
      timetableVersion,
      importedBy: req.user?._id,
      importedByName: adminName,
      importedByEmail: adminEmail,
      sourceFilename,
      totalRecords: records.length,
      validRecords: validationResult.validCount,
      invalidRecords: validationResult.invalidCount,
      duplicateRecords: validationResult.duplicateCount,
      overlappingRecords: validationResult.overlapCount,
      insertedCount: insertedDocs.length,
      status: 'committed',
      notes,
    });

    return sendSuccess(res, {
      insertedCount: insertedDocs.length,
      auditId: audit._id,
      timetableVersion,
      summary: {
        total: records.length,
        saved: insertedDocs.length,
        invalid: validationResult.invalidCount,
        duplicates: validationResult.duplicateCount,
        overlaps: validationResult.overlapCount,
      }
    }, `Successfully imported ${insertedDocs.length} timetable records into ${timetableVersion}.`, 201);
  } catch (err) {
    console.error('CSV Commit Error:', err);
    return sendError(res, err.message || ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * GET /api/timetables/import/history
 * Admin-only: get import audit records
 */
export const getImportHistory = async (req, res) => {
  try {
    const history = await TimetableImportAudit.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return sendSuccess(res, { history }, 'Import history fetched');
  } catch (err) {
    return sendError(res, ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};

/**
 * GET /api/timetables/template
 * Download standard CSV template
 */
export const downloadCsvTemplate = (req, res) => {
  const content = generateCsvTemplate();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="campusplay_timetable_template.csv"');
  return res.send(content);
};

/**
 * GET /api/bookings/:id/academic-verification
 * Admin-only: performs full academic verification report for a booking
 */
export const getBookingAcademicVerification = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('student', 'name email roll branch division classYear semester phone alternatePhone academicVerificationStatus academicProfileVerified');

    if (!booking) return sendError(res, 'Booking not found', 404);

    const report = await verifyBookingAcademicTimetable(booking);

    // Save snapshot of verification status into the booking document for audit consistency
    if (report && report.verification) {
      booking.timetableVerification = {
        status: report.verification.status,
        conflictCount: report.verification.conflicts?.length || 0,
        timetableVersion: report.verification.timetableVersion || 'v1.0',
        checkedAt: report.checkedAt,
        note: report.verification.explanation || '',
      };
      await booking.save();
    }

    return sendSuccess(res, { report }, 'Academic timetable verification completed');
  } catch (err) {
    console.error('Academic Verification Error:', err);
    return sendError(res, err.message || ERROR_MESSAGES.SERVER_ERROR, 500);
  }
};
