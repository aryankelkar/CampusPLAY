import Equipment from '../models/Equipment.js';
import EquipmentBooking from '../models/EquipmentBooking.js';

// Convert time strings (e.g. '8:00 AM', '08:00', '8–9 AM') to minutes from midnight
export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const str = String(timeStr).trim().toUpperCase();

  // If slot range format like '8–9 AM' or '3–4 PM' or '8 AM - 9 AM'
  if (str.includes('–') || str.includes('-')) {
    const parts = str.split(/–|-/);
    return parseTimeToMinutes(parts[0].trim());
  }

  // Parse 12-hour AM/PM format e.g. "8:00 AM" or "8 AM" or "3 PM"
  const ampmMatch = str.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2] || '0', 10);
    const period = ampmMatch[3];

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  return 0;
};

// Check if two time ranges overlap: existingStart < requestedEnd AND existingEnd > requestedStart
export const isTimeOverlapping = (startA, endA, startB, endB) => {
  const minStartA = parseTimeToMinutes(startA);
  let minEndA = parseTimeToMinutes(endA);
  const minStartB = parseTimeToMinutes(startB);
  let minEndB = parseTimeToMinutes(endB);

  // If end is before or equal to start in 12h format, assume standard 1 hour duration
  if (minEndA <= minStartA) minEndA = minStartA + 60;
  if (minEndB <= minStartB) minEndB = minStartB + 60;

  return minStartA < minEndB && minEndA > minStartB;
};

import EquipmentInventoryTransaction from '../models/EquipmentInventoryTransaction.js';

export const ACTIVE_ALLOCATION_STATUSES = [
  'Approved',
  'Ready for Collection',
  'Issued',
  'Return Requested',
  'Overdue',
  'Return Issue',
];

// Calculate available quantity for an equipment item for a specific date & time interval
export const calculateAvailableQuantity = async (equipmentId, date, collectionTime, returnTime, excludeBookingId = null) => {
  const item = await Equipment.findById(equipmentId);
  if (!item) return 0;

  if (item.status === 'Maintenance') return 0;

  const totalStock = Number(item.totalQuantity) || 0;
  const damagedStock = Number(item.damagedQuantity) || 0;
  const missingStock = Number(item.missingQuantity) || 0;
  const usableBase = Math.max(0, totalStock - damagedStock - missingStock);

  // Active bookings consuming inventory: Approved, Ready for Collection, Issued, Return Requested, Overdue, Return Issue (unconfirmed)
  const query = {
    equipment: equipmentId,
    status: { $in: ACTIVE_ALLOCATION_STATUSES },
    returnConfirmedAt: { $in: [null, undefined] },
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };

  const activeBookings = await EquipmentBooking.find(query);

  let occupiedQuantity = 0;
  for (const b of activeBookings) {
    const isPhysicallyIssued = ['Issued', 'Return Requested', 'Overdue', 'Return Issue'].includes(b.status);

    if (!date || !collectionTime || !returnTime) {
      // General inventory balance: all active unreturned allocations consume inventory
      occupiedQuantity += b.quantity;
    } else if (isPhysicallyIssued) {
      // Equipment already issued out to a student is physically unavailable
      occupiedQuantity += b.quantity;
    } else if (b.date === date && isTimeOverlapping(b.collectionTime, b.returnTime, collectionTime, returnTime)) {
      // Future/same-day reservation overlapping the requested time window
      occupiedQuantity += b.quantity;
    }
  }

  return Math.max(0, usableBase - occupiedQuantity);
};

// Record an immutable equipment inventory transaction audit record
export const recordInventoryTransaction = async ({
  equipmentId,
  equipmentBookingId = null,
  transactionType,
  quantity,
  usableQuantityReturned = 0,
  damagedQuantity = 0,
  missingQuantity = 0,
  previousAvailable = null,
  resultingAvailable = null,
  performedBy = 'system',
  performedByRole = 'admin',
  notes = '',
  returnCondition = '',
}) => {
  try {
    const tx = await EquipmentInventoryTransaction.create({
      equipment: equipmentId,
      equipmentBooking: equipmentBookingId,
      transactionType,
      quantity,
      usableQuantityReturned,
      damagedQuantity,
      missingQuantity,
      previousAvailable,
      resultingAvailable,
      performedBy,
      performedByRole,
      notes,
      returnCondition,
    });
    return tx;
  } catch (err) {
    console.error('Error logging inventory transaction:', err);
    return null;
  }
};

let isEquipmentSeeded = false;

// Seed default equipment items if database table is empty
export const seedDefaultEquipment = async () => {
  if (isEquipmentSeeded) return;
  try {
    const count = await Equipment.countDocuments();
    if (count > 0) {
      isEquipmentSeeded = true;
      return;
    }

    const defaultItems = [
      { name: 'Cricket Bat', category: 'Cricket', description: 'English willow & Kashmir willow match bats', totalQuantity: 10, image: '/equipment/cricket-bat.png' },
      { name: 'Cricket Ball', category: 'Cricket', description: 'Regulation leather & synthetic match balls', totalQuantity: 15, image: '/equipment/cricket-ball.png' },
      { name: 'Cricket Stumps', category: 'Cricket', description: 'Wooden stump sets with bails & stand', totalQuantity: 6, image: '/equipment/cricket-stumps.png' },
      { name: 'Football', category: 'Football', description: 'FIFA-approved match & training footballs', totalQuantity: 12, image: '/equipment/football.png' },
      { name: 'Volleyball', category: 'Volleyball', description: 'Professional indoor & outdoor volleyballs', totalQuantity: 10, image: '/equipment/volleyball.png' },
      { name: 'Badminton Racket', category: 'Badminton', description: 'Lightweight graphite badminton rackets', totalQuantity: 16, image: '/equipment/badminton-racket.png' },
      { name: 'Shuttlecock', category: 'Badminton', description: 'Feather & synthetic shuttlecock packs', totalQuantity: 30, image: '/equipment/shuttlecock.png' },
      { name: 'Training Cones', category: 'General', description: 'High-visibility field marker cones (Set of 10)', totalQuantity: 50, image: '/equipment/cones.png' },
      { name: 'Bibs', category: 'General', description: 'Breathable mesh team training bibs', totalQuantity: 40, image: '/equipment/bibs.png' },
      { name: 'Volleyball Net', category: 'Volleyball', description: 'Official regulation campus volleyball net', totalQuantity: 4, image: '/equipment/volleyball-net.png' },
    ];

    await Equipment.insertMany(defaultItems);
    console.log('✅ Seeded default sports equipment inventory');
  } catch (err) {
    console.error('❌ Error seeding equipment:', err);
  }
};
