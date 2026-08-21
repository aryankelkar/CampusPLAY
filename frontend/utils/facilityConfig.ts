export interface FacilityInfo {
  id: string;
  name: 'Ground 1' | 'Ground 2' | 'Basketball Court' | 'Badminton Court';
  type: 'GROUND' | 'COURT';
  supportedSports: Array<'Football' | 'Cricket' | 'Volleyball' | 'Basketball' | 'Badminton'>;
  location: string;
  capacity: string;
  description: string;
  operatingHours?: string;
  image?: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

export const CAMPUS_FACILITIES: FacilityInfo[] = [
  {
    id: 'ground-1',
    name: 'Ground 1',
    type: 'GROUND',
    supportedSports: ['Football', 'Cricket', 'Volleyball'],
    location: 'Main Sports Complex',
    capacity: '22 Players',
    description: 'Full-sized outdoor turf ground for Football, Cricket, and Volleyball matches.',
    status: 'ACTIVE',
  },
  {
    id: 'ground-2',
    name: 'Ground 2',
    type: 'GROUND',
    supportedSports: ['Football', 'Cricket', 'Volleyball'],
    location: 'West Campus',
    capacity: '22 Players',
    description: 'Secondary outdoor multi-purpose sports ground.',
    status: 'ACTIVE',
  },
  {
    id: 'basketball-court',
    name: 'Basketball Court',
    type: 'COURT',
    supportedSports: ['Basketball'],
    location: 'Indoor Sports Arena',
    capacity: '10 Players',
    description: 'Standard synthetic hardwood basketball court with modern lighting.',
    status: 'ACTIVE',
  },
  {
    id: 'badminton-court',
    name: 'Badminton Court',
    type: 'COURT',
    supportedSports: ['Badminton'],
    location: 'Indoor Sports Arena',
    capacity: '4 Players',
    description: 'Indoor badminton court with professional mat surface and nets.',
    status: 'ACTIVE',
  },
];

export const SPORT_TO_FACILITY_MAP: Record<string, string[]> = {
  Football: ['Ground 1', 'Ground 2'],
  Cricket: ['Ground 1', 'Ground 2'],
  Volleyball: ['Ground 2', 'Ground 1'],
  Basketball: ['Basketball Court'],
  Badminton: ['Badminton Court'],
};

export const getFacilityLabelForSport = (sport: string): string => {
  switch (sport) {
    case 'Football':
    case 'Cricket':
    case 'Volleyball':
      return 'SELECT GROUND';
    case 'Basketball':
    case 'Badminton':
      return 'SELECT COURT';
    default:
      return 'SELECT FACILITY';
  }
};

export const getCompatibleFacilities = (sport: string): FacilityInfo[] => {
  const allowedNames = SPORT_TO_FACILITY_MAP[sport] || [];
  return CAMPUS_FACILITIES.filter((fac) => allowedNames.includes(fac.name));
};
