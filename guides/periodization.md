# Periodization and Recovery Week Guide

This guide explains the 15-week marathon training periodization and the critical role of recovery weeks.

---

## Why Recovery Weeks Matter

Training adaptations don't happen during workouts—they happen during recovery. Without planned recovery weeks:
- Accumulated fatigue masks fitness gains
- Injury risk increases exponentially
- Performance plateaus or declines
- Mental burnout becomes likely

**Elite runners NEVER train through fatigue.** They build recovery into the plan.

---

## 15-Week Periodization Overview

| Weeks | Phase | Focus | Mileage Trend | Strength |
|-------|-------|-------|---------------|----------|
| 1-4 | Base | Aerobic foundation | Building (25→35 mi) | 3x/week |
| 5-10 | Build | Add intensity | Building (35→45 mi) | 2-3x/week |
| 11-13 | Peak | Highest volume | Plateau (45→40 mi) | 2x/week |
| 14-15 | Taper | Rest & sharpen | Dropping (40→20 mi) | 1x/week |
| 16 | Race | Race day | Race only | None |

---

## Recovery Week Schedule

**Recovery weeks reduce volume by 25-30%** while maintaining some intensity.

| Week | Type | Purpose |
|------|------|---------|
| 4 | Recovery | End of base phase adaptation |
| 7 | Recovery | Mid-build consolidation |
| 10 | Recovery | End of build phase adaptation |
| 13 | Recovery (optional) | Pre-taper if needed |
| 14-15 | Taper | Race preparation |

---

## Recovery Week Structure

### What Changes
- **Long run:** Reduce by 2-3 miles (e.g., 14→11 miles)
- **Weekly mileage:** Reduce by 25-30%
- **Strength:** 1 session only (lighter weight)
- **Intensity workouts:** Keep but shorten (e.g., 6x800m→4x800m)

### What Stays the Same
- **Easy run frequency:** Same number of runs
- **Workout types:** Still include tempo/intervals
- **Easy pace:** Same pace (don't go faster to "make up for" less volume)

---

## Example: Normal Week vs Recovery Week

### Week 6 (Normal Build Week)
| Day | Workout | Distance |
|-----|---------|----------|
| Mon | Easy + Lower body | 5 mi |
| Tue | Tempo (4 mi @ tempo) | 7 mi |
| Wed | Easy + Upper body | 5 mi |
| Thu | Rest | - |
| Fri | Easy + Core | 4 mi |
| Sat | Cross-train | - |
| Sun | Long run | 14 mi |
| **Total** | | **35 mi** |

### Week 7 (Recovery Week)
| Day | Workout | Distance |
|-----|---------|----------|
| Mon | Easy | 4 mi |
| Tue | Tempo (3 mi @ tempo) | 6 mi |
| Wed | Easy + Light full body | 4 mi |
| Thu | Rest | - |
| Fri | Easy | 3 mi |
| Sat | Rest or Cross-train | - |
| Sun | Long run | 10-11 mi |
| **Total** | | **27-28 mi** |

**Reduction:** 35 → 28 miles = 20% reduction

---

## Phase-by-Phase Breakdown

### Base Phase (Weeks 1-4)

**Goals:**
- Establish consistent running routine
- Build aerobic foundation
- Develop strength training habits

**Weekly Mileage Progression:**
- Week 1: 25 miles
- Week 2: 28 miles
- Week 3: 32 miles
- Week 4: 24 miles (RECOVERY - 25% cut)

**Long Run Progression:**
- Week 1: 9 miles
- Week 2: 10 miles
- Week 3: 12 miles
- Week 4: 8-9 miles (recovery)

**Key Workouts:**
- Strides (short accelerations)
- Easy tempo introduction (2-3 miles)
- Consistent easy runs

### Build Phase (Weeks 5-10)

**Goals:**
- Add intensity (tempo, intervals)
- Continue aerobic development
- Introduce hill work
- Build toward peak long run

**Weekly Mileage Progression:**
- Week 5: 30 miles
- Week 6: 35 miles
- Week 7: 28 miles (RECOVERY)
- Week 8: 38 miles
- Week 9: 42 miles
- Week 10: 32 miles (RECOVERY)

**Long Run Progression:**
- Week 5: 13 miles
- Week 6: 14 miles
- Week 7: 10-11 miles (recovery)
- Week 8: 16 miles
- Week 9: 18 miles
- Week 10: 12-13 miles (recovery)

**Key Workouts:**
- Tempo runs (4-6 miles @ tempo)
- Intervals (6-8 x 800m, 1000m)
- Hill repeats (6-8 x 60-90 seconds)
- Progression long runs

### Peak Phase (Weeks 11-13)

**Goals:**
- Achieve highest training load
- Race simulation long runs
- Maintain (don't build) strength

**Weekly Mileage Progression:**
- Week 11: 45 miles (peak volume)
- Week 12: 42 miles
- Week 13: 38 miles (slight reduction before taper)

**Long Run Progression:**
- Week 11: 20 miles (peak long run)
- Week 12: 16 miles (with race pace finish)
- Week 13: 12 miles (easy)

**Key Workouts:**
- Race pace long runs (final 6-8 miles @ MP)
- Sharpening intervals (shorter, faster)
- Practice race fueling

### Taper Phase (Weeks 14-15)

**Goals:**
- Full recovery while maintaining fitness
- Mental preparation
- Final tune-up

**Weekly Mileage Progression:**
- Week 14: 25-28 miles (40% of peak)
- Week 15: 15-18 miles (race week)

**Long Run Progression:**
- Week 14: 10-12 miles (easy)
- Week 15: 4-6 miles (3 days before race)

**Key Workouts:**
- Short tempo (2-3 miles)
- Strides to keep legs sharp
- Race pace miles (short)

---

## Signs You Need Extra Recovery

**Physical Signs:**
- Legs feel heavy on easy runs
- Pace is slower at same effort
- Elevated resting heart rate (5+ bpm above normal)
- Persistent muscle soreness
- Trouble sleeping

**Mental Signs:**
- Dreading workouts
- Low motivation
- Irritability
- Difficulty concentrating

**What to Do:**
1. Take an extra easy day
2. Convert a hard workout to easy
3. Shorten the long run
4. Add an extra rest day

**DO NOT:**
- Try to "make up" missed miles
- Push through fatigue
- Skip recovery weeks to build more

---

## Recovery Week JSON Example

```json
{
  "weekNumber": 7,
  "weeksUntilRace": 9,
  "isRecoveryWeek": true,
  "phase": "build",
  "focus": "Recovery week - absorb previous training, prepare for second build block",
  "totalMileage": 28,
  "totalHours": 4,
  "strengthDays": 1,
  "days": {
    "monday": {
      "date": "2026-02-24",
      "running": {
        "type": "easy",
        "title": "Easy Run",
        "totalDistance": 4,
        "hrZone": "Zone 2",
        "description": "Recovery week - keep effort very easy"
      }
    },
    "tuesday": {
      "date": "2026-02-25",
      "running": {
        "type": "tempo",
        "title": "Short Tempo",
        "totalDistance": 6,
        "description": "Reduced tempo - 3 miles instead of usual 4-5"
      }
    }
  }
}
```

---

## Quick Reference: When to Reduce

| Scenario | Action |
|----------|--------|
| Scheduled recovery week | -25-30% volume |
| Legs feel heavy | Extra easy day |
| Missed sleep (< 6 hrs) | Easy day or rest |
| Coming off illness | Start at 50%, build over 1-2 weeks |
| High stress week | Reduce volume 20% |
| Hot weather (> 85°F) | Reduce volume or shift to cooler times |
