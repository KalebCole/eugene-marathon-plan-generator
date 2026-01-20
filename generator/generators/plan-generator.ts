/**
 * Main plan generator orchestrator.
 * Generates complete training plans from athlete intake data.
 */

import {
  TrainingPlan,
  PlanMetadata,
  PlanLevel,
  AthleteProfile,
  TrainingWeek,
} from '../types/plan';
import { AthleteIntake } from '../types/intake';
import {
  calculateAllPaceData,
  formatTime,
} from '../calculators/pace-zones';
import { calculateHRZones } from '../calculators/hr-zones';
import { calculateNutritionTargets, weightToKg } from '../calculators/nutrition';
import {
  generateWeekSchedule,
  formatDateISO,
  WeekInfo,
} from '../calculators/date-math';
import { generateWeek, createWeekTemplate } from './week-generator';
import {
  generateBasePhase,
  generateBuildPhase,
  generatePeakPhase,
  generateTaperPhase,
} from '../templates';

const RACE_DATE = new Date('2026-04-26');
const RACE_NAME = 'Eugene Full Marathon';

/**
 * Convert AthleteIntake to AthleteProfile for plan output.
 */
function intakeToProfile(intake: AthleteIntake): AthleteProfile {
  return {
    recentRace: {
      distance: intake.recentRace.distance.replace('_', ' '),
      time: intake.recentRace.timeFormatted,
      date: intake.recentRace.date,
    },
    bodyComposition: {
      height: intake.bodyComposition.height,
      weight: intake.bodyComposition.weight,
      age: intake.bodyComposition.age,
      sex: intake.bodyComposition.sex,
      activityLevel: intake.bodyComposition.activityLevel.replace('_', ' '),
    },
    heartRate: intake.heartRate,
    availableDays: intake.availableDays,
    strengthPreferences: {
      daysPerWeek: intake.strengthPreferences.daysPerWeek,
      preferredDays: intake.strengthPreferences.preferredDays,
      avoidBeforeLongRun: intake.strengthPreferences.avoidBeforeLongRun,
      notes: intake.strengthPreferences.notes,
    },
    weeklyHoursLimit: intake.weeklyHoursLimit,
    blockedDates: intake.blockedDates,
    dietaryRestrictions: intake.dietaryRestrictions,
    goal: intake.goal,
  };
}

/**
 * Generate plan metadata.
 */
function generateMetadata(
  level: PlanLevel,
  totalWeeks: number,
  finishPrediction: { min: string; max: string; target: string },
  weeklyHours: number
): PlanMetadata {
  const levelNames: Record<PlanLevel, string> = {
    conservative: 'Conservative',
    moderate: 'Moderate',
    ambitious: 'Ambitious',
  };

  return {
    planName: `${RACE_NAME} - ${levelNames[level]} Plan`,
    planLevel: level,
    raceDate: formatDateISO(RACE_DATE),
    raceName: RACE_NAME,
    totalWeeks,
    weeklyHoursTarget: {
      min: Math.round(weeklyHours * 0.8),
      max: Math.round(weeklyHours * 1.2),
    },
    predictedFinishTime: finishPrediction,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate weeks for the plan using phase templates.
 */
function generateWeeks(
  weekSchedule: WeekInfo[],
  athlete: AthleteIntake,
  paceZones: ReturnType<typeof calculateAllPaceData>['paceZones'],
  hrZones: ReturnType<typeof calculateHRZones>,
  nutritionTargets: ReturnType<typeof calculateNutritionTargets>,
  level: PlanLevel
): TrainingWeek[] {
  const weeks: TrainingWeek[] = [];

  // Group weeks by phase
  const baseWeeks = weekSchedule.filter(w => w.phase === 'base');
  const buildWeeks = weekSchedule.filter(w => w.phase === 'build');
  const peakWeeks = weekSchedule.filter(w => w.phase === 'peak');
  const taperWeeks = weekSchedule.filter(w => w.phase === 'taper' || w.phase === 'race');

  // Generate base phase weeks
  const baseTemplates = generateBasePhase(baseWeeks.length, level);
  for (let i = 0; i < baseWeeks.length; i++) {
    const weekInfo = baseWeeks[i];
    const template = baseTemplates[i] || baseTemplates[baseTemplates.length - 1];

    const week = generateWeek(
      weekInfo,
      template,
      athlete,
      paceZones,
      hrZones,
      nutritionTargets,
      level
    );
    weeks.push(week);
  }

  // Generate build phase weeks
  const buildTemplates = generateBuildPhase(buildWeeks.length, level);
  for (let i = 0; i < buildWeeks.length; i++) {
    const weekInfo = buildWeeks[i];
    const template = buildTemplates[i] || buildTemplates[buildTemplates.length - 1];

    const week = generateWeek(
      weekInfo,
      template,
      athlete,
      paceZones,
      hrZones,
      nutritionTargets,
      level
    );
    weeks.push(week);
  }

  // Generate peak phase weeks
  const peakTemplates = generatePeakPhase(peakWeeks.length, level);
  for (let i = 0; i < peakWeeks.length; i++) {
    const weekInfo = peakWeeks[i];
    const template = peakTemplates[i] || peakTemplates[peakTemplates.length - 1];

    const week = generateWeek(
      weekInfo,
      template,
      athlete,
      paceZones,
      hrZones,
      nutritionTargets,
      level
    );
    weeks.push(week);
  }

  // Generate taper/race weeks
  const taperTemplates = generateTaperPhase(taperWeeks.length, level);
  for (let i = 0; i < taperWeeks.length; i++) {
    const weekInfo = taperWeeks[i];
    const template = taperTemplates[i] || taperTemplates[taperTemplates.length - 1];

    const week = generateWeek(
      weekInfo,
      template,
      athlete,
      paceZones,
      hrZones,
      nutritionTargets,
      level
    );
    weeks.push(week);
  }

  return weeks;
}

/**
 * Generate a single training plan for a given level.
 */
export function generatePlan(
  athlete: AthleteIntake,
  level: PlanLevel,
  startDate: Date = new Date()
): TrainingPlan {
  // Calculate pace data
  const paceData = calculateAllPaceData(athlete.recentRace, level);

  // Calculate HR zones
  const hrZones = calculateHRZones(athlete.heartRate);

  // Calculate nutrition targets
  const nutritionTargets = calculateNutritionTargets(athlete.bodyComposition);

  // Generate week schedule
  const weekSchedule = generateWeekSchedule(startDate, RACE_DATE);
  const totalWeeks = weekSchedule.length;

  // Generate metadata
  const metadata = generateMetadata(
    level,
    totalWeeks,
    paceData.finishPrediction,
    athlete.weeklyHoursLimit
  );

  // Convert athlete intake to profile
  const athleteProfile = intakeToProfile(athlete);

  // Generate weeks
  const weeks = generateWeeks(
    weekSchedule,
    athlete,
    paceData.paceZones,
    hrZones,
    nutritionTargets,
    level
  );

  return {
    metadata,
    athlete: athleteProfile,
    paceZones: paceData.paceZones,
    hrZones,
    nutritionTargets,
    weeks,
  };
}

/**
 * Generate all three plan levels.
 */
export function generateAllPlans(
  athlete: AthleteIntake,
  startDate: Date = new Date()
): {
  conservative: TrainingPlan;
  moderate: TrainingPlan;
  ambitious: TrainingPlan;
} {
  return {
    conservative: generatePlan(athlete, 'conservative', startDate),
    moderate: generatePlan(athlete, 'moderate', startDate),
    ambitious: generatePlan(athlete, 'ambitious', startDate),
  };
}

/**
 * Validate a generated plan.
 */
export function validatePlan(plan: TrainingPlan): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!plan.metadata) errors.push('Missing metadata');
  if (!plan.paceZones) errors.push('Missing pace zones');
  if (!plan.hrZones) errors.push('Missing HR zones');
  if (!plan.nutritionTargets) errors.push('Missing nutrition targets');
  if (!plan.weeks || plan.weeks.length === 0) errors.push('Missing weeks');

  // Check week structure
  for (let i = 0; i < plan.weeks.length; i++) {
    const week = plan.weeks[i];

    if (!week.days) {
      errors.push(`Week ${i + 1}: Missing days`);
      continue;
    }

    const days = Object.keys(week.days);
    if (days.length !== 7) {
      warnings.push(`Week ${i + 1}: Only ${days.length} days scheduled`);
    }

    // Check for long run
    const hasLongRun = Object.values(week.days).some(
      d => d.running?.type === 'long' || d.running?.type === 'progression'
    );
    if (!hasLongRun && week.phase !== 'taper') {
      warnings.push(`Week ${i + 1}: No long run scheduled`);
    }
  }

  // Check peak mileage progression
  const peakWeeks = plan.weeks.filter(w => w.phase === 'peak');
  if (peakWeeks.length > 0) {
    const peakMileage = Math.max(...peakWeeks.map(w => w.totalMileage));
    if (peakMileage < 35) {
      warnings.push(`Peak mileage (${peakMileage}) may be low for marathon training`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
