/**
 * Parse blocked dates from free text.
 * Examples:
 * - "Feb 15-22, wedding March 8"
 * - "Traveling Feb 15-22"
 * - "wedding March 8"
 * - "vacation January 5-12, conference Feb 20"
 */

import { BlockedDateRange } from '../types';

const MONTH_MAP: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

const REASON_KEYWORDS = [
  'wedding', 'travel', 'traveling', 'trip', 'vacation', 'conference',
  'work', 'business', 'family', 'holiday', 'event', 'party', 'birthday',
  'anniversary', 'graduation', 'reunion', 'visit', 'visiting',
];

/**
 * Format a date as YYYY-MM-DD.
 */
function formatDate(year: number, month: number, day: number): string {
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

/**
 * Determine the year for a date based on race date.
 * Dates before the race are assumed to be in the training period.
 * Race is April 26, 2026.
 */
function determineYear(month: number, raceDate: Date = new Date('2026-04-26')): number {
  const raceMonth = raceDate.getMonth() + 1;
  const raceYear = raceDate.getFullYear();

  // If the month is after the race month in the same year, it's the previous year
  // (training likely started the previous year)
  if (month > raceMonth) {
    return raceYear - 1;
  }

  return raceYear;
}

/**
 * Parse a single date range segment.
 */
function parseDateSegment(
  segment: string,
  raceDate: Date = new Date('2026-04-26')
): BlockedDateRange | null {
  const cleaned = segment.trim().toLowerCase();

  if (!cleaned) {
    return null;
  }

  // Extract reason if present
  let reason: string | undefined;
  for (const keyword of REASON_KEYWORDS) {
    if (cleaned.includes(keyword)) {
      reason = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      break;
    }
  }

  // Pattern: "Month DD-DD" (e.g., "Feb 15-22")
  const monthRangeMatch = cleaned.match(
    /(\w+)\s+(\d{1,2})\s*[-–to]+\s*(\d{1,2})/
  );
  if (monthRangeMatch) {
    const monthName = monthRangeMatch[1];
    const startDay = parseInt(monthRangeMatch[2], 10);
    const endDay = parseInt(monthRangeMatch[3], 10);
    const month = MONTH_MAP[monthName];

    if (month) {
      const year = determineYear(month, raceDate);
      return {
        start: formatDate(year, month, startDay),
        end: formatDate(year, month, endDay),
        reason,
      };
    }
  }

  // Pattern: "Month DD" (single day, e.g., "March 8")
  const singleDayMatch = cleaned.match(/(\w+)\s+(\d{1,2})(?:\s|$|,)/);
  if (singleDayMatch) {
    const monthName = singleDayMatch[1];
    const day = parseInt(singleDayMatch[2], 10);
    const month = MONTH_MAP[monthName];

    if (month) {
      const year = determineYear(month, raceDate);
      const date = formatDate(year, month, day);
      return {
        start: date,
        end: date,
        reason,
      };
    }
  }

  // Pattern: "MM/DD-MM/DD" or "MM/DD - MM/DD"
  const numericRangeMatch = cleaned.match(
    /(\d{1,2})\/(\d{1,2})\s*[-–to]+\s*(\d{1,2})\/(\d{1,2})/
  );
  if (numericRangeMatch) {
    const startMonth = parseInt(numericRangeMatch[1], 10);
    const startDay = parseInt(numericRangeMatch[2], 10);
    const endMonth = parseInt(numericRangeMatch[3], 10);
    const endDay = parseInt(numericRangeMatch[4], 10);

    const startYear = determineYear(startMonth, raceDate);
    const endYear = determineYear(endMonth, raceDate);

    return {
      start: formatDate(startYear, startMonth, startDay),
      end: formatDate(endYear, endMonth, endDay),
      reason,
    };
  }

  // Pattern: "MM/DD" (single day)
  const numericSingleMatch = cleaned.match(/(\d{1,2})\/(\d{1,2})(?:\s|$|,)/);
  if (numericSingleMatch) {
    const month = parseInt(numericSingleMatch[1], 10);
    const day = parseInt(numericSingleMatch[2], 10);
    const year = determineYear(month, raceDate);
    const date = formatDate(year, month, day);

    return {
      start: date,
      end: date,
      reason,
    };
  }

  return null;
}

/**
 * Parse blocked dates from text.
 */
export function parseBlockedDates(
  text: string,
  raceDate: Date = new Date('2026-04-26')
): BlockedDateRange[] {
  if (!text || text.trim() === '' || text.toLowerCase() === 'none') {
    return [];
  }

  const results: BlockedDateRange[] = [];

  // Split by common delimiters: comma, semicolon, "and"
  const segments = text.split(/[,;]|\band\b/i).map(s => s.trim());

  for (const segment of segments) {
    const parsed = parseDateSegment(segment, raceDate);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

/**
 * Check if a date falls within any blocked range.
 */
export function isDateBlocked(
  date: string | Date,
  blockedDates: BlockedDateRange[]
): { blocked: boolean; reason?: string } {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  const checkStr = checkDate.toISOString().split('T')[0];

  for (const range of blockedDates) {
    if (checkStr >= range.start && checkStr <= range.end) {
      return { blocked: true, reason: range.reason };
    }
  }

  return { blocked: false };
}
