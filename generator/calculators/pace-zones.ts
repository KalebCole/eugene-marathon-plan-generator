/**
 * Pace zone calculations using Riegel formula.
 * Derives training pace zones from recent race performance.
 */

import { RecentRace, RACE_DISTANCES_MILES, RaceDistance } from '../types/intake';
import { PaceZones, PaceRange, PlanLevel } from '../types/plan';

const MARATHON_DISTANCE = 26.2;
const RIEGEL_EXPONENT = 1.06;

/**
 * Convert seconds to MM:SS pace format.
 */
export function secondsToPace(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Convert MM:SS pace to seconds.
 */
export function paceToSeconds(pace: string): number {
  const parts = pace.split(':').map(p => parseInt(p, 10));
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

/**
 * Add seconds to a pace (makes it slower).
 */
function addToPace(paceSeconds: number, addSeconds: number): string {
  return secondsToPace(paceSeconds + addSeconds);
}

/**
 * Subtract seconds from a pace (makes it faster).
 */
function subtractFromPace(paceSeconds: number, subtractSeconds: number): string {
  return secondsToPace(Math.max(0, paceSeconds - subtractSeconds));
}

/**
 * Predict marathon time from a recent race using Riegel formula.
 * T2 = T1 * (D2/D1)^1.06
 */
export function predictMarathonTime(race: RecentRace): number {
  const raceDistanceMiles = RACE_DISTANCES_MILES[race.distance];
  const marathonTimeSeconds = race.timeSeconds * Math.pow(
    MARATHON_DISTANCE / raceDistanceMiles,
    RIEGEL_EXPONENT
  );
  return Math.round(marathonTimeSeconds);
}

/**
 * Calculate marathon pace (seconds per mile) from marathon time.
 */
export function calculateMarathonPace(marathonTimeSeconds: number): number {
  return marathonTimeSeconds / MARATHON_DISTANCE;
}

/**
 * Format a time in seconds to HH:MM:SS.
 */
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate pace zones from marathon pace.
 *
 * Zone formulas from guides/pace-zones.md:
 * - Recovery: MP + 2:30 to 3:30
 * - Easy: MP + 1:30 to 2:30
 * - Marathon: Goal pace
 * - Tempo: MP - 0:30 to 0:45
 * - 5K: MP - 1:00 to 1:30
 * - Interval: MP - 1:30 to 2:00
 */
export function calculatePaceZones(marathonPaceSeconds: number): PaceZones {
  const mp = marathonPaceSeconds;

  return {
    recovery: {
      min: addToPace(mp, 150),  // MP + 2:30
      max: addToPace(mp, 210),  // MP + 3:30
      description: 'Very easy, active recovery',
    },
    easy: {
      min: addToPace(mp, 90),   // MP + 1:30
      max: addToPace(mp, 150),  // MP + 2:30
      description: 'Conversational pace, should feel comfortable. MP + 1:30-2:30.',
    },
    marathon: {
      min: secondsToPace(mp - 10),  // Slightly faster than goal
      max: secondsToPace(mp + 15),  // Slightly slower than goal
      description: `Goal race pace (~${formatTime(Math.round(mp * MARATHON_DISTANCE))} marathon)`,
    },
    tempo: {
      min: subtractFromPace(mp, 45),  // MP - 0:45
      max: subtractFromPace(mp, 30),  // MP - 0:30
      description: 'Comfortably hard, can speak in short sentences',
    },
    fiveK: {
      min: subtractFromPace(mp, 90),  // MP - 1:30
      max: subtractFromPace(mp, 60),  // MP - 1:00
      description: 'Hard effort, limited speaking',
    },
    interval: {
      min: subtractFromPace(mp, 120), // MP - 2:00
      max: subtractFromPace(mp, 90),  // MP - 1:30
      description: 'Near max effort for short bursts',
    },
  };
}

/**
 * Adjust predicted finish time based on plan level.
 */
export function adjustFinishTimeForLevel(
  baseTime: number,
  level: PlanLevel
): { min: string; max: string; target: string } {
  switch (level) {
    case 'conservative':
      return {
        min: formatTime(baseTime),
        max: formatTime(Math.round(baseTime * 1.10)), // +10%
        target: formatTime(Math.round(baseTime * 1.05)), // +5%
      };
    case 'ambitious':
      return {
        min: formatTime(Math.round(baseTime * 0.95)), // -5%
        max: formatTime(baseTime),
        target: formatTime(Math.round(baseTime * 0.97)), // -3%
      };
    case 'moderate':
    default:
      return {
        min: formatTime(Math.round(baseTime * 0.98)), // -2%
        max: formatTime(Math.round(baseTime * 1.04)), // +4%
        target: formatTime(baseTime),
      };
  }
}

/**
 * Full pace zone calculation from recent race.
 */
export function calculateAllPaceData(race: RecentRace, level: PlanLevel) {
  const predictedMarathonSeconds = predictMarathonTime(race);
  const marathonPaceSeconds = calculateMarathonPace(predictedMarathonSeconds);

  return {
    predictedMarathonTime: predictedMarathonSeconds,
    predictedMarathonTimeFormatted: formatTime(predictedMarathonSeconds),
    marathonPaceSeconds,
    marathonPace: secondsToPace(marathonPaceSeconds),
    paceZones: calculatePaceZones(marathonPaceSeconds),
    finishPrediction: adjustFinishTimeForLevel(predictedMarathonSeconds, level),
  };
}

/**
 * Estimate calories burned per mile based on pace.
 * Faster paces burn slightly more calories due to higher intensity.
 */
export function estimateCaloriesPerMile(paceSecondsPerMile: number, weightLbs: number): number {
  // Base: ~100 cal/mile for 150 lb person at 10:00 pace
  const baseCalories = (weightLbs / 150) * 100;

  // Adjust for pace (faster = more calories)
  const basePace = 600; // 10:00/mile
  const paceAdjustment = 1 + (basePace - paceSecondsPerMile) / 1200;

  return Math.round(baseCalories * Math.max(0.8, Math.min(1.3, paceAdjustment)));
}
