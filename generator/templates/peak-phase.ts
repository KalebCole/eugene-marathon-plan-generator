/**
 * Peak phase templates (weeks 11-13 of standard 15-week plan).
 *
 * Focus:
 * - Highest volume
 * - Race-specific workouts
 * - Marathon pace long runs
 * - Race simulation
 *
 * Characteristics:
 * - Longest long runs
 * - MP finish on long runs
 * - Strength at 50% maintenance
 * - Sharpening intervals
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
 * Peak phase long run distances by level.
 */
const PEAK_LONG_RUNS: Record<PlanLevel, number[]> = {
  conservative: [18, 16, 12],  // Peak, race sim, final long
  moderate: [20, 16, 12],
  ambitious: [22, 18, 14],
};

/**
 * Peak phase weekly mileage by level.
 */
const PEAK_WEEKLY_MILEAGE: Record<PlanLevel, number[]> = {
  conservative: [35, 32, 28],
  moderate: [44, 40, 35],
  ambitious: [52, 48, 42],
};

/**
 * Generate peak phase week templates.
 *
 * @param numWeeks - Number of peak phase weeks (typically 3)
 * @param level - Plan intensity level
 */
export function generatePeakPhase(numWeeks: number, level: PlanLevel): WeekTemplate[] {
  const templates: WeekTemplate[] = [];

  const longRuns = PEAK_LONG_RUNS[level];
  const mileages = PEAK_WEEKLY_MILEAGE[level];

  for (let i = 0; i < numWeeks; i++) {
    const weekIndex = Math.min(i, longRuns.length - 1);
    const longRunDistance = longRuns[weekIndex];
    const totalMileage = mileages[weekIndex];

    // Week 11: Peak week - longest long run
    if (i === 0) {
      templates.push({
        focus: 'PEAK WEEK - Highest volume, longest long run',
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

    // Week 12: Race simulation with MP finish
    if (i === 1) {
      templates.push({
        focus: 'Race simulation long run with marathon pace finish',
        longRunDay: 'sunday',
        longRunDistance,
        qualityDays: [
          { day: 'tuesday', type: 'intervals' }, // Sharpening intervals
        ],
        easyRunDays: ['monday', 'wednesday', 'friday'],
        restDays: ['thursday', 'saturday'],
        totalMileage,
      });
      continue;
    }

    // Week 13: Final hard week before taper
    if (i === 2) {
      templates.push({
        focus: 'Final hard week before taper begins',
        longRunDay: 'sunday',
        longRunDistance,
        qualityDays: [
          { day: 'tuesday', type: 'tempo' },
        ],
        easyRunDays: ['monday', 'wednesday', 'friday'],
        restDays: ['thursday', 'saturday'],
        totalMileage,
      });
      continue;
    }

    // Default for extra peak weeks
    templates.push({
      focus: 'Peak phase - race-specific fitness',
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
  }

  return templates;
}
