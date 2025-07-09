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

// Utility function to add working days to a date (excluding weekends and holidays)
export const addWorkingDays = (startDate: Date, workingDays: number, holidays: Date[] = []): Date => {
  const result = new Date(startDate);
  let daysToAdd = workingDays;
  
  while (daysToAdd > 0) {
    result.setDate(result.getDate() + 1);
    
    // Skip weekends (Saturday = 6, Sunday = 0)
    const isWeekend = result.getDay() === 0 || result.getDay() === 6;
    
    // Skip holidays
    const isHoliday = holidays.some(holiday => 
      holiday.toDateString() === result.toDateString()
    );
    
    if (!isWeekend && !isHoliday) {
      daysToAdd--;
    }
  }
  
  return result;
};

// Calculate minimum installation date based on delivery confirmation and state
export const calculateMinInstallationDate = (
  deliveryConfirmedDate: Date, 
  deliveryState: string,
  holidays: Date[] = []
): Date => {
  const deliveryTime = DELIVERY_TIME_BY_STATE[deliveryState] || { min: 3, max: 5 };
  return addWorkingDays(deliveryConfirmedDate, deliveryTime.max, holidays);
};

// Calculate minimum training date (next working day after installation confirmation)
export const calculateMinTrainingDate = (
  installationConfirmedDate: Date,
  holidays: Date[] = []
): Date => {
  // Training must be scheduled at least 1 working day after installation confirmation
  // This ensures proper time for installation completion and preparation
  return addWorkingDays(installationConfirmedDate, 1, holidays);
};

// Trainer Management Constants
export const TRAINER_LANGUAGES = [
  'English',
  'Malay',
  'Chinese'
] as const;

export const TRAINER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
} as const;

export type TrainerLanguage = typeof TRAINER_LANGUAGES[number];
export type TrainerStatus = typeof TRAINER_STATUS[keyof typeof TRAINER_STATUS]; 