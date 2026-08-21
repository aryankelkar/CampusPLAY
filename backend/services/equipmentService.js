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

// Calculate available quantity for an equipment item for a specific date & time interval
export const calculateAvailableQuantity = async (equipmentId, date, collectionTime, returnTime, excludeBookingId = null) => {
  const item = await Equipment.findById(equipmentId);
  if (!item) return 0;

  if (item.status === 'Maintenance') return 0;

  // Only APPROVED bookings reduce inventory!
  const query = {
    equipment: equipmentId,
    status: 'Approved',
  };
  if (date) query.date = date;
  if (excludeBookingId) query._id = { $ne: excludeBookingId };

  const approvedBookings = await EquipmentBooking.find(query);

  let occupiedQuantity = 0;
  for (const b of approvedBookings) {
    if (!date || !collectionTime || !returnTime || isTimeOverlapping(b.collectionTime, b.returnTime, collectionTime, returnTime)) {
      occupiedQuantity += b.quantity;
    }
  }

  return Math.max(0, item.totalQuantity - occupiedQuantity);
};

// Seed default equipment items if database table is empty
export const seedDefaultEquipment = async () => {
  try {
    const count = await Equipment.countDocuments();
    if (count > 0) return;

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
