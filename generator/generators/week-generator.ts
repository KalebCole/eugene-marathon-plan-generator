/**
 * Generate a single training week.
 * Assembles running workouts, strength sessions, and nutrition.
 */

import {
  TrainingWeek,
  TrainingDay,
  PaceZones,
  HRZones,
  NutritionTargets,
  RunType,
  Phase,
  PlanLevel,
} from '../types/plan';
import {
  DayOfWeek,
  AthleteIntake,
  BlockedDateRange,
} from '../types/intake';
import { WeekInfo, getDateForDay, formatDateISO, getWeekDates } from '../calculators/date-math';
import { estimateRunningCalories, estimateStrengthCalories, calculateDailyNutrition, weightToKg } from '../calculators/nutrition';
import { generateWorkout, createRestDay, createEasyRun, createCrossTraining } from './workout-generator';
import { scheduleStrengthForWeek, createStrengthSession } from './strength-scheduler';
import { isDateBlocked } from '../parsers/blocked-dates-parser';

// Day order for iteration (Monday first)
const DAYS_IN_ORDER: DayOfWeek[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

interface WeekTemplate {
  focus: string;
  longRunDay: DayOfWeek;
  longRunDistance: number;
  qualityDays: Array<{
    day: DayOfWeek;
    type: RunType;
    distance?: number;
  }>;
  easyRunDays: DayOfWeek[];
  restDays: DayOfWeek[];
  crossTrainingDay?: DayOfWeek;
  totalMileage: number;
}

/**
 * Get default easy run distance based on plan level.
 */
function getDefaultEasyDistance(level: PlanLevel, phase: Phase): number {
  const bases: Record<PlanLevel, number> = {
    conservative: 3,
    moderate: 4,
    ambitious: 5,
  };

  const base = bases[level];

  // Adjust for phase
  if (phase === 'peak') return base + 1;
  if (phase === 'taper') return base - 1;

  return base;
}

/**
 * Check if a date is blocked.
 */
function isDayBlocked(
  day: DayOfWeek,
  weekStart: Date,
  blockedDates: BlockedDateRange[]
): { blocked: boolean; reason?: string } {
  const date = getDateForDay(weekStart, day);
  return isDateBlocked(formatDateISO(date), blockedDates);
}

/**
 * Generate running schedule for a week.
 */
function generateRunningSchedule(
  template: WeekTemplate,
  paceZones: PaceZones,
  phase: Phase,
  isRecovery: boolean,
  level: PlanLevel,
  blockedDates: BlockedDateRange[],
  weekStart: Date
): Map<DayOfWeek, ReturnType<typeof generateWorkout>> {
  const schedule = new Map<DayOfWeek, ReturnType<typeof generateWorkout>>();

  // Handle blocked dates - convert quality/long runs to rest or easy
  const adjustedTemplate = { ...template };

  // Check if long run day is blocked
  const longRunBlocked = isDayBlocked(template.longRunDay, weekStart, blockedDates);
  if (longRunBlocked.blocked) {
    // Try to move to Saturday if Sunday is blocked (or vice versa)
    const altDay = template.longRunDay === 'sunday' ? 'saturday' : 'sunday';
    const altBlocked = isDayBlocked(altDay, weekStart, blockedDates);

    if (!altBlocked.blocked) {
      adjustedTemplate.longRunDay = altDay;
    } else {
      // Both weekend days blocked - reduce long run to easy
      adjustedTemplate.longRunDistance = 0;
    }
  }

  // Generate long run
  if (adjustedTemplate.longRunDistance > 0) {
    const longRun = generateWorkout({
      type: 'long',
      distance: adjustedTemplate.longRunDistance,
      phase,
      isRecovery,
      paceZones,
      level,
    });

    // Add title adjustments for recovery weeks
    if (isRecovery) {
      longRun.title = 'Reduced Long Run';
    }

    schedule.set(adjustedTemplate.longRunDay, longRun);
  } else {
    schedule.set(template.longRunDay, createRestDay(longRunBlocked.reason));
  }

  // Generate quality workouts
  for (const quality of template.qualityDays) {
    const blocked = isDayBlocked(quality.day, weekStart, blockedDates);

    if (blocked.blocked) {
      // Convert to easy run or rest if blocked
      const easyRun = createEasyRun(
        getDefaultEasyDistance(level, phase) - 1,
        paceZones,
        `Easy Run (adjusted: ${blocked.reason})`
      );
      schedule.set(quality.day, easyRun);
    } else {
      const workout = generateWorkout({
        type: quality.type,
        distance: quality.distance,
        phase,
        isRecovery,
        paceZones,
        level,
      });
      schedule.set(quality.day, workout);
    }
  }

  // Generate easy runs
  for (const day of template.easyRunDays) {
    if (schedule.has(day)) continue; // Already scheduled

    const blocked = isDayBlocked(day, weekStart, blockedDates);

    if (blocked.blocked) {
      schedule.set(day, createRestDay(blocked.reason));
    } else {
      const easyRun = createEasyRun(
        getDefaultEasyDistance(level, phase),
        paceZones
      );
      schedule.set(day, easyRun);
    }
  }

  // Generate rest days
  for (const day of template.restDays) {
    if (schedule.has(day)) continue;
    schedule.set(day, createRestDay());
  }

  // Generate cross training
  if (template.crossTrainingDay && !schedule.has(template.crossTrainingDay)) {
    const blocked = isDayBlocked(template.crossTrainingDay, weekStart, blockedDates);
    if (blocked.blocked) {
      schedule.set(template.crossTrainingDay, createRestDay(blocked.reason));
    } else {
      schedule.set(template.crossTrainingDay, createCrossTraining());
    }
  }

  return schedule;
}

/**
 * Calculate week totals.
 */
function calculateWeekTotals(
  runningSchedule: Map<DayOfWeek, ReturnType<typeof generateWorkout>>,
  strengthDays: number,
  paceZones: PaceZones
): { totalMileage: number; totalHours: number } {
  let totalMileage = 0;
  let totalMinutes = 0;

  for (const workout of runningSchedule.values()) {
    if (workout.totalDistance) {
      totalMileage += workout.totalDistance;
    }
    if (workout.estimatedDuration) {
      totalMinutes += workout.estimatedDuration;
    }
  }

  // Add strength time (avg 30 min per session)
  totalMinutes += strengthDays * 30;

  return {
    totalMileage: Math.round(totalMileage * 10) / 10,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
  };
}

/**
 * Generate a complete training week.
 */
export function generateWeek(
  weekInfo: WeekInfo,
  template: WeekTemplate,
  athlete: AthleteIntake,
  paceZones: PaceZones,
  hrZones: HRZones,
  nutritionTargets: NutritionTargets,
  level: PlanLevel
): TrainingWeek {
  const { weekNumber, weeksUntilRace, phase, isRecoveryWeek, startDate } = weekInfo;

  // Generate running schedule
  const runningSchedule = generateRunningSchedule(
    template,
    paceZones,
    phase,
    isRecoveryWeek,
    level,
    athlete.blockedDates,
    startDate
  );

  // Convert to Map<DayOfWeek, RunType> for strength scheduling
  const workoutTypes = new Map<DayOfWeek, RunType>();
  for (const [day, workout] of runningSchedule) {
    workoutTypes.set(day, workout.type);
  }

  // Schedule strength sessions
  const strengthAllocations = scheduleStrengthForWeek(
    workoutTypes,
    athlete.strengthPreferences,
    phase,
    isRecoveryWeek
  );

  // Get dates for the week
  const weekDates = getWeekDates(startDate);
  const weightLbs = athlete.bodyComposition.weight.unit === 'lbs'
    ? athlete.bodyComposition.weight.value
    : athlete.bodyComposition.weight.value * 2.205;

  // Build days
  const days: Partial<Record<DayOfWeek, TrainingDay>> = {};

  for (const day of DAYS_IN_ORDER) {
    const date = formatDateISO(weekDates[day]);
    const running = runningSchedule.get(day);
    const strengthAlloc = strengthAllocations.get(day);
    const strength = createStrengthSession(strengthAlloc);

    // Calculate daily nutrition
    const runningCalories = running?.totalDistance
      ? estimateRunningCalories(
          running.totalDistance,
          weightLbs,
          running.type === 'long' ? 'long' : running.type === 'tempo' ? 'tempo' : 'easy'
        )
      : 0;
    const strengthCalories = strength?.duration
      ? estimateStrengthCalories(strength.duration)
      : 0;

    const dailyNutrition = calculateDailyNutrition(
      nutritionTargets.baseTDEE,
      nutritionTargets.macros,
      runningCalories,
      strengthCalories
    );

    days[day] = {
      date,
      dayOfWeek: day.charAt(0).toUpperCase() + day.slice(1),
      running,
      strength,
      nutrition: {
        dailyTarget: dailyNutrition,
      },
    };
  }

  // Calculate totals
  const { totalMileage, totalHours } = calculateWeekTotals(
    runningSchedule,
    strengthAllocations.size,
    paceZones
  );

  // Calculate weekly nutrition averages
  const dailyCaloriesList = Object.values(days)
    .map(day => day.nutrition?.dailyTarget?.calories || 0)
    .filter(cal => cal > 0);

  const avgDailyCalories = dailyCaloriesList.length > 0
    ? Math.round(dailyCaloriesList.reduce((a, b) => a + b, 0) / dailyCaloriesList.length)
    : nutritionTargets.baseTDEE;

  const avgTrainingCalories = avgDailyCalories - nutritionTargets.baseTDEE;

  return {
    weekNumber,
    weeksUntilRace,
    isRecoveryWeek,
    phase,
    focus: template.focus,
    totalMileage,
    totalHours,
    strengthDays: strengthAllocations.size,
    weeklyNutrition: {
      dailyCalories: avgDailyCalories,
      trainingCaloriesPerDay: Math.max(0, avgTrainingCalories),
      macros: nutritionTargets.macros,
    },
    days: days as Record<DayOfWeek, TrainingDay>,
  };
}

/**
 * Create a week template based on phase and level.
 * This is a helper to be called from phase templates.
 */
export function createWeekTemplate(
  phase: Phase,
  level: PlanLevel,
  isRecovery: boolean,
  weekNumber: number,
  options?: {
    focus?: string;
    longRunDistance?: number;
    qualityType?: RunType;
    secondQuality?: RunType;
  }
): WeekTemplate {
  // Base distances by level
  const longRunDistances: Record<PlanLevel, Record<Phase, number>> = {
    conservative: { base: 9, build: 12, peak: 18, taper: 10, race: 26.2 },
    moderate: { base: 10, build: 14, peak: 20, taper: 10, race: 26.2 },
    ambitious: { base: 12, build: 16, peak: 22, taper: 12, race: 26.2 },
  };

  // Total weekly mileage by level and phase
  const weeklyMileage: Record<PlanLevel, Record<Phase, number>> = {
    conservative: { base: 25, build: 30, peak: 35, taper: 20, race: 35 },
    moderate: { base: 30, build: 40, peak: 45, taper: 25, race: 40 },
    ambitious: { base: 40, build: 50, peak: 55, taper: 30, race: 55 },
  };

  let longRunDistance = options?.longRunDistance ?? longRunDistances[level][phase];
  let totalMileage = weeklyMileage[level][phase];

  // Reduce for recovery weeks
  if (isRecovery) {
    longRunDistance = Math.round(longRunDistance * 0.7);
    totalMileage = Math.round(totalMileage * 0.75);
  }

  // Default quality workout based on phase
  const defaultQuality: Record<Phase, RunType> = {
    base: 'tempo',
    build: 'intervals',
    peak: 'tempo',
    taper: 'intervals',
    race: 'easy',
  };

  const qualityType = options?.qualityType ?? defaultQuality[phase];

  // Build template
  const template: WeekTemplate = {
    focus: options?.focus ?? getFocusForPhase(phase, isRecovery, weekNumber),
    longRunDay: 'sunday',
    longRunDistance,
    qualityDays: [{ day: 'tuesday', type: qualityType }],
    easyRunDays: ['monday', 'wednesday', 'friday'],
    restDays: ['thursday'],
    crossTrainingDay: 'saturday',
    totalMileage,
  };

  // Add second quality for non-recovery build/peak
  if (!isRecovery && (phase === 'build' || phase === 'peak')) {
    if (options?.secondQuality) {
      template.qualityDays.push({ day: 'thursday', type: options.secondQuality });
      template.restDays = [];
    }
  }

  return template;
}

/**
 * Get focus description for a phase.
 */
function getFocusForPhase(phase: Phase, isRecovery: boolean, weekNumber: number): string {
  if (isRecovery) {
    return `RECOVERY WEEK - Absorb ${phase} training`;
  }

  const focuses: Record<Phase, string> = {
    base: 'Building aerobic foundation',
    build: 'Increasing intensity and volume',
    peak: 'Race-specific fitness',
    taper: 'Rest and sharpen',
    race: 'RACE WEEK',
  };

  return focuses[phase];
}
