import Facility from '../models/Facility.js';

export const SPORT_FACILITY_MAP = {
  Football: ['Ground 1', 'Ground 2'],
  Cricket: ['Ground 1', 'Ground 2'],
  Volleyball: ['Ground 2', 'Ground 1'],
  Basketball: ['Basketball Court'],
  Badminton: ['Badminton Court'],
};

export const DEFAULT_FACILITIES = [
  {
    name: 'Ground 1',
    type: 'GROUND',
    supportedSports: ['Football', 'Cricket', 'Volleyball'],
    status: 'ACTIVE',
    capacity: '22 Players',
    location: 'Main Sports Complex',
    operatingHours: '08:00 AM - 06:00 PM',
    description: 'Full-sized outdoor turf ground for Football, Cricket, and Volleyball matches.',
  },
  {
    name: 'Ground 2',
    type: 'GROUND',
    supportedSports: ['Football', 'Cricket', 'Volleyball'],
    status: 'ACTIVE',
    capacity: '22 Players',
    location: 'West Campus',
    operatingHours: '08:00 AM - 06:00 PM',
    description: 'Secondary outdoor multi-purpose sports ground.',
  },
  {
    name: 'Basketball Court',
    type: 'COURT',
    supportedSports: ['Basketball'],
    status: 'ACTIVE',
    capacity: '10 Players',
    location: 'Indoor Sports Arena',
    operatingHours: '08:00 AM - 06:00 PM',
    description: 'Standard synthetic hardwood basketball court with modern lighting.',
  },
  {
    name: 'Badminton Court',
    type: 'COURT',
    supportedSports: ['Badminton'],
    status: 'ACTIVE',
    capacity: '4 Players',
    location: 'Indoor Sports Arena',
    operatingHours: '08:00 AM - 06:00 PM',
    description: 'Indoor badminton court with professional mat surface and nets.',
  },
];

export const seedDefaultFacilities = async () => {
  try {
    for (const fac of DEFAULT_FACILITIES) {
      await Facility.findOneAndUpdate(
        { name: fac.name },
        { $set: fac },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    console.error('Error seeding default facilities:', err.message);
  }
};

export const validateSportFacilityMatch = (sport, facilityName) => {
  if (!sport || !facilityName) {
    return { valid: false, message: 'Sport and Facility are required.' };
  }

  const allowedFacilities = SPORT_FACILITY_MAP[sport];
  if (!allowedFacilities) {
    return { valid: false, message: `Unsupported sport: ${sport}` };
  }

  if (!allowedFacilities.includes(facilityName)) {
    return { 
      valid: false, 
      message: `Invalid facility selection. ${sport} can only be played on: ${allowedFacilities.join(', ')}.` 
    };
  }

  return { valid: true };
};

export const getFacilities = async (sportFilter = null) => {
  const filter = {};
  if (sportFilter && SPORT_FACILITY_MAP[sportFilter]) {
    filter.name = { $in: SPORT_FACILITY_MAP[sportFilter] };
  }
  return await Facility.find(filter).sort({ type: 1, name: 1 });
};

export const getFacilityByName = async (name) => {
  return await Facility.findOne({ name });
};

export const updateFacilityStatus = async (facilityId, status, details = {}) => {
  return await Facility.findByIdAndUpdate(
    facilityId,
    { status, ...details },
    { new: true }
  );
};
