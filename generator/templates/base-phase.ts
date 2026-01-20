/**
 * Base phase templates (weeks 1-4 of standard 15-week plan).
 *
 * Focus:
 * - Building aerobic foundation
 * - Establishing training routine
 * - Full strength volume
 *
 * Characteristics:
 * - 80% easy running
 * - Long runs build gradually
 * - One tempo session per week
 * - Strides for leg speed
 */

import { PlanLevel, RunType } from '../types/plan';

interface WeekTemplate {
  focus: string;
  longRunDay: 'saturday' | 'sunday';
  longRunDistance: number;
  qualityDays: Array<{
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    type: RunType;
    distance?: number;
  }>;
  easyRunDays: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>;
  restDays: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>;
  crossTrainingDay?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  totalMileage: number;
}

/**
 * Base phase long run distances by level.
 */
const BASE_LONG_RUNS: Record<PlanLevel, number[]> = {
  conservative: [8, 9, 10, 7],   // Week 4 is recovery
  moderate: [9, 10, 12, 8],
  ambitious: [10, 12, 14, 10],
};

/**
 * Base phase weekly mileage by level.
 */
const BASE_WEEKLY_MILEAGE: Record<PlanLevel, number[]> = {
  conservative: [22, 25, 28, 20],
  moderate: [25, 28, 32, 24],
  ambitious: [30, 35, 40, 30],
};

/**
 * Generate base phase week templates.
 *
 * @param numWeeks - Number of base phase weeks (typically 4)
 * @param level - Plan intensity level
 */
export function generateBasePhase(numWeeks: number, level: PlanLevel): WeekTemplate[] {
  const templates: WeekTemplate[] = [];

  const longRuns = BASE_LONG_RUNS[level];
  const mileages = BASE_WEEKLY_MILEAGE[level];

  for (let i = 0; i < numWeeks; i++) {
    const isRecovery = i === numWeeks - 1 && numWeeks >= 4;
    const weekIndex = Math.min(i, longRuns.length - 1);

    const longRunDistance = isRecovery
      ? longRuns[longRuns.length - 1]
      : longRuns[weekIndex];
    const totalMileage = isRecovery
      ? mileages[mileages.length - 1]
      : mileages[weekIndex];

    // Week 1: Establish routine, just strides for speed
    if (i === 0) {
      templates.push({
        focus: 'Building aerobic foundation, establishing routine',
        longRunDay: 'sunday',
        longRunDistance,
        qualityDays: [
          { day: 'tuesday', type: 'intervals', distance: 5 }, // Strides
        ],
        easyRunDays: ['monday', 'wednesday', 'friday'],
        restDays: ['thursday'],
        crossTrainingDay: 'saturday',
        totalMileage,
      });
      continue;
    }

    // Week 2: Introduce tempo
    if (i === 1) {
      templates.push({
        focus: 'Continue building base, introduce tempo',
        longRunDay: 'sunday',
        longRunDistance,
        qualityDays: [
          { day: 'tuesday', type: 'tempo' },
        ],
        easyRunDays: ['monday', 'wednesday', 'friday'],
        restDays: ['thursday'],
        crossTrainingDay: 'saturday',
        totalMileage,
      });
      continue;
    }

    // Week 3: Peak base week
    if (i === 2 || (i > 2 && !isRecovery)) {
      templates.push({
        focus: 'Peak base week, longest base phase volume',
        longRunDay: 'sunday',
        longRunDistance,
        qualityDays: [
          { day: 'tuesday', type: 'fartlek', distance: 6 },
        ],
        easyRunDays: ['monday', 'wednesday', 'friday'],
        restDays: ['thursday'],
        crossTrainingDay: 'saturday',
        totalMileage,
      });
      continue;
    }

    // Week 4: Recovery week
    if (isRecovery) {
      templates.push({
        focus: 'RECOVERY WEEK - Absorb base training, prepare for build phase',
        longRunDay: 'sunday',
        longRunDistance,
        qualityDays: [
          { day: 'tuesday', type: 'tempo' }, // Reduced tempo
        ],
        easyRunDays: ['monday', 'wednesday', 'friday'],
        restDays: ['thursday', 'saturday'],
        totalMileage,
      });
    }
  }

  return templates;
}
