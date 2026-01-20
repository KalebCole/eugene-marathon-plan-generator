/**
 * Generate running workouts by type.
 * Creates detailed workout structures with warmup/main/cooldown.
 */

import {
  RunningWorkout,
  RunType,
  WorkoutStructure,
  PaceZones,
  PlanLevel,
} from '../types/plan';
import { secondsToPace, paceToSeconds } from '../calculators/pace-zones';
import { getZoneForWorkoutType } from '../calculators/hr-zones';

interface WorkoutParams {
  type: RunType;
  distance?: number;
  phase: 'base' | 'build' | 'peak' | 'taper' | 'race';
  isRecovery: boolean;
  paceZones: PaceZones;
  level: PlanLevel;
}

/**
 * Create a rest day.
 */
export function createRestDay(notes?: string): RunningWorkout {
  return {
    type: 'rest',
    title: 'Rest Day',
    notes,
  };
}

/**
 * Create an easy run workout.
 */
export function createEasyRun(
  distance: number,
  paceZones: PaceZones,
  title: string = 'Easy Run'
): RunningWorkout {
  const easyPaceMin = paceToSeconds(paceZones.easy.min);
  const estimatedDuration = Math.round((distance * easyPaceMin) / 60);

  return {
    type: 'easy',
    title,
    totalDistance: distance,
    estimatedDuration,
    hrZone: 'Zone 2',
  };
}

/**
 * Create a long run workout.
 */
export function createLongRun(
  distance: number,
  paceZones: PaceZones,
  phase: 'base' | 'build' | 'peak' | 'taper' | 'race',
  options?: {
    withProgression?: boolean;
    withMarathonPaceFinish?: boolean;
    title?: string;
    description?: string;
  }
): RunningWorkout {
  const easyPaceMin = paceToSeconds(paceZones.easy.min);
  const estimatedDuration = Math.round((distance * easyPaceMin) / 60);

  const workout: RunningWorkout = {
    type: 'long',
    title: options?.title || 'Long Run',
    totalDistance: distance,
    estimatedDuration,
    hrZone: 'Zone 2',
  };

  // Add progression structure for build/peak phases
  if (options?.withProgression && phase !== 'base') {
    workout.type = 'progression';
    const easyMiles = Math.round(distance * 0.67);
    const moderateMiles = Math.round(distance * 0.22);
    const mpMiles = distance - easyMiles - moderateMiles;

    workout.description = `${distance}mi total: ${easyMiles}mi easy, ${moderateMiles}mi moderate, ${mpMiles}mi at marathon pace`;
    workout.hrZone = 'Zone 2→3→MP';
  }

  // Add MP finish for peak phase race simulation
  if (options?.withMarathonPaceFinish && (phase === 'peak' || phase === 'build')) {
    workout.type = 'race_pace';
    const easyMiles = Math.round(distance * 0.6);
    const mpMiles = distance - easyMiles;

    workout.description = `${distance}mi total: ${easyMiles}mi easy, then ${mpMiles}mi at marathon pace. Practice race fueling.`;
    workout.hrZone = 'Zone 2→MP';
  }

  if (options?.description) {
    workout.description = options.description;
  }

  return workout;
}

/**
 * Create a tempo run workout.
 */
export function createTempoRun(
  tempoMiles: number,
  paceZones: PaceZones,
  reduced: boolean = false
): RunningWorkout {
  const warmupMiles = reduced ? 1 : 1.5;
  const cooldownMiles = reduced ? 1 : 1.5;
  const totalDistance = warmupMiles + tempoMiles + cooldownMiles;

  const tempoPaceMin = paceToSeconds(paceZones.tempo.min);
  const easyPaceMin = paceToSeconds(paceZones.easy.min);
  const tempoTime = (tempoMiles * tempoPaceMin) / 60;
  const warmupCooldownTime = ((warmupMiles + cooldownMiles) * easyPaceMin) / 60;
  const estimatedDuration = Math.round(tempoTime + warmupCooldownTime);

  return {
    type: 'tempo',
    title: reduced ? 'Short Tempo' : 'Tempo Run',
    description: `${warmupMiles}mi warmup, ${tempoMiles}mi tempo, ${cooldownMiles}mi cooldown`,
    totalDistance,
    estimatedDuration,
    hrZone: 'Zone 3-4',
    structure: {
      warmup: {
        distance: warmupMiles,
        unit: 'miles',
        pace: 'easy',
        hrZone: 'Zone 2',
      },
      main: {
        type: 'continuous',
        distance: tempoMiles,
        pace: `${paceZones.tempo.min}-${paceZones.tempo.max}/mi`,
        hrZone: 'Zone 3-4',
      },
      cooldown: {
        distance: cooldownMiles,
        unit: 'miles',
        pace: 'easy',
        hrZone: 'Zone 2',
      },
    },
  };
}

/**
 * Create an interval workout.
 */
export function createIntervals(
  intervalType: '400m' | '800m' | '1000m' | '1200m' | '1600m' | 'strides',
  repeats: number,
  paceZones: PaceZones
): RunningWorkout {
  const warmupMiles = intervalType === 'strides' ? 0 : 2;
  const cooldownMiles = intervalType === 'strides' ? 0 : 1;

  // Calculate interval distances
  const intervalMeters: Record<string, number> = {
    '400m': 400,
    '800m': 800,
    '1000m': 1000,
    '1200m': 1200,
    '1600m': 1600,
    'strides': 100,
  };

  const meters = intervalMeters[intervalType];
  const intervalMiles = (meters / 1609.34) * repeats;

  // Recovery distance (roughly half the interval for longer, full jog back for strides)
  const recoveryMiles = intervalType === 'strides'
    ? 0
    : (intervalMeters[intervalType] / 2 / 1609.34) * (repeats - 1);

  const totalDistance = warmupMiles + intervalMiles + recoveryMiles + cooldownMiles;

  // Estimate duration
  let baseMiles = intervalType === 'strides' ? 3 : 0; // Easy miles with strides
  const easyPaceMin = paceToSeconds(paceZones.easy.min);
  const intervalPaceMin = paceToSeconds(paceZones.interval.min);
  const estimatedDuration = Math.round(
    (warmupMiles + cooldownMiles + baseMiles) * easyPaceMin / 60 +
    intervalMiles * intervalPaceMin / 60 +
    (repeats - 1) * 1.5 // Recovery time in minutes
  );

  if (intervalType === 'strides') {
    return {
      type: 'intervals',
      title: 'Strides',
      description: `Easy run with ${repeats}x100m strides`,
      totalDistance: totalDistance + baseMiles,
      estimatedDuration,
      hrZone: 'Zone 2 (Zone 4-5 strides)',
    };
  }

  const paceZone = intervalType === '1600m' || intervalType === '1200m' ? 'fiveK' : 'interval';
  const targetPace = paceZone === 'fiveK' ? paceZones.fiveK : paceZones.interval;

  return {
    type: 'intervals',
    title: `${intervalType} Repeats`,
    description: `${warmupMiles}mi warmup, ${repeats}x${intervalType} @ ${paceZone === 'fiveK' ? '5K' : 'interval'} pace with ${Math.round(meters / 2)}m jog recovery, ${cooldownMiles}mi cooldown`,
    totalDistance: Math.round(totalDistance * 10) / 10,
    estimatedDuration,
    hrZone: 'Zone 4-5 during intervals',
    structure: {
      warmup: {
        distance: warmupMiles,
        unit: 'miles',
        pace: 'easy',
        hrZone: 'Zone 2',
      },
      main: {
        type: 'intervals',
        repeats,
        work: {
          distance: meters,
          unit: 'meters',
          pace: `${targetPace.min}-${targetPace.max}/mi`,
          hrZone: 'Zone 4-5',
        },
        recovery: {
          distance: Math.round(meters / 2),
          unit: 'meters',
          type: 'jog',
        },
      },
      cooldown: {
        distance: cooldownMiles,
        unit: 'miles',
        pace: 'easy',
        hrZone: 'Zone 2',
      },
    },
  };
}

/**
 * Create a hill repeat workout.
 */
export function createHillRepeats(
  repeats: number,
  durationSeconds: number,
  paceZones: PaceZones
): RunningWorkout {
  const warmupMiles = 1.5;
  const cooldownMiles = 1.5;

  // Estimate total distance (rough: ~0.2mi per 60sec hill effort)
  const hillMiles = (repeats * durationSeconds / 60) * 0.2;
  const totalDistance = warmupMiles + hillMiles + cooldownMiles;

  const easyPaceMin = paceToSeconds(paceZones.easy.min);
  // Hill efforts + jog down recovery
  const estimatedDuration = Math.round(
    (warmupMiles + cooldownMiles) * easyPaceMin / 60 +
    repeats * (durationSeconds / 60 + 1.5) // Effort + jog down
  );

  return {
    type: 'hill_repeats',
    title: 'Hill Repeats',
    description: `${warmupMiles}mi warmup, ${repeats}x${durationSeconds}sec hill at hard effort, jog down recovery, ${cooldownMiles}mi cooldown`,
    totalDistance: Math.round(totalDistance * 10) / 10,
    estimatedDuration,
    hrZone: 'Zone 4-5 on hills',
  };
}

/**
 * Create a fartlek workout.
 */
export function createFartlek(
  totalMiles: number,
  pickups: number,
  pickupDurationSeconds: number,
  paceZones: PaceZones
): RunningWorkout {
  const easyPaceMin = paceToSeconds(paceZones.easy.min);
  const estimatedDuration = Math.round(totalMiles * easyPaceMin / 60);

  return {
    type: 'fartlek',
    title: 'Fartlek',
    description: `Easy run with ${pickups}x${Math.round(pickupDurationSeconds / 60)}min pickups at tempo pace, ${Math.round(pickupDurationSeconds / 60)}min easy between`,
    totalDistance: totalMiles,
    estimatedDuration,
    hrZone: 'Zone 2-3',
  };
}

/**
 * Create a cross training day.
 */
export function createCrossTraining(duration: number = 40): RunningWorkout {
  return {
    type: 'cross_training',
    title: 'Cross Training',
    estimatedDuration: duration,
  };
}

/**
 * Create a recovery run.
 */
export function createRecoveryRun(
  distance: number,
  paceZones: PaceZones
): RunningWorkout {
  const recoveryPaceMin = paceToSeconds(paceZones.recovery.min);
  const estimatedDuration = Math.round((distance * recoveryPaceMin) / 60);

  return {
    type: 'recovery',
    title: 'Recovery Run',
    description: 'Very easy after long weekend',
    totalDistance: distance,
    estimatedDuration,
    hrZone: 'Zone 1-2',
  };
}

/**
 * Generate the appropriate workout based on parameters.
 */
export function generateWorkout(params: WorkoutParams): RunningWorkout {
  const { type, distance, phase, isRecovery, paceZones, level } = params;

  switch (type) {
    case 'rest':
      return createRestDay();

    case 'easy':
      return createEasyRun(distance || 4, paceZones);

    case 'long':
      const longDistance = distance || 12;
      const useProgression = phase !== 'base' && !isRecovery;
      return createLongRun(longDistance, paceZones, phase, {
        withProgression: useProgression && phase === 'build',
      });

    case 'tempo':
      const tempoMiles = isRecovery ? 2 : (phase === 'base' ? 3 : 4);
      return createTempoRun(tempoMiles, paceZones, isRecovery);

    case 'intervals':
      const repeats = isRecovery ? 6 : 8;
      return createIntervals('800m', repeats, paceZones);

    case 'hill_repeats':
      const hillRepeats = isRecovery ? 4 : 6;
      return createHillRepeats(hillRepeats, 60, paceZones);

    case 'fartlek':
      return createFartlek(distance || 6, 8, 60, paceZones);

    case 'cross_training':
      return createCrossTraining();

    case 'recovery':
      return createRecoveryRun(distance || 4, paceZones);

    case 'progression':
      return createLongRun(distance || 16, paceZones, phase, {
        withProgression: true,
      });

    case 'race_pace':
      return createLongRun(distance || 16, paceZones, phase, {
        withMarathonPaceFinish: true,
      });

    default:
      return createEasyRun(4, paceZones);
  }
}
