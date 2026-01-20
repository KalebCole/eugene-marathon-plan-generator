/**
 * Training plan output types matching schema/plan-schema.json
 */

import type { DayOfWeek, TimeSlot } from './intake';

export type PlanLevel = 'conservative' | 'moderate' | 'ambitious';
export type Phase = 'base' | 'build' | 'peak' | 'taper' | 'race';
export type RunType =
  | 'rest'
  | 'easy'
  | 'long'
  | 'tempo'
  | 'intervals'
  | 'fartlek'
  | 'race_pace'
  | 'recovery'
  | 'cross_training'
  | 'hill_repeats'
  | 'progression';

export type StrengthType = 'full_body' | 'upper_body' | 'lower_body' | 'core' | 'mobility';
export type IntervalType = 'continuous' | 'intervals' | 'ladder' | 'pyramid';
export type RecoveryType = 'jog' | 'walk' | 'stand';
export type DistanceUnit = 'miles' | 'km' | 'meters';

export interface PaceRange {
  min: string;  // MM:SS per mile (faster)
  max: string;  // MM:SS per mile (slower)
  description: string;
}

export interface HRZone {
  name: string;
  minHR: number;
  maxHR: number;
  percentMaxHR: string;  // e.g., "60-70%"
  purpose: string;
}

export interface PaceZones {
  easy: PaceRange;
  marathon: PaceRange;
  tempo: PaceRange;
  fiveK: PaceRange;
  interval: PaceRange;
  recovery: PaceRange;
}

export interface HRZones {
  zone1: HRZone;
  zone2: HRZone;
  zone3: HRZone;
  zone4: HRZone;
  zone5: HRZone;
}

export interface MacroTarget {
  grams: number;
  percentage: number;
}

export interface NutritionTargets {
  bmr: number;
  baseTDEE: number;
  macros: {
    protein: MacroTarget;
    carbs: MacroTarget;
    fat: MacroTarget;
  };
  notes?: string;
}

export interface WorkInterval {
  distance?: number;
  unit?: DistanceUnit;
  duration?: number;  // seconds
  pace?: string;
  hrZone?: string;
}

export interface RecoveryInterval {
  distance?: number;
  unit?: DistanceUnit;
  duration?: number;  // seconds
  type?: RecoveryType;
}

export interface LadderSet {
  distance: number;
  unit: DistanceUnit;
  pace: string;
  hrZone?: string;
  recovery?: number;  // seconds
}

export interface WorkoutStructure {
  warmup?: {
    distance?: number;
    unit?: DistanceUnit;
    pace?: string;
    hrZone?: string;
    duration?: number;
  };
  main?: {
    type: IntervalType;
    distance?: number;
    pace?: string;
    hrZone?: string;
    repeats?: number;
    work?: WorkInterval;
    recovery?: RecoveryInterval;
    sets?: LadderSet[];
  };
  cooldown?: {
    distance?: number;
    unit?: DistanceUnit;
    pace?: string;
    hrZone?: string;
    duration?: number;
  };
}

export interface RunningWorkout {
  type: RunType;
  title: string;
  description?: string;
  totalDistance?: number;
  estimatedDuration?: number;  // minutes
  hrZone?: string;
  caloriesBurned?: number;
  structure?: WorkoutStructure;
  notes?: string;
}

export interface StrengthSession {
  scheduled: boolean;
  type?: StrengthType;
  timing?: string;
  duration?: number;  // minutes
  caloriesBurned?: number;
  notes?: string;
}

export interface DailyNutrition {
  dailyTarget?: {
    calories: number;
    breakdown: string;
    protein: string;
    carbs: string;
    fat: string;
  };
  timing?: {
    preWorkout?: string;
    duringWorkout?: string;
    postWorkout?: string;
  };
  notes?: string;
}

export interface TrainingDay {
  date: string;  // YYYY-MM-DD
  dayOfWeek?: string;
  running?: RunningWorkout;
  strength?: StrengthSession;
  nutrition?: DailyNutrition;
  notes?: string;
}

export interface TrainingWeek {
  weekNumber: number;
  weeksUntilRace: number;
  isRecoveryWeek: boolean;
  phase: Phase;
  focus: string;
  totalMileage: number;
  totalHours: number;
  strengthDays: number;
  weeklyNutrition?: {
    dailyCalories: number;
    trainingCaloriesPerDay: number;
    macros: {
      protein: { grams: number; percentage: number };
      carbs: { grams: number; percentage: number };
      fat: { grams: number; percentage: number };
    };
  };
  days: Record<DayOfWeek, TrainingDay>;
}

export interface AthleteProfile {
  recentRace?: {
    distance: string;
    time: string;
    date?: string;
  };
  bodyComposition?: {
    height: {
      value: number;
      unit: 'cm' | 'inches';
    };
    weight: {
      value: number;
      unit: 'kg' | 'lbs';
    };
    age: number;
    sex: 'male' | 'female';
    activityLevel: string;
  };
  heartRate?: {
    maxHR: number;
    restingHR?: number;
    lthr?: number;
  };
  availableDays?: Record<DayOfWeek, {
    available: boolean;
    timeSlot?: TimeSlot;
    maxDuration?: number;
  }>;
  strengthPreferences?: {
    daysPerWeek: number;
    preferredDays: string[];
    avoidBeforeLongRun: boolean;
    notes?: string;
  };
  weeklyHoursLimit?: number;
  blockedDates?: Array<{
    start: string;
    end: string;
    reason?: string;
  }>;
  dietaryRestrictions?: string[];
  currentSupplements?: string[];
  goal?: string;
}

export interface PlanMetadata {
  planName: string;
  planLevel: PlanLevel;
  raceDate: string;
  raceName: string;
  totalWeeks: number;
  weeklyHoursTarget?: {
    running?: number;
    strength?: number;
    total?: number;
    min?: number;
    max?: number;
  };
  predictedFinishTime?: {
    min: string;
    max: string;
    target: string;
  };
  generatedAt: string;
}

export interface TrainingPlan {
  metadata: PlanMetadata;
  athlete: AthleteProfile;
  paceZones: PaceZones;
  hrZones: HRZones;
  nutritionTargets: NutritionTargets;
  weeks: TrainingWeek[];
}
