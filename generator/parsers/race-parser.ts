/**
 * Parse race performance text into structured data.
 * Examples:
 * - "1:52:30 half marathon last October"
 * - "2:00:00 half marathon"
 * - "50:00 10K"
 * - "25:30 5K"
 */

import { RaceDistance, RecentRace } from '../types';

const DISTANCE_PATTERNS: Array<{ pattern: RegExp; distance: RaceDistance }> = [
  // Check half marathon patterns BEFORE marathon to avoid false matches
  { pattern: /\bhalf[\s-]?marathon\b/i, distance: 'half_marathon' },
  { pattern: /\bhalf\b/i, distance: 'half_marathon' },
  // Then check marathon patterns
  { pattern: /\bfull\s*marathon\b/i, distance: 'marathon' },
  { pattern: /\bmarathon\b/i, distance: 'marathon' },
  { pattern: /\b10[\s-]?k\b/i, distance: '10k' },
  { pattern: /\b5[\s-]?k\b/i, distance: '5k' },
  { pattern: /\b10[\s-]?mi(?:le)?(?:r|s)?\b/i, distance: '10_miler' },
  { pattern: /\b15[\s-]?k\b/i, distance: '15k' },
];

const MONTH_MAP: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

/**
 * Parse time string to seconds.
 * Supports formats: HH:MM:SS, H:MM:SS, MM:SS, M:SS
 */
export function parseTimeToSeconds(timeStr: string): number {
  const cleaned = timeStr.trim();
  const parts = cleaned.split(':').map(p => parseInt(p, 10));

  if (parts.length === 3) {
    // HH:MM:SS
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    // MM:SS or H:MM (context dependent)
    const [first, second] = parts;
    // If first part is > 59, treat as H:MM, otherwise MM:SS
    if (first > 59) {
      // Likely hours and minutes
      return first * 3600 + second * 60;
    }
    return first * 60 + second;
  }

  return 0;
}

/**
 * Format seconds to HH:MM:SS string.
 */
export function formatSecondsToTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Extract time from race text.
 * Looks for patterns like "1:52:30", "2:00", "50:00"
 */
function extractTime(text: string): { timeSeconds: number; timeFormatted: string } | null {
  // Match time patterns: H:MM:SS, HH:MM:SS, M:SS, MM:SS
  const timePattern = /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g;
  const matches = text.match(timePattern);

  if (!matches || matches.length === 0) {
    return null;
  }

  // Use the first time found
  const timeStr = matches[0];
  const timeSeconds = parseTimeToSeconds(timeStr);

  return {
    timeSeconds,
    timeFormatted: formatSecondsToTime(timeSeconds),
  };
}

/**
 * Extract race distance from text.
 */
function extractDistance(text: string): RaceDistance | null {
  for (const { pattern, distance } of DISTANCE_PATTERNS) {
    if (pattern.test(text)) {
      return distance;
    }
  }
  return null;
}

/**
 * Extract race date from text.
 * Handles patterns like "last October", "October 2025", "10/15/2025"
 */
function extractDate(text: string, referenceDate: Date = new Date()): string | undefined {
  const lowerText = text.toLowerCase();

  // Check for "last [month]" pattern
  const lastMonthMatch = lowerText.match(/last\s+(\w+)/);
  if (lastMonthMatch) {
    const monthName = lastMonthMatch[1];
    const monthNum = MONTH_MAP[monthName];
    if (monthNum !== undefined) {
      let year = referenceDate.getFullYear();
      // If month is after current month, it was last year
      if (monthNum >= referenceDate.getMonth()) {
        year -= 1;
      }
      // Assume 15th of the month for approximation
      return `${year}-${(monthNum + 1).toString().padStart(2, '0')}-15`;
    }
  }

  // Check for "[month] [year]" pattern
  const monthYearMatch = lowerText.match(/(\w+)\s+(\d{4})/);
  if (monthYearMatch) {
    const monthName = monthYearMatch[1];
    const year = parseInt(monthYearMatch[2], 10);
    const monthNum = MONTH_MAP[monthName];
    if (monthNum !== undefined) {
      return `${year}-${(monthNum + 1).toString().padStart(2, '0')}-15`;
    }
  }

  // Check for MM/DD/YYYY or YYYY-MM-DD pattern
  const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    const [, month, day, year] = dateMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return isoMatch[0];
  }

  return undefined;
}

/**
 * Parse race performance text into structured data.
 */
export function parseRace(text: string, referenceDate?: Date): RecentRace | null {
  if (!text || text.trim() === '') {
    return null;
  }

  const timeData = extractTime(text);
  const distance = extractDistance(text);

  if (!timeData || !distance) {
    // Try some reasonable defaults based on time
    if (timeData) {
      // Guess distance based on time
      const seconds = timeData.timeSeconds;
      let guessedDistance: RaceDistance = 'half_marathon';

      if (seconds < 1800) {
        guessedDistance = '5k'; // Under 30 min
      } else if (seconds < 4200) {
        guessedDistance = '10k'; // 30 min - 1:10
      } else if (seconds < 10800) {
        guessedDistance = 'half_marathon'; // 1:10 - 3:00
      } else {
        guessedDistance = 'marathon'; // Over 3 hours
      }

      return {
        distance: distance || guessedDistance,
        timeSeconds: timeData.timeSeconds,
        timeFormatted: timeData.timeFormatted,
        date: extractDate(text, referenceDate),
      };
    }
    return null;
  }

  return {
    distance,
    timeSeconds: timeData.timeSeconds,
    timeFormatted: timeData.timeFormatted,
    date: extractDate(text, referenceDate),
  };
}
