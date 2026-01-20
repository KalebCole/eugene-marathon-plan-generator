# Training Plan Generation Prompt

You are an expert marathon coach generating a personalized 15-week training plan for the Eugene Full Marathon (April 26, 2026).

## Athlete Information

{athlete_data}

## Instructions

Generate a complete training plan following these requirements:

### 1. Date Calculation
- Today's date: {today_date}
- Race date: April 26, 2026
- Calculate weeks remaining and adjust plan length accordingly
- Week 1 starts on the Monday of the current week

### 2. Availability Constraints (CRITICAL)
- Schedule running ONLY on these days: {running_days}
- Schedule strength training ONLY on these days: {strength_days}
- Long run should be on: {long_run_day}
- Blocked dates (NO training): {blocked_dates_rest}
- Blocked dates (cross-training OK): {blocked_dates_cross}

When a workout conflicts with availability:
1. Move long runs to the nearest available weekend day
2. Move quality sessions (tempo, intervals) to available weekdays, maintaining 48hr spacing
3. Drop recovery runs if no slots available (do NOT redistribute volume)
4. Add `adjustment` object to moved workouts noting original day and reason

### 3. Pace Zones
Calculate from the recent race time using Riegel formula:
- Easy: MP + 1:30-2:30
- Marathon Pace: Goal pace
- Tempo: MP - 0:30-0:45
- 5K Pace: MP - 1:15-1:30
- Interval: MP - 1:30-1:45
- Recovery: MP + 2:30-3:30

### 4. HR Zones
Calculate using the provided heart rate data (Max HR, LTHR if available, Resting HR).

### 5. Nutrition
Calculate TDEE using Mifflin-St Jeor equation with the body composition data.
Add training calories (80-100 cal/mile running, 100-300 cal/strength session).

### 6. Periodization
Follow this structure with recovery weeks built in:
- Base (Weeks 1-4): Aerobic foundation, 3x/week strength. Recovery: Week 4
- Build (Weeks 5-10): Add intensity, 2-3x/week strength. Recovery: Weeks 7, 10
- Peak (Weeks 11-13): Max volume, 2x/week light strength
- Taper (Weeks 14-15): Reduce volume, maintain sharpness, minimal strength

### 7. Sequencing Rules
- No heavy leg work within 48 hours of speed work
- Lift AFTER runs on same day, never before
- No lifting the day before long runs
- Upper body is flexible

### 8. Output Format
Return ONLY valid JSON matching the schema structure. Include:
- metadata (planName, raceDate, predictedFinishTime, etc.)
- athlete (with athleteAvailability section)
- paceZones
- hrZones
- nutritionTargets
- weeks array with all 15 weeks

Each week must have:
- weekNumber, weeksUntilRace, phase, focus
- totalMileage, totalHours, strengthDays
- days object with monday through sunday
- Each day: date, running object, optional strength object
- Blocked days: isBlockedDay: true
- Adjusted workouts: adjustment object with wasAdjusted, originalDay, reason

## Reference Example

Use this structure (abbreviated):
```json
{
  "metadata": {
    "planName": "Eugene Marathon - Moderate Plan",
    "planLevel": "moderate",
    "raceDate": "2026-04-26",
    ...
  },
  "athlete": {
    "athleteAvailability": {
      "runningDays": ["monday", "tuesday", ...],
      "strengthDays": ["tuesday", "thursday", "saturday"],
      "preferredLongRunDay": "sunday"
    },
    "blockedDates": [...]
  },
  "weeks": [
    {
      "weekNumber": 1,
      "days": {
        "monday": {
          "date": "2026-01-13",
          "running": { "type": "easy", "title": "Easy Run", ... }
        },
        ...
      }
    }
  ]
}
```

Generate the complete plan now. Output ONLY the JSON, no explanations.
