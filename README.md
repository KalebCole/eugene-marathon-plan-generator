# Eugene Marathon Training Plan Generator

A comprehensive marathon training system that generates personalized 15-week plans for the Eugene Full Marathon (April 2026), integrating **running, strength training, and nutrition**.

## What This Does

Given an athlete's:
- Current fitness level (recent race time)
- Heart rate data (Max HR, LTHR, Resting HR from Garmin)
- Body composition (height, weight, age for TDEE calculation)
- Schedule constraints (available days/times)
- Strength training preferences
- Dietary considerations

The system generates **3 integrated training plan options** at different commitment levels:

| Plan | Weekly Hours | Peak Long Run | Target Outcome |
|------|--------------|---------------|----------------|
| Conservative | 5-6 hrs | 18 miles | Finish comfortably |
| Moderate | 7-9 hrs | 20 miles | Solid performance |
| Ambitious | 9-12 hrs | 22 miles | Best possible time |

### Each plan includes:

**Running:**
- Week-by-week schedule with detailed workouts
- Structured intervals, tempos, and long runs
- HR zone targets for each workout
- Pace zones calculated from race time

**Strength Training:**
- Integrated lifting schedule
- Phase-appropriate volume (decreasing toward race)
- Sequencing rules (no heavy legs before speed work)
- Running-specific exercise focus

**Nutrition:**
- Daily calorie targets based on TDEE + training load
- Macro distribution (carbs/protein/fat)
- Workout-specific timing (pre/during/post)
- Race day fueling protocol

## Project Structure

```
eugene-marathon-training-plan/
├── README.md                     # This file
├── intake/
│   └── questions.md              # Questions to gather from athlete
├── schema/
│   └── plan-schema.json          # JSON Schema for training plans
├── guides/
│   ├── nutrition-timing.md       # TDEE calculation, meal timing
│   ├── strength-integration.md   # How lifting fits with running
│   └── hr-zones.md               # HR zone explanation
├── plans/
│   ├── conservative.json         # Generated plan option 1
│   ├── moderate.json             # Generated plan option 2
│   └── ambitious.json            # Generated plan option 3
├── generator/
│   └── generate.ts               # Plan generation logic
└── sync/
    └── calendar.ts               # Google Calendar sync (Phase 2)
```

## Usage

### 1. Gather Athlete Info

Send the questions in `intake/questions.md` to the athlete via text message. The expanded intake covers:
- Running background and availability
- Heart rate data from Garmin
- Strength training preferences
- Body composition for nutrition calculations
- Schedule constraints

### 2. Generate Plans

Once you have their answers, use Claude Code to generate plans:

```
Generate training plans for Eugene Marathon with these inputs:

RUNNING
- Half marathon time: 1:52:30
- Available days: M/W/F mornings, weekends flexible
- Weekly hours: 8-10 total

HEART RATE
- Max HR: 185
- LTHR: 168
- Resting: 52

BODY & NUTRITION
- Height/Weight: 5'10", 165 lbs
- Age: 32, Male
- Activity: Desk job

STRENGTH
- Lifting days: 2-3x/week
- Preferences: No heavy legs before long runs

SCHEDULE
- Blocked dates: Feb 15-22, March 8
- Goal: Sub-4:00 marathon
```

### 3. Review Options

Compare the 3 generated plans. Each shows:
- Weekly running volume and key workouts
- Strength training schedule
- Daily calorie targets (adjusted for training load)
- Predicted finish time range

### 4. Sync to Calendar (Phase 2)

Once a plan is chosen, sync to Google Calendar for easy viewing.

## Training Philosophy

### Running
- Progressive long run buildup (peaking 3 weeks before race)
- Recovery weeks every 3-4 weeks
- 2-3 week taper before race day
- 80% easy / 20% hard intensity distribution
- HR-based training to ensure proper recovery

### Strength
- Periodized to support running (not compete with it)
- Volume decreases as running volume peaks
- Focus on single-leg and core work
- No lifting that compromises key running workouts

### Nutrition
- TDEE-based daily targets that adjust with training
- Higher carbs on high-volume days
- Consistent protein for recovery
- Practice race fueling during long runs

## Guides

Detailed explanations in the `guides/` folder:

- **[Nutrition & TDEE](guides/nutrition-timing.md)** - How calories are calculated, meal timing around workouts, race day fueling
- **[Strength Integration](guides/strength-integration.md)** - How lifting fits with running, phase periodization, exercise selection
- **[HR Zones](guides/hr-zones.md)** - Zone calculation methods, finding data in Garmin, zone-to-workout mapping

## Example Daily Output

```json
{
  "date": "2026-02-10",
  "dayOfWeek": "Tuesday",
  "running": {
    "type": "tempo",
    "title": "Tempo Run",
    "totalDistance": 6,
    "hrZone": "Zone 3-4",
    "caloriesBurned": 650
  },
  "strength": {
    "scheduled": true,
    "type": "upper_body",
    "timing": "After run, evening",
    "duration": 30,
    "caloriesBurned": 120
  },
  "nutrition": {
    "dailyTarget": {
      "calories": 2870,
      "protein": "165g",
      "carbs": "395g",
      "fat": "70g"
    },
    "timing": {
      "preWorkout": "Light snack 1-2hrs before",
      "postWorkout": "Protein + carbs within 30min"
    }
  }
}
```
