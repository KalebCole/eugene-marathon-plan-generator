# Availability-Based Scheduling Guide

This guide documents how to schedule workouts when generating training plans based on athlete availability constraints.

---

## Input Data

When generating a plan, you'll receive:

### 1. Running Availability
```json
"runningDays": ["monday", "wednesday", "friday", "saturday", "sunday"],
"preferredRunTime": "morning",
"preferredLongRunDay": "sunday"
```

### 2. Strength Training Availability
```json
"strengthDays": ["tuesday", "thursday", "saturday"],
"preferredStrengthTime": "evening"
```

### 3. Blocked Date Ranges
```json
"blockedDates": [
  {
    "startDate": "2026-02-15",
    "endDate": "2026-02-22",
    "reason": "Work travel",
    "type": "rest"
  },
  {
    "startDate": "2026-03-07",
    "endDate": "2026-03-08",
    "reason": "Skiing trip",
    "type": "cross-training",
    "crossTrainingActivity": "Skiing"
  }
]
```

---

## Workout Priority System

When scheduling conflicts occur, prioritize workouts in this order:

| Priority | Workout Type | Never Skip? | Handling When Day Unavailable |
|----------|--------------|-------------|-------------------------------|
| 1 | Long Run | YES | Move to nearest available weekend day (Sat/Sun/Fri/Mon) |
| 2 | Quality (Tempo, Intervals, Hills) | Rarely | Move to available weekday, maintain 48hr gap |
| 3 | Easy/Medium Runs | No | Move if slot available, or drop |
| 4 | Strength Training | No | Move to available strength day |
| 5 | Recovery Runs | No | Drop entirely, convert to full rest |

---

## Scheduling Algorithm

### Step 1: Identify Available Days

For each week, determine which days are available for:
- Running (from `runningDays` minus any blocked dates that week)
- Strength (from `strengthDays` minus any blocked dates that week)

### Step 2: Place Long Run First

1. Check if `preferredLongRunDay` is available
2. If not, try other weekend days in order: Saturday → Sunday → Friday → Monday
3. Mark the chosen day for the long run

### Step 3: Place Quality Sessions

1. Identify quality workouts for the week (tempo, intervals, hills)
2. Place on available running days that are NOT:
   - Adjacent to the long run day
   - Within 48 hours of another quality session
3. If no valid day, move to nearest available day that respects 48hr rule

### Step 4: Place Easy Runs

1. Fill remaining available running days with easy runs
2. If more easy runs planned than available days, drop lowest-mileage easy runs first
3. Do NOT redistribute dropped miles to other days

### Step 5: Place Strength Training

1. Place strength sessions on available strength days
2. Respect sequencing rules:
   - No heavy leg work within 48 hours of quality running
   - No strength day before long run
   - Strength should come AFTER runs on same-day doubles
3. If conflicts, reduce to upper body/core only on that day

### Step 6: Handle Blocked Date Ranges

For each blocked date range:

**If type = "rest":**
- No workouts on those days
- Apply Step 2-5 algorithm for that week with those days removed
- Mark days with `isBlockedDay: true`

**If type = "cross-training":**
- No running workouts on those days
- Mark with cross-training activity:
  ```json
  "crossTraining": {
    "activity": "Skiing",
    "notes": "Counts as aerobic cross-training"
  }
  ```
- Strength may still be scheduled if the day is in `strengthDays` and timing works

---

## Sequencing Rules (Hard Constraints)

These rules must NEVER be violated:

1. **48-hour rule for quality sessions**: Never schedule two quality running sessions (tempo, intervals, hills, race pace) within 48 hours of each other.

2. **No heavy legs before speed work**: No lower body strength training within 48 hours before intervals or tempo runs.

3. **No strength before long run**: Never schedule strength training the day before a long run.

4. **Strength after runs**: If running and strength are on the same day, strength must come AFTER the run.

5. **Long run priority**: The long run must ALWAYS be scheduled somewhere in the week. It is the most important workout.

---

## Volume Handling

When workouts are dropped due to limited availability:

**DO:** Accept reduced weekly volume
```
Standard week: 30 miles (5 running days)
Limited week:  24 miles (4 running days) - OK
```

**DO NOT:** Redistribute miles to remaining days
```
WRONG: "Drop 6-mile easy run, add 2 miles to each of 3 other runs"
This increases injury risk from cramming miles
```

---

## Adjustment Tracking

When a workout is moved or modified, add adjustment metadata:

```json
{
  "date": "2026-02-08",
  "dayOfWeek": "saturday",
  "running": {
    "type": "long",
    "title": "Long Run",
    "totalDistance": 14,
    "description": "14 mile progression long run..."
  },
  "adjustment": {
    "wasAdjusted": true,
    "originalDay": "sunday",
    "reason": "Sunday blocked for running"
  }
}
```

For cross-training days:

```json
{
  "date": "2026-03-07",
  "dayOfWeek": "saturday",
  "running": {
    "type": "cross_training",
    "title": "Cross-Training Day",
    "description": "Skiing - counts as aerobic activity"
  },
  "crossTraining": {
    "activity": "Skiing",
    "notes": "Full day skiing trip - good aerobic cross-training"
  },
  "isBlockedDay": true
}
```

---

## Example Scenarios

### Scenario 1: Sunday Blocked for Running

**Input:**
- Running days: Mon, Wed, Fri, Sat (Sunday NOT available)
- Long run preference: Sunday

**Solution:**
- Move long run to Saturday
- If Saturday has another workout, swap it to Friday
- Note adjustment in Saturday's data

### Scenario 2: Limited to 4 Running Days

**Input:**
- Running days: Mon, Wed, Fri, Sun
- Standard week calls for 5 runs

**Solution:**
1. Keep: Long run (Sun), Quality session (Wed), Easy (Mon), Easy (Fri)
2. Drop: One easy run or recovery run
3. Accept ~20% reduced weekly mileage

### Scenario 3: Ski Weekend (Cross-Training)

**Input:**
- Blocked: Sat-Sun, type: cross-training, activity: Skiing
- Long run preference: Sunday

**Solution:**
1. Move long run to Friday
2. Mark Sat/Sun as cross-training days
3. Note adjustment and include skiing as the activity
4. If strength was planned for Saturday, keep it (skiing != running conflict)

### Scenario 4: Week-Long Travel (Rest)

**Input:**
- Blocked: Mon-Sun, type: rest, reason: Work travel

**Solution:**
1. Mark entire week as blocked
2. Label it a forced recovery week
3. Adjust surrounding weeks if needed (don't do back-to-back hard weeks)
4. Note in weekly focus: "Travel week - forced recovery"

---

## Minimum Availability Warning

If athlete has fewer than 3 running days available:
- Generate the plan anyway
- Add warning note in plan overview:
  > "Note: With only [X] running days per week, this plan has reduced volume. Consider adding another running day if possible for optimal marathon preparation."

---

## PDF Display

When adjustments are made, the PDF should show:

1. **Overview page**: Summary of availability constraints and how they're handled
2. **Weekly pages**: Small note under adjusted workouts (e.g., "Moved from Sunday")
3. **Cross-training days**: Show activity name with distinct styling

Example adjustment note format:
```
Saturday, Feb 8
Long Run - 14 miles
Zone 2 | ~2:30 duration
↳ Moved from Sunday due to availability
```
