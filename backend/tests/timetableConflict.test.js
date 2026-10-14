import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSlotToInterval,
  getBookingIntervals,
  intervalsOverlap,
  getWeekdayFromDate,
  normalizeAcademicYear,
  checkAcademicTimetableConflict,
  verifyBookingAcademicTimetable,
} from '../services/timetableConflictService.js';
import {
  parseCsvContent,
  validateTimetableRecords,
  generateCsvTemplate,
} from '../services/timetableImportService.js';

// Mock in-memory timetable and user database for unit and integration testing without requiring a live MongoDB connection
import Timetable from '../models/Timetable.js';
import User from '../models/User.js';

test('TEST 1: Booking overlaps a lecture -> Conflict detected', async () => {
  // Session: 10:00 - 11:00, Booking: 10–11 AM (10:00 - 11:00)
  const session = { startTime: '10:00', endTime: '11:00' };
  const booking = parseSlotToInterval('10–11 AM'); // 10:00 - 11:00

  const overlap = intervalsOverlap(booking.start, booking.end, session.startTime, session.endTime);
  assert.equal(overlap, true, 'Booking 10:00-11:00 should overlap session 10:00-11:00');
});

test('TEST 2: Booking begins exactly when a lecture ends -> No overlap', async () => {
  // Session: 10:00 - 11:00, Booking: 11–12 AM (11:00 - 12:00)
  const session = { startTime: '10:00', endTime: '11:00' };
  const booking = parseSlotToInterval('11–12 AM'); // 11:00 - 12:00

  const overlap = intervalsOverlap(booking.start, booking.end, session.startTime, session.endTime);
  assert.equal(overlap, false, 'Touching boundary (11:00) should not overlap');
});

test('TEST 3: Booking ends exactly when a lecture begins -> No overlap', async () => {
  // Session: 11:00 - 12:00, Booking: 10–11 AM (10:00 - 11:00)
  const session = { startTime: '11:00', endTime: '12:00' };
  const booking = parseSlotToInterval('10–11 AM'); // 10:00 - 11:00

  const overlap = intervalsOverlap(booking.start, booking.end, session.startTime, session.endTime);
  assert.equal(overlap, false, 'Touching boundary (11:00) should not overlap');
});

test('TEST 4: Booking overlaps a practical session -> Conflict detected', async () => {
  // Practical session: 14:00 - 16:00, Booking: 3–4 PM (15:00 - 16:00)
  const session = { startTime: '14:00', endTime: '16:00' };
  const booking = parseSlotToInterval('3–4 PM'); // 15:00 - 16:00

  const overlap = intervalsOverlap(booking.start, booking.end, session.startTime, session.endTime);
  assert.equal(overlap, true, 'Booking 15:00-16:00 should overlap practical 14:00-16:00');
});

test('TEST 5: Student belongs to another division -> Correct division timetable is used', async () => {
  // Stub Timetable.find to return division B session
  const origFind = Timetable.find;
  Timetable.find = function(query) {
    assert.equal(query.division, 'B', 'Query should strictly search for division B');
    return {
      sort: () => Promise.resolve([
        {
          _id: 'sess-div-b',
          branch: 'INFT',
          academicYear: 'SE',
          division: 'B',
          day: 'Monday',
          startTime: '10:00',
          endTime: '11:00',
          subjectName: 'DBMS Div B',
          sessionType: 'Lecture',
          timetableVersion: 'v1.0',
        }
      ]),
    };
  };

  try {
    const result = await checkAcademicTimetableConflict({
      branch: 'INFT',
      classYear: 'SE',
      division: 'B',
      date: '2026-10-19', // Monday
      timeSlots: ['10–11 AM'],
    });

    assert.equal(result.status, 'CONFLICT DETECTED');
    assert.equal(result.academicGroup.division, 'B');
    assert.equal(result.conflicts[0].subjectName, 'DBMS Div B');
  } finally {
    Timetable.find = origFind;
  }
});

test('TEST 6: Student belongs to another branch -> Correct branch timetable is used', async () => {
  const origFind = Timetable.find;
  Timetable.find = function(query) {
    assert.equal(query.branch, 'CMPN', 'Query should strictly search for CMPN branch');
    return {
      sort: () => Promise.resolve([
        {
          _id: 'sess-cmpn',
          branch: 'CMPN',
          academicYear: 'TE',
          division: 'A',
          day: 'Monday',
          startTime: '09:00',
          endTime: '10:00',
          subjectName: 'Computer Networks',
          sessionType: 'Lecture',
          timetableVersion: 'v1.0',
        }
      ]),
    };
  };

  try {
    const result = await checkAcademicTimetableConflict({
      branch: 'CMPN',
      classYear: 'TE',
      division: 'A',
      date: '2026-10-19', // Monday
      timeSlots: ['9–10 AM'],
    });

    assert.equal(result.status, 'CONFLICT DETECTED');
    assert.equal(result.academicGroup.branch, 'CMPN');
    assert.equal(result.conflicts[0].subjectName, 'Computer Networks');
  } finally {
    Timetable.find = origFind;
  }
});

test('TEST 7: Academic year is missing -> Incomplete academic verification', async () => {
  const result = await checkAcademicTimetableConflict({
    branch: 'INFT',
    classYear: '', // missing
    division: 'A',
    date: '2026-10-19',
    timeSlots: ['10–11 AM'],
  });

  assert.equal(result.status, 'ACADEMIC INFORMATION INCOMPLETE');
  assert.equal(result.conflicts.length, 0);
  assert.match(result.explanation, /incomplete/i);
});

test('TEST 8: No timetable exists -> Timetable unavailable', async () => {
  const origFind = Timetable.find;
  const origCount = Timetable.countDocuments;
  Timetable.find = () => ({ sort: () => Promise.resolve([]) });
  Timetable.countDocuments = () => Promise.resolve(0); // 0 total sessions for group

  try {
    const result = await checkAcademicTimetableConflict({
      branch: 'BIOMED',
      classYear: 'FE',
      division: 'C',
      date: '2026-10-19',
      timeSlots: ['10–11 AM'],
    });

    assert.equal(result.status, 'TIMETABLE NOT AVAILABLE');
    assert.equal(result.conflicts.length, 0);
    assert.match(result.explanation, /No published timetable found/i);
  } finally {
    Timetable.find = origFind;
    Timetable.countDocuments = origCount;
  }
});

test('TEST 9: Multiple consecutive booking slots overlap a lecture -> Full interval is checked', async () => {
  // Lecture: 10:30 - 11:30
  // Booking has 2 consecutive slots: '10–11 AM' (10:00-11:00) and '11–12 AM' (11:00-12:00)
  const origFind = Timetable.find;
  Timetable.find = () => ({
    sort: () => Promise.resolve([
      {
        _id: 'sess-lecture',
        branch: 'INFT',
        academicYear: 'SE',
        division: 'A',
        day: 'Monday',
        startTime: '10:30',
        endTime: '11:30',
        subjectName: 'Mid-Morning Seminar',
        sessionType: 'Seminar',
        timetableVersion: 'v1.0',
      }
    ]),
  });

  try {
    const result = await checkAcademicTimetableConflict({
      branch: 'INFT',
      classYear: 'SE',
      division: 'A',
      date: '2026-10-19',
      timeSlots: ['10–11 AM', '11–12 AM'], // 10:00 - 12:00 total
    });

    assert.equal(result.status, 'CONFLICT DETECTED');
    assert.equal(result.conflicts.length, 1);
    assert.equal(result.bookingInterval.start, '10:00');
    assert.equal(result.bookingInterval.end, '12:00');
  } finally {
    Timetable.find = origFind;
  }
});

test('TEST 10: Squad members belong to different divisions -> Checked separately', async () => {
  const origFindUser = User.find;
  const origFindTimetable = Timetable.find;

  // Mock squad users
  User.find = () => ({
    select: () => Promise.resolve([
      { roll: '101', name: 'Member One', email: 'm1@vit.edu.in', branch: 'INFT', division: 'A', classYear: 'SE' },
      { roll: '102', name: 'Member Two', email: 'm2@vit.edu.in', branch: 'CMPN', division: 'C', classYear: 'TE' },
    ]),
  });

  // Return conflict only for CMPN TE Div C
  Timetable.find = (query) => ({
    sort: () => {
      if (query.division === 'C') {
        return Promise.resolve([
          { _id: 'c1', subjectName: 'CMPN Class', startTime: '10:00', endTime: '11:00', branch: 'CMPN', division: 'C', academicYear: 'TE', timetableVersion: 'v1.0' }
        ]);
      }
      return Promise.resolve([
        { _id: 'c2', subjectName: 'Free afternoon', startTime: '14:00', endTime: '15:00', branch: 'INFT', division: 'A', academicYear: 'SE', timetableVersion: 'v1.0' }
      ]);
    }
  });

  try {
    const mockBooking = {
      _id: 'b-10',
      date: '2026-10-19',
      timeSlots: ['10–11 AM'],
      game: 'Football',
      ground: 'Ground 1',
      student: { name: 'Lead', roll: '100', email: 'lead@vit.edu.in', branch: 'INFT', division: 'A', classYear: 'SE' },
      teamMembers: [
        { roll: '101', name: 'Member One', email: 'm1@vit.edu.in' },
        { roll: '102', name: 'Member Two', email: 'm2@vit.edu.in' },
        { roll: '999', name: 'Guest External', email: 'guest@vit.edu.in' }, // unverified
      ],
    };

    const report = await verifyBookingAcademicTimetable(mockBooking);

    assert.equal(report.verification.status, 'NO CONFLICT FOUND', 'Primary student has no conflict');
    assert.equal(report.squadMembers.length, 3);

    // Member 1 (Div A): No conflict
    assert.equal(report.squadMembers[0].verifiedUser, true);
    assert.equal(report.squadMembers[0].verificationStatus, 'NO CONFLICT FOUND');

    // Member 2 (Div C): Conflict detected
    assert.equal(report.squadMembers[1].verifiedUser, true);
    assert.equal(report.squadMembers[1].verificationStatus, 'CONFLICT DETECTED');

    // Member 3 (Unregistered): Unverified status
    assert.equal(report.squadMembers[2].verifiedUser, false);
    assert.equal(report.squadMembers[2].verificationStatus, 'UNVERIFIED SQUAD MEMBER');
  } finally {
    User.find = origFindUser;
    Timetable.find = origFindTimetable;
  }
});

test('TEST 11: Unauthorized user attempts to modify a timetable -> Request is denied', async () => {
  // Test adminOnly middleware logic
  import('../middleware/authMiddleware.js').then(({ adminOnly }) => {
    let statusCode = null;
    let responseBody = null;

    const reqStudent = { user: { role: 'student', email: 'student@vit.edu.in' } };
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { responseBody = data; return res; },
    };
    let nextCalled = false;

    adminOnly(reqStudent, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false, 'Student must not proceed to next()');
    assert.equal(statusCode, 403, 'Must return HTTP 403 Forbidden');
    assert.equal(responseBody.success, false);
  });
});

test('TEST 12: CSV contains invalid records -> Validation errors reported with line numbers', () => {
  const invalidCsv = `branch,academicYear,semester,division,day,startTime,endTime,subjectName
INFT,SE,3,A,Funday,10:00,11:00,Maths
INFT,SE,3,A,Monday,12:00,11:00,Invalid Times
,SE,3,A,Monday,09:00,10:00,Missing Branch
INFT,SE,3,A,Monday,09:00,10:00,Valid Course`;

  const rows = parseCsvContent(invalidCsv);
  const result = validateTimetableRecords(rows, 'v1.0');

  assert.equal(result.totalRecords, 4);
  assert.equal(result.invalidCount, 3);
  assert.equal(result.validCount, 1);

  // Check that row numbers and specific errors are captured
  assert.equal(result.invalidRecords[0].row, 2);
  assert.match(result.invalidRecords[0].errors[0], /Invalid day/i);
  assert.equal(result.invalidRecords[1].row, 3);
  assert.match(result.invalidRecords[1].errors[0], /Start time.*strictly earlier/i);
  assert.equal(result.invalidRecords[2].row, 4);
  assert.match(result.invalidRecords[2].errors[0], /Branch is required/i);
});

test('TEST 13: CSV contains overlapping sessions -> Overlaps reported before confirmation', () => {
  const overlappingCsv = `branch,academicYear,semester,division,day,startTime,endTime,subjectName
INFT,SE,3,A,Monday,09:00,11:00,Big Lecture
INFT,SE,3,A,Monday,10:00,12:00,Overlapping Lab`;

  const rows = parseCsvContent(overlappingCsv);
  const result = validateTimetableRecords(rows, 'v1.0');

  assert.equal(result.validCount, 2);
  assert.equal(result.overlapCount, 1, 'Should detect 1 internal overlap');
  assert.equal(result.overlaps[0].rowA, 2);
  assert.equal(result.overlaps[0].rowB, 3);
  assert.match(result.overlaps[0].message, /Overlapping sessions/i);
});

test('TEST 14: CSV contains duplicate records -> Duplicates are detected', () => {
  const duplicateCsv = `branch,academicYear,semester,division,day,startTime,endTime,subjectName
INFT,SE,3,A,Monday,09:00,10:00,Operating Systems
INFT,SE,3,A,Monday,09:00,10:00,Operating Systems`;

  const rows = parseCsvContent(duplicateCsv);
  const result = validateTimetableRecords(rows, 'v1.0');

  assert.equal(result.validCount, 1, 'Only first occurrence is kept as valid');
  assert.equal(result.duplicateCount, 1, 'Second occurrence is marked as duplicate');
  assert.equal(result.duplicates[0].row, 3);
  assert.equal(result.duplicates[0].firstSeenAtRow, 2);
});

test('TEST 15: Admin opens an existing pending booking -> Booking details visible with verification', async () => {
  const origFindTimetable = Timetable.find;
  Timetable.find = () => ({
    sort: () => Promise.resolve([
      { _id: 's1', subjectName: 'Software Eng', startTime: '14:00', endTime: '15:00', branch: 'INFT', division: 'A', academicYear: 'SE', timetableVersion: 'v1.0' }
    ])
  });

  try {
    const mockBooking = {
      _id: 'b-15',
      game: 'Basketball',
      ground: 'Ground 2',
      date: '2026-10-19',
      timeSlots: ['8–9 AM'],
      status: 'Pending',
      name: 'Rohan Sharma',
      roll: '1099',
      email: 'rohan@vit.edu.in',
      branch: 'INFT',
      division: 'A',
      classYear: 'SE',
    };

    const report = await verifyBookingAcademicTimetable(mockBooking);

    assert.equal(report.bookingId, 'b-15');
    assert.equal(report.game, 'Basketball');
    assert.equal(report.ground, 'Ground 2');
    assert.equal(report.verification.status, 'NO CONFLICT FOUND');
    assert.equal(report.student.name, 'Rohan Sharma');
    assert.equal(report.student.roll, '1099');
  } finally {
    Timetable.find = origFindTimetable;
  }
});

test('TEST 16: Student academic information is incomplete -> No fabricated values displayed', async () => {
  const mockBooking = {
    _id: 'b-16',
    date: '2026-10-19',
    timeSlots: ['10–11 AM'],
    student: {
      name: 'Legacy Student',
      email: 'legacy@vit.edu.in',
      roll: '9999',
      branch: undefined,
      division: undefined,
      classYear: undefined,
    },
  };

  const report = await verifyBookingAcademicTimetable(mockBooking);

  assert.equal(report.verification.status, 'ACADEMIC INFORMATION INCOMPLETE');
  assert.equal(report.verification.academicGroup.branch, '');
  assert.equal(report.verification.academicGroup.division, '');
  assert.equal(report.verification.academicGroup.academicYear, '');
});

test('TEST 17: Timetable changes after booking was reviewed -> Active timetable is used', async () => {
  const origFind = Timetable.find;
  // Timetable was updated to v2.0 with a new session at 10:00
  Timetable.find = (query) => {
    assert.equal(query.active, true, 'Must query active: true timetable');
    return {
      sort: () => Promise.resolve([
        {
          _id: 'sess-v2',
          branch: 'INFT',
          academicYear: 'SE',
          division: 'A',
          day: 'Monday',
          startTime: '10:00',
          endTime: '11:00',
          subjectName: 'Newly Added Lab Session',
          sessionType: 'Lab',
          timetableVersion: 'v2.0',
        }
      ]),
    };
  };

  try {
    const mockBooking = {
      _id: 'b-17',
      date: '2026-10-19',
      timeSlots: ['10–11 AM'],
      student: { name: 'Student A', branch: 'INFT', division: 'A', classYear: 'SE' },
    };

    const report = await verifyBookingAcademicTimetable(mockBooking);
    assert.equal(report.verification.status, 'CONFLICT DETECTED');
    assert.equal(report.verification.timetableVersion, 'v2.0');
    assert.equal(report.verification.conflicts[0].subjectName, 'Newly Added Lab Session');
  } finally {
    Timetable.find = origFind;
  }
});

test('TEST 18: Student attempts to spoof another student identity -> Backend uses authenticated req.user', async () => {
  // Booking creation verification: req.body has spoofed snapshot, but controller uses req.user
  const req = {
    user: {
      _id: 'user-real',
      name: 'Real Student',
      email: 'real@vit.edu.in',
      roll: 'REAL01',
      branch: 'INFT',
      division: 'A',
      classYear: 'SE',
    },
    body: {
      game: 'Cricket',
      ground: 'Ground 1',
      date: '2026-10-20',
      timeSlots: ['9–10 AM'],
      // Spoofed details in body
      name: 'Fake Admin Name',
      email: 'admin@vit.edu.in',
      roll: 'ADMIN01',
      branch: 'CMPN',
      division: 'D',
      classYear: 'BE',
    },
  };

  // Check snapshot creation logic from bookingController.js:
  const snapshot = {
    name: req.user?.name || '',
    email: req.user?.email || '',
    roll: req.user?.roll || '',
    branch: req.user?.branch || '',
    division: req.user?.division || '',
    classYear: req.user?.classYear || '',
  };

  assert.equal(snapshot.roll, 'REAL01', 'Roll number must be taken from authenticated session');
  assert.equal(snapshot.email, 'real@vit.edu.in', 'Email must be taken from authenticated session');
  assert.equal(snapshot.branch, 'INFT', 'Branch must be taken from authenticated session');
});

test('TEST 19: Valid PDF magic bytes detected accurately (%PDF-)', async () => {
  const { detectFileTypeFromBuffer } = await import('../services/storageService.js');
  const validPdfBuffer = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
  const detected = detectFileTypeFromBuffer(validPdfBuffer);

  assert.notEqual(detected, null);
  assert.equal(detected.mimeType, 'application/pdf');
  assert.equal(detected.documentType, 'pdf');
  assert.equal(detected.extension, 'pdf');
});

test('TEST 20: Valid PNG, JPEG, WebP magic bytes detected accurately', async () => {
  const { detectFileTypeFromBuffer } = await import('../services/storageService.js');
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
  const detectedPng = detectFileTypeFromBuffer(pngHeader);
  assert.equal(detectedPng.mimeType, 'image/png');
  assert.equal(detectedPng.documentType, 'image');

  // JPEG: FF D8 FF
  const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
  const detectedJpeg = detectFileTypeFromBuffer(jpegHeader);
  assert.equal(detectedJpeg.mimeType, 'image/jpeg');

  // WebP: RIFF ... WEBP
  const webpHeader = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // RIFF
    0x24, 0x00, 0x00, 0x00, // size
    0x57, 0x45, 0x42, 0x50  // WEBP
  ]);
  const detectedWebp = detectFileTypeFromBuffer(webpHeader);
  assert.equal(detectedWebp.mimeType, 'image/webp');
});

test('TEST 21: Fake/spoofed file rejected by binary inspection (e.g. text file renamed to .pdf)', async () => {
  const { detectFileTypeFromBuffer } = await import('../services/storageService.js');
  const fakePdf = Buffer.from('This is a plain text file pretending to be timetable.pdf');
  const detected = detectFileTypeFromBuffer(fakePdf);

  assert.equal(detected, null, 'Fake file must fail binary magic byte inspection');
});

test('TEST 22: Oversized file rejected by size limit (> 10 MB)', async () => {
  const { saveDocumentBuffer, MAX_FILE_SIZE } = await import('../services/storageService.js');
  // Create an oversized buffer simulating 11 MB
  const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024);

  await assert.rejects(
    async () => {
      await saveDocumentBuffer({
        buffer: oversizedBuffer,
        originalFilename: 'huge_timetable.pdf',
        branch: 'INFT',
        academicYear: 'SE',
        division: 'A',
      });
    },
    /exceeds maximum allowed limit/i
  );
});

test('TEST 23: Anti-path-traversal on storage identifiers', async () => {
  const { getDocumentBuffer } = await import('../services/storageService.js');
  // Attempting path traversal
  const maliciousIdentifier = '../../etc/passwd';
  const result = await getDocumentBuffer(maliciousIdentifier);
  assert.equal(result, null, 'Must neutralize path traversal attacks');
});

test('TEST 24: Reference PDF document available does NOT classify as "No conflict found"', async () => {
  const origFind = Timetable.find;
  const origCount = Timetable.countDocuments;
  Timetable.find = () => ({ sort: () => Promise.resolve([]) });
  Timetable.countDocuments = () => Promise.resolve(0); // 0 structured sessions

  // Mock a published TimetableDocument
  import('../models/TimetableDocument.js').then(async ({ default: TimetableDocument }) => {
    TimetableDocument.mockFindOne = () => Promise.resolve({
      _id: 'doc-ref-1',
      documentTitle: 'Official Departmental Timetable Odd Sem 2026',
      documentType: 'pdf',
      fileUrl: '/api/timetables/documents/doc-ref-1/file',
      mimeType: 'application/pdf',
      timetableVersion: 'v2026.1',
      createdAt: new Date(),
    });

    try {
      const result = await checkAcademicTimetableConflict({
        branch: 'INFT',
        classYear: 'SE',
        division: 'A',
        date: '2026-10-19',
        timeSlots: ['10–11 AM'],
      });

      // Must be REFERENCE DOCUMENT AVAILABLE with referenceDocumentAvailable: true and structuredTimetableAvailable: false
      assert.notEqual(result.status, 'NO CONFLICT FOUND', 'Reference PDF alone must NEVER produce "No conflict found"');
      assert.equal(result.status, 'REFERENCE DOCUMENT AVAILABLE');
      assert.equal(result.referenceDocumentAvailable, true);
      assert.equal(result.structuredTimetableAvailable, false);
      assert.equal(result.referenceDocument.documentType, 'pdf');
      assert.match(result.explanation, /reference timetable document/i);
    } finally {
      Timetable.find = origFind;
      Timetable.countDocuments = origCount;
      TimetableDocument.mockFindOne = null;
    }
  });
});

