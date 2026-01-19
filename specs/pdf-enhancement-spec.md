# PDF Enhancement Spec: Weekly Schedule with Strength & Nutrition

## Overview

Redesign the week detail page to clearly show running schedule, strength training schedule, and weekly nutrition targets in distinct sections.

## Design Decision Summary

| Decision | Choice |
|----------|--------|
| Layout | Option A - Single page with sections |
| Nutrition detail | Full: Calories + macro breakdown |
| Rest days | Shown in running section |
| Strength display | Only days with scheduled strength |

---

## New Week Detail Page Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Week 1                         BASE                    15 weeks to go    │
│                    "Stay consistent, stay patient."                      │
├──────────────────────────────────────────────────────────────────────────┤
│ WEEKLY SUMMARY                                                           │
│ ┌─────────────┬─────────────┬─────────────┬────────────────────────────┐ │
│ │ 25 miles    │ ~4.5 hours  │ 3 strength  │ ~2,800 cal/day            │ │
│ └─────────────┴─────────────┴─────────────┴────────────────────────────┘ │
│                                                                          │
│ Running:  ● ● ● ○ ● ● ●      Strength:  ● ○ ● ○ ● ○ ○                   │
│           M T W T F S S                  M T W T F S S                   │
├──────────────────────────────────────────────────────────────────────────┤
│ RUNNING SCHEDULE                                                         │
├──────────────────────────────────────────────────────────────────────────┤
│ ┃ Mon 01/13 │ Easy Run          │ 4 mi  │ ~44 min │ Zone 2             │ │
│ ┃ Tue 01/14 │ Strides           │ 5 mi  │ ~55 min │ Zone 2-4           │ │
│ ┃ Wed 01/15 │ Easy Run          │ 4 mi  │ ~44 min │ Zone 2             │ │
│ ┃ Thu 01/16 │ Rest Day          │   —   │    —    │   —                │ │
│ ┃ Fri 01/17 │ Short Easy        │ 3 mi  │ ~33 min │ Zone 2             │ │
│ ┃ Sat 01/18 │ Cross Training    │   —   │  40 min │   —                │ │
│ ┃ Sun 01/19 │ Long Run          │ 9 mi  │ ~99 min │ Zone 2             │ │
├──────────────────────────────────────────────────────────────────────────┤
│ STRENGTH SCHEDULE                                                        │
├──────────────────────────────────────────────────────────────────────────┤
│ ┃ Mon │ Lower Body │ 40 min │ After run                                │ │
│ ┃ Wed │ Upper Body │ 30 min │ After run                                │ │
│ ┃ Fri │ Core       │ 20 min │ After run                                │ │
├──────────────────────────────────────────────────────────────────────────┤
│ NUTRITION TARGET                                                         │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────┐   │
│ │  Daily Target: ~2,800 calories                                     │   │
│ │  ────────────────────────────────────────────────────────────────  │   │
│ │  Protein: 150g (25%)  │  Carbs: 350g (50%)  │  Fat: 78g (25%)     │   │
│ └────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Data Structure Changes

### 1. Schema Update (`schema/plan-schema.json`)

Add `weeklyNutrition` to the `week` definition:

```json
"weeklyNutrition": {
  "type": "object",
  "description": "Calculated nutrition targets for this specific week",
  "properties": {
    "dailyCalories": {
      "type": "integer",
      "description": "Average daily calorie target including training"
    },
    "trainingCaloriesPerDay": {
      "type": "integer",
      "description": "Additional calories from training averaged per day"
    },
    "macros": {
      "type": "object",
      "properties": {
        "protein": {
          "type": "object",
          "properties": {
            "grams": { "type": "integer" },
            "percentage": { "type": "integer" }
          }
        },
        "carbs": {
          "type": "object",
          "properties": {
            "grams": { "type": "integer" },
            "percentage": { "type": "integer" }
          }
        },
        "fat": {
          "type": "object",
          "properties": {
            "grams": { "type": "integer" },
            "percentage": { "type": "integer" }
          }
        }
      }
    },
    "notes": {
      "type": "string",
      "description": "Week-specific nutrition notes (e.g., 'Recovery week - maintain calories')"
    }
  }
}
```

### 2. Example Plan Update (`plans/example-moderate.json`)

Add `weeklyNutrition` to each week. Calculation formula:

```
Base TDEE:                    2,400 cal (from nutritionTargets.baseTDEE)
Running calories:             totalMileage × 90 cal/mile ÷ 7 days
Strength calories:            strengthDays × 150 cal ÷ 7 days
────────────────────────────────────────────────────────────────
Daily Target:                 Base + Running + Strength (rounded to nearest 50)
```

**Example Week 1 (25 miles, 3 strength sessions):**
```
Base TDEE:         2,400
Running:           25 × 90 = 2,250 ÷ 7 = +321/day
Strength:          3 × 150 = 450 ÷ 7 = +64/day
────────────────────────────────────────────────
Daily Target:      2,785 → round to 2,800 cal/day
```

**Macro calculation (from base percentages):**
```
At 2,800 cal/day:
- Protein (25%): 2,800 × 0.25 ÷ 4 cal/g = 175g
- Carbs (50%):   2,800 × 0.50 ÷ 4 cal/g = 350g
- Fat (25%):     2,800 × 0.25 ÷ 9 cal/g = 78g
```

---

## Implementation Tasks

### Task 1: Update Schema
**File:** `schema/plan-schema.json`

Add `weeklyNutrition` property to the `week` definition (lines 254-292).

### Task 2: Update Example Plan
**File:** `plans/example-moderate.json`

Add `weeklyNutrition` object to all 15 weeks with calculated values.

### Task 3: Update Styles
**File:** `pdf/styles.py`

Add new style constants:

```python
# Section header colors
COLORS['section_running'] = (125, 211, 252)    # cyan_glow
COLORS['section_strength'] = (255, 107, 179)   # neon_pink
COLORS['section_nutrition'] = (167, 139, 250)  # light purple

# Day indicator dots
COLORS['dot_active'] = (255, 255, 255)         # white - has workout
COLORS['dot_inactive'] = (100, 100, 120)       # gray - no workout
```

### Task 4: Rewrite Week Detail Page
**File:** `pdf/components/week_detail.py`

Replace current implementation with new sectioned layout:

#### 4.1 Header Section
- Week number + phase badge + countdown
- Motivational quote (existing)

#### 4.2 Weekly Summary Bar
- Four stats: Miles | Hours | Strength sessions | Calories
- Day indicator dots for running (M T W T F S S)
- Day indicator dots for strength (M T W T F S S)

#### 4.3 Running Schedule Section
- Section header: "RUNNING SCHEDULE"
- 7 rows (Mon-Sun), including rest days
- Columns: Day/Date | Workout Title | Distance | Duration | HR Zone
- Color-coded left bar by workout type (existing logic)

#### 4.4 Strength Schedule Section
- Section header: "STRENGTH SCHEDULE"
- Only rows for days with scheduled strength
- Columns: Day | Type | Duration | Timing
- If no strength this week, show "No strength sessions this week"

#### 4.5 Nutrition Section
- Section header: "NUTRITION TARGET"
- Daily calorie target (prominent)
- Macro breakdown: Protein | Carbs | Fat (grams and %)
- Optional notes field

---

## Visual Specifications

### Spacing
```
Page margins:           0.5 inch
Section gap:            0.25 inch
Row height (running):   0.5 inch (reduced from 0.7 to fit all sections)
Row height (strength):  0.4 inch
Row spacing:            4px
```

### Typography
```
Section headers:        Helvetica-Bold, 14pt, cyan_glow
Day labels:             Helvetica-Bold, 11pt, soft_white
Workout titles:         Helvetica-Bold, 11pt, workout_color
Stats/values:           Helvetica, 10pt, soft_white
Nutrition calories:     Helvetica-Bold, 16pt, soft_white
Macro values:           Helvetica, 11pt, soft_white
```

### Colors (from brand/colors.json)
```
Background:             twilight gradient (existing)
Section backgrounds:    strip_purple with 0.85 alpha
Running row indicator:  workout-specific color (existing)
Strength row indicator: neon_pink
Nutrition box:          deep_purple with 0.9 alpha
```

---

## Page Space Calculation

Available height: ~9.5 inches (letter size minus margins)

| Section | Height |
|---------|--------|
| Header + quote | 1.0 inch |
| Summary bar | 0.7 inch |
| Running header | 0.3 inch |
| Running rows (7 × 0.5) | 3.5 inch |
| Strength header | 0.3 inch |
| Strength rows (max 3 × 0.4) | 1.2 inch |
| Nutrition section | 1.0 inch |
| **Total** | **8.0 inch** ✓ |

Buffer: 1.5 inches for spacing between sections.

---

## Edge Cases

### Recovery Weeks (Reduced Strength)
- May have only 1 strength session
- Strength section shows single row
- Nutrition notes: "Recovery week - maintain calories for adaptation"

### Travel Weeks
- May have modified schedule
- Running titles include context (e.g., "Travel Run")
- Notes preserved in running description

### Taper Weeks (No Strength)
- `strengthDays: 0`
- Strength section shows: "Taper week - no strength training"
- Reduced calorie target reflected

### Race Week
- Final week has race day
- Nutrition notes: "Carb loading days before race"

---

## Testing Checklist

- [ ] All 15 weeks render without overflow
- [ ] Recovery weeks (4, 7, 10) display correctly with reduced strength
- [ ] Taper weeks (14, 15) show no strength message
- [ ] Nutrition calculations match expected values
- [ ] Day indicator dots correctly show active/inactive
- [ ] Rest days appear in running section with "—" values
- [ ] Long workout descriptions truncate gracefully
- [ ] PDF file size reasonable (< 500KB for 20 pages)

---

## Files to Modify

| File | Changes |
|------|---------|
| `schema/plan-schema.json` | Add `weeklyNutrition` to week definition |
| `plans/example-moderate.json` | Add `weeklyNutrition` to all 15 weeks |
| `pdf/styles.py` | Add section colors, dot colors |
| `pdf/components/week_detail.py` | Complete rewrite with new layout |

---

## Rollback Plan

Keep the original `week_detail.py` as `week_detail_v1.py` before making changes, allowing easy rollback if needed.
