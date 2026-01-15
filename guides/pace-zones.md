# Pace Zones Calculation Guide

This guide explains how to derive training pace zones from a recent race time.

---

## The Riegel Formula

To predict marathon finish time from a shorter race:

**Marathon Time = Recent Race Time × (26.2 / Race Distance)^1.06**

### Examples

| Recent Race | Time | Predicted Marathon |
|-------------|------|-------------------|
| Half Marathon | 1:52:30 | ~3:55 - 4:00 |
| Half Marathon | 1:45:00 | ~3:40 - 3:45 |
| Half Marathon | 2:00:00 | ~4:10 - 4:15 |
| 10K | 50:00 | ~4:05 - 4:10 |
| 10K | 45:00 | ~3:40 - 3:45 |

**Note:** Marathon predictions from half marathon times are more accurate than from shorter distances.

---

## Deriving Pace Zones

Once you have the predicted marathon time, calculate marathon pace (MP), then derive all other zones:

### Zone Formulas

| Zone | Formula | Description |
|------|---------|-------------|
| **Recovery** | MP + 2:30 to 3:30 | Slowest running, post-hard workout |
| **Easy** | MP + 1:30 to 2:30 | Default training pace, conversational |
| **Marathon** | Goal pace | What you'll run on race day |
| **Tempo** | MP - 0:30 to 0:45 | Comfortably hard, sustainable 20-40 min |
| **5K** | MP - 1:00 to 1:30 | Hard, 15-25 min sustainable |
| **Interval** | MP - 1:30 to 2:00 | Very hard, 2-5 min repeats |

---

## Complete Example: 1:52:30 Half Marathon

### Step 1: Predict Marathon Time

```
1:52:30 = 6750 seconds
Marathon time = 6750 × (26.2 / 13.1)^1.06
             = 6750 × 2.139
             = 14,438 seconds
             = 4:00:38
```

Round to **4:00 marathon** = **9:09/mile pace**

### Step 2: Calculate Pace Zones

| Zone | Calculation | Pace Range |
|------|-------------|------------|
| Recovery | 9:09 + 2:30 to 3:30 | 11:39 - 12:39/mile |
| Easy | 9:09 + 1:30 to 2:30 | 10:39 - 11:39/mile |
| Marathon | Goal pace | 9:00 - 9:15/mile |
| Tempo | 9:09 - 0:30 to 0:45 | 8:24 - 8:39/mile |
| 5K | 9:09 - 1:00 to 1:30 | 7:39 - 8:09/mile |
| Interval | 9:09 - 1:30 to 2:00 | 7:09 - 7:39/mile |

---

## Common Mistakes

### 1. Easy Pace Too Fast

The #1 mistake runners make is running easy runs too fast.

**Wrong thinking:** "If my marathon pace is 9:00, my easy pace should be 9:45"
**Correct thinking:** "Easy pace is MP + 1:30-2:30, so 10:30-11:30"

**How to check:** Can you hold a full conversation while running? If not, slow down.

### 2. Using Generic Calculators

Many online calculators give "easy pace" that's too fast. They often suggest MP + 0:45-1:15, which leads to:
- Accumulated fatigue
- Poor recovery between hard workouts
- Increased injury risk
- Plateau in fitness gains

### 3. Not Adjusting for Conditions

Your pace zones assume ideal conditions. Adjust for:
- **Heat/Humidity:** Add 15-30 sec/mile
- **Hills:** Effort-based, not pace-based
- **Altitude:** Add 10-20 sec/mile above 5000 ft
- **Fatigue:** If legs are heavy, go by effort

---

## Zone Purposes

### Recovery (MP + 2:30-3:30)
- Post-hard workout active recovery
- Shake out runs
- Day after long run

### Easy (MP + 1:30-2:30)
- 80% of training volume should be here
- Builds aerobic base without fatigue
- Allows recovery between hard days

### Marathon (Goal pace)
- Race day pace
- Practice in later long runs (final 4-8 miles)
- Should feel "controlled" not "hard"

### Tempo (MP - 0:30-0:45)
- "Comfortably hard"
- Improves lactate threshold
- 20-40 minute continuous efforts

### 5K (MP - 1:00-1:30)
- "Hard"
- Interval repeats (1000m, 1200m, 1600m)
- Improves VO2max

### Interval (MP - 1:30-2:00)
- "Very hard"
- Short repeats (400m, 600m, 800m)
- Improves speed and running economy

---

## Pace Zone JSON Example

```json
{
  "paceZones": {
    "easy": {
      "min": "10:30",
      "max": "11:30",
      "description": "Conversational pace, should feel comfortable. MP + 1:30-2:30."
    },
    "marathon": {
      "min": "9:00",
      "max": "9:15",
      "description": "Goal race pace (~4:00 marathon)"
    },
    "tempo": {
      "min": "8:20",
      "max": "8:35",
      "description": "Comfortably hard, can speak in short sentences"
    },
    "fiveK": {
      "min": "7:45",
      "max": "8:00",
      "description": "Hard effort, limited speaking"
    },
    "interval": {
      "min": "7:15",
      "max": "7:45",
      "description": "Near max effort for short bursts"
    },
    "recovery": {
      "min": "11:30",
      "max": "12:30",
      "description": "Very easy, active recovery"
    }
  }
}
```

---

## Quick Reference Tables

### From Half Marathon Time

| HM Time | Marathon | Easy | Tempo | 5K | Interval |
|---------|----------|------|-------|-------|----------|
| 1:40:00 | 8:00/mi | 9:30-10:30 | 7:15-7:30 | 6:30-7:00 | 6:00-6:30 |
| 1:45:00 | 8:30/mi | 10:00-11:00 | 7:45-8:00 | 7:00-7:30 | 6:30-7:00 |
| 1:50:00 | 8:45/mi | 10:15-11:15 | 8:00-8:15 | 7:15-7:45 | 6:45-7:15 |
| 1:55:00 | 9:00/mi | 10:30-11:30 | 8:15-8:30 | 7:30-8:00 | 7:00-7:30 |
| 2:00:00 | 9:15/mi | 10:45-11:45 | 8:30-8:45 | 7:45-8:15 | 7:15-7:45 |
| 2:05:00 | 9:30/mi | 11:00-12:00 | 8:45-9:00 | 8:00-8:30 | 7:30-8:00 |
| 2:10:00 | 10:00/mi | 11:30-12:30 | 9:15-9:30 | 8:30-9:00 | 8:00-8:30 |
| 2:15:00 | 10:15/mi | 11:45-12:45 | 9:30-9:45 | 8:45-9:15 | 8:15-8:45 |

### From 10K Time

| 10K Time | Marathon | Easy | Tempo |
|----------|----------|------|-------|
| 45:00 | 8:30/mi | 10:00-11:00 | 7:45-8:00 |
| 50:00 | 9:30/mi | 11:00-12:00 | 8:45-9:00 |
| 55:00 | 10:30/mi | 12:00-13:00 | 9:45-10:00 |
| 60:00 | 11:30/mi | 13:00-14:00 | 10:45-11:00 |
