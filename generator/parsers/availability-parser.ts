/**
 * Parse availability text into structured day availability.
 * Examples:
 * - "Mon/Wed/Fri mornings before 7am"
 * - "Weekdays I can do mornings"
 * - "Sundays work best for long runs"
 */

import { DayOfWeek, DayAvailability, TimeSlot } from '../types';

const DAY_PATTERNS: Array<{ patterns: RegExp[]; day: DayOfWeek }> = [
  { patterns: [/\bmon(?:day)?\b/i], day: 'monday' },
  { patterns: [/\btue(?:s(?:day)?)?\b/i], day: 'tuesday' },
  { patterns: [/\bwed(?:nesday)?\b/i], day: 'wednesday' },
  { patterns: [/\bthu(?:rs(?:day)?)?\b/i], day: 'thursday' },
  { patterns: [/\bfri(?:day)?\b/i], day: 'friday' },
  { patterns: [/\bsat(?:urday)?\b/i], day: 'saturday' },
  { patterns: [/\bsun(?:day)?\b/i], day: 'sunday' },
];

const DEFAULT_AVAILABILITY: Record<DayOfWeek, DayAvailability> = {
  monday: { available: true, timeSlot: 'flexible', maxDuration: 60 },
  tuesday: { available: true, timeSlot: 'flexible', maxDuration: 60 },
  wednesday: { available: true, timeSlot: 'flexible', maxDuration: 60 },
  thursday: { available: true, timeSlot: 'flexible', maxDuration: 60 },
  friday: { available: true, timeSlot: 'flexible', maxDuration: 60 },
  saturday: { available: true, timeSlot: 'flexible', maxDuration: 120 },
  sunday: { available: true, timeSlot: 'flexible', maxDuration: 180 },
};

/**
 * Extract time slot from text.
 */
function extractTimeSlot(text: string): TimeSlot {
  const lower = text.toLowerCase();

  if (lower.includes('morning') || lower.includes('before 7') || lower.includes('before 8') ||
      lower.includes('early') || lower.includes('am')) {
    return 'morning';
  }
  if (lower.includes('evening') || lower.includes('after work') || lower.includes('after 5') ||
      lower.includes('after 6') || lower.includes('pm')) {
    return 'evening';
  }
  if (lower.includes('midday') || lower.includes('lunch') || lower.includes('noon')) {
    return 'midday';
  }

  return 'flexible';
}

/**
 * Extract max duration from text (in minutes).
 */
function extractMaxDuration(text: string, defaultDuration: number = 60): number {
  const lower = text.toLowerCase();

  // Check for explicit hour mentions
  const hourMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr)s?/);
  if (hourMatch) {
    return Math.round(parseFloat(hourMatch[1]) * 60);
  }

  // Check for minute mentions
  const minMatch = lower.match(/(\d+)\s*(?:min(?:ute)?s?)/);
  if (minMatch) {
    return parseInt(minMatch[1], 10);
  }

  // Check for time constraints that imply duration
  if (lower.includes('before 7') || lower.includes('before work')) {
    return 60; // Limited morning time
  }
  if (lower.includes('long run') || lower.includes('weekend')) {
    return 180; // Long run day
  }

  return defaultDuration;
}

/**
 * Find specific days mentioned in text.
 */
function findMentionedDays(text: string): DayOfWeek[] {
  const days: DayOfWeek[] = [];
  const lower = text.toLowerCase();

  for (const { patterns, day } of DAY_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(lower)) {
        if (!days.includes(day)) {
          days.push(day);
        }
        break;
      }
    }
  }

  return days;
}

/**
 * Check if text mentions weekdays or weekends.
 */
function checkGroupMentions(text: string): { weekdays: boolean; weekends: boolean } {
  const lower = text.toLowerCase();

  return {
    weekdays: /\bweekdays?\b/i.test(lower) || /\bm[- ]?w[- ]?f\b/i.test(lower),
    weekends: /\bweekends?\b/i.test(lower),
  };
}

/**
 * Parse weekday availability text.
 */
export function parseWeekdayAvailability(text: string): Partial<Record<DayOfWeek, DayAvailability>> {
  if (!text || text.trim() === '') {
    return {};
  }

  const result: Partial<Record<DayOfWeek, DayAvailability>> = {};
  const timeSlot = extractTimeSlot(text);
  const maxDuration = extractMaxDuration(text);

  const mentionedDays = findMentionedDays(text);
  const { weekdays } = checkGroupMentions(text);

  // If "weekdays" is mentioned, apply to all weekdays
  if (weekdays) {
    const weekdayList: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    for (const day of weekdayList) {
      result[day] = {
        available: true,
        timeSlot,
        maxDuration,
      };
    }
  }

  // Override with specifically mentioned days
  for (const day of mentionedDays) {
    result[day] = {
      available: true,
      timeSlot,
      maxDuration,
    };
  }

  return result;
}

/**
 * Parse weekend availability text.
 */
export function parseWeekendAvailability(text: string): Partial<Record<DayOfWeek, DayAvailability>> {
  if (!text || text.trim() === '') {
    return {};
  }

  const result: Partial<Record<DayOfWeek, DayAvailability>> = {};
  const timeSlot = extractTimeSlot(text);
  const maxDuration = extractMaxDuration(text, 180); // Default longer for weekend

  const mentionedDays = findMentionedDays(text);
  const { weekends } = checkGroupMentions(text);
  const lower = text.toLowerCase();

  // If "weekend" is mentioned or no specific days, apply to both
  if (weekends || mentionedDays.length === 0) {
    result.saturday = {
      available: true,
      timeSlot,
      maxDuration: lower.includes('long run') ? 180 : maxDuration,
    };
    result.sunday = {
      available: true,
      timeSlot,
      maxDuration: lower.includes('long run') ? 180 : maxDuration,
    };
  }

  // Override with specifically mentioned days
  for (const day of mentionedDays) {
    if (day === 'saturday' || day === 'sunday') {
      result[day] = {
        available: true,
        timeSlot,
        maxDuration: lower.includes('long run') ? 180 : maxDuration,
      };
    }
  }

  // If Sunday specifically mentioned for long runs
  if (lower.includes('sunday') && lower.includes('long run')) {
    result.sunday = {
      available: true,
      timeSlot,
      maxDuration: 180,
    };
  }

  return result;
}

/**
 * Parse combined availability into full week schedule.
 */
export function parseAvailability(
  weekdayText: string,
  weekendText: string
): Record<DayOfWeek, DayAvailability> {
  // Start with defaults
  const availability = { ...DEFAULT_AVAILABILITY };

  // Parse weekday availability
  const weekdayAvail = parseWeekdayAvailability(weekdayText);
  for (const [day, avail] of Object.entries(weekdayAvail)) {
    availability[day as DayOfWeek] = avail;
  }

  // Parse weekend availability
  const weekendAvail = parseWeekendAvailability(weekendText);
  for (const [day, avail] of Object.entries(weekendAvail)) {
    availability[day as DayOfWeek] = avail;
  }

  return availability;
}

/**
 * Parse weekly hours limit from text.
 * Examples: "8-10 hours", "about 7 hours", "6-8"
 */
export function parseWeeklyHours(text: string): number {
  if (!text || text.trim() === '') {
    return 7; // Default
  }

  const lower = text.toLowerCase();

  // Check for range pattern like "8-10" or "8 to 10"
  const rangeMatch = lower.match(/(\d+(?:\.\d+)?)\s*[-–to]\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    return (min + max) / 2; // Use midpoint
  }

  // Check for single number
  const singleMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)?/);
  if (singleMatch) {
    return parseFloat(singleMatch[1]);
  }

  return 7; // Default
}
