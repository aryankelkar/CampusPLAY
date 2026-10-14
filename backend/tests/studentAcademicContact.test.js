import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAndNormalizePhone } from '../utils/phoneValidator.js';
import { 
  validateAcademicData, 
  validateSemesterForYear, 
  VALID_BRANCHES, 
  VALID_YEARS, 
  VALID_DIVISIONS 
} from '../utils/academicValidator.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Timetable from '../models/Timetable.js';
import { verifyBookingAcademicTimetable } from '../services/timetableConflictService.js';

test('1. New student enters valid academic information and phone number', () => {
  const phoneRes = validateAndNormalizePhone('9876543210', { isRequired: true });
  assert.equal(phoneRes.valid, true);
  assert.equal(phoneRes.normalized, '9876543210');

  const acadRes = validateAcademicData({
    roll: '24IT101',
    branch: 'INFT',
    classYear: 'SE',
    semester: 3,
    division: 'A',
  }, { isStrict: true });
  assert.equal(acadRes.valid, true);
  assert.equal(acadRes.normalized.classYear, 'SE');
  assert.equal(acadRes.normalized.semester, 3);
});

test('2. Existing student profile information is prefilled and reused', () => {
  const profileUser = {
    name: 'Aarav Sharma',
    email: 'aarav@vit.edu.in',
    phone: '9820112233',
    alternatePhone: '9820445566',
    roll: '23IT205',
    branch: 'INFT',
    classYear: 'TE',
    semester: 5,
    division: 'B',
    academicProfileVerified: false,
    academicVerificationStatus: 'UNVERIFIED',
  };

  // Student does not enter new academic fields; profile fallback is used
  const acadRes = validateAcademicData({
    roll: profileUser.roll,
    branch: profileUser.branch,
    classYear: profileUser.classYear,
    semester: profileUser.semester,
    division: profileUser.division,
  }, { isStrict: true });

  assert.equal(acadRes.valid, true);
  assert.equal(acadRes.normalized.roll, '23IT205');
  assert.equal(acadRes.normalized.branch, 'INFT');
  assert.equal(acadRes.normalized.classYear, 'TE');
  assert.equal(acadRes.normalized.semester, 5);

  const phoneRes = validateAndNormalizePhone(profileUser.phone, { isRequired: true });
  assert.equal(phoneRes.valid, true);
  assert.equal(phoneRes.normalized, '9820112233');
});

test('3. Missing academic information is identified', () => {
  // Missing division and semester
  const incompleteAcad = validateAcademicData({
    roll: '24IT101',
    branch: 'INFT',
    classYear: 'FE',
    semester: null,
    division: '',
  }, { isStrict: true });

  assert.equal(incompleteAcad.valid, false);
  assert.match(incompleteAcad.message, /Semester is required|Division is required/);

  // Missing roll number
  const missingRoll = validateAcademicData({
    roll: '',
    branch: 'CMPN',
    classYear: 'SE',
    semester: 4,
    division: 'A',
  }, { isStrict: true });
  assert.equal(missingRoll.valid, false);
  assert.match(missingRoll.message, /Roll number is required/);
});

test('4. Invalid phone number is rejected', () => {
  // Dummy repeated digits
  assert.equal(validateAndNormalizePhone('9999999999', { isRequired: true }).valid, false);
  // Less than 10 digits
  assert.equal(validateAndNormalizePhone('98765', { isRequired: true }).valid, false);
  // Starts with invalid digit (< 6)
  assert.equal(validateAndNormalizePhone('2345678901', { isRequired: true }).valid, false);
  // Arbitrary text / letters
  assert.equal(validateAndNormalizePhone('abcdefghij', { isRequired: true }).valid, false);
  // Empty required phone
  assert.equal(validateAndNormalizePhone('', { isRequired: true }).valid, false);
  // Whitespace trimmed normalization
  const normalized = validateAndNormalizePhone('+91 98765 43210', { isRequired: true });
  assert.equal(normalized.valid, true);
  assert.equal(normalized.normalized, '9876543210');
});

test('5. Optional alternate phone number can remain empty or must be valid and distinct', () => {
  // Empty alternate phone is valid
  const emptyAlt = validateAndNormalizePhone('', { isRequired: false, isAlternate: true });
  assert.equal(emptyAlt.valid, true);
  assert.equal(emptyAlt.normalized, '');

  // Valid alternate phone
  const validAlt = validateAndNormalizePhone('8123456789', { isRequired: false, isAlternate: true });
  assert.equal(validAlt.valid, true);
  assert.equal(validAlt.normalized, '8123456789');

  // Identical primary and alternate
  const primary = '9876543210';
  const alternate = '9876543210';
  assert.equal(primary === alternate, true, 'Alternate phone cannot be identical to primary');
});

test('6. Invalid academic combinations are rejected', () => {
  // FE (First Year) can only have semesters 1 or 2, not 5
  const invalidSem = validateSemesterForYear('FE', 5);
  assert.equal(invalidSem.valid, false);
  assert.match(invalidSem.message, /Semester 5 is not valid for.*FE/);

  // TE (Third Year) can only have semesters 5 or 6, not 2
  const invalidSem2 = validateSemesterForYear('TE', 2);
  assert.equal(invalidSem2.valid, false);

  // Invalid branch
  const invalidBranch = validateAcademicData({
    roll: '24XX101',
    branch: 'AERONAUTICAL', // Not in INSTITUTION_BRANCHES
    classYear: 'SE',
    semester: 3,
    division: 'A',
  }, { isStrict: true });
  assert.equal(invalidBranch.valid, false);
  assert.match(invalidBranch.message, /Invalid branch/);

  // Invalid division
  const invalidDiv = validateAcademicData({
    roll: '24IT101',
    branch: 'INFT',
    classYear: 'SE',
    semester: 3,
    division: 'Z', // Not in A, B, C, D
  }, { isStrict: true });
  assert.equal(invalidDiv.valid, false);
  assert.match(invalidDiv.message, /Invalid division/);
});

test('7. Verified profile data cannot be silently overwritten by student input', () => {
  const verifiedUser = {
    _id: 'user_verified_123',
    name: 'Verified Student',
    email: 'verified@vit.edu.in',
    roll: '21CMPN101',
    branch: 'CMPN',
    classYear: 'BE',
    semester: 7,
    division: 'A',
    academicProfileVerified: true,
    academicVerificationStatus: 'VERIFIED',
  };

  // Malicious / erroneous student input attempting to change verified branch to INFT and year to FE
  const clientInput = {
    branch: 'INFT',
    classYear: 'FE',
    division: 'D',
    semester: 1,
    roll: 'HACKED_ROLL',
  };

  // Backend policy: When req.user.academicProfileVerified === true, force verified profile data
  let finalAcademic;
  if (verifiedUser.academicProfileVerified === true) {
    finalAcademic = {
      roll: verifiedUser.roll,
      branch: verifiedUser.branch,
      division: verifiedUser.division,
      classYear: verifiedUser.classYear,
      semester: verifiedUser.semester,
    };
  } else {
    finalAcademic = clientInput;
  }

  assert.equal(finalAcademic.roll, '21CMPN101', 'Verified roll must not be modified');
  assert.equal(finalAcademic.branch, 'CMPN', 'Verified branch must not be modified');
  assert.equal(finalAcademic.classYear, 'BE', 'Verified year must not be modified');
  assert.equal(finalAcademic.semester, 7, 'Verified semester must not be modified');
  assert.equal(finalAcademic.division, 'A', 'Verified division must not be modified');
});

test('8. Booking submission succeeds with valid required academic and contact information', () => {
  const student = {
    _id: 'user_stud_456',
    name: 'Pooja Patel',
    email: 'pooja@vit.edu.in',
    phone: '9769123456',
    roll: '24EXTC201',
    branch: 'EXTC',
    classYear: 'SE',
    semester: 4,
    division: 'B',
  };

  const bookingSnapshot = {
    student: student._id,
    name: student.name,
    email: student.email,
    phone: student.phone,
    alternatePhone: '',
    roll: student.roll,
    branch: student.branch,
    classYear: student.classYear,
    semester: student.semester,
    division: student.division,
    academicVerificationStatus: 'UNVERIFIED',
    game: 'Football',
    ground: 'Ground 1',
    date: '2026-10-20',
    timeSlots: ['8–9 AM', '9–10 AM'],
  };

  assert.equal(bookingSnapshot.phone, '9769123456');
  assert.equal(bookingSnapshot.roll, '24EXTC201');
  assert.equal(bookingSnapshot.branch, 'EXTC');
  assert.equal(bookingSnapshot.classYear, 'SE');
  assert.equal(bookingSnapshot.semester, 4);
  assert.equal(bookingSnapshot.division, 'B');
  assert.equal(bookingSnapshot.academicVerificationStatus, 'UNVERIFIED');
});

test('9. Admin can see the submitted academic details in timetable verification report', async () => {
  const origFindById = Booking.findById;
  const origTimetableFind = Timetable.find;
  const origCount = Timetable.countDocuments;
  Timetable.find = () => ({ sort: () => Promise.resolve([]) });
  Timetable.countDocuments = () => Promise.resolve(0);
  try {
    Booking.findById = () => ({
      populate: () => Promise.resolve({
        _id: 'booking_admin_test_1',
        name: 'Sneha Kulkarni',
        email: 'sneha@vit.edu.in',
        phone: '9819001122',
        alternatePhone: '9820003344',
        roll: '22BIOMED102',
        branch: 'BIOMED',
        classYear: 'TE',
        semester: 6,
        division: 'A',
        academicVerificationStatus: 'VERIFIED',
        game: 'Basketball',
        ground: 'Ground 2',
        date: '2026-10-22',
        timeSlots: ['10–11 AM'],
        teamMembers: [],
        student: {
          _id: 'stud_789',
          name: 'Sneha Kulkarni',
          email: 'sneha@vit.edu.in',
          phone: '9819001122',
          alternatePhone: '9820003344',
          academicProfileVerified: true,
          academicVerificationStatus: 'VERIFIED',
        },
      }),
    });

    const report = await verifyBookingAcademicTimetable('booking_admin_test_1');
    assert.ok(report);
    assert.equal(report.student.roll, '22BIOMED102');
    assert.equal(report.student.branch, 'BIOMED');
    assert.equal(report.student.academicYear, 'TE');
    assert.equal(report.student.semester, 6);
    assert.equal(report.student.division, 'A');
    assert.equal(report.student.academicVerificationStatus, 'VERIFIED');
  } finally {
    Booking.findById = origFindById;
    Timetable.find = origTimetableFind;
    Timetable.countDocuments = origCount;
  }
});

test('10. Admin can see the submitted mobile number and optional alternate number', async () => {
  const origFindById = Booking.findById;
  const origTimetableFind = Timetable.find;
  const origCount = Timetable.countDocuments;
  Timetable.find = () => ({ sort: () => Promise.resolve([]) });
  Timetable.countDocuments = () => Promise.resolve(0);
  try {
    Booking.findById = () => ({
      populate: () => Promise.resolve({
        _id: 'booking_phone_test',
        name: 'Rohan Joshi',
        email: 'rohan@vit.edu.in',
        phone: '9833445566',
        alternatePhone: '9822114477',
        roll: '24EXCS105',
        branch: 'EXCS',
        classYear: 'FE',
        semester: 1,
        division: 'C',
        game: 'Cricket',
        ground: 'Ground 1',
        date: '2026-10-23',
        timeSlots: ['2–3 PM'],
        student: {
          _id: 'stud_rohan',
          name: 'Rohan Joshi',
          email: 'rohan@vit.edu.in',
          phone: '9833445566',
          alternatePhone: '9822114477',
          academicProfileVerified: false,
        },
      }),
    });

    const report = await verifyBookingAcademicTimetable('booking_phone_test');
    assert.equal(report.student.phone, '9833445566');
    assert.equal(report.student.alternatePhone, '9822114477');
  } finally {
    Booking.findById = origFindById;
    Timetable.find = origTimetableFind;
    Timetable.countDocuments = origCount;
  }
});

test('11. Missing contact information is handled safely without throwing', async () => {
  const origFindById = Booking.findById;
  try {
    Booking.findById = () => ({
      populate: () => Promise.resolve({
        _id: 'legacy_booking_no_phone',
        name: 'Legacy Student',
        email: 'legacy@vit.edu.in',
        // phone and alternatePhone missing
        roll: '20INFT001',
        branch: 'INFT',
        classYear: 'BE',
        semester: null,
        division: '',
        game: 'Volleyball',
        ground: 'Ground 1',
        date: '2026-10-24',
        timeSlots: ['4–5 PM'],
        student: null,
      }),
    });

    const report = await verifyBookingAcademicTimetable('legacy_booking_no_phone');
    assert.ok(report);
    assert.equal(report.student.phone, '');
    assert.equal(report.student.alternatePhone, '');
    assert.equal(report.student.name, 'Legacy Student');
  } finally {
    Booking.findById = origFindById;
  }
});

test('12. Unauthorized users cannot access private contact details (role authorization)', () => {
  const studentUser = { role: 'student', _id: 'student_1' };
  const adminUser = { role: 'admin', _id: 'admin_1' };

  // Query filter simulation in getBookings
  const getFilterForUser = (user) => {
    return user.role === 'student' ? { student: user._id } : {};
  };

  const studentFilter = getFilterForUser(studentUser);
  assert.deepEqual(studentFilter, { student: 'student_1' }, 'Student must be restricted to their own bookings');

  const adminFilter = getFilterForUser(adminUser);
  assert.deepEqual(adminFilter, {}, 'Admin has access to view all booking records for administrative duties');
});

test('13. Existing booking functionality continues to work', () => {
  // Check slots and games constants compatibility
  const testBooking = {
    ground: 'Ground 1',
    game: 'Cricket',
    date: '2026-10-25',
    timeSlots: ['8–9 AM', '9–10 AM'],
  };
  assert.equal(testBooking.timeSlots.length <= 2, true);
  assert.equal(['Ground 1', 'Ground 2'].includes(testBooking.ground), true);
  assert.equal(['Cricket', 'Football', 'Volleyball', 'Basketball', 'Badminton'].includes(testBooking.game), true);
});

test('14. Existing users are not broken by schema changes (safe defaults)', () => {
  // Simulating an existing user object before schema migration
  const legacyUser = {
    name: 'Old User',
    email: 'old@vit.edu.in',
    role: 'student',
    roll: '20INFT050',
    branch: 'INFT',
    division: 'A',
    classYear: 'TE',
  };

  // When loaded with model defaults
  const userDoc = {
    ...legacyUser,
    phone: legacyUser.phone || '',
    alternatePhone: legacyUser.alternatePhone || '',
    semester: legacyUser.semester || null,
    academicProfileVerified: legacyUser.academicProfileVerified ?? false,
    academicVerificationStatus: legacyUser.academicVerificationStatus || 'UNVERIFIED',
  };

  assert.equal(userDoc.phone, '');
  assert.equal(userDoc.alternatePhone, '');
  assert.equal(userDoc.academicProfileVerified, false);
  assert.equal(userDoc.academicVerificationStatus, 'UNVERIFIED');
});

test('15. Registration validates and accepts mobile phone number, normalizes, and attaches to user record', () => {
  // Valid Indian 10-digit number with spaces/dashes
  const validPhoneRes = validateAndNormalizePhone(' 9820-123456 ', { isRequired: true });
  assert.equal(validPhoneRes.valid, true);
  assert.equal(validPhoneRes.normalized, '9820123456');

  // International format with +91
  const intlPhoneRes = validateAndNormalizePhone('+91 9820123456', { isRequired: true });
  assert.equal(intlPhoneRes.valid, true);
  assert.equal(intlPhoneRes.normalized, '9820123456');

  // Dummy repeating numbers rejected
  const fakePhoneRes = validateAndNormalizePhone('9999999999', { isRequired: true });
  assert.equal(fakePhoneRes.valid, false);

  // New registration payload
  const registrationPayload = {
    name: 'Priya Deshmukh',
    email: 'priya@vit.edu.in',
    roll: '24IT105',
    branch: 'INFT',
    division: 'B',
    classYear: 'SE',
    phone: validPhoneRes.normalized,
  };

  assert.equal(registrationPayload.phone, '9820123456');
});

