// Malaysia States
export const MALAYSIA_STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Kuala Lumpur',
  'Labuan',
  'Malacca',
  'Negeri Sembilan',
  'Pahang',
  'Penang',
  'Perak',
  'Perlis',
  'Putrajaya',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu'
];

// Delivery time estimation by state (in working days)
export const DELIVERY_TIME_BY_STATE: Record<string, { min: number; max: number }> = {
  'Johor': { min: 3, max: 5 },
  'Kedah': { min: 3, max: 5 },
  'Kelantan': { min: 3, max: 5 },
  'Kuala Lumpur': { min: 1, max: 1 },
  'Labuan': { min: 5, max: 7 },
  'Malacca': { min: 3, max: 5 },
  'Negeri Sembilan': { min: 3, max: 5 },
  'Pahang': { min: 3, max: 5 },
  'Penang': { min: 3, max: 5 },
  'Perak': { min: 3, max: 5 },
  'Perlis': { min: 3, max: 5 },
  'Putrajaya': { min: 1, max: 1 },
  'Sabah': { min: 5, max: 7 },
  'Sarawak': { min: 5, max: 7 },
  'Selangor': { min: 1, max: 1 },
  'Terengganu': { min: 3, max: 5 }
}; 