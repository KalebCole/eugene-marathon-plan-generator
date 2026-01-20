/**
 * Strength training scheduler.
 * Places strength sessions respecting sequencing rules from CLAUDE.md:
 * 1. No heavy leg work within 48 hours of speed work (intervals, tempo)
 * 2. Lift AFTER runs on same day, never before
 * 3. No lifting the day before long runs
 * 4. Upper body is flexible - can be scheduled most days
 */

import {
  StrengthSession,
  StrengthType,
  Phase,
  RunType,
} from '../types/plan';
import { DayOfWeek, StrengthPreferences } from '../types/intake';

interface DayWorkout {
  day: DayOfWeek;
  runType: RunType;
}

interface StrengthAllocation {
  day: DayOfWeek;
  type: StrengthType;
  timing: string;
  duration: number;
  notes?: string;
}

// Days in order for iteration
const DAYS_IN_ORDER: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

/**
 * Check if a run type is a "speed" workout.
 */
function isSpeedWorkout(runType: RunType): boolean {
  return ['tempo', 'intervals', 'hill_repeats', 'fartlek', 'race_pace'].includes(runType);
}

/**
 * Check if a run type is a long run.
 */
function isLongRun(runType: RunType): boolean {
  return ['long', 'progression'].includes(runType);
}

/**
 * Get the previous day.
 */
function getPreviousDay(day: DayOfWeek): DayOfWeek {
  const idx = DAYS_IN_ORDER.indexOf(day);
  return DAYS_IN_ORDER[(idx - 1 + 7) % 7];
}

/**
 * Get the next day.
 */
function getNextDay(day: DayOfWeek): DayOfWeek {
  const idx = DAYS_IN_ORDER.indexOf(day);
  return DAYS_IN_ORDER[(idx + 1) % 7];
}

/**
 * Check if heavy legs can be done on a specific day.
 */
function canDoHeavyLegs(
  day: DayOfWeek,
  weekWorkouts: Map<DayOfWeek, RunType>
): boolean {
  const prevDay = getPreviousDay(day);
  const nextDay = getNextDay(day);
  const dayAfterNext = getNextDay(nextDay);

  // No heavy legs within 48 hours of speed work
  const prevWorkout = weekWorkouts.get(prevDay);
  const nextWorkout = weekWorkouts.get(nextDay);
  const dayAfterWorkout = weekWorkouts.get(dayAfterNext);

  if (prevWorkout && isSpeedWorkout(prevWorkout)) return false;
  if (nextWorkout && isSpeedWorkout(nextWorkout)) return false;

  // No lifting day before long runs
  if (nextWorkout && isLongRun(nextWorkout)) return false;

  return true;
}

/**
 * Check if any lifting can be done on a specific day.
 */
function canLiftOnDay(
  day: DayOfWeek,
  weekWorkouts: Map<DayOfWeek, RunType>
): boolean {
  const nextDay = getNextDay(day);
  const nextWorkout = weekWorkouts.get(nextDay);

  // No lifting day before long runs
  if (nextWorkout && isLongRun(nextWorkout)) return false;

  return true;
}

/**
 * Get strength duration based on phase.
 */
function getStrengthDuration(
  type: StrengthType,
  phase: Phase,
  isRecoveryWeek: boolean
): number {
  if (isRecoveryWeek) {
    return type === 'core' ? 15 : 25;
  }

  const baseDurations: Record<StrengthType, number> = {
    full_body: 35,
    lower_body: 40,
    upper_body: 30,
    core: 20,
    mobility: 15,
  };

  const base = baseDurations[type];

  // Reduce during peak/taper
  if (phase === 'peak') return Math.round(base * 0.7);
  if (phase === 'taper') return Math.round(base * 0.5);

  return base;
}

/**
 * Determine strength days per week based on phase.
 * From CLAUDE.md:
 * - Base: full strength volume
 * - Build: reduce 20-30%
 * - Peak: 50% of base
 * - Taper: minimal
 */
function getStrengthDaysForPhase(
  preferredDays: number,
  phase: Phase,
  isRecoveryWeek: boolean
): number {
  if (isRecoveryWeek) return 1;

  switch (phase) {
    case 'base':
      return preferredDays;
    case 'build':
      return Math.max(1, preferredDays - 1);
    case 'peak':
      return Math.min(2, Math.ceil(preferredDays / 2));
    case 'taper':
    case 'race':
      return 0;
    default:
      return preferredDays;
  }
}

/**
 * Schedule strength sessions for a week.
 */
export function scheduleStrengthForWeek(
  weekWorkouts: Map<DayOfWeek, RunType>,
  preferences: StrengthPreferences,
  phase: Phase,
  isRecoveryWeek: boolean
): Map<DayOfWeek, StrengthAllocation> {
  const allocations = new Map<DayOfWeek, StrengthAllocation>();

  const targetDays = getStrengthDaysForPhase(
    preferences.daysPerWeek,
    phase,
    isRecoveryWeek
  );

  if (targetDays === 0) {
    return allocations;
  }

  // Get available days for lifting
  const availableDays: DayOfWeek[] = [];
  const preferredDays = new Set(preferences.preferredDays);

  for (const day of DAYS_IN_ORDER) {
    if (canLiftOnDay(day, weekWorkouts)) {
      availableDays.push(day);
    }
  }

  // Prioritize preferred days
  const sortedDays = availableDays.sort((a, b) => {
    const aPreferred = preferredDays.has(a) ? 0 : 1;
    const bPreferred = preferredDays.has(b) ? 0 : 1;
    return aPreferred - bPreferred;
  });

  // Allocate sessions
  let legsScheduled = false;
  let upperScheduled = false;
  let sessionsScheduled = 0;

  for (const day of sortedDays) {
    if (sessionsScheduled >= targetDays) break;

    const dayRun = weekWorkouts.get(day);
    const canDoLegs = canDoHeavyLegs(day, weekWorkouts);

    let type: StrengthType;
    let timing: string;
    let notes: string | undefined;

    // Recovery weeks get one full body light session
    if (isRecoveryWeek) {
      type = 'full_body';
      timing = 'Light session';
      notes = 'Recovery week - lighter weight, fewer sets';
    } else if (phase === 'peak') {
      // Peak phase: maintenance only
      type = sessionsScheduled === 0 ? 'lower_body' : 'core';
      timing = 'Light - maintenance only';
    } else if (canDoLegs && !legsScheduled) {
      // Priority: schedule lower body if possible
      type = 'lower_body';
      timing = dayRun ? 'After run' : 'Any time';
      legsScheduled = true;

      if (phase === 'build') {
        notes = 'Build phase - reduced volume from base';
      }
    } else if (!upperScheduled) {
      type = 'upper_body';
      timing = dayRun ? 'After run' : 'Any time';
      upperScheduled = true;
    } else {
      type = 'core';
      timing = dayRun ? 'After run' : 'Any time';
    }

    allocations.set(day, {
      day,
      type,
      timing,
      duration: getStrengthDuration(type, phase, isRecoveryWeek),
      notes,
    });

    sessionsScheduled++;
  }

  return allocations;
}

/**
 * Create a strength session object from allocation.
 */
export function createStrengthSession(
  allocation: StrengthAllocation | undefined
): StrengthSession | undefined {
  if (!allocation) {
    return undefined;
  }

  return {
    scheduled: true,
    type: allocation.type,
    timing: allocation.timing,
    duration: allocation.duration,
    notes: allocation.notes,
  };
}

/**
 * Check if a strength session conflicts with sequencing rules.
 */
export function checkStrengthConflict(
  strengthDay: DayOfWeek,
  strengthType: StrengthType,
  weekWorkouts: Map<DayOfWeek, RunType>
): { conflict: boolean; reason?: string } {
  const nextDay = getNextDay(strengthDay);
  const nextWorkout = weekWorkouts.get(nextDay);

  if (nextWorkout && isLongRun(nextWorkout)) {
    return {
      conflict: true,
      reason: 'Lifting scheduled day before long run',
    };
  }

  if (strengthType === 'lower_body') {
    if (!canDoHeavyLegs(strengthDay, weekWorkouts)) {
      return {
        conflict: true,
        reason: 'Heavy legs too close to speed work',
      };
    }
  }

  return { conflict: false };
}
