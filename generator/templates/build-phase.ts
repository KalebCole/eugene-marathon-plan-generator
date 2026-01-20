/**
 * Build phase templates (weeks 5-10 of standard 15-week plan).
 *
 * Focus:
 * - Increasing intensity
 * - Hill repeats for power
 * - Longer intervals
 * - Progression runs
 *
 * Characteristics:
 * - More quality workouts
 * - Long runs get longer
 * - Strength reduced 20-30%
 * - Recovery weeks at 7 and 10
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
 * Build phase long run distances by level.
 */
const BUILD_LONG_RUNS: Record<PlanLevel, number[]> = {
  conservative: [12, 12, 10, 14, 15, 12],  // Recovery at week 3 (week 7) and 6 (week 10)
  moderate: [13, 13, 10, 14, 18, 12],
  ambitious: [15, 15, 12, 16, 20, 14],
};

/**
 * Build phase weekly mileage by level.
 */
const BUILD_WEEKLY_MILEAGE: Record<PlanLevel, number[]> = {
  conservative: [28, 28, 22, 32, 35, 26],
  moderate: [30, 35, 26, 35, 40, 30],
  ambitious: [38, 42, 32, 45, 50, 38],
};

/**
 * Generate build phase week templates.
 *
 * @param numWeeks - Number of build phase weeks (typically 6)
 * @param level - Plan intensity level
 */
export function generateBuildPhase(numWeeks: number, level: PlanLevel): WeekTemplate[] {
  const templates: WeekTemplate[] = [];

  const longRuns = BUILD_LONG_RUNS[level];
  const mileages = BUILD_WEEKLY_MILEAGE[level];

  for (let i = 0; i < numWeeks; i++) {
    // Recovery weeks: week 3 (week 7 overall) and week 6 (week 10 overall)
    const isRecovery = i === 2 || i === numWeeks - 1;
    const weekIndex = Math.min(i, longRuns.length - 1);

    const longRunDistance = longRuns[weekIndex];
    const totalMileage = mileages[weekIndex];

    // Week 5 (first build week): Introduce hill repeats
    if (i === 0) {
      templates.push({
        focus: 'Start build phase, introduce hill repeats',
        longRunDay: 'sunday',
        longRunDistance,
        qualityDays: [
          { day: 'tuesday', type: 'hill_repeats' },
        ],
        easyRunDays: ['monday', 'wednesday', 'friday'],
        restDays: ['thursday', 'saturday'],
        totalMileage,
      });
      continue;
    }

    // Week 6: Continue hill work
    if (i === 1) {
      templates.push({
        focus: 'Continue building intensity',
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

    // Week 7: Recovery
    if (i === 2) {
      templates.push({
        focus: 'RECOVERY WEEK - Absorb build training',
        longRunDay: 'sunday',
        longRunDistance,
        qualityDays: [
          { day: 'tuesday', type: 'intervals' }, // Strides only
        ],
        easyRunDays: ['monday', 'wednesday', 'friday'],
        restDays: ['thursday', 'saturday'],
        totalMileage,
      });
      continue;
    }

    // Week 8-9: Build volume with progression runs
    if (i === 3 || i === 4) {
      const focus = i === 4
        ? 'Peak build week - highest build phase volume'
        : 'Resume build - increase volume';

      templates.push({
        focus,
        longRunDay: 'sunday',
        longRunDistance,
        qualityDays: [
          { day: 'tuesday', type: i === 4 ? 'intervals' : 'tempo' },
        ],
        easyRunDays: ['monday', 'wednesday', 'friday'],
        restDays: ['thursday'],
        crossTrainingDay: 'saturday',
        totalMileage,
      });
      continue;
    }

    // Week 10: Recovery before peak
    if (i === 5 || isRecovery) {
      templates.push({
        focus: 'RECOVERY WEEK - Final recovery before peak phase',
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

    // Default template for extra weeks
    templates.push({
      focus: 'Build phase - continue progression',
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
