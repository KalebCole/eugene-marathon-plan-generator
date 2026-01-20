/**
 * Raw intake data as captured from Google Form via n8n workflow.
 * All fields are text strings that need parsing.
 */
export interface RawAthleteIntake {
  submittedAt: string;

  recentRace: {
    /** e.g., "1:52:30 half marathon last October" */
    raw: string;
  };

  availableDays: {
    /** e.g., "Mon/Wed/Fri mornings before 7am" */
    weekday: string;
    /** e.g., "Sundays work best for long runs" */
    weekend: string;
  };

  /** e.g., "8-10 hours" */
  weeklyHoursLimit: string;

  heartRate: {
    /** e.g., "185" */
    maxHR: string;
    /** e.g., "168" or empty */
    lthr: string;
    /** e.g., "52" */
    restingHR: string;
  };

  strengthPreferences: {
    /** e.g., "2-3 days" */
    daysPerWeek: string;
    /** e.g., "Tuesday and Thursday evenings" */
    preferredTimes: string;
    /** e.g., "No heavy squats before long runs" */
    restrictions: string;
  };

  bodyComposition: {
    /** e.g., "5'10\", 165 lbs" */
    heightWeight: string;
    /** e.g., "32" */
    age: string;
    /** e.g., "Male" */
    sex: string;
    /** e.g., "Desk job, mostly sedentary" */
    activityLevel: string;
  };

  /** e.g., "No restrictions" or "Vegetarian, no dairy" */
  dietaryRestrictions: string;

  /** e.g., "Feb 15-22, wedding March 8" */
  blockedDates: string;

  /** e.g., "Target a specific time" */
  goal: string;

  /** e.g., "sub-4:00" (only if goal is target time) */
  targetTime: string;
}
