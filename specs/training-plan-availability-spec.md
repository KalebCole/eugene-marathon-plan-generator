# PRD: Training Plan Availability & Scheduling

## Overview

Enable athletes to specify their training availability (separately for running and strength training) and blocked dates, so the plan generator automatically schedules workouts around their real-life constraints.

## Problem Statement

Currently, the intake process asks generally about available days/times and blocked dates, but the plan generation doesn't systematically account for:
- Recurring unavailable days (e.g., "I can never run on Sundays")
- Different availability for running vs. strength training
- One-time blocked periods (travel, events, ski trips)
- How to intelligently reschedule or drop workouts when conflicts occur

## Goals

1. Capture granular availability data through updated intake questions
2. Automatically generate conflict-free training schedules
3. Apply smart workout prioritization when days are limited
4. Require zero manual intervention from the plan creator
5. Display adjustments transparently in the PDF output

---

## Proposed Intake Question Changes

### Current Questions (to be updated)

**Question 2** (currently):
> What days/times can you run?
> - Weekday availability (e.g., "mornings before 7am")
> - Weekend availability

**Question 8** (currently):
> Preferred lifting days/times?

**Question 16** (currently):
> Any dates you'll be unavailable? (travel, events)

### New Questions

**Question 2 (Updated) - Running Availability:**
> Which days are you available to run? (Select all that apply)
> - [ ] Monday
> - [ ] Tuesday
> - [ ] Wednesday
> - [ ] Thursday
> - [ ] Friday
> - [ ] Saturday
> - [ ] Sunday
>
> Preferred time of day: ☐ Morning ☐ Afternoon ☐ Evening ☐ Flexible

**Question 8 (Updated) - Strength Training Availability:**
> Which days are you available to strength train? (Select all that apply)
> - [ ] Monday
> - [ ] Tuesday
> - [ ] Wednesday
> - [ ] Thursday
> - [ ] Friday
> - [ ] Saturday
> - [ ] Sunday
>
> Preferred time of day: ☐ Morning ☐ Afternoon ☐ Evening ☐ Flexible

**Question 16 (Updated) - Blocked Dates:**
> List any date ranges when you'll be unavailable to train:
>
> | Dates | Reason | Type |
> |-------|--------|------|
> | Feb 15-22 | Work travel | Rest (no training) |
> | Mar 7-8 | Skiing trip | Cross-training |
>
> **Type options:**
> - **Rest** - No training possible (travel, wedding, etc.)
> - **Cross-training** - Active but not running (skiing, hiking, cycling)

---

## Algorithm Logic

### Workout Priority System

| Priority | Workout Type | Handling |
|----------|--------------|----------|
| 1 (Highest) | Long Run | Move to nearest available weekend day. If full weekend blocked → Friday or Monday. **Never skip.** |
| 2 | Quality (Tempo/Intervals/Hills) | Move to available weekday. Maintain 48hr gap from other quality sessions. |
| 3 | Easy/Medium Runs | Move to available day, or drop if no slots. |
| 4 | Strength Training | Move to available strength day. Respect sequencing rules. |
| 5 (Lowest) | Recovery Runs | Drop entirely if needed. Convert to full rest. |

### Sequencing Rules (Hard Constraints)

- 48+ hours between quality running sessions
- No heavy leg work within 48 hours of speed work
- No strength training the day before long runs
- Strength training should come AFTER runs if on the same day

### Volume Handling

When workouts are dropped due to limited availability:
- **Accept reduced weekly volume** (do NOT redistribute miles)
- Rationale: Cramming extra miles into fewer days increases injury risk

### Cross-Training Days

When a date range is marked as "Cross-training":
- Do not schedule running workouts
- Note the activity in the plan (e.g., "Skiing - cross-training")
- Count toward weekly activity but not running volume
- Can place a strength session before/after if availability allows

---

## Schema Changes

### Enhanced Athlete Availability

Update `athlete` object in `schema/plan-schema.json`:

```json
{
  "athleteAvailability": {
    "type": "object",
    "description": "Detailed availability for scheduling",
    "properties": {
      "runningDays": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        },
        "description": "Days available for running"
      },
      "strengthDays": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        },
        "description": "Days available for strength training"
      },
      "preferredRunTime": {
        "type": "string",
        "enum": ["morning", "afternoon", "evening", "flexible"]
      },
      "preferredStrengthTime": {
        "type": "string",
        "enum": ["morning", "afternoon", "evening", "flexible"]
      },
      "preferredLongRunDay": {
        "type": "string",
        "enum": ["friday", "saturday", "sunday"],
        "description": "Preferred day for long runs"
      }
    }
  }
}
```

### Enhanced Blocked Dates

Update `blockedDates` in `schema/plan-schema.json`:

```json
{
  "blockedDates": {
    "type": "array",
    "items": {
      "type": "object",
      "required": ["startDate", "endDate", "type"],
      "properties": {
        "startDate": {
          "type": "string",
          "format": "date"
        },
        "endDate": {
          "type": "string",
          "format": "date"
        },
        "reason": {
          "type": "string",
          "description": "Why unavailable (for display in PDF)"
        },
        "type": {
          "type": "string",
          "enum": ["rest", "cross-training"],
          "description": "rest = no training; cross-training = active but no running"
        },
        "crossTrainingActivity": {
          "type": "string",
          "description": "Activity name if type is cross-training (e.g., 'Skiing', 'Hiking')"
        }
      }
    }
  }
}
```

### Adjustment Tracking Per Day

Add to `day` definition:

```json
{
  "adjustment": {
    "type": "object",
    "description": "Tracking if this day's workout was modified due to availability",
    "properties": {
      "wasAdjusted": {
        "type": "boolean"
      },
      "originalDay": {
        "type": "string",
        "description": "The day this workout was originally scheduled for"
      },
      "reason": {
        "type": "string",
        "description": "Why the adjustment was made"
      }
    }
  },
  "crossTraining": {
    "type": "object",
    "description": "Cross-training activity if this is a blocked cross-training day",
    "properties": {
      "activity": {
        "type": "string",
        "description": "Name of the activity (e.g., 'Skiing')"
      },
      "notes": {
        "type": "string",
        "description": "Additional context"
      }
    }
  }
}
```

---

## PDF Display Changes

### Training Overview Page

Add a section: **"Schedule Adjustments"**
- List recurring blocked days (e.g., "Sundays are blocked for running")
- List blocked date ranges with reasons
- Brief explanation of how the plan accommodates these

### Weekly Detail Pages

When a workout was moved or adjusted:
- Small note under the workout: *"Moved from Sunday due to availability"*
- For cross-training days: Show the activity with a distinct visual treatment

### Visual Indicators

| Indicator | Meaning |
|-----------|---------|
| Small note text | Workout was rescheduled |
| Activity label | Cross-training day (skiing, hiking, etc.) |
| — (dash) | Intentionally no workout (blocked day) |

---

## Implementation Phases

### Phase 1: Intake Updates
- Update `intake/questions.md` with new question format
- Update Google Form to match (checkbox format)

### Phase 2: Schema Updates
- Add `athleteAvailability` object to `plan-schema.json`
- Enhance `blockedDates` with type field
- Add adjustment tracking fields to day structure

### Phase 3: Plan Generation Logic
- Document the scheduling algorithm for Claude to follow when generating plans
- Add examples showing conflict resolution in various scenarios

### Phase 4: PDF Updates
- Update `pdf/components/overview.py` - add availability summary section
- Update `pdf/components/week_detail.py` - show adjustment notes and cross-training days

---

## Example Scenario

**Input:**
- Available to run: Mon, Wed, Fri, Sat
- Available to lift: Tue, Thu, Sat
- Blocked: Feb 7-8 (skiing, cross-training)

**Week 6 (standard schedule):**

| Day | Workout |
|-----|---------|
| Mon | Easy 5mi |
| Tue | Tempo 6mi |
| Wed | Easy 4mi |
| Thu | Rest |
| Fri | Easy 5mi |
| Sat | Rest |
| Sun | Long 14mi |

**Week 6 (adjusted for availability):**

| Day | Workout | Note |
|-----|---------|------|
| Mon | Easy 5mi | |
| Tue | Strength (Upper) | |
| Wed | Tempo 6mi | *Moved from Tue - running not available* |
| Thu | Strength (Lower) | |
| Fri | Easy 5mi | |
| Sat | Long 14mi | *Moved from Sun - recurring block* |
| Sun | Rest | *Blocked day* |

---

## Edge Cases

### Minimum Running Days Warning

If athlete selects fewer than 3 running days:
- Generate plan anyway but include warning note in overview
- Suggest reviewing availability if possible

### Long Run Conflicts

If both Saturday and Sunday are blocked:
- Move long run to Friday (if available)
- If Friday unavailable, use Monday
- Add note explaining the unusual placement

### Recovery Week Flexibility

During recovery weeks (4, 7, 10):
- More flexibility since volume is already reduced
- Easier to accommodate limited availability

### Race Week

Final week before race:
- Minimal adjustments needed (mostly rest/easy days)
- Ensure race day itself is never blocked

---

## Files to Modify

| File | Changes |
|------|---------|
| `intake/questions.md` | Update questions 2, 8, and 16 with new format |
| `schema/plan-schema.json` | Add `athleteAvailability`, enhance `blockedDates`, add adjustment tracking |
| `plans/example-moderate.json` | Add example availability data |
| `pdf/components/overview.py` | Add availability summary section |
| `pdf/components/week_detail.py` | Show adjustment notes and cross-training |

---

## Success Criteria

- [ ] Intake questions clearly capture running vs strength availability
- [ ] Blocked dates include type (rest vs cross-training)
- [ ] Generated plans respect all availability constraints
- [ ] No manual review needed - algorithm handles all conflicts
- [ ] PDF shows adjustment notes where applicable
- [ ] Cross-training days are visually distinct from rest days
