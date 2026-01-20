/**
 * Date calculations for training plan generation.
 * Handles week calculations, race countdown, and date formatting.
 */

import {
  addDays,
  addWeeks,
  differenceInDays,
  differenceInWeeks,
  format,
  startOfWeek,
  parseISO,
  isValid,
} from 'date-fns';

import { DayOfWeek } from '../types/intake';

const RACE_DATE = new Date('2026-04-26');
const STANDARD_PLAN_WEEKS = 15;

export interface WeekInfo {
  weekNumber: number;
  weeksUntilRace: number;
  startDate: Date;
  endDate: Date;
  phase: 'base' | 'build' | 'peak' | 'taper' | 'race';
  isRecoveryWeek: boolean;
}

/**
 * Get the Monday of the current week.
 */
export function getMondayOfWeek(date: Date = new Date()): Date {
  // date-fns startOfWeek defaults to Sunday, we want Monday
  return startOfWeek(date, { weekStartsOn: 1 });
}

/**
 * Calculate weeks until race from a given date.
 */
export function getWeeksUntilRace(
  fromDate: Date = new Date(),
  raceDate: Date = RACE_DATE
): number {
  const days = differenceInDays(raceDate, fromDate);
  return Math.ceil(days / 7);
}

/**
 * Calculate the total weeks for the plan based on time until race.
 * - If less than 15 weeks: compress (shorten base phase)
 * - If more than 15 weeks: extend (add base weeks)
 */
export function calculatePlanWeeks(
  startDate: Date = new Date(),
  raceDate: Date = RACE_DATE
): number {
  const weeksUntilRace = getWeeksUntilRace(startDate, raceDate);

  // Minimum 8 weeks, maximum 20 weeks
  if (weeksUntilRace < 8) {
    return 8;
  }
  if (weeksUntilRace > 20) {
    return 20;
  }

  return weeksUntilRace;
}

/**
 * Determine the training phase for a given week.
 *
 * Standard 15-week plan phases:
 * - Base: weeks 1-4
 * - Build: weeks 5-10
 * - Peak: weeks 11-13
 * - Taper: weeks 14-15
 * - Race: final week
 *
 * For non-standard plans, scale proportionally.
 */
export function getPhaseForWeek(
  weekNumber: number,
  totalWeeks: number
): 'base' | 'build' | 'peak' | 'taper' | 'race' {
  if (weekNumber === totalWeeks) {
    return 'race';
  }

  // Calculate proportional phase boundaries
  const baseEnd = Math.ceil(totalWeeks * (4 / 15));
  const buildEnd = Math.ceil(totalWeeks * (10 / 15));
  const peakEnd = Math.ceil(totalWeeks * (13 / 15));

  if (weekNumber <= baseEnd) {
    return 'base';
  }
  if (weekNumber <= buildEnd) {
    return 'build';
  }
  if (weekNumber <= peakEnd) {
    return 'peak';
  }
  return 'taper';
}

/**
 * Determine if a week is a recovery week.
 *
 * Recovery weeks in standard 15-week plan: weeks 4, 7, 10
 * For other plans, place recovery every 3-4 weeks.
 */
export function isRecoveryWeek(weekNumber: number, totalWeeks: number): boolean {
  // Never recovery in first week or taper/race weeks
  if (weekNumber === 1) return false;

  const phase = getPhaseForWeek(weekNumber, totalWeeks);
  if (phase === 'taper' || phase === 'race') return false;

  // For standard 15-week plan
  if (totalWeeks === 15) {
    return weekNumber === 4 || weekNumber === 7 || weekNumber === 10;
  }

  // For other plans, recovery every ~3-4 weeks during base/build
  // Place at end of each mini-cycle
  const baseEnd = Math.ceil(totalWeeks * (4 / 15));
  const buildEnd = Math.ceil(totalWeeks * (10 / 15));

  // Recovery at end of base phase
  if (weekNumber === baseEnd) return true;

  // Recovery weeks in build phase (every 3 weeks)
  if (phase === 'build') {
    const buildStart = baseEnd + 1;
    const weeksIntoBuild = weekNumber - buildStart;
    return weeksIntoBuild > 0 && weeksIntoBuild % 3 === 2;
  }

  return false;
}

/**
 * Generate week info for all weeks in the plan.
 */
export function generateWeekSchedule(
  startDate: Date = new Date(),
  raceDate: Date = RACE_DATE
): WeekInfo[] {
  const monday = getMondayOfWeek(startDate);
  const totalWeeks = calculatePlanWeeks(startDate, raceDate);
  const weeks: WeekInfo[] = [];

  for (let i = 1; i <= totalWeeks; i++) {
    const weekStart = addWeeks(monday, i - 1);
    const weekEnd = addDays(weekStart, 6);
    const weeksUntilRace = totalWeeks - i + 1;

    weeks.push({
      weekNumber: i,
      weeksUntilRace,
      startDate: weekStart,
      endDate: weekEnd,
      phase: getPhaseForWeek(i, totalWeeks),
      isRecoveryWeek: isRecoveryWeek(i, totalWeeks),
    });
  }

  return weeks;
}

/**
 * Get the date for a specific day of a week.
 */
export function getDateForDay(weekStart: Date, day: DayOfWeek): Date {
  const dayOffsets: Record<DayOfWeek, number> = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
  };

  return addDays(weekStart, dayOffsets[day]);
}

/**
 * Format a date as YYYY-MM-DD.
 */
export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Format a date for display.
 */
export function formatDateDisplay(date: Date): string {
  return format(date, 'MMMM d, yyyy');
}

/**
 * Get day of week name from date.
 */
export function getDayOfWeekName(date: Date): DayOfWeek {
  const dayIndex = date.getDay();
  const days: DayOfWeek[] = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
  ];
  return days[dayIndex];
}

/**
 * Parse a date string safely.
 */
export function parseDateSafe(dateStr: string): Date | null {
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? parsed : null;
}

/**
 * Check if a date falls within a range.
 */
export function isDateInRange(date: Date, startStr: string, endStr: string): boolean {
  const dateStr = formatDateISO(date);
  return dateStr >= startStr && dateStr <= endStr;
}

/**
 * Get all dates in a week.
 */
export function getWeekDates(weekStart: Date): Record<DayOfWeek, Date> {
  const days: DayOfWeek[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  const result: Partial<Record<DayOfWeek, Date>> = {};
  for (let i = 0; i < days.length; i++) {
    result[days[i]] = addDays(weekStart, i);
  }

  return result as Record<DayOfWeek, Date>;
}
