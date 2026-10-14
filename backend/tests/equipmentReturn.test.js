import test from 'node:test';
import assert from 'node:assert/strict';
import Equipment from '../models/Equipment.js';
import EquipmentBooking from '../models/EquipmentBooking.js';
import EquipmentInventoryTransaction from '../models/EquipmentInventoryTransaction.js';
import { 
  calculateAvailableQuantity, 
  ACTIVE_ALLOCATION_STATUSES,
  recordInventoryTransaction 
} from '../services/equipmentService.js';
import { 
  requestEquipmentReturn, 
  confirmEquipmentReturn, 
  markEquipmentAsIssued, 
  cancelEquipmentBooking 
} from '../controllers/equipmentController.js';

// Helper to create mock Express response object
function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

test('TEST 1: FULL RETURN - Usable stock restored, status Marked Returned, audit logged', async () => {
  const eqId = 'eq-full-1';
  const mockEquipment = {
    _id: eqId,
    name: 'Cricket Ball',
    category: 'Cricket',
    totalQuantity: 10,
    damagedQuantity: 0,
    missingQuantity: 0,
    status: 'Available',
    save: async function() { return this; },
  };

  const booking = {
    _id: 'b-full-1',
    equipment: eqId,
    student: 'student-123',
    studentName: 'Aryan Kelkar',
    quantity: 3,
    quantityIssued: 3,
    status: 'Issued',
    issuedAt: new Date(),
    returnConfirmedAt: null,
    save: async function() { return this; },
  };

  // Mock DB lookup
  const origFindEquipmentById = Equipment.findById;
  const origFindBookingById = EquipmentBooking.findById;
  const origFindBookings = EquipmentBooking.find;
  const origTxCreate = EquipmentInventoryTransaction.create;

  let createdAuditTx = null;
  EquipmentInventoryTransaction.create = async (data) => {
    createdAuditTx = data;
    return { _id: 'tx-1', ...data };
  };

  Equipment.findById = async (id) => (String(id) === eqId ? mockEquipment : null);
  EquipmentBooking.findById = async (id) => (String(id) === 'b-full-1' ? booking : null);
  
  // Before return: 1 active issued booking of 3
  EquipmentBooking.find = async () => (booking.status === 'Issued' ? [booking] : []);

  const stockBefore = await calculateAvailableQuantity(eqId);
  assert.equal(stockBefore, 7, 'Before return, available stock should be 10 - 3 = 7');

  const req = {
    params: { id: 'b-full-1' },
    user: { role: 'admin', email: 'admin@vit.edu.in' },
    body: {
      quantityReturned: 3,
      quantityDamaged: 0,
      quantityMissing: 0,
      returnCondition: 'Good',
      returnNotes: 'Returned in good order',
    },
  };
  const res = createMockRes();

  await confirmEquipmentReturn(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(booking.status, 'Returned');
  assert.equal(booking.quantityReturned, 3);
  assert.ok(booking.returnConfirmedAt, 'returnConfirmedAt must be recorded');
  assert.equal(mockEquipment.damagedQuantity, 0);
  assert.equal(mockEquipment.missingQuantity, 0);

  // After return: status is Returned, not in active allocations
  EquipmentBooking.find = async () => [];
  const stockAfter = await calculateAvailableQuantity(eqId);
  assert.equal(stockAfter, 10, 'After full return, available stock should increase by 3 to 10');

  // Verify audit log
  assert.ok(createdAuditTx, 'Inventory transaction audit must be created');
  assert.equal(createdAuditTx.transactionType, 'RETURN_CONFIRMED');
  assert.equal(createdAuditTx.usableQuantityReturned, 3);

  // Restore mocks
  Equipment.findById = origFindEquipmentById;
  EquipmentBooking.findById = origFindBookingById;
  EquipmentBooking.find = origFindBookings;
  EquipmentInventoryTransaction.create = origTxCreate;
});

test('TEST 2: PARTIAL RETURN - Issued 5, Usable 3, Damaged 1, Missing 1 -> Reconciled and restored accurately', async () => {
  const eqId = 'eq-partial-1';
  const mockEquipment = {
    _id: eqId,
    name: 'Football',
    category: 'Football',
    totalQuantity: 10,
    damagedQuantity: 0,
    missingQuantity: 0,
    status: 'Available',
    save: async function() { return this; },
  };

  const booking = {
    _id: 'b-part-1',
    equipment: eqId,
    student: 'student-200',
    studentName: 'Rahul Mehta',
    quantity: 5,
    quantityIssued: 5,
    status: 'Return Requested',
    issuedAt: new Date(),
    returnConfirmedAt: null,
    save: async function() { return this; },
  };

  const origFindEquipmentById = Equipment.findById;
  const origFindBookingById = EquipmentBooking.findById;
  const origFindBookings = EquipmentBooking.find;
  const origTxCreate = EquipmentInventoryTransaction.create;

  EquipmentInventoryTransaction.create = async (data) => ({ _id: 'tx-2', ...data });

  Equipment.findById = async (id) => (String(id) === eqId ? mockEquipment : null);
  EquipmentBooking.findById = async (id) => (String(id) === 'b-part-1' ? booking : null);
  EquipmentBooking.find = async () => (booking.status === 'Return Requested' ? [booking] : []);

  const stockBefore = await calculateAvailableQuantity(eqId);
  assert.equal(stockBefore, 5, 'Initial available: 10 - 5 = 5');

  const req = {
    params: { id: 'b-part-1' },
    user: { role: 'admin', email: 'admin@vit.edu.in' },
    body: {
      quantityReturned: 3,
      quantityDamaged: 1,
      quantityMissing: 1,
      returnCondition: 'Damaged',
      returnNotes: '1 ball punctured, 1 ball not returned',
    },
  };
  const res = createMockRes();

  await confirmEquipmentReturn(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(booking.quantityReturned, 3);
  assert.equal(booking.quantityDamaged, 1);
  assert.equal(booking.quantityMissing, 1);
  assert.equal(mockEquipment.damagedQuantity, 1, 'One damaged unit recorded on Equipment');
  assert.equal(mockEquipment.missingQuantity, 1, 'One missing unit recorded on Equipment');

  // Quantities reconcile: 3 + 1 + 1 === 5
  assert.equal(booking.quantityReturned + booking.quantityDamaged + booking.quantityMissing, booking.quantityIssued);

  // Available stock should increase by exactly 3 usable items: from 5 to 8
  EquipmentBooking.find = async () => [];
  const stockAfter = await calculateAvailableQuantity(eqId);
  // total 10 - damaged 1 - missing 1 = usableBase 8
  assert.equal(stockAfter, 8, 'Available stock should be 8 (5 previous + 3 usable returned)');

  Equipment.findById = origFindEquipmentById;
  EquipmentBooking.findById = origFindBookingById;
  EquipmentBooking.find = origFindBookings;
  EquipmentInventoryTransaction.create = origTxCreate;
});

test('TEST 3: STUDENT SUBMITS RETURN - Status changes to Return Requested, stock NOT restored yet', async () => {
  const eqId = 'eq-sub-1';
  const mockEquipment = {
    _id: eqId,
    name: 'Badminton Racket',
    totalQuantity: 8,
    damagedQuantity: 0,
    missingQuantity: 0,
    status: 'Available',
    save: async function() { return this; },
  };

  const booking = {
    _id: 'b-sub-1',
    equipment: eqId,
    student: 'student-me',
    quantity: 2,
    quantityIssued: 2,
    status: 'Issued',
    returnRequestedAt: null,
    save: async function() { return this; },
  };

  const origFindEquipmentById = Equipment.findById;
  const origFindBookingById = EquipmentBooking.findById;
  const origFindBookings = EquipmentBooking.find;

  Equipment.findById = async () => mockEquipment;
  EquipmentBooking.findById = async () => booking;
  EquipmentBooking.find = async () => [booking];

  const stockBefore = await calculateAvailableQuantity(eqId);
  assert.equal(stockBefore, 6, '8 - 2 = 6 available before return report');

  const req = {
    params: { id: 'b-sub-1' },
    user: { _id: 'student-me', role: 'student' },
  };
  const res = createMockRes();

  await requestEquipmentReturn(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(booking.status, 'Return Requested');
  assert.ok(booking.returnRequestedAt, 'Timestamp recorded for student return submission');

  // Stock must NOT increase upon student submission alone!
  const stockAfter = await calculateAvailableQuantity(eqId);
  assert.equal(stockAfter, 6, 'Available stock must remain 6 until administrator physically confirms');

  Equipment.findById = origFindEquipmentById;
  EquipmentBooking.findById = origFindBookingById;
  EquipmentBooking.find = origFindBookings;
});

test('TEST 4: DUPLICATE RETURN - Second confirmation rejected with 400 and stock not restored twice', async () => {
  const eqId = 'eq-dup-1';
  const booking = {
    _id: 'b-dup-1',
    equipment: eqId,
    student: 'student-dup',
    quantity: 2,
    quantityIssued: 2,
    status: 'Returned',
    returnConfirmedAt: new Date(),
    save: async function() { return this; },
  };

  const origFindBookingById = EquipmentBooking.findById;
  EquipmentBooking.findById = async () => booking;

  const req = {
    params: { id: 'b-dup-1' },
    user: { role: 'admin' },
    body: { quantityReturned: 2, quantityDamaged: 0, quantityMissing: 0 },
  };
  const res = createMockRes();

  await confirmEquipmentReturn(req, res);

  assert.equal(res.statusCode, 400, 'Duplicate return confirmation must be rejected');
  assert.match(res.body.message, /already been confirmed/i);

  EquipmentBooking.findById = origFindBookingById;
});

test('TEST 5: UNAUTHORIZED STUDENT - Student cannot submit return for another student', async () => {
  const booking = {
    _id: 'b-unauth-1',
    student: 'student-actual-owner',
    status: 'Issued',
    save: async function() { return this; },
  };

  const origFindBookingById = EquipmentBooking.findById;
  EquipmentBooking.findById = async () => booking;

  const req = {
    params: { id: 'b-unauth-1' },
    user: { _id: 'student-impostor', role: 'student' },
  };
  const res = createMockRes();

  await requestEquipmentReturn(req, res);

  assert.equal(res.statusCode, 403, 'Must return 403 Forbidden for unauthorized student');
  assert.equal(booking.status, 'Issued', 'Booking status must remain unchanged');

  EquipmentBooking.findById = origFindBookingById;
});

test('TEST 6: INVALID QUANTITY - Returned, damaged, and missing quantities must reconcile with issued qty', async () => {
  const booking = {
    _id: 'b-inv-1',
    equipment: 'eq-inv',
    quantity: 4,
    quantityIssued: 4,
    status: 'Issued',
    save: async function() { return this; },
  };

  const origFindBookingById = EquipmentBooking.findById;
  EquipmentBooking.findById = async () => booking;

  // Case A: Sum less than issued (3 < 4)
  const reqA = {
    params: { id: 'b-inv-1' },
    user: { role: 'admin' },
    body: { quantityReturned: 3, quantityDamaged: 0, quantityMissing: 0 },
  };
  const resA = createMockRes();
  await confirmEquipmentReturn(reqA, resA);
  assert.equal(resA.statusCode, 400);
  assert.match(resA.body.message, /Reconciliation error/i);

  // Case B: Sum greater than issued (5 > 4)
  const reqB = {
    params: { id: 'b-inv-1' },
    user: { role: 'admin' },
    body: { quantityReturned: 3, quantityDamaged: 2, quantityMissing: 0 },
  };
  const resB = createMockRes();
  await confirmEquipmentReturn(reqB, resB);
  assert.equal(resB.statusCode, 400);
  assert.match(resB.body.message, /Reconciliation error/i);

  // Case C: Negative quantity
  const reqC = {
    params: { id: 'b-inv-1' },
    user: { role: 'admin' },
    body: { quantityReturned: -1, quantityDamaged: 5, quantityMissing: 0 },
  };
  const resC = createMockRes();
  await confirmEquipmentReturn(reqC, resC);
  assert.equal(resC.statusCode, 400);
  assert.match(resC.body.message, /non-negative/i);

  EquipmentBooking.findById = origFindBookingById;
});

test('TEST 7: CONCURRENT RETURNS - Check-and-set idempotency prevents double restoration', async () => {
  const eqId = 'eq-conc-1';
  let mockEquipment = {
    _id: eqId,
    totalQuantity: 10,
    damagedQuantity: 0,
    missingQuantity: 0,
    status: 'Available',
    save: async function() { return this; },
  };

  let booking = {
    _id: 'b-conc-1',
    equipment: eqId,
    quantity: 3,
    quantityIssued: 3,
    status: 'Issued',
    returnConfirmedAt: null,
    save: async function() { return this; },
  };

  const origFindEquipmentById = Equipment.findById;
  const origFindBookingById = EquipmentBooking.findById;
  const origFindBookings = EquipmentBooking.find;
  const origTxCreate = EquipmentInventoryTransaction.create;

  EquipmentInventoryTransaction.create = async (data) => ({ _id: 'tx-mock', ...data });

  Equipment.findById = async () => mockEquipment;
  EquipmentBooking.findById = async () => booking;
  EquipmentBooking.find = async () => (booking.status === 'Issued' ? [booking] : []);

  // First request completes
  const req1 = {
    params: { id: 'b-conc-1' },
    user: { role: 'admin' },
    body: { quantityReturned: 3, quantityDamaged: 0, quantityMissing: 0 },
  };
  const res1 = createMockRes();
  await confirmEquipmentReturn(req1, res1);
  assert.equal(res1.statusCode, 200);
  assert.equal(booking.status, 'Returned');

  // Second request arrives concurrently or immediately after
  const req2 = {
    params: { id: 'b-conc-1' },
    user: { role: 'admin' },
    body: { quantityReturned: 3, quantityDamaged: 0, quantityMissing: 0 },
  };
  const res2 = createMockRes();
  await confirmEquipmentReturn(req2, res2);
  assert.equal(res2.statusCode, 400, 'Second attempt must be rejected to prevent double inventory restoration');

  Equipment.findById = origFindEquipmentById;
  EquipmentBooking.findById = origFindBookingById;
  EquipmentBooking.find = origFindBookings;
  EquipmentInventoryTransaction.create = origTxCreate;
});

test('TEST 8: DAMAGED EQUIPMENT - Damaged units do not increase usable availability', async () => {
  const eqId = 'eq-dam-1';
  const mockEquipment = {
    _id: eqId,
    name: 'Volleyball',
    totalQuantity: 10,
    damagedQuantity: 0,
    missingQuantity: 0,
    status: 'Available',
    save: async function() { return this; },
  };

  const booking = {
    _id: 'b-dam-1',
    equipment: eqId,
    quantity: 4,
    quantityIssued: 4,
    status: 'Issued',
    save: async function() { return this; },
  };

  const origFindEquipmentById = Equipment.findById;
  const origFindBookingById = EquipmentBooking.findById;
  const origFindBookings = EquipmentBooking.find;
  const origTxCreate = EquipmentInventoryTransaction.create;

  EquipmentInventoryTransaction.create = async (data) => ({ _id: 'tx-mock-2', ...data });

  Equipment.findById = async () => mockEquipment;
  EquipmentBooking.findById = async () => booking;
  EquipmentBooking.find = async () => (booking.status === 'Issued' ? [booking] : []);

  const stockBefore = await calculateAvailableQuantity(eqId);
  assert.equal(stockBefore, 6, '10 - 4 = 6 before return');

  // All 4 units damaged beyond repair
  const req = {
    params: { id: 'b-dam-1' },
    user: { role: 'admin' },
    body: {
      quantityReturned: 0,
      quantityDamaged: 4,
      quantityMissing: 0,
      returnCondition: 'Damaged',
      returnNotes: 'Torn during match',
    },
  };
  const res = createMockRes();
  await confirmEquipmentReturn(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(mockEquipment.damagedQuantity, 4);

  // Booking is completed, but usableBase is now 10 - 4 = 6
  EquipmentBooking.find = async () => [];
  const stockAfter = await calculateAvailableQuantity(eqId);
  assert.equal(stockAfter, 6, 'Available stock must NOT increase when only damaged units are returned');

  Equipment.findById = origFindEquipmentById;
  EquipmentBooking.findById = origFindBookingById;
  EquipmentBooking.find = origFindBookings;
  EquipmentInventoryTransaction.create = origTxCreate;
});

test('TEST 9: CANCELLED REQUEST - Does not consume inventory or restore stock twice', async () => {
  const eqId = 'eq-canc-1';
  const mockEquipment = {
    _id: eqId,
    totalQuantity: 10,
    damagedQuantity: 0,
    missingQuantity: 0,
    status: 'Available',
    save: async function() { return this; },
  };

  const booking = {
    _id: 'b-canc-1',
    equipment: eqId,
    student: 'student-c',
    quantity: 3,
    status: 'Approved',
    save: async function() { return this; },
  };

  const origFindEquipmentById = Equipment.findById;
  const origFindBookingById = EquipmentBooking.findById;
  const origFindBookings = EquipmentBooking.find;
  const origTxCreate = EquipmentInventoryTransaction.create;

  EquipmentInventoryTransaction.create = async (data) => ({ _id: 'tx-canc', ...data });

  Equipment.findById = async () => mockEquipment;
  EquipmentBooking.findById = async () => booking;
  EquipmentBooking.find = async () => (booking.status === 'Approved' ? [booking] : []);

  const stockWithApproved = await calculateAvailableQuantity(eqId);
  assert.equal(stockWithApproved, 7, '10 - 3 = 7 while reservation is Approved');

  // Cancel reservation
  const req = {
    params: { id: 'b-canc-1' },
    user: { _id: 'student-c', role: 'student' },
  };
  const res = createMockRes();
  await cancelEquipmentBooking(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(booking.status, 'Cancelled');

  // Once cancelled, it no longer consumes active inventory
  EquipmentBooking.find = async () => (ACTIVE_ALLOCATION_STATUSES.includes(booking.status) ? [booking] : []);
  const stockAfterCancel = await calculateAvailableQuantity(eqId);
  assert.equal(stockAfterCancel, 10, 'Available stock is restored to 10 after cancellation');

  // Attempting to cancel an already cancelled booking fails gracefully
  const res2 = createMockRes();
  await cancelEquipmentBooking(req, res2);
  assert.equal(res2.statusCode, 400, 'Already cancelled booking cannot be cancelled again');

  Equipment.findById = origFindEquipmentById;
  EquipmentBooking.findById = origFindBookingById;
  EquipmentBooking.find = origFindBookings;
  EquipmentInventoryTransaction.create = origTxCreate;
});

test('TEST 10: UI & INVENTORY CALCULATION CONSISTENCY - Unified calculation across student and admin views', async () => {
  const eqId = 'eq-cons-1';
  const mockEquipment = {
    _id: eqId,
    name: 'Cricket Stumps',
    totalQuantity: 12,
    damagedQuantity: 1,
    missingQuantity: 1,
    status: 'Available',
  };

  // 1 issued (2 units), 1 return requested (1 unit), 1 cancelled (3 units), 1 returned (2 units)
  const activeBookings = [
    { _id: 'b-1', equipment: eqId, status: 'Issued', quantity: 2, returnConfirmedAt: null },
    { _id: 'b-2', equipment: eqId, status: 'Return Requested', quantity: 1, returnConfirmedAt: null },
  ];

  const origFindEquipmentById = Equipment.findById;
  const origFindBookings = EquipmentBooking.find;

  Equipment.findById = async () => mockEquipment;
  EquipmentBooking.find = async () => activeBookings;

  // General inventory balance
  const generalAvailability = await calculateAvailableQuantity(eqId, null, null, null);
  // Total 12 - damaged 1 - missing 1 = 10 usable base.
  // Active allocations: 2 (Issued) + 1 (Return Requested) = 3 occupied.
  // Available = 10 - 3 = 7.
  assert.equal(generalAvailability, 7);

  // Time-slot specific calculation for a slot:
  // Physically issued items (Issued, Return Requested) are unavailable regardless of time slot
  const slotAvailability = await calculateAvailableQuantity(eqId, '2026-10-15', '10:00 AM', '11:00 AM');
  assert.equal(slotAvailability, 7, 'Slot availability matches general availability when items are physically checked out');

  Equipment.findById = origFindEquipmentById;
  EquipmentBooking.find = origFindBookings;
});
