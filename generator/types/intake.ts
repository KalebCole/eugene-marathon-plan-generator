/**
 * Structured athlete intake data after parsing raw form responses.
 */

export type RaceDistance =
  | 'marathon'
  | 'half_marathon'
  | '10k'
  | '5k'
  | '10_miler'
  | '15k';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active';

export type Sex = 'male' | 'female';

export type TimeSlot = 'morning' | 'midday' | 'evening' | 'flexible';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type Goal = 'finish' | 'target_time' | 'best_performance';

export interface RecentRace {
  distance: RaceDistance;
  /** Time in seconds for calculations */
  timeSeconds: number;
  /** Display time in HH:MM:SS format */
  timeFormatted: string;
  /** Race date as YYYY-MM-DD */
  date?: string;
}

export interface DayAvailability {
  available: boolean;
  timeSlot?: TimeSlot;
  /** Maximum workout duration in minutes */
  maxDuration?: number;
}

export interface HeightMeasurement {
  value: number;
  unit: 'cm' | 'inches';
}

export interface WeightMeasurement {
  value: number;
  unit: 'kg' | 'lbs';
}

export interface HeartRateData {
  maxHR: number;
  restingHR?: number;
  lthr?: number;
}

export interface StrengthPreferences {
  daysPerWeek: number;
  preferredDays: DayOfWeek[];
  avoidBeforeLongRun: boolean;
  notes?: string;
}

export interface BodyComposition {
  height: HeightMeasurement;
  weight: WeightMeasurement;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
}

export interface BlockedDateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  reason?: string;
}

/**
 * Fully structured and validated athlete intake data.
 */
export interface AthleteIntake {
  submittedAt: string;

  recentRace: RecentRace;

  availableDays: Record<DayOfWeek, DayAvailability>;

  weeklyHoursLimit: number;

  heartRate: HeartRateData;

  strengthPreferences: StrengthPreferences;

  bodyComposition: BodyComposition;

  dietaryRestrictions: string[];

  blockedDates: BlockedDateRange[];

  goal: Goal;

  /** Target finish time in seconds (only if goal is 'target_time') */
  targetTimeSeconds?: number;
}

/**
 * Race distance in miles for calculations
 */
export const RACE_DISTANCES_MILES: Record<RaceDistance, number> = {
  marathon: 26.2,
  half_marathon: 13.1,
  '10k': 6.2,
  '5k': 3.1,
  '10_miler': 10,
  '15k': 9.3,
};
