# Eugene Marathon Training Plan System

## TL;DR
Build a comprehensive marathon training system that generates an **integrated weekly plan** combining:
1. **Running workouts** with HR zones (from Garmin data) and detailed structure
2. **Strength training** schedule (timing integration for experienced lifter)
3. **Nutrition timing** (pre/during/after workouts, race fueling protocol)
4. 3 plan options (Conservative/Moderate/Ambitious) with finish time predictions
5. **PDF export** of the training plan for easy sharing/printing
6. (Later) Google Calendar sync

---

## Current Status

**Data Collection:** IN PROGRESS - Questions sent to friend, awaiting responses
**Next Focus:** Build the generator and PDF export while waiting for intake data

---

## Implementation Plan (What to Build Now)

### Phase 1: Generator Infrastructure (Build Now)
1. **Create TypeScript generator** (`generator/generate.ts`)
   - Input: Athlete profile JSON (from intake answers)
   - Output: 3 plan JSON files (conservative, moderate, ambitious)
   - Uses formulas from guides for pace zones, HR zones, TDEE

2. **PDF Generation** using installed PDF skill
   - Location: `C:\Users\kaleb\.claude\skills\pdf\`
   - Use `reportlab` to create professional training plan PDFs
   - Generate one PDF per plan option showing:
     - Cover page with athlete info and predicted finish time
     - Week-by-week schedule (running + lifting + nutrition)
     - Quick reference cards (pace zones, HR zones, fueling guide)

3. **Test with sample data** before real intake arrives

### Phase 2: Personalization (After Data Arrives)
4. Parse friend's intake responses into athlete profile JSON
5. Generate 3 personalized plans
6. Export to PDF for review
7. Iterate based on feedback

### Phase 3: Calendar Sync (Later)
8. Google Calendar integration

---

## PDF Generation Strategy

### Using the PDF Skill
The PDF skill is installed at `C:\Users\kaleb\.claude\skills\pdf\` with:
- `SKILL.md` - Main guide (reportlab for PDF creation)
- `forms.md` - Form filling (not needed here)
- `reference.md` - Advanced features

### PDF Structure for Training Plan
```
training-plan-moderate.pdf
├── Page 1: Cover
│   ├── "Eugene Marathon Training Plan"
│   ├── Athlete name, goal, predicted finish time
│   └── Plan summary (weekly hours, peak long run)
├── Pages 2-3: Quick Reference
│   ├── Pace zones table
│   ├── HR zones table
│   └── Nutrition timing cheat sheet
├── Pages 4-18: Weekly Schedules (15 weeks)
│   └── Each week shows 7 days with:
│       ├── Running workout (type, distance, pace/HR target)
│       ├── Strength session (if scheduled)
│       └── Daily calorie target
└── Final Page: Race Day Protocol
    ├── Pre-race fueling timeline
    ├── During-race nutrition plan
    └── Pace strategy
```

### Python Code for PDF Generation
```python
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
import json

def generate_training_plan_pdf(plan_json_path: str, output_pdf_path: str):
    # Load plan from JSON
    with open(plan_json_path) as f:
        plan = json.load(f)

    doc = SimpleDocTemplate(output_pdf_path, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    # Cover page
    story.append(Paragraph(f"Eugene Marathon Training Plan", styles['Title']))
    story.append(Paragraph(f"Plan Level: {plan['metadata']['planLevel']}", styles['Heading2']))
    story.append(Paragraph(f"Predicted Finish: {plan['metadata']['predictedFinishTime']}", styles['Normal']))
    story.append(PageBreak())

    # Weekly schedules
    for week in plan['weeks']:
        story.append(Paragraph(f"Week {week['weekNumber']}: {week['phase']}", styles['Heading2']))
        # Build week table...

    doc.build(story)
```

---

## Files to Create/Update

```
eugene-marathon-training-plan/
├── README.md                     # ✓ Done
├── CLAUDE.md                     # ✓ Done
├── intake/
│   └── questions.md              # ✓ Done - questions sent to friend
├── schema/
│   └── plan-schema.json          # ✓ Done - needs PDF output section
├── guides/
│   ├── nutrition-timing.md       # ✓ Done
│   ├── strength-integration.md   # ✓ Done
│   └── hr-zones.md               # ✓ Done
├── generator/
│   ├── generate.ts               # TODO - main generation logic
│   ├── pdf-export.py             # TODO - PDF generation script
│   └── sample-athlete.json       # TODO - test data for development
├── plans/
│   ├── conservative.json         # Generated output
│   ├── moderate.json             # Generated output
│   └── ambitious.json            # Generated output
├── output/
│   ├── conservative.pdf          # PDF export
│   ├── moderate.pdf              # PDF export
│   └── ambitious.pdf             # PDF export
└── sync/
    └── calendar.ts               # Phase 3
```

---

## Immediate Next Steps

1. **Create sample athlete JSON** for testing generator
2. **Build generator logic** (TypeScript or Python)
3. **Build PDF export script** using reportlab
4. **Test end-to-end** with sample data
5. **Wait for friend's intake data**
6. **Generate real plans** once data arrives

---

## Data Collection (Sent to Friend)

Questions sent via text to gather the info we need:

```
Hey! I'm building a comprehensive training plan system for your
Eugene Marathon. Need some info to generate personalized options:

RUNNING
1. What was your recent half marathon time? (or any recent race)
2. What days/times can you run?
   - Weekday availability (e.g., "mornings before 7am")
   - Weekend availability
3. How many hours/week total for training (running + lifting)?

HEART RATE (from Garmin)
4. What's your max HR? (Check Garmin Connect > Performance Stats)
5. Do you have a lactate threshold HR? (If tested)
6. Resting HR?

STRENGTH TRAINING
7. How many days/week do you want to lift?
8. Preferred lifting days/times?
9. Any exercises you want to include or avoid?

BODY & NUTRITION
10. Height and weight?
11. Age?
12. Sex (for calorie calculation)?
13. Activity level outside training? (desk job, on your feet, etc.)
14. Any dietary restrictions or preferences?
15. Do you use any supplements currently?

SCHEDULE
16. Any dates you'll be unavailable? (travel, events)
17. What's your goal for Eugene?
    - Just finish comfortably
    - Target a specific time
    - Push for best possible performance
```

---

## Problem Statement
Creating a personalized marathon training plan is slow, rigid, and hard to adapt to real life. This project explores a system that makes plan creation faster, more flexible, and more human.

## Context
- **Target user:** Single friend
- **Race:** Eugene Full Marathon, late April 2026 (~15 weeks out)
- **Current fitness:** Has completed a half marathon (time TBD)
- **Calendar:** Google Calendar
- **Tracking:** Garmin watch + Strava (has HR data)
- **Lifting experience:** Experienced (knows exercises, just needs schedule integration)
- **Schedule:** Fixed work schedule with variable/unpredictable elements
- **Desired workflow:** Generate plan upfront, edit later via natural language, sync to calendar

## Scope (Expanded)
The system now covers **four pillars**:
1. **Running** - Workouts with HR zones, pace targets, detailed structure
2. **Strength** - Lifting schedule integrated with running (experienced lifter)
3. **Nutrition** - Pre/during/post workout timing, race day fueling
4. **Recovery** - Rest days, sleep, easy weeks

## Priorities
1. **Primary:** Integrated weekly plan generation with all four pillars
2. **Secondary:** Editability and platform sync (calendar, Garmin)

---

## Core Problem: Constraint-Aware Plan Generation

The key challenge is generating training plans that:
- Respect available days/times (e.g., "mornings only on weekdays")
- Stay within maximum weekly hours
- Work around blocked dates (travel, events)
- Show **finish time predictions** for different commitment levels
- Are physiologically sound (proper progression, recovery, taper)

### Inputs Needed

**Running & Fitness**
| Input | Example | How to Gather |
|-------|---------|---------------|
| Recent race time | "1:52 half marathon" | Text |
| Available run days | "M/W/F mornings, weekends flexible" | Text |
| Max weekly hours | "8-10 hours total" | Text |
| Blocked dates | "Feb 15-22 travel" | Text |
| Goal type | "Target sub-4:00" | Text |

**Heart Rate (from Garmin)**
| Input | Example | How to Gather |
|-------|---------|---------------|
| Max HR | "185 bpm" | Garmin Connect |
| Lactate Threshold HR | "168 bpm" | Garmin Connect (if tested) |
| Resting HR | "52 bpm" | Garmin Connect |

**Strength Training**
| Input | Example | How to Gather |
|-------|---------|---------------|
| Lifting days/week | "2-3 days" | Text |
| Preferred days | "Tuesday, Thursday, Saturday" | Text |
| Exercise preferences | "No heavy squats day before long run" | Text |

**Nutrition & Body Composition**
| Input | Example | How to Gather |
|-------|---------|---------------|
| Height | "5'10" / 178 cm" | Text |
| Weight | "165 lbs / 75 kg" | Text |
| Age | "32" | Text |
| Sex | "Male/Female" | Text |
| Activity level (non-training) | "Desk job, light walking" | Text |
| Dietary restrictions | "No dairy" | Text |
| Current supplements | "Creatine, protein powder" | Text |

### Outputs

**Integrated Weekly Plan** showing for each day:
- Running workout (with HR zone targets)
- Lifting session (if scheduled)
- Nutrition timing (pre/during/post workout)
- Notes on sequencing (e.g., "lift after run, not before")

**Per Commitment Level:**
- Weekly time commitment (running + lifting)
- Predicted finish time range
- Training load summary
- Risk/flexibility assessment

---

## Proposed Concepts

### Concept A: Claude Code as Personal Training Coach (Recommended)

**Core idea:** Use Claude Code itself as the interface for generating, viewing, and editing training plans. The plan lives as structured data in this repo, with integrations to push to Google Calendar and Garmin.

**Architecture:**
```
┌─────────────────────────────────────────────────────┐
│  Claude Code (Conversational Interface)             │
│  "Generate a 15-week plan for Eugene Marathon"      │
│  "Move Saturday's long run to Sunday"               │
│  "I'm traveling next week, adjust accordingly"      │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│  Training Plan (JSON/YAML in repo)                  │
│  - Weeks, days, workouts                            │
│  - Metadata (goals, constraints, history)           │
│  - Version controlled via git                       │
└─────────────────┬───────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│ Google Cal    │   │ Garmin/Strava │
│ (via API)     │   │ (export .fit) │
└───────────────┘   └───────────────┘
```

**Key features:**
1. **Plan generation** - Claude generates a structured plan based on conversation about goals, constraints, available time
2. **Scenario comparison** - Generate 2-3 plans at different commitment levels (e.g., "minimal viable", "solid", "competitive") with expected outcomes
3. **Natural language editing** - "I can't run Tuesday, move it to Wednesday" → Claude updates the JSON and re-syncs
4. **Calendar sync** - Push workouts to Google Calendar as events (can use Google Calendar API or n8n workflow)
5. **Garmin sync** - Export structured workouts that can be loaded to Garmin Connect

**Why this approach:**
- Minimal new infrastructure (uses tools you already have)
- Conversational interface is natural for "human" feel
- Git versioning means full history of plan changes
- Can iterate quickly on the plan format

**Potential challenges:**
- Google Calendar API requires OAuth setup
- Garmin Connect API is limited; may need workarounds

---

### Concept B: n8n Workflow Automation Hub

**Core idea:** Use n8n as the automation backbone. Store the training plan in Notion (or Google Sheets), use n8n workflows to sync with calendar, detect conflicts, and send notifications.

**Architecture:**
```
┌─────────────────┐     ┌─────────────────┐
│ Claude API      │────▶│ Notion Database │
│ (plan gen/edit) │     │ (source of truth)│
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────┴────────┐
                        ▼                 ▼
               ┌─────────────┐   ┌─────────────┐
               │ n8n Workflows│   │ n8n Workflows│
               │ → Google Cal │   │ → Notifications│
               └─────────────┘   └─────────────┘
```

**Key features:**
1. **Notion as plan database** - Rich interface for viewing/editing, mobile friendly
2. **Automated calendar sync** - n8n watches Notion, pushes changes to Google Calendar
3. **Conflict detection** - n8n workflow checks calendar for conflicts when syncing
4. **Reminder system** - Automated notifications before workouts

**Why this approach:**
- More "hands-off" once set up
- Notion provides a nice visual interface
- n8n handles the integration complexity
- Could add more automations over time (weather alerts, etc.)

**Potential challenges:**
- More complex initial setup
- Another tool (Notion) in the mix
- Claude API calls have a cost

---

### Concept C: Spreadsheet-Centric with Smart Sync

**Core idea:** Google Sheets as the source of truth (simple, accessible, collaborative), with Claude Code for conversational edits and a simple sync script.

**Architecture:**
```
┌─────────────────────────────────────────────────────┐
│  Claude Code                                        │
│  "Add a recovery week after week 8"                 │
│  → Updates Google Sheet via API                     │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│  Google Sheet (Training Plan)                       │
│  - One row per day                                  │
│  - Columns: Date, Workout, Duration, Notes, Status  │
│  - Conditional formatting for workout types         │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│  Apps Script / n8n                                  │
│  - On edit: sync to Google Calendar                 │
│  - Creates/updates calendar events                  │
└─────────────────────────────────────────────────────┘
```

**Key features:**
1. **Familiar interface** - Everyone knows spreadsheets
2. **Direct editing** - Can edit the sheet directly OR via Claude
3. **Simple sync** - Apps Script is free, runs in Google's cloud
4. **Exportable** - Easy to export to CSV, share, print

**Why this approach:**
- Lowest barrier to entry
- Friend can edit directly if needed
- Google ecosystem = good mobile support
- Easy to add columns (actual pace, how it felt, etc.)

**Potential challenges:**
- Less structured than JSON/YAML
- Spreadsheet can get messy over time
- Limited workout complexity (can't easily represent intervals)

---

## Recommendation

**Focus on the generation problem first.** The core deliverable is a system that takes constraints and produces 2-3 smart, comparable training plans.

### Phased Approach

**Phase 1: Intake & Generation (Primary Goal)**
1. Create an intake mechanism (survey/form or conversational) to gather:
   - Recent race time
   - Available days/times
   - Weekly hour limit
   - Blocked dates
   - Goal orientation
2. Build the plan generator that:
   - Uses race equivalency formulas for finish time predictions
   - Applies training principles (progression, recovery weeks, taper)
   - Respects all constraints
   - Outputs 3 plan options: Conservative, Moderate, Ambitious
3. Output format: Structured JSON that's human-readable and machine-parseable

**Phase 2: Viewing & Editing (Secondary)**
4. Simple viewing: Markdown rendering of the plan
5. Conversational editing via Claude Code
6. Calendar sync (Google Calendar)

**Phase 3: Enhancements (If Valuable)**
7. Garmin workout sync
8. Progress tracking
9. Mid-plan adjustments based on actual training

---

## Plan Generation Logic

### Finish Time Prediction
Using the Riegel formula and race equivalency:
- **Half marathon time → Marathon prediction:** `HM_time × 2.1` (with adjustment for experience)
- **Training effect:** More volume/intensity → closer to predicted time
- **Conservative estimate:** Add 5-10% for first-time marathoners

### Commitment Levels
| Level | Weekly Hours | Long Run Peak | Predicted Time | Notes |
|-------|--------------|---------------|----------------|-------|
| Conservative | 4-5 hrs | 18 miles | HM×2.2 + 10min | Low risk, focuses on finishing |
| Moderate | 6-8 hrs | 20 miles | HM×2.1 | Balanced approach |
| Ambitious | 8-10 hrs | 22 miles | HM×2.0 | Requires consistency |

### Constraint Handling
- **Available days:** Map workout types to available slots (long run → weekend, speed → weekday)
- **Blocked dates:** Shift workouts around blocks, compress if needed, never skip key workouts
- **Hour limits:** Scale workout durations, reduce frequency if needed

---

## Decisions Made

1. **Intake mechanism:** Text message → you ask friend, paste answers into Claude Code
2. **Workout granularity:** Detailed structure (e.g., "8×400m @ 5K pace, 90s recovery")
3. **Nutrition depth:** TDEE-based daily calorie targets + meal timing (pre/during/after workouts, race day protocol)
4. **Lifting approach:** Schedule integration only (experienced lifter knows exercises)
5. **HR zones:** Pull from Garmin data (Max HR and/or LTHR)
6. **Output format:** Integrated weekly plan showing running + lifting + nutrition (with calorie/macro targets) per day

---

## Workout Detail Format

Since we're using detailed workout structure, the schema should support:

```json
{
  "type": "intervals",
  "warmup": { "distance": 1.5, "unit": "miles", "pace": "easy" },
  "main": {
    "repeats": 8,
    "work": { "distance": 400, "unit": "meters", "pace": "5K" },
    "recovery": { "duration": 90, "unit": "seconds", "type": "jog" }
  },
  "cooldown": { "distance": 1, "unit": "miles", "pace": "easy" },
  "totalDistance": 6,
  "estimatedDuration": 55
}
```

**Pace zones** (calculated from half marathon time):
- Easy: HM pace + 1:30-2:00/mile
- Marathon pace: HM pace + 0:30-0:45/mile
- Tempo: HM pace - 0:10/mile
- 5K pace: HM pace - 0:45/mile
- Interval/VO2max: HM pace - 1:00/mile

---

## Heart Rate Zones

Using Garmin data (Max HR and/or LTHR) to define 5 zones:

| Zone | Name | % Max HR | % LTHR | Purpose |
|------|------|----------|--------|---------|
| 1 | Recovery | 50-60% | <80% | Active recovery, warm-up |
| 2 | Easy/Aerobic | 60-70% | 80-90% | Base building, long runs |
| 3 | Tempo | 70-80% | 90-100% | Marathon pace, tempo runs |
| 4 | Threshold | 80-90% | 100-105% | Lactate threshold work |
| 5 | VO2max | 90-100% | >105% | Intervals, speed work |

**Workout-to-Zone Mapping:**
- Easy runs → Zone 2
- Long runs → Zone 2 (with possible Zone 3 finish)
- Tempo runs → Zone 3-4
- Intervals → Zone 4-5
- Recovery runs → Zone 1-2

---

## Strength Training Integration

**Philosophy:** For an experienced lifter, the plan provides **timing and periodization** rather than exercise selection.

**Weekly Integration Pattern:**
| Phase | Lifting Days | Focus | Timing |
|-------|-------------|-------|--------|
| Base (weeks 1-4) | 3x/week | General strength | Any time |
| Build (weeks 5-10) | 2-3x/week | Running-specific | After easy runs |
| Peak (weeks 11-13) | 2x/week | Maintenance | Light days only |
| Taper (weeks 14-15) | 1x/week | Mobility focus | Very light |

**Sequencing Rules:**
- No heavy legs within 48hrs of speed work
- Lift AFTER runs, not before (if same day)
- No lifting day before long run
- Upper body can be more flexible

**Running-Specific Strength Focus:**
- Single-leg work (lunges, step-ups, pistols)
- Hip stability (glute bridges, clamshells)
- Core (planks, dead bugs, Pallof press)
- Calf strength (raises, tibialis work)

---

## Nutrition & TDEE

### TDEE Calculation

The plan calculates personalized daily calorie targets based on:

**Step 1: Basal Metabolic Rate (BMR)** using Mifflin-St Jeor equation:
- Male: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) + 5
- Female: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) - 161

**Step 2: Base TDEE** (BMR × activity multiplier):
| Activity Level | Multiplier | Example |
|----------------|------------|---------|
| Sedentary | 1.2 | Desk job, no exercise |
| Lightly active | 1.375 | Light walking, standing |
| Moderately active | 1.55 | Some daily movement |
| Very active | 1.725 | Active job + training |

**Step 3: Training Day Adjustment** (add exercise calories):
| Workout Type | Additional Calories |
|--------------|---------------------|
| Rest day | +0 |
| Easy run | +80-100 cal/mile |
| Long run | +100-120 cal/mile |
| Tempo/Intervals | +100-110 cal/mile |
| Strength (30min) | +100-150 cal |
| Strength (60min) | +200-300 cal |

### Daily Calorie Targets (Example: 165lb male, 5'10", age 32, desk job)

| Day Type | Base TDEE | Training Burn | Total Target |
|----------|-----------|---------------|--------------|
| Rest day | 2,100 | +0 | 2,100 cal |
| Easy run (5mi) | 2,100 | +450 | 2,550 cal |
| Long run (16mi) | 2,100 | +1,700 | 3,800 cal |
| Tempo (6mi) + Lift | 2,100 | +750 | 2,850 cal |

### Macro Distribution

| Macro | % of Calories | Purpose |
|-------|---------------|---------|
| Carbs | 50-55% | Primary fuel for running |
| Protein | 20-25% | Muscle repair, ~0.7-1g per lb bodyweight |
| Fat | 25-30% | Hormone function, satiety |

**Training Day Adjustments:**
- High-volume days: Increase carbs to 55-60%
- Strength-focused days: Increase protein slightly
- Rest days: Can reduce carbs, maintain protein

### Workout-Specific Timing

| Workout Type | Pre-Workout | During | Post-Workout |
|--------------|-------------|--------|--------------|
| Easy run (<60min) | Optional light snack | Water only | Normal meal within 2hrs |
| Long run (>90min) | 200-300 cal, 2-3hrs before | 30-60g carbs/hr | Recovery shake + meal |
| Tempo/Intervals | 100-200 cal, 1-2hrs before | Water, maybe gels | Protein + carbs within 30min |
| Strength | Light snack 1hr before | Water | Protein within 1hr |
| Rest day | Normal eating | — | — |

### Long Run & Race Fueling

**Long Run Protocol:**
- Start fueling at 45-60 minutes
- Aim for 30-60g carbs per hour
- Options: gels, chews, sports drink, real food
- Practice race fueling during long runs

**Race Day Fueling:**
- 3-4 hours before: 300-500 cal breakfast (low fiber, familiar foods)
- 1 hour before: 100-200 cal (banana, gel)
- During race: 30-60g carbs/hr starting at mile 3-4
- Hydration: 4-8 oz every 15-20 min

### Supplements (common for marathon training)
- Electrolytes (during long runs, hot days)
- Caffeine (race day, some hard workouts)
- Protein powder (convenient post-workout)
- Creatine (optional, may help with strength work)

---

## Reference: Example Day Output (JSON → PDF)

This JSON structure will be rendered into the PDF:

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
    "duration": 30
  },
  "nutrition": {
    "dailyTarget": { "calories": 2870, "protein": "165g", "carbs": "395g", "fat": "70g" }
  }
}
```

---

## Verification

To verify the implementation works:
1. Run generator with sample athlete data
2. Check that 3 JSON plans are created in `plans/`
3. Run PDF export script
4. Open PDFs and verify:
   - Cover page shows correct athlete info
   - All 15 weeks are present
   - Pace/HR zones are calculated correctly
   - Nutrition targets adjust based on workout day
