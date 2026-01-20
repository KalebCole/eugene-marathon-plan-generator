/**
 * Nutrition calculations: TDEE, BMR, and macro targets.
 * Uses Mifflin-St Jeor equation for BMR.
 */

import { BodyComposition, ActivityLevel } from '../types/intake';
import { NutritionTargets, MacroTarget } from '../types/plan';

/**
 * Activity multipliers for TDEE calculation.
 * From guides/nutrition-timing.md
 */
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,        // Desk job, minimal movement
  lightly_active: 1.375, // Light walking, some standing
  moderately_active: 1.55, // On your feet, some physical work
  very_active: 1.725,    // Physical job + active lifestyle
};

/**
 * Convert height to centimeters.
 */
export function heightToCm(value: number, unit: 'cm' | 'inches'): number {
  if (unit === 'cm') return value;
  return value * 2.54; // inches to cm
}

/**
 * Convert weight to kilograms.
 */
export function weightToKg(value: number, unit: 'kg' | 'lbs'): number {
  if (unit === 'kg') return value;
  return value * 0.453592; // lbs to kg
}

/**
 * Calculate BMR using Mifflin-St Jeor equation.
 *
 * Male: BMR = (10 x weight in kg) + (6.25 x height in cm) - (5 x age) + 5
 * Female: BMR = (10 x weight in kg) + (6.25 x height in cm) - (5 x age) - 161
 */
export function calculateBMR(body: BodyComposition): number {
  const weightKg = weightToKg(body.weight.value, body.weight.unit);
  const heightCm = heightToCm(body.height.value, body.height.unit);
  const age = body.age;

  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;

  if (body.sex === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  return Math.round(bmr);
}

/**
 * Calculate base TDEE (without training) from BMR and activity level.
 */
export function calculateBaseTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  return Math.round(bmr * multiplier);
}

/**
 * Calculate macro targets based on total calories.
 * Distribution: ~50-55% carbs, 20-25% protein, 25-30% fat
 *
 * For endurance athletes:
 * - Protein: 1.2-1.6g per kg bodyweight
 * - Carbs: Higher percentage to fuel training
 * - Fat: Minimum ~0.5g per lb for hormone health
 */
export function calculateMacros(
  totalCalories: number,
  weightKg: number
): { protein: MacroTarget; carbs: MacroTarget; fat: MacroTarget } {
  // Protein: target ~1.4g per kg for endurance athletes
  const proteinGrams = Math.round(weightKg * 1.4);
  const proteinCalories = proteinGrams * 4;
  const proteinPercentage = Math.round((proteinCalories / totalCalories) * 100);

  // Fat: minimum for health, ~25% of calories
  const fatPercentage = 25;
  const fatCalories = (totalCalories * fatPercentage) / 100;
  const fatGrams = Math.round(fatCalories / 9);

  // Carbs: remainder
  const carbsCalories = totalCalories - proteinCalories - fatCalories;
  const carbsGrams = Math.round(carbsCalories / 4);
  const carbsPercentage = Math.round((carbsCalories / totalCalories) * 100);

  return {
    protein: { grams: proteinGrams, percentage: proteinPercentage },
    carbs: { grams: carbsGrams, percentage: carbsPercentage },
    fat: { grams: fatGrams, percentage: fatPercentage },
  };
}

/**
 * Calculate full nutrition targets.
 */
export function calculateNutritionTargets(body: BodyComposition): NutritionTargets {
  const bmr = calculateBMR(body);
  const baseTDEE = calculateBaseTDEE(bmr, body.activityLevel);
  const weightKg = weightToKg(body.weight.value, body.weight.unit);
  const macros = calculateMacros(baseTDEE, weightKg);

  return {
    bmr,
    baseTDEE,
    macros,
    notes: `Base TDEE calculated for ${body.activityLevel.replace('_', ' ')}. ` +
      `Add 80-100 cal/mile for easy runs, 100-120 cal/mile for long runs.`,
  };
}

/**
 * Estimate calories burned during running.
 * Rule of thumb: ~100 calories per mile for 150lb person
 * Adjusted for weight and intensity.
 */
export function estimateRunningCalories(
  miles: number,
  weightLbs: number,
  intensity: 'easy' | 'long' | 'tempo' | 'intervals' = 'easy'
): number {
  // Base calculation
  const basePerMile = (weightLbs / 150) * 100;

  // Intensity multipliers
  const intensityMultipliers: Record<string, number> = {
    easy: 0.9,
    long: 1.1,
    tempo: 1.15,
    intervals: 1.2,
  };

  const multiplier = intensityMultipliers[intensity] || 1;
  return Math.round(miles * basePerMile * multiplier);
}

/**
 * Estimate calories burned during strength training.
 * From guides/nutrition-timing.md:
 * - 30min: 100-150 cal
 * - 60min: 200-300 cal
 */
export function estimateStrengthCalories(
  durationMinutes: number,
  intensity: 'light' | 'moderate' | 'heavy' = 'moderate'
): number {
  const basePerMinute = 4; // ~240 cal/hour moderate

  const intensityMultipliers: Record<string, number> = {
    light: 0.7,
    moderate: 1.0,
    heavy: 1.3,
  };

  const multiplier = intensityMultipliers[intensity] || 1;
  return Math.round(durationMinutes * basePerMinute * multiplier);
}

/**
 * Calculate daily nutrition for a training day.
 */
export function calculateDailyNutrition(
  baseTDEE: number,
  baseMacros: NutritionTargets['macros'],
  runningCalories: number,
  strengthCalories: number
): {
  calories: number;
  breakdown: string;
  protein: string;
  carbs: string;
  fat: string;
} {
  const calories = baseTDEE + runningCalories + strengthCalories;

  // Adjust macros for training day (higher carbs)
  const adjustedMacros = calculateMacros(
    calories,
    baseMacros.protein.grams / 1.4 // Reverse calculate weight
  );

  return {
    calories,
    breakdown: `Base: ${baseTDEE} + Running: ${runningCalories} + Strength: ${strengthCalories}`,
    protein: `${adjustedMacros.protein.grams}g (${adjustedMacros.protein.percentage}%)`,
    carbs: `${adjustedMacros.carbs.grams}g (${adjustedMacros.carbs.percentage}%)`,
    fat: `${adjustedMacros.fat.grams}g (${adjustedMacros.fat.percentage}%)`,
  };
}
