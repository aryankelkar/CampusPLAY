/**
 * Academic Structure Validation Utility
 * Validates branch, year, semester, division consistency based on college structure
 */

export const VALID_BRANCHES = ['INFT', 'CMPN', 'EXTC', 'EXCS', 'BIOMED'];
export const VALID_DIVISIONS = ['A', 'B', 'C', 'D'];
export const VALID_YEARS = ['FE', 'SE', 'TE', 'BE'];

export const YEAR_LABELS = {
  FE: 'First Year',
  SE: 'Second Year',
  TE: 'Third Year',
  BE: 'Final Year',
};

export const YEAR_SEMESTER_MAP = {
  FE: [1, 2],
  SE: [3, 4],
  TE: [5, 6],
  BE: [7, 8],
};

/**
 * Normalizes year representations to standard code: FE, SE, TE, BE
 * @param {string} yearInput 
 * @returns {string}
 */
export function normalizeClassYear(yearInput) {
  if (!yearInput) return '';
  const y = String(yearInput).trim().toUpperCase();
  if (VALID_YEARS.includes(y)) return y;
  if (y.includes('FIRST') || y === '1' || y === '1ST' || y === 'FY') return 'FE';
  if (y.includes('SECOND') || y === '2' || y === '2ND' || y === 'SY') return 'SE';
  if (y.includes('THIRD') || y === '3' || y === '3RD' || y === 'TY') return 'TE';
  if (y.includes('FINAL') || y.includes('FOURTH') || y === '4' || y === '4TH' || y === 'B.TECH' || y === 'LY') return 'BE';
  return y;
}

/**
 * Validates academic information for consistency
 * @param {object} academicData - { branch, classYear, academicYear, semester, division, roll }
 * @param {object} options - { isStrict: boolean }
 * @returns {{ valid: boolean, message?: string, normalized?: object }}
 */
export function validateAcademicData(academicData = {}, options = {}) {
  const { isStrict = true } = options;
  const rawBranch = academicData.branch ? String(academicData.branch).trim().toUpperCase() : '';
  const rawYear = normalizeClassYear(academicData.classYear || academicData.academicYear);
  const rawDiv = academicData.division ? String(academicData.division).trim().toUpperCase() : '';
  const rawRoll = academicData.roll ? String(academicData.roll).trim().toUpperCase() : '';
  const rawSem = academicData.semester !== undefined && academicData.semester !== null && academicData.semester !== ''
    ? Number(academicData.semester)
    : undefined;

  // Check required fields if strict
  if (isStrict) {
    if (!rawRoll) return { valid: false, message: 'Roll number is required.' };
    if (!rawBranch) return { valid: false, message: 'Branch is required.' };
    if (!rawYear) return { valid: false, message: 'Academic Year / Year of Study is required.' };
    if (!rawDiv) return { valid: false, message: 'Division is required.' };
    if (rawSem === undefined || isNaN(rawSem)) return { valid: false, message: 'Semester is required.' };
  }

  // Branch validation
  if (rawBranch && !VALID_BRANCHES.includes(rawBranch)) {
    return {
      valid: false,
      message: `Invalid branch: '${rawBranch}'. Allowed branches: ${VALID_BRANCHES.join(', ')}`,
    };
  }

  // Year validation
  if (rawYear && !VALID_YEARS.includes(rawYear)) {
    return {
      valid: false,
      message: `Invalid year of study: '${rawYear}'. Allowed values: ${VALID_YEARS.join(', ')}`,
    };
  }

  // Division validation
  if (rawDiv && !VALID_DIVISIONS.includes(rawDiv)) {
    return {
      valid: false,
      message: `Invalid division: '${rawDiv}'. Allowed divisions: ${VALID_DIVISIONS.join(', ')}`,
    };
  }

  // Roll validation
  if (rawRoll && !/^[A-Za-z0-9]{1,10}$/.test(rawRoll)) {
    return {
      valid: false,
      message: 'Roll number must be alphanumeric and up to 10 characters.',
    };
  }

  // Semester and Year consistency validation
  if (rawSem !== undefined && !isNaN(rawSem)) {
    if (rawSem < 1 || rawSem > 8) {
      return {
        valid: false,
        message: 'Semester must be between 1 and 8.',
      };
    }

    if (rawYear && YEAR_SEMESTER_MAP[rawYear]) {
      const allowedSemesters = YEAR_SEMESTER_MAP[rawYear];
      if (!allowedSemesters.includes(rawSem)) {
        return {
          valid: false,
          message: `Inconsistent academic structure: Semester ${rawSem} is not valid for ${YEAR_LABELS[rawYear] || rawYear} (${rawYear}). Expected Semester ${allowedSemesters.join(' or ')}.`,
        };
      }
    }
  }

  return {
    valid: true,
    normalized: {
      branch: rawBranch,
      classYear: rawYear,
      academicYear: rawYear,
      division: rawDiv,
      semester: rawSem,
      roll: rawRoll,
    },
  };
}

export function validateSemesterForYear(classYear, semester) {
  const normYear = normalizeClassYear(classYear);
  const semNum = Number(semester);
  if (isNaN(semNum) || semNum < 1 || semNum > 8) {
    return { valid: false, message: 'Semester must be between 1 and 8.' };
  }
  const allowed = YEAR_SEMESTER_MAP[normYear];
  if (!allowed || !allowed.includes(semNum)) {
    return {
      valid: false,
      message: `Semester ${semNum} is not valid for ${YEAR_LABELS[normYear] || normYear} (${normYear}). Expected: ${allowed ? allowed.join(' or ') : 'None'}.`
    };
  }
  return { valid: true, allowed };
}

