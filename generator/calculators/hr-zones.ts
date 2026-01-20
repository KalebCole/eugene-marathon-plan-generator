/**
 * Heart rate zone calculations.
 * Supports three methods:
 * 1. Percentage of Max HR (simplest)
 * 2. Percentage of LTHR (most accurate if available)
 * 3. Heart Rate Reserve / Karvonen (needs resting HR)
 */

import { HeartRateData } from '../types/intake';
import { HRZones, HRZone } from '../types/plan';

/**
 * HR Zone definition with percentages.
 */
interface ZoneDefinition {
  name: string;
  minPercent: number;
  maxPercent: number;
  purpose: string;
}

const MAX_HR_ZONES: ZoneDefinition[] = [
  { name: 'Recovery', minPercent: 50, maxPercent: 60, purpose: 'Active recovery, blood flow promotion' },
  { name: 'Aerobic/Easy', minPercent: 60, maxPercent: 70, purpose: 'Build aerobic base - 80% of training should be here' },
  { name: 'Tempo', minPercent: 70, maxPercent: 80, purpose: 'Improve lactate clearance, marathon pace' },
  { name: 'Threshold', minPercent: 80, maxPercent: 90, purpose: 'Raise lactate threshold, race fitness' },
  { name: 'VO2max', minPercent: 90, maxPercent: 100, purpose: 'Maximum aerobic capacity - short intervals only' },
];

const LTHR_ZONES: ZoneDefinition[] = [
  { name: 'Recovery', minPercent: 65, maxPercent: 80, purpose: 'Active recovery, very easy' },
  { name: 'Aerobic/Easy', minPercent: 80, maxPercent: 90, purpose: 'Build aerobic base - conversational' },
  { name: 'Tempo', minPercent: 90, maxPercent: 100, purpose: 'Comfortably hard, threshold pace' },
  { name: 'Threshold', minPercent: 100, maxPercent: 105, purpose: 'At or just above threshold' },
  { name: 'VO2max', minPercent: 105, maxPercent: 115, purpose: 'Near maximum - short intervals' },
];

const HRR_ZONES: ZoneDefinition[] = [
  { name: 'Recovery', minPercent: 50, maxPercent: 60, purpose: 'Active recovery, blood flow promotion' },
  { name: 'Aerobic/Easy', minPercent: 60, maxPercent: 70, purpose: 'Build aerobic base - 80% of training should be here' },
  { name: 'Tempo', minPercent: 70, maxPercent: 80, purpose: 'Improve lactate clearance, marathon pace' },
  { name: 'Threshold', minPercent: 80, maxPercent: 90, purpose: 'Raise lactate threshold, race fitness' },
  { name: 'VO2max', minPercent: 90, maxPercent: 100, purpose: 'Maximum aerobic capacity - short intervals only' },
];

/**
 * Calculate HR zones using percentage of Max HR method.
 */
export function calculateZonesFromMaxHR(maxHR: number): HRZones {
  const zones: HRZones = {
    zone1: createZone(MAX_HR_ZONES[0], maxHR, maxHR),
    zone2: createZone(MAX_HR_ZONES[1], maxHR, maxHR),
    zone3: createZone(MAX_HR_ZONES[2], maxHR, maxHR),
    zone4: createZone(MAX_HR_ZONES[3], maxHR, maxHR),
    zone5: createZone(MAX_HR_ZONES[4], maxHR, maxHR),
  };
  return zones;
}

function createZone(
  def: ZoneDefinition,
  referenceHR: number,
  maxHR: number,
  restingHR: number = 0,
  useHRR: boolean = false
): HRZone {
  let minHR: number;
  let maxHRVal: number;

  if (useHRR && restingHR > 0) {
    // Heart Rate Reserve method: Target = (Max - Rest) * % + Rest
    const reserve = maxHR - restingHR;
    minHR = Math.round(reserve * (def.minPercent / 100) + restingHR);
    maxHRVal = Math.round(reserve * (def.maxPercent / 100) + restingHR);
  } else {
    // Simple percentage method
    minHR = Math.round(referenceHR * (def.minPercent / 100));
    maxHRVal = Math.round(referenceHR * (def.maxPercent / 100));
  }

  return {
    name: def.name,
    minHR,
    maxHR: Math.min(maxHRVal, maxHR),
    percentMaxHR: `${def.minPercent}-${def.maxPercent}%`,
    purpose: def.purpose,
  };
}

/**
 * Calculate HR zones using LTHR method (most accurate if LTHR is known).
 */
export function calculateZonesFromLTHR(lthr: number, maxHR: number): HRZones {
  return {
    zone1: createZoneFromLTHR(LTHR_ZONES[0], lthr, maxHR),
    zone2: createZoneFromLTHR(LTHR_ZONES[1], lthr, maxHR),
    zone3: createZoneFromLTHR(LTHR_ZONES[2], lthr, maxHR),
    zone4: createZoneFromLTHR(LTHR_ZONES[3], lthr, maxHR),
    zone5: createZoneFromLTHR(LTHR_ZONES[4], lthr, maxHR),
  };
}

function createZoneFromLTHR(def: ZoneDefinition, lthr: number, maxHR: number): HRZone {
  const minHR = Math.round(lthr * (def.minPercent / 100));
  const maxHRVal = Math.min(Math.round(lthr * (def.maxPercent / 100)), maxHR);

  return {
    name: def.name,
    minHR,
    maxHR: maxHRVal,
    percentMaxHR: `${def.minPercent}-${def.maxPercent}% LTHR`,
    purpose: def.purpose,
  };
}

/**
 * Calculate HR zones using Karvonen/HRR method (most accurate with resting HR).
 */
export function calculateZonesFromHRR(maxHR: number, restingHR: number): HRZones {
  return {
    zone1: createZone(HRR_ZONES[0], maxHR, maxHR, restingHR, true),
    zone2: createZone(HRR_ZONES[1], maxHR, maxHR, restingHR, true),
    zone3: createZone(HRR_ZONES[2], maxHR, maxHR, restingHR, true),
    zone4: createZone(HRR_ZONES[3], maxHR, maxHR, restingHR, true),
    zone5: createZone(HRR_ZONES[4], maxHR, maxHR, restingHR, true),
  };
}

/**
 * Calculate HR zones using the best available method.
 * Priority: HRR (if resting available) > LTHR > Max HR percentage
 */
export function calculateHRZones(hrData: HeartRateData): HRZones {
  const { maxHR, restingHR, lthr } = hrData;

  // If we have LTHR, use that (most accurate for training zones)
  if (lthr) {
    return calculateZonesFromLTHR(lthr, maxHR);
  }

  // If we have resting HR, use Karvonen method
  if (restingHR) {
    return calculateZonesFromHRR(maxHR, restingHR);
  }

  // Fall back to simple percentage of max HR
  return calculateZonesFromMaxHR(maxHR);
}

/**
 * Get the appropriate HR zone name for a workout type.
 */
export function getZoneForWorkoutType(workoutType: string): string {
  switch (workoutType) {
    case 'rest':
    case 'recovery':
      return 'Zone 1';
    case 'easy':
    case 'long':
    case 'cross_training':
      return 'Zone 2';
    case 'tempo':
    case 'marathon':
    case 'race_pace':
      return 'Zone 3';
    case 'threshold':
      return 'Zone 3-4';
    case 'intervals':
    case 'fiveK':
    case 'hill_repeats':
      return 'Zone 4-5';
    case 'sprint':
      return 'Zone 5';
    default:
      return 'Zone 2';
  }
}

/**
 * Check if HR is in the correct zone.
 */
export function isInZone(currentHR: number, zones: HRZones, targetZone: keyof HRZones): boolean {
  const zone = zones[targetZone];
  return currentHR >= zone.minHR && currentHR <= zone.maxHR;
}
