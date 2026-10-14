import mongoose from 'mongoose';
import Timetable, { DAYS_OF_WEEK } from '../models/Timetable.js';
import TimetableDocument from '../models/TimetableDocument.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';

/**
 * Normalizes academic year / class year representation
 * Supports FE, SE, TE, BE and common labels (First Year, etc.)
 */
export function normalizeAcademicYear(year) {
  if (!year) return '';
  const y = String(year).trim().toUpperCase();
  if (y === 'FE' || y === '1' || y === 'FIRST YEAR' || y === '1ST YEAR' || y === 'FIRST') return 'FE';
  if (y === 'SE' || y === '2' || y === 'SECOND YEAR' || y === '2ND YEAR' || y === 'SECOND') return 'SE';
  if (y === 'TE' || y === '3' || y === 'THIRD YEAR' || y === '3RD YEAR' || y === 'THIRD') return 'TE';
  if (y === 'BE' || y === '4' || y === 'FINAL YEAR' || y === '4TH YEAR' || y === 'FOURTH YEAR' || y === 'FINAL') return 'BE';
  return y;
}

/**
 * Converts slot string (e.g. '8–9 AM', '12–1 PM', '10:00 - 11:00') into 24-hr [start, end] in 'HH:mm'
 */
export function parseSlotToInterval(slot) {
  if (!slot || typeof slot !== 'string') return null;
  const clean = slot.replace(/[\u2013\u2014]/g, '-').trim();

  // Try standard HH:mm - HH:mm
  const hhmmMatch = clean.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
  if (hhmmMatch) {
    const sH = String(hhmmMatch[1]).padStart(2, '0');
    const sM = hhmmMatch[2];
    const eH = String(hhmmMatch[3]).padStart(2, '0');
    const eM = hhmmMatch[4];
    return { start: `${sH}:${sM}`, end: `${eH}:${eM}` };
  }

  // Pre-defined CampusPLAY TIME_SLOTS mapping:
  const canonicalMap = {
    '8-9 AM': { start: '08:00', end: '09:00' },
    '9-10 AM': { start: '09:00', end: '10:00' },
    '10-11 AM': { start: '10:00', end: '11:00' },
    '11-12 AM': { start: '11:00', end: '12:00' },
    '11-12 PM': { start: '11:00', end: '12:00' },
    '12-1 PM': { start: '12:00', end: '13:00' },
    '1-2 PM': { start: '13:00', end: '14:00' },
    '2-3 PM': { start: '14:00', end: '15:00' },
    '3-4 PM': { start: '15:00', end: '16:00' },
    '4-5 PM': { start: '16:00', end: '17:00' },
    '5-6 PM': { start: '17:00', end: '18:00' },
    '6-7 PM': { start: '18:00', end: '19:00' },
  };

  const normKey = clean.toUpperCase().replace(/\s+/g, ' ');
  for (const [key, interval] of Object.entries(canonicalMap)) {
    if (normKey === key || normKey === key.replace(/\s+/g, '')) {
      return interval;
    }
  }

  // Generic 12-hour parser (e.g. "8 AM - 9 AM", "1 PM - 2 PM", "10 AM - 11 AM")
  const ampmMatch = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let [, startH, startM = '00', startPeriod, endH, endM = '00', endPeriod] = ampmMatch;
    let sH = parseInt(startH, 10);
    let eH = parseInt(endH, 10);
    const endP = endPeriod.toUpperCase();
    const startP = (startPeriod ? startPeriod.toUpperCase() : (eH < 12 && endP === 'PM' && sH >= eH ? 'AM' : endP));

    if (startP === 'PM' && sH < 12) sH += 12;
    if (startP === 'AM' && sH === 12) sH = 0;
    if (endP === 'PM' && eH < 12) eH += 12;
    if (endP === 'AM' && eH === 12) eH = 0;

    return {
      start: `${String(sH).padStart(2, '0')}:${startM}`,
      end: `${String(eH).padStart(2, '0')}:${endM}`,
    };
  }

  return null;
}

/**
 * Calculates the bounding interval and individual intervals for an array of booking slots.
 */
export function getBookingIntervals(timeSlots = []) {
  const intervals = [];
  for (const slot of timeSlots) {
    const parsed = parseSlotToInterval(slot);
    if (parsed) intervals.push(parsed);
  }
  if (intervals.length === 0) return null;

  intervals.sort((a, b) => a.start.localeCompare(b.start));
  const minStart = intervals[0].start;
  const maxEnd = intervals.reduce((max, cur) => cur.end > max ? cur.end : max, intervals[0].end);

  return {
    intervals,
    bounding: { start: minStart, end: maxEnd },
  };
}

/**
 * Strict interval-overlap logic:
 * bookingStart < sessionEnd && bookingEnd > sessionStart
 * (Boundaries touching only e.g. 10:00-11:00 and 11:00-12:00 DO NOT overlap)
 */
export function intervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

/**
 * Determines the weekday name ('Monday', 'Tuesday', ...) for a given YYYY-MM-DD date.
 */
export function getWeekdayFromDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return null;
  }
  const [year, month, day] = parts;
  // Use noon UTC to prevent timezone boundary drift
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[d.getUTCDay()];
}

/**
 * Checks timetable conflicts for a single academic profile against requested booking intervals.
 */
export async function checkAcademicTimetableConflict({
  branch,
  academicYear,
  classYear,
  division,
  semester,
  date,
  timeSlots = [],
}) {
  const normYear = normalizeAcademicYear(academicYear || classYear);
  const normBranch = branch ? String(branch).trim().toUpperCase() : '';
  const normDiv = division ? String(division).trim().toUpperCase() : '';

  // 1. Validate completeness of academic profile
  if (!normBranch || !normYear || !normDiv) {
    return {
      status: 'ACADEMIC INFORMATION INCOMPLETE',
      explanation: 'Academic profile is incomplete. Branch, academic year, and division are required for timetable conflict verification.',
      conflicts: [],
      applicableSessionsCount: 0,
      timetableVersion: null,
      academicGroup: { branch: normBranch, academicYear: normYear, division: normDiv, semester },
    };
  }

  // 2. Parse booking date and time slots
  const weekday = getWeekdayFromDate(date);
  if (!weekday) {
    return {
      status: 'VERIFICATION REQUIRES REVIEW',
      explanation: `Invalid booking date format: ${date}. Expected YYYY-MM-DD.`,
      conflicts: [],
      applicableSessionsCount: 0,
      timetableVersion: null,
      academicGroup: { branch: normBranch, academicYear: normYear, division: normDiv, semester },
    };
  }

  const bookingIntervalData = getBookingIntervals(timeSlots);
  if (!bookingIntervalData) {
    return {
      status: 'VERIFICATION REQUIRES REVIEW',
      explanation: 'Requested booking time slots could not be parsed into valid time intervals.',
      conflicts: [],
      applicableSessionsCount: 0,
      timetableVersion: null,
      academicGroup: { branch: normBranch, academicYear: normYear, division: normDiv, semester },
    };
  }

  // 3. Query applicable timetable entries for this exact academic group
  // Supports matching academicYear as 'SE' or 'Second Year'
  const yearVariants = [normYear];
  if (normYear === 'FE') yearVariants.push('FIRST YEAR', '1ST YEAR');
  if (normYear === 'SE') yearVariants.push('SECOND YEAR', '2ND YEAR');
  if (normYear === 'TE') yearVariants.push('THIRD YEAR', '3RD YEAR');
  if (normYear === 'BE') yearVariants.push('FINAL YEAR', '4TH YEAR', 'FOURTH YEAR');

  const query = {
    branch: normBranch,
    academicYear: { $in: yearVariants },
    division: normDiv,
    active: true,
  };

  // Check if date-specific exception exists for this date
  const dateExceptionSessions = await Timetable.find({
    ...query,
    exceptionDate: date,
  }).sort({ startTime: 1 });

  let applicableSessions = [];
  if (dateExceptionSessions.length > 0) {
    // If holiday or event scheduled, check exceptionType
    const holidaySession = dateExceptionSessions.find(s => s.exceptionType === 'holiday' || s.exceptionType === 'college_event');
    if (holidaySession) {
      return {
        status: 'NO CONFLICT FOUND',
        explanation: `Date is designated as a holiday / special event (${holidaySession.subjectName || holidaySession.exceptionType}). No standard classes scheduled.`,
        conflicts: [],
        applicableSessionsCount: dateExceptionSessions.length,
        timetableVersion: holidaySession.timetableVersion || 'v1.0',
        academicGroup: { branch: normBranch, academicYear: normYear, division: normDiv, semester },
        bookingInterval: bookingIntervalData.bounding,
      };
    }
    applicableSessions = dateExceptionSessions;
  } else {
    // Query standard weekly recurring timetable entries for this weekday
    applicableSessions = await Timetable.find({
      ...query,
      day: weekday,
      exceptionDate: { $in: [null, ''] },
    }).sort({ startTime: 1 });
  }

  // 4. Verify timetable availability
  // Also check if any timetable exists for this group on ANY day (to differentiate "no classes on this weekday" vs "no timetable uploaded")
  if (applicableSessions.length === 0) {
    const totalGroupSessions = await Timetable.countDocuments(query);
    if (totalGroupSessions === 0) {
      // Check if an official reference document (PDF or image) is published for this academic group
      let refDoc = null;
      if (TimetableDocument.mockFindOne) {
        refDoc = await TimetableDocument.mockFindOne({ branch: normBranch, academicYear: { $in: yearVariants }, division: normDiv, status: 'published' });
      } else if (mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          refDoc = await TimetableDocument.findOne({
            branch: normBranch,
            academicYear: { $in: yearVariants },
            division: normDiv,
            status: 'published',
          }).sort({ createdAt: -1 });
        } catch (e) {}
      }

      if (refDoc) {
        return {
          status: 'REFERENCE DOCUMENT AVAILABLE',
          referenceDocumentAvailable: true,
          structuredTimetableAvailable: false,
          referenceDocument: {
            id: refDoc._id,
            title: refDoc.documentTitle,
            documentType: refDoc.documentType,
            fileUrl: refDoc.fileUrl,
            mimeType: refDoc.mimeType,
            timetableVersion: refDoc.timetableVersion,
            uploadedAt: refDoc.createdAt,
            uploadedByName: refDoc.uploadedByName || 'Admin',
            branch: refDoc.branch || normBranch,
            academicYear: refDoc.academicYear || normYear,
            division: refDoc.division || normDiv,
            semester: refDoc.semester,
          },
          explanation: `Official reference timetable document (${refDoc.documentTitle} [${refDoc.documentType.toUpperCase()}]) is available for ${normBranch} - ${normYear} Div ${normDiv}. Structured timetable entries have not been imported for automated conflict detection. An administrator must inspect the reference document before approving.`,
          conflicts: [],
          applicableSessionsCount: 0,
          timetableVersion: refDoc.timetableVersion,
          academicGroup: { branch: normBranch, academicYear: normYear, division: normDiv, semester },
          bookingInterval: bookingIntervalData.bounding,
        };
      }

      return {
        status: 'TIMETABLE NOT AVAILABLE',
        referenceDocumentAvailable: false,
        structuredTimetableAvailable: false,
        explanation: `No published timetable found in the system for ${normBranch} - ${normYear} Division ${normDiv}. Timetable data or official reference document must be uploaded by an authorized administrator.`,
        conflicts: [],
        applicableSessionsCount: 0,
        timetableVersion: null,
        academicGroup: { branch: normBranch, academicYear: normYear, division: normDiv, semester },
        bookingInterval: bookingIntervalData.bounding,
      };
    }
    // Timetable exists for this group, but no classes scheduled on this specific weekday (e.g. Sunday or free day)
    return {
      status: 'NO CONFLICT FOUND',
      referenceDocumentAvailable: false,
      structuredTimetableAvailable: true,
      explanation: `No academic sessions scheduled on ${weekday} in the published timetable for ${normBranch} - ${normYear} Div ${normDiv}.`,
      conflicts: [],
      applicableSessionsCount: 0,
      timetableVersion: 'v1.0',
      academicGroup: { branch: normBranch, academicYear: normYear, division: normDiv, semester },
      bookingInterval: bookingIntervalData.bounding,
    };
  }

  // 5. Compare requested booking interval(s) against scheduled sessions
  const conflicts = [];
  const latestVersion = applicableSessions[0]?.timetableVersion || 'v1.0';

  for (const session of applicableSessions) {
    for (const bInterval of bookingIntervalData.intervals) {
      if (intervalsOverlap(bInterval.start, bInterval.end, session.startTime, session.endTime)) {
        conflicts.push({
          sessionId: session._id,
          subjectName: session.subjectName,
          subjectCode: session.subjectCode || '',
          sessionType: session.sessionType || 'Lecture',
          startTime: session.startTime,
          endTime: session.endTime,
          room: session.room || '',
          faculty: session.faculty || '',
          branch: session.branch,
          division: session.division,
          academicYear: session.academicYear,
          semester: session.semester,
          timetableVersion: session.timetableVersion,
          conflictingBookingInterval: `${bInterval.start} - ${bInterval.end}`,
        });
        break; // don't add the same session twice for multiple overlapping sub-slots
      }
    }
  }

  if (conflicts.length > 0) {
    return {
      status: 'CONFLICT DETECTED',
      explanation: `Booking interval (${bookingIntervalData.bounding.start} - ${bookingIntervalData.bounding.end}) overlaps with ${conflicts.length} scheduled academic session(s).`,
      conflicts,
      applicableSessionsCount: applicableSessions.length,
      timetableVersion: latestVersion,
      academicGroup: { branch: normBranch, academicYear: normYear, division: normDiv, semester },
      bookingInterval: bookingIntervalData.bounding,
    };
  }

  return {
    status: 'NO CONFLICT FOUND',
    explanation: `No conflict was found in the published timetable for this student's academic group. This check does not establish personal availability or account for commitments absent from the timetable.`,
    conflicts: [],
    applicableSessionsCount: applicableSessions.length,
    timetableVersion: latestVersion,
    academicGroup: { branch: normBranch, academicYear: normYear, division: normDiv, semester },
    bookingInterval: bookingIntervalData.bounding,
  };
}

/**
 * Performs full academic verification for a booking, including primary student and squad members.
 */
export async function verifyBookingAcademicTimetable(booking) {
  if (!booking) return null;

  let bookingDoc = booking;
  if (typeof booking === 'string') {
    bookingDoc = await Booking.findById(booking).populate('student');
    if (!bookingDoc) return null;
  }

  // 1. Resolve current authenticated student User account as the authoritative source
  let studentUser = bookingDoc.student;
  const isObjectId = (id) => id && (typeof id === 'string' || typeof id === 'object') && mongoose.Types.ObjectId.isValid(id);

  // If student is missing, is just an ID, or lacks fields like phone, check MongoDB if connected
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    if (!studentUser || typeof studentUser !== 'object' || !studentUser.email || studentUser.phone === undefined) {
      const studentId = studentUser?._id || (isObjectId(studentUser) ? studentUser : null);
      if (studentId) {
        try {
          const found = await User.findById(studentId).lean();
          if (found) studentUser = found;
        } catch (e) {}
      } else if (bookingDoc.email) {
        try {
          const found = await User.findOne({ email: bookingDoc.email.toLowerCase() }).lean();
          if (found) studentUser = found;
        } catch (e) {}
      }
    }
  }

  // Authoritative Current Student Profile
  const primaryAcademic = {
    name: studentUser?.name || bookingDoc.name || '-',
    roll: studentUser?.roll || bookingDoc.roll || '-',
    email: studentUser?.email || bookingDoc.email || '-',
    phone: studentUser?.phone || bookingDoc.phone || '',
    alternatePhone: studentUser?.alternatePhone || bookingDoc.alternatePhone || '',
    branch: studentUser?.branch || bookingDoc.branch || '',
    division: studentUser?.division || bookingDoc.division || '',
    academicYear: studentUser?.classYear || bookingDoc.classYear || '',
    classYear: studentUser?.classYear || bookingDoc.classYear || '',
    semester: studentUser?.semester !== undefined && studentUser?.semester !== null
      ? studentUser.semester
      : (bookingDoc.semester !== undefined && bookingDoc.semester !== null ? bookingDoc.semester : null),
    academicProfileVerified: Boolean(studentUser?.academicProfileVerified),
    academicVerificationStatus: studentUser?.academicProfileVerified 
      ? 'VERIFIED' 
      : (studentUser?.academicVerificationStatus || bookingDoc.academicVerificationStatus || 'UNVERIFIED'),
  };

  // Historical Booking-Time Snapshot (preserved separately)
  const bookingSnapshot = {
    hasSnapshot: Boolean(bookingDoc.name || bookingDoc.roll || bookingDoc.branch || bookingDoc.classYear || bookingDoc.phone),
    name: bookingDoc.name || null,
    email: bookingDoc.email || null,
    roll: bookingDoc.roll || null,
    phone: bookingDoc.phone || null,
    alternatePhone: bookingDoc.alternatePhone || null,
    branch: bookingDoc.branch || null,
    division: bookingDoc.division || null,
    classYear: bookingDoc.classYear || null,
    semester: bookingDoc.semester !== undefined && bookingDoc.semester !== null ? bookingDoc.semester : null,
    academicVerificationStatus: bookingDoc.academicVerificationStatus || 'UNVERIFIED',
    createdAt: bookingDoc.createdAt,
  };

  // Run conflict check for primary student using current authoritative academic group
  const primaryVerification = await checkAcademicTimetableConflict({
    branch: primaryAcademic.branch,
    academicYear: primaryAcademic.academicYear,
    classYear: primaryAcademic.classYear,
    division: primaryAcademic.division,
    semester: primaryAcademic.semester,
    date: bookingDoc.date,
    timeSlots: bookingDoc.timeSlots,
  });

  // Verify Squad Members
  const verifiedSquad = [];
  if (Array.isArray(bookingDoc.teamMembers) && bookingDoc.teamMembers.length > 0) {
    // Collect roll numbers and emails to batch query
    const rolls = bookingDoc.teamMembers.map(m => m.roll).filter(Boolean);
    const emails = bookingDoc.teamMembers.map(m => m.email?.toLowerCase()).filter(Boolean);

    const registeredUsers = await User.find({
      $or: [
        { roll: { $in: rolls } },
        { email: { $in: emails } },
      ],
    }).select('name email roll branch division classYear semester');

    const userByRoll = new Map();
    const userByEmail = new Map();
    for (const u of registeredUsers) {
      if (u.roll) userByRoll.set(u.roll, u);
      if (u.email) userByEmail.set(u.email.toLowerCase(), u);
    }

    for (const member of bookingDoc.teamMembers) {
      const regUser = (member.roll && userByRoll.get(member.roll)) ||
                      (member.email && userByEmail.get(member.email.toLowerCase()));

      if (regUser) {
        // Registered student: check their separate academic group
        const memberVerification = await checkAcademicTimetableConflict({
          branch: regUser.branch,
          academicYear: regUser.classYear,
          classYear: regUser.classYear,
          division: regUser.division,
          semester: regUser.semester,
          date: bookingDoc.date,
          timeSlots: bookingDoc.timeSlots,
        });

        verifiedSquad.push({
          name: regUser.name || member.name,
          roll: regUser.roll || member.roll,
          email: regUser.email || member.email,
          branch: regUser.branch || 'Incomplete',
          division: regUser.division || 'Incomplete',
          academicYear: regUser.classYear || 'Incomplete',
          semester: regUser.semester,
          verifiedUser: true,
          verificationStatus: memberVerification.status,
          conflicts: memberVerification.conflicts,
          explanation: memberVerification.explanation,
        });
      } else {
        // Unverified / plain form entry
        verifiedSquad.push({
          name: member.name,
          roll: member.roll,
          email: member.email,
          branch: null,
          division: null,
          academicYear: null,
          semester: null,
          verifiedUser: false,
          verificationStatus: 'UNVERIFIED SQUAD MEMBER',
          conflicts: [],
          explanation: 'Supplied teammate information is unverified. Member is not registered in the student database.',
        });
      }
    }
  }

  return {
    bookingId: bookingDoc._id,
    date: bookingDoc.date,
    timeSlots: bookingDoc.timeSlots,
    game: bookingDoc.game,
    ground: bookingDoc.ground,
    student: primaryAcademic,
    bookingSnapshot,
    verification: primaryVerification,
    squadMembers: verifiedSquad,
    checkedAt: new Date(),
  };
}
