/**
 * Taper phase templates (weeks 14-15 of standard 15-week plan).
 *
 * Focus:
 * - Reduce volume progressively
 * - Maintain sharpness
 * - Rest and recover
 * - Race preparation
 *
 * Characteristics:
 * - 50-70% volume reduction
 * - No strength training
 * - Short strides for leg turnover
 * - Mental preparation
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
 * Taper phase long run distances by level.
 */
const TAPER_LONG_RUNS: Record<PlanLevel, number[]> = {
  conservative: [8, 0],   // Last long run, then race week (no long run)
  moderate: [10, 0],
  ambitious: [12, 0],
};

/**
 * Taper phase weekly mileage by level.
 */
const TAPER_WEEKLY_MILEAGE: Record<PlanLevel, number[]> = {
  conservative: [18, 12],
  moderate: [25, 15],
  ambitious: [30, 18],
};

/**
 * Generate taper phase week templates.
 *
 * @param numWeeks - Number of taper weeks (typically 2, including race week)
 * @param level - Plan intensity level
 */
export function generateTaperPhase(numWeeks: number, level: PlanLevel): WeekTemplate[] {
  const templates: WeekTemplate[] = [];

  const longRuns = TAPER_LONG_RUNS[level];
  const mileages = TAPER_WEEKLY_MILEAGE[level];

  for (let i = 0; i < numWeeks; i++) {
    const isRaceWeek = i === numWeeks - 1;
    const weekIndex = Math.min(i, longRuns.length - 1);

    // Race week
    if (isRaceWeek) {
      templates.push(createRaceWeekTemplate(level));
      continue;
    }

    const longRunDistance = longRuns[weekIndex];
    const totalMileage = mileages[weekIndex];

    // Week 14: First taper week
    if (i === 0) {
      templates.push({
        focus: 'TAPER BEGINS - Reduce volume, maintain sharpness',
        longRunDay: 'sunday',
        longRunDistance,
        qualityDays: [
          { day: 'tuesday', type: 'intervals', distance: 4 }, // Sharpening strides
        ],
        easyRunDays: ['monday', 'wednesday', 'friday'],
        restDays: ['thursday', 'saturday'],
        totalMileage,
      });
      continue;
    }

    // Default for extra taper weeks
    templates.push({
      focus: 'TAPER - Rest and recover',
      longRunDay: 'sunday',
      longRunDistance,
      qualityDays: [
        { day: 'tuesday', type: 'intervals', distance: 3 },
      ],
      easyRunDays: ['monday', 'wednesday', 'friday'],
      restDays: ['thursday', 'saturday'],
      totalMileage,
    });
  }

  return templates;
}

/**
 * Create race week template.
 */
function createRaceWeekTemplate(level: PlanLevel): WeekTemplate {
  const totalMileage = TAPER_WEEKLY_MILEAGE[level][1];

  return {
    focus: 'RACE WEEK - Rest, hydrate, trust your training',
    longRunDay: 'saturday', // Race day!
    longRunDistance: 26.2,  // Marathon
    qualityDays: [
      { day: 'tuesday', type: 'intervals', distance: 3 }, // Final shakeout with strides
    ],
    easyRunDays: ['monday', 'wednesday', 'friday'],
    restDays: ['thursday', 'sunday'], // Rest after race
    totalMileage: totalMileage + 26.2, // Include race
  };
}
