/**
 * Main normalizer: transforms raw Google Form intake into structured data.
 */

import { RawAthleteIntake } from '../types/intake-raw';
import {
  AthleteIntake,
  DayOfWeek,
  Goal,
  StrengthPreferences,
} from '../types/intake';
import { parseRace } from './race-parser';
import {
  parseHeightWeight,
  parseSex,
  parseActivityLevel,
  parseAge,
} from './body-parser';
import { parseAvailability, parseWeeklyHours } from './availability-parser';
import { parseBlockedDates } from './blocked-dates-parser';
import { parseTimeToSeconds } from './race-parser';

const DAY_PATTERNS: Array<{ patterns: RegExp[]; day: DayOfWeek }> = [
  { patterns: [/\bmon(?:day)?\b/i], day: 'monday' },
  { patterns: [/\btue(?:s(?:day)?)?\b/i], day: 'tuesday' },
  { patterns: [/\bwed(?:nesday)?\b/i], day: 'wednesday' },
  { patterns: [/\bthu(?:rs(?:day)?)?\b/i], day: 'thursday' },
  { patterns: [/\bfri(?:day)?\b/i], day: 'friday' },
  { patterns: [/\bsat(?:urday)?\b/i], day: 'saturday' },
  { patterns: [/\bsun(?:day)?\b/i], day: 'sunday' },
];

/**
 * Parse goal from text.
 */
function parseGoal(text: string): Goal {
  const lower = text.toLowerCase();

  if (lower.includes('target') || lower.includes('specific time') || lower.includes('time goal')) {
    return 'target_time';
  }
  if (lower.includes('best') || lower.includes('push') || lower.includes('performance') || lower.includes('pr')) {
    return 'best_performance';
  }
  if (lower.includes('finish') || lower.includes('complete') || lower.includes('just')) {
    return 'finish';
  }

  // Default based on whether they mentioned a target time
  return 'target_time';
}

/**
 * Parse target time from text.
 * Examples: "sub-4:00", "4:00:00", "under 4 hours", "3:45"
 */
function parseTargetTime(text: string): number | undefined {
  if (!text || text.trim() === '') {
    return undefined;
  }

  const lower = text.toLowerCase();

  // Check for time patterns
  const timeMatch = lower.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Check for "X hours" pattern
  const hoursMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/);
  if (hoursMatch) {
    return Math.round(parseFloat(hoursMatch[1]) * 3600);
  }

  return undefined;
}

/**
 * Parse heart rate value from text.
 */
function parseHRValue(text: string): number | undefined {
  if (!text || text.trim() === '') {
    return undefined;
  }

  const match = text.match(/(\d{2,3})/);
  if (match) {
    const value = parseInt(match[1], 10);
    // Validate reasonable HR range
    if (value >= 40 && value <= 220) {
      return value;
    }
  }

  return undefined;
}

/**
 * Parse strength preferences from raw data.
 */
function parseStrengthPreferences(raw: RawAthleteIntake['strengthPreferences']): StrengthPreferences {
  // Parse days per week
  let daysPerWeek = 2; // default
  const daysMatch = raw.daysPerWeek.match(/(\d)/);
  if (daysMatch) {
    daysPerWeek = parseInt(daysMatch[1], 10);
  }
  // Handle ranges like "2-3" - use lower value for conservative
  const rangeMatch = raw.daysPerWeek.match(/(\d)\s*[-–to]\s*(\d)/);
  if (rangeMatch) {
    daysPerWeek = parseInt(rangeMatch[1], 10);
  }

  // Parse preferred days
  const preferredDays: DayOfWeek[] = [];
  const daysText = raw.preferredTimes.toLowerCase();
  for (const { patterns, day } of DAY_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(daysText)) {
        preferredDays.push(day);
        break;
      }
    }
  }

  // Parse restrictions/notes
  const notes = raw.restrictions || undefined;
  const avoidBeforeLongRun = notes
    ? notes.toLowerCase().includes('long run') || notes.toLowerCase().includes('before')
    : true;

  return {
    daysPerWeek,
    preferredDays,
    avoidBeforeLongRun,
    notes,
  };
}

/**
 * Parse dietary restrictions from text.
 */
function parseDietaryRestrictions(text: string): string[] {
  if (!text || text.trim() === '' ||
      text.toLowerCase() === 'none' ||
      text.toLowerCase() === 'no restrictions') {
    return [];
  }

  // Split by common delimiters and clean up
  const restrictions = text
    .split(/[,;]/)
    .map(r => r.trim())
    .filter(r => r.length > 0);

  return restrictions;
}

/**
 * Normalize raw athlete intake into structured data.
 */
export function normalizeIntake(raw: RawAthleteIntake): AthleteIntake {
  // Parse recent race
  const recentRace = parseRace(raw.recentRace.raw);
  if (!recentRace) {
    throw new Error('Could not parse recent race data. Please provide a valid race time and distance.');
  }

  // Parse body composition
  const { height, weight } = parseHeightWeight(raw.bodyComposition.heightWeight);
  if (!height || !weight) {
    throw new Error('Could not parse height and weight. Please provide valid measurements.');
  }

  const age = parseAge(raw.bodyComposition.age);
  if (!age) {
    throw new Error('Could not parse age. Please provide a valid age.');
  }

  const sex = parseSex(raw.bodyComposition.sex);
  if (!sex) {
    throw new Error('Could not parse sex/gender. Please specify male or female.');
  }

  // Parse heart rate data
  const maxHR = parseHRValue(raw.heartRate.maxHR);
  if (!maxHR) {
    throw new Error('Could not parse max heart rate. Please provide a valid max HR.');
  }

  // Parse availability
  const availableDays = parseAvailability(
    raw.availableDays.weekday,
    raw.availableDays.weekend
  );

  // Parse weekly hours
  const weeklyHoursLimit = parseWeeklyHours(raw.weeklyHoursLimit);

  // Parse goal and target time
  const goal = parseGoal(raw.goal);
  const targetTimeSeconds = goal === 'target_time'
    ? parseTargetTime(raw.targetTime)
    : undefined;

  return {
    submittedAt: raw.submittedAt,

    recentRace,

    availableDays,

    weeklyHoursLimit,

    heartRate: {
      maxHR,
      restingHR: parseHRValue(raw.heartRate.restingHR),
      lthr: parseHRValue(raw.heartRate.lthr),
    },

    strengthPreferences: parseStrengthPreferences(raw.strengthPreferences),

    bodyComposition: {
      height,
      weight,
      age,
      sex,
      activityLevel: parseActivityLevel(raw.bodyComposition.activityLevel),
    },

    dietaryRestrictions: parseDietaryRestrictions(raw.dietaryRestrictions),

    blockedDates: parseBlockedDates(raw.blockedDates),

    goal,

    targetTimeSeconds,
  };
}
