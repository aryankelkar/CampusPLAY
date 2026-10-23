import test from 'node:test';
import assert from 'node:assert/strict';
import Booking from '../models/Booking.js';
import Facility from '../models/Facility.js';
import { BOOKING_STATUS, TIME_SLOTS } from '../constants/index.js';
import { 
  createBookingWithValidation, 
  updateBookingStatus, 
  getAvailableSlots 
} from '../services/bookingService.js';
import { createBooking } from '../controllers/bookingController.js';

// Mock Express response helper
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

test('BOOKING ENGINE 1: Past-date reservation attempt is strictly rejected', async () => {
  const pastDate = '2020-01-01';
  await assert.rejects(
    async () => {
      await createBookingWithValidation(
        {
          game: 'Football',
          facility: 'Ground 1',
          date: pastDate,
          timeSlots: ['8–9 AM'],
        },
        'user-1',
        { name: 'Student 1', email: 'student1@vit.edu.in' }
      );
    },
    (err) => {
      assert.strictEqual(err.statusCode, 400);
      assert.match(err.message, /past date/i);
      return true;
    }
  );
});

test('BOOKING ENGINE 2: Sport-Facility mismatch is rejected (e.g. Football on Badminton Court)', async () => {
  const futureDate = '2028-12-01';
  await assert.rejects(
    async () => {
      await createBookingWithValidation(
        {
          game: 'Football',
          facility: 'Badminton Court',
          date: futureDate,
          timeSlots: ['8–9 AM'],
        },
        'user-1',
        { name: 'Student 1', email: 'student1@vit.edu.in' }
      );
    },
    (err) => {
      assert.strictEqual(err.statusCode, 400);
      assert.match(err.message, /invalid facility selection/i);
      return true;
    }
  );
});

test('BOOKING ENGINE 3: Slot already occupied by an APPROVED booking is rejected with 409 Conflict', async () => {
  const futureDate = '2028-12-02';
  const targetSlot = '10–11 AM';

  const originalBookingFindOne = Booking.findOne;
  const originalFacilityFindOne = Facility.findOne;
  try {
    Facility.findOne = async () => ({ name: 'Ground 1', status: 'ACTIVE' });
    Booking.findOne = async (query) => {
      if (query.status === BOOKING_STATUS.APPROVED) {
        return {
          _id: 'existing-approved-1',
          ground: 'Ground 1',
          facility: 'Ground 1',
          date: futureDate,
          timeSlots: [targetSlot],
          status: 'Approved',
        };
      }
      return null;
    };

    await assert.rejects(
      async () => {
        await createBookingWithValidation(
          {
            game: 'Football',
            facility: 'Ground 1',
            date: futureDate,
            timeSlots: [targetSlot],
          },
          'user-2',
          { name: 'Student 2', email: 'student2@vit.edu.in' }
        );
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.match(err.message, /already confirmed for another booking/i);
        return true;
      }
    );
  } finally {
    Booking.findOne = originalBookingFindOne;
    Facility.findOne = originalFacilityFindOne;
  }
});

test('BOOKING ENGINE 4: Duplicate reservation request by same student is rejected with 409 Conflict', async () => {
  const futureDate = '2028-12-03';
  const targetSlot = '4–5 PM';

  const originalBookingFindOne = Booking.findOne;
  const originalFacilityFindOne = Facility.findOne;
  try {
    Facility.findOne = async () => ({ name: 'Ground 1', status: 'ACTIVE' });
    Booking.findOne = async (query) => {
      // First check is for any Approved booking on this slot (none)
      if (query.status === BOOKING_STATUS.APPROVED) {
        return null;
      }
      // Second check is for duplicate by student
      if (query.student === 'user-dup') {
        return {
          _id: 'existing-pending-1',
          student: 'user-dup',
          date: futureDate,
          timeSlots: [targetSlot],
          status: 'Pending',
        };
      }
      return null;
    };

    await assert.rejects(
      async () => {
        await createBookingWithValidation(
          {
            game: 'Football',
            facility: 'Ground 1',
            date: futureDate,
            timeSlots: [targetSlot],
          },
          'user-dup',
          { name: 'Duplicate Student', email: 'dup@vit.edu.in' }
        );
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.match(err.message, /already have an active pending reservation/i);
        return true;
      }
    );
  } finally {
    Booking.findOne = originalBookingFindOne;
    Facility.findOne = originalFacilityFindOne;
  }
});

test('BOOKING ENGINE 5: Admin approval throws 409 if a competing reservation was already approved', async () => {
  const targetId = 'booking-competing-1';
  const originalFindById = Booking.findById;
  const originalFindOne = Booking.findOne;

  try {
    Booking.findById = async (id) => ({
      _id: targetId,
      facility: 'Ground 1',
      date: '2028-12-04',
      timeSlots: ['2–3 PM'],
      status: 'Pending',
      save: async () => {},
      populate: async () => {},
    });

    Booking.findOne = async (query) => {
      // Simulates that another booking with the same slot was approved in the meantime
      return {
        _id: 'other-approved-id',
        status: 'Approved',
        facility: 'Ground 1',
        timeSlots: ['2–3 PM'],
      };
    };

    await assert.rejects(
      async () => {
        await updateBookingStatus(targetId, BOOKING_STATUS.APPROVED, { approvedBy: 'admin@vit.edu.in' });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.match(err.message, /Approval conflict/i);
        return true;
      }
    );
  } finally {
    Booking.findById = originalFindById;
    Booking.findOne = originalFindOne;
  }
});

test('BOOKING ENGINE 6: Slot availability query strictly marks Approved bookings as Booked and Vacant otherwise', async () => {
  const originalFind = Booking.find;
  try {
    Booking.find = async (query) => {
      assert.strictEqual(query.status, 'Approved');
      return [
        {
          facility: 'Ground 1',
          date: '2028-12-05',
          timeSlots: ['8–9 AM', '9–10 AM'],
          game: 'Football',
          status: 'Approved',
        },
      ];
    };

    const result = await getAvailableSlots('2028-12-05', 'Ground 1', TIME_SLOTS);
    assert.ok(result.slots);
    assert.strictEqual(result.bookedTimes.length, 2);
    assert.deepStrictEqual(result.bookedTimes, ['8–9 AM', '9–10 AM']);

    const slot8 = result.slots.find((s) => s.slot === '8–9 AM');
    assert.strictEqual(slot8.status, 'Booked');

    const slot10 = result.slots.find((s) => s.slot === '10–11 AM');
    assert.strictEqual(slot10.status, 'Vacant');
  } finally {
    Booking.find = originalFind;
  }
});

test('BOOKING ENGINE 7: Simultaneous approval collision rollback triggers and reverts status to Pending', async () => {
  const targetId = 'booking-race-1';
  const originalFindById = Booking.findById;
  const originalFindOne = Booking.findOne;

  const mockBooking = {
    _id: targetId,
    facility: 'Ground 1',
    date: '2028-12-06',
    timeSlots: ['3–4 PM'],
    status: 'Pending',
    approvedBy: undefined,
    approvedAt: undefined,
    save: async function() { return this; },
    populate: async function() { return this; },
  };

  try {
    Booking.findById = async (id) => mockBooking;

    let findOneCalls = 0;
    Booking.findOne = async (query) => {
      findOneCalls++;
      // Call 1: Pre-save check -> simulates no approved booking found yet (both race simultaneously)
      if (findOneCalls === 1) {
        return null;
      }
      // Call 2: Post-save concurrency collision check -> simulates competing approval won at T1
      return {
        _id: 'competing-booking-id',
        status: 'Approved',
        facility: 'Ground 1',
        date: '2028-12-06',
        timeSlots: ['3–4 PM'],
        approvedAt: new Date(Date.now() - 50),
      };
    };

    await assert.rejects(
      async () => {
        await updateBookingStatus(targetId, BOOKING_STATUS.APPROVED, { approvedBy: 'admin@vit.edu.in' });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.match(err.message, /confirmed simultaneously/i);
        return true;
      }
    );

    // Verify rollback restored status to Pending
    assert.strictEqual(mockBooking.status, 'Pending');
    assert.strictEqual(mockBooking.approvedBy, undefined);
    assert.strictEqual(mockBooking.approvedAt, undefined);
  } finally {
    Booking.findById = originalFindById;
    Booking.findOne = originalFindOne;
  }
});

test('BOOKING ENGINE 8: Concurrency check: Reject booking when requested slot is in active Pending or Approved', async () => {
  const futureDate = '2028-12-07';
  const targetSlot = '5–6 PM';

  const originalBookingFindOne = Booking.findOne;
  const originalFacilityFindOne = Facility.findOne;
  try {
    Facility.findOne = async () => ({ name: 'Ground 1', status: 'ACTIVE' });
    Booking.findOne = async (query) => {
      if (query.student === 'student-active') {
        return {
          _id: 'pending-123',
          student: 'student-active',
          date: futureDate,
          timeSlots: [targetSlot],
          status: 'Pending',
        };
      }
      return null;
    };

    await assert.rejects(
      async () => {
        await createBookingWithValidation(
          {
            game: 'Football',
            facility: 'Ground 1',
            date: futureDate,
            timeSlots: [targetSlot],
          },
          'student-active',
          { name: 'Active Student', email: 'active@vit.edu.in' }
        );
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.match(err.message, /active pending reservation/i);
        return true;
      }
    );
  } finally {
    Booking.findOne = originalBookingFindOne;
    Facility.findOne = originalFacilityFindOne;
  }
});
