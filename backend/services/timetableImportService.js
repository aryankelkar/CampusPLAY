import { DAYS_OF_WEEK, SESSION_TYPES } from '../models/Timetable.js';
import { normalizeAcademicYear, intervalsOverlap } from './timetableConflictService.js';

/**
 * Standard CSV Template header columns
 */
export const CSV_TEMPLATE_COLUMNS = [
  'branch',
  'academicYear',
  'semester',
  'division',
  'day',
  'startTime',
  'endTime',
  'subjectName',
  'subjectCode',
  'sessionType',
  'faculty',
  'room',
];

/**
 * Generates sample CSV template content
 */
export function generateCsvTemplate() {
  const header = CSV_TEMPLATE_COLUMNS.join(',');
  const samples = [
    'INFT,SE,3,A,Monday,09:00,10:00,Data Structures & Algorithms,IT301,Lecture,Prof. Sharma,Room 301',
    'INFT,SE,3,A,Monday,10:00,11:00,Database Management Systems,IT302,Lecture,Prof. Verma,Room 302',
    'INFT,SE,3,A,Monday,11:15,13:15,Data Structures Lab,IT301L,Practical,Prof. Sharma,Lab 1',
    'INFT,SE,3,A,Tuesday,09:00,10:00,Operating Systems,IT303,Lecture,Prof. Kulkarni,Room 301',
    'INFT,SE,3,A,Wednesday,14:00,16:00,Web Development Workshop,IT304W,Workshop,Industry Expert,Auditorium',
  ];
  return [header, ...samples].join('\n');
}

/**
 * Safe CSV row splitter that respects quoted values
 */
export function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parses raw CSV string into array of normalized row objects
 */
export function parseCsvContent(rawCsvText) {
  if (!rawCsvText || typeof rawCsvText !== 'string') {
    throw new Error('CSV content must be a non-empty string.');
  }

  // Split into lines (support \r\n and \n)
  const lines = rawCsvText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'));

  if (lines.length < 2) {
    throw new Error('CSV must contain a header row and at least one data row.');
  }

  // Parse header
  const rawHeaders = parseCsvLine(lines[0]);
  const headers = rawHeaders.map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Map known variations to canonical column names
  const headerMap = {
    branch: 'branch',
    department: 'branch',
    academicyear: 'academicYear',
    classyear: 'academicYear',
    year: 'academicYear',
    semester: 'semester',
    sem: 'semester',
    division: 'division',
    div: 'division',
    day: 'day',
    dayofweek: 'day',
    weekday: 'day',
    starttime: 'startTime',
    start: 'startTime',
    endtime: 'endTime',
    end: 'endTime',
    subjectname: 'subjectName',
    subject: 'subjectName',
    title: 'subjectName',
    subjectcode: 'subjectCode',
    code: 'subjectCode',
    sessiontype: 'sessionType',
    type: 'sessionType',
    faculty: 'faculty',
    teacher: 'faculty',
    professor: 'faculty',
    room: 'room',
    classroom: 'room',
    lab: 'room',
  };

  const canonicalHeaders = headers.map(h => headerMap[h] || h);

  // Check required header presence
  const requiredFields = ['branch', 'academicYear', 'division', 'day', 'startTime', 'endTime', 'subjectName'];
  const missingHeaders = requiredFields.filter(f => !canonicalHeaders.includes(f));
  if (missingHeaders.length > 0) {
    throw new Error(`CSV is missing required columns: ${missingHeaders.join(', ')}`);
  }

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const rawValues = parseCsvLine(lines[i]);
    if (rawValues.every(v => v === '')) continue; // skip blank line

    const rowObj = { _rowNumber: i + 1 };
    for (let hIdx = 0; hIdx < canonicalHeaders.length; hIdx++) {
      const colName = canonicalHeaders[hIdx];
      rowObj[colName] = rawValues[hIdx] !== undefined ? rawValues[hIdx] : '';
    }
    rows.push(rowObj);
  }

  return rows;
}

/**
 * Normalizes time format to 'HH:mm'
 */
export function normalizeTimeString(str) {
  if (!str) return null;
  const clean = str.trim().toUpperCase();

  // HH:mm 24-hr
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = match24[2];
    if (h >= 0 && h <= 23 && parseInt(m, 10) >= 0 && parseInt(m, 10) <= 59) {
      return `${String(h).padStart(2, '0')}:${m}`;
    }
  }

  // 12-hr with AM/PM e.g. "9 AM", "9:30 AM", "1 PM", "1:15 PM"
  const match12 = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = match12[2] || '00';
    const period = match12[3];
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    if (h >= 0 && h <= 23 && parseInt(m, 10) >= 0 && parseInt(m, 10) <= 59) {
      return `${String(h).padStart(2, '0')}:${m}`;
    }
  }

  return null;
}

/**
 * Normalizes day of week to title case (e.g. 'Monday')
 */
export function normalizeDayOfWeek(str) {
  if (!str) return null;
  const clean = str.trim().toLowerCase();
  const dayMap = {
    mon: 'Monday', monday: 'Monday',
    tue: 'Tuesday', tues: 'Tuesday', tuesday: 'Tuesday',
    wed: 'Wednesday', wednesday: 'Wednesday',
    thu: 'Thursday', thur: 'Thursday', thurs: 'Thursday', thursday: 'Thursday',
    fri: 'Friday', friday: 'Friday',
    sat: 'Saturday', saturday: 'Saturday',
    sun: 'Sunday', sunday: 'Sunday',
  };
  return dayMap[clean] || (DAYS_OF_WEEK.includes(str) ? str : null);
}

/**
 * Validates and normalizes parsed rows, identifying:
 * - valid records
 * - invalid records with line numbers & error messages
 * - duplicate records
 * - overlapping sessions within the import file
 */
export function validateTimetableRecords(rows, timetableVersion = 'v1.0') {
  const validRecords = [];
  const invalidRecords = [];
  const duplicates = [];
  const internalOverlaps = [];

  const seenKeys = new Map();

  for (const row of rows) {
    const rowNum = row._rowNumber || '?';
    const errors = [];

    // Branch
    const branch = (row.branch || '').trim().toUpperCase();
    if (!branch) errors.push('Branch is required.');

    // Academic Year
    const rawYear = (row.academicYear || '').trim();
    const academicYear = normalizeAcademicYear(rawYear);
    if (!academicYear) errors.push('Academic year is required (e.g. FE, SE, TE, BE).');

    // Semester (optional)
    let semester = undefined;
    if (row.semester !== undefined && row.semester !== null && String(row.semester).trim() !== '') {
      const s = Number(row.semester);
      if (isNaN(s) || s < 1 || s > 8) {
        errors.push('Semester must be an integer between 1 and 8.');
      } else {
        semester = s;
      }
    }

    // Division
    const division = (row.division || '').trim().toUpperCase();
    if (!division) errors.push('Division is required.');

    // Day
    const day = normalizeDayOfWeek(row.day);
    if (!day) errors.push(`Invalid day '${row.day}'. Must be a valid weekday (Monday-Sunday).`);

    // Start & End Times
    const startTime = normalizeTimeString(row.startTime);
    const endTime = normalizeTimeString(row.endTime);
    if (!startTime) errors.push(`Invalid start time '${row.startTime}'. Use HH:mm format.`);
    if (!endTime) errors.push(`Invalid end time '${row.endTime}'. Use HH:mm format.`);
    if (startTime && endTime && startTime >= endTime) {
      errors.push(`Start time (${startTime}) must be strictly earlier than end time (${endTime}).`);
    }

    // Subject
    const subjectName = (row.subjectName || '').trim();
    if (!subjectName) errors.push('Subject name is required.');

    // Session Type
    let sessionType = (row.sessionType || '').trim();
    if (!sessionType) {
      sessionType = 'Lecture';
    } else {
      const matchedType = SESSION_TYPES.find(t => t.toLowerCase() === sessionType.toLowerCase());
      sessionType = matchedType || 'Lecture';
    }

    if (errors.length > 0) {
      invalidRecords.push({
        row: rowNum,
        raw: row,
        errors,
      });
      continue;
    }

    // Normalized valid record
    const record = {
      branch,
      academicYear,
      division,
      day,
      startTime,
      endTime,
      subjectName,
      subjectCode: (row.subjectCode || '').trim().toUpperCase(),
      sessionType,
      faculty: (row.faculty || '').trim(),
      room: (row.room || '').trim(),
      timetableVersion,
      active: true,
      source: 'csv_import',
      ...(semester ? { semester } : {}),
      _rowNumber: rowNum,
    };

    // Duplicate Detection (same branch, year, div, day, startTime, endTime, subject)
    const duplicateKey = `${branch}|${academicYear}|${division}|${day}|${startTime}|${endTime}|${subjectName.toLowerCase()}`;
    if (seenKeys.has(duplicateKey)) {
      duplicates.push({
        row: rowNum,
        firstSeenAtRow: seenKeys.get(duplicateKey),
        record,
        message: `Duplicate record of line ${seenKeys.get(duplicateKey)} (${branch} ${academicYear} Div ${division} on ${day} ${startTime}-${endTime})`,
      });
      continue;
    }
    seenKeys.set(duplicateKey, rowNum);

    validRecords.push(record);
  }

  // Detect overlapping sessions within the valid records for the same academic group & day
  for (let i = 0; i < validRecords.length; i++) {
    for (let j = i + 1; j < validRecords.length; j++) {
      const rA = validRecords[i];
      const rB = validRecords[j];

      if (
        rA.branch === rB.branch &&
        rA.academicYear === rB.academicYear &&
        rA.division === rB.division &&
        rA.day === rB.day
      ) {
        if (intervalsOverlap(rA.startTime, rA.endTime, rB.startTime, rB.endTime)) {
          internalOverlaps.push({
            rowA: rA._rowNumber,
            rowB: rB._rowNumber,
            sessionA: `${rA.subjectName} (${rA.startTime}-${rA.endTime})`,
            sessionB: `${rB.subjectName} (${rB.startTime}-${rB.endTime})`,
            academicGroup: `${rA.branch} ${rA.academicYear} Div ${rA.division} (${rA.day})`,
            message: `Overlapping sessions: '${rA.subjectName}' (${rA.startTime}-${rA.endTime}) and '${rB.subjectName}' (${rB.startTime}-${rB.endTime})`,
          });
        }
      }
    }
  }

  return {
    totalRecords: rows.length,
    validRecords,
    validCount: validRecords.length,
    invalidRecords,
    invalidCount: invalidRecords.length,
    duplicates,
    duplicateCount: duplicates.length,
    overlaps: internalOverlaps,
    overlapCount: internalOverlaps.length,
  };
}
