# PRD: Availability Algorithm Fixes

## Problem Statement

The availability feature currently has a **display-only implementation**. The PDF shows:
- Schedule Constraints section (running days, strength days, blocked dates)
- Adjustment notes on individual workouts
- Cross-training day styling

However, the **actual plan data does not respect these constraints**. The example plan was not regenerated using the availability algorithm.

---

## Bugs Identified

### Bug 1: Strength Schedule Ignores `strengthDays` Preference

**Expected:** Strength training should only be scheduled on days listed in `athleteAvailability.strengthDays`

**Current State:**
- `strengthDays`: `["tuesday", "thursday", "saturday"]`
- Week 1 shows strength on: Mon, Wed, Fri
- This directly contradicts the athlete's stated availability

**Impact:** The plan schedules strength training on days the athlete said they're NOT available.

### Bug 2: Work Travel Block (Feb 15-22) Not Reflected

**Expected:** During Feb 15-22 (blocked as "rest"):
- No workouts should be scheduled
- Week should be marked as forced recovery/travel week
- Surrounding weeks should have workouts adjusted if needed

**Current State:**
- Week 5 (Feb 10-16) and Week 6 (Feb 17-23) overlap with travel
- Week 6 shows normal workouts during travel dates
- No adjustment tracking on affected days
- No `isBlockedDay: true` markers

**Impact:** Plan tells athlete to do workouts during dates they explicitly said they're unavailable.

### Bug 3: Running Schedule Ignores `runningDays` Preference

**Expected:** Running workouts should only be scheduled on days listed in `athleteAvailability.runningDays`

**Current State:**
- `runningDays`: `["monday", "tuesday", "wednesday", "friday", "saturday", "sunday"]`
- Thursday is NOT in the list (athlete unavailable)
- Some weeks show Thursday as "Rest Day" (correct by accident)
- But the algorithm isn't explicitly checking availability

**Impact:** Plan may schedule runs on unavailable days in edge cases.

---

## Root Cause

This is a **data-driven project** where Claude generates plans based on athlete intake. The issue is:

1. The `guides/availability-scheduling.md` documents the algorithm
2. The schema supports tracking adjustments
3. The PDF displays adjustments correctly
4. **BUT**: The example plan (`plans/example-moderate.json`) was not regenerated using the algorithm

The example plan predates the availability feature and has hardcoded workout schedules that don't respect the `athleteAvailability` data that was added later.

---

## Required Changes

### Change 1: Regenerate Example Plan

The `plans/example-moderate.json` file must be regenerated from scratch, following:

1. **Respect `runningDays`**: Only schedule running on Mon, Tue, Wed, Fri, Sat, Sun
2. **Respect `strengthDays`**: Only schedule strength on Tue, Thu, Sat
3. **Handle work travel (Feb 15-22)**:
   - Mark all days in range as `isBlockedDay: true`
   - Set running type to "rest" with appropriate title
   - Add notes explaining travel
   - Adjust surrounding workouts if needed (move long run, etc.)
4. **Handle skiing trip (Mar 7-8)**:
   - Already partially done in Week 8
   - Verify cross-training data is correct
5. **Add adjustment tracking** wherever workouts were moved

### Change 2: Update CLAUDE.md Generation Instructions

Add explicit checklist for Claude when generating plans:

```markdown
## Plan Generation Checklist

Before finalizing any plan, verify:

[ ] Running workouts ONLY on days in `runningDays`
[ ] Strength workouts ONLY on days in `strengthDays`
[ ] Long run on `preferredLongRunDay` (or nearest available)
[ ] All blocked date ranges have `isBlockedDay: true`
[ ] Blocked "rest" days have no workouts scheduled
[ ] Blocked "cross-training" days show the activity
[ ] Any moved workouts have `adjustment` tracking
[ ] 48hr rule respected between quality sessions
[ ] No strength day before long run
```

### Change 3: Validate Example Plan Against Schema

Create a validation step to ensure the example plan is consistent:

1. For each week, verify running days match `runningDays`
2. For each week, verify strength days match `strengthDays`
3. For each blocked date, verify the day has appropriate markers
4. For each adjustment, verify the `originalDay` makes sense

---

## Specific Data Fixes Needed

### Week 1 (Jan 13-19)
**Current strength:** Mon, Wed, Fri
**Should be:** Tue, Thu, Sat

| Day | Current | Should Be |
|-----|---------|-----------|
| Mon | Easy + Lower Body | Easy Run only |
| Tue | Tempo | Tempo + Lower Body (after run) |
| Wed | Easy + Upper Body | Easy Run only |
| Thu | Rest | Upper Body only (no running - not in runningDays) |
| Fri | Short Easy + Core | Short Easy Run only |
| Sat | Cross Training | Cross Training + Core |
| Sun | Long Run | Long Run |

### Week 5 (Feb 10-16) - Travel Starts Feb 15
| Day | Date | Current | Should Be |
|-----|------|---------|-----------|
| Mon | Feb 10 | Easy + Lower Body | Easy Run, Strength on Tue |
| Tue | Feb 11 | Hill Repeats | Hill Repeats + Lower Body |
| Wed | Feb 12 | Easy + Upper Body | Easy Run only |
| Thu | Feb 13 | Rest | Upper Body |
| Fri | Feb 14 | Easy | Easy Run |
| Sat | Feb 15 | Rest | **BLOCKED - Travel starts** |
| Sun | Feb 16 | Long Run | **BLOCKED - Travel**, Long run moved to Fri Feb 14 |

### Week 6 (Feb 17-23) - Full Travel Week
**All days Feb 17-22 should be blocked.** Feb 23 (Sun) is available.

| Day | Date | Current | Should Be |
|-----|------|---------|-----------|
| Mon | Feb 17 | Travel Run | **BLOCKED** `isBlockedDay: true` |
| Tue | Feb 18 | Travel Tempo | **BLOCKED** |
| Wed | Feb 19 | Easy + Strength | **BLOCKED** |
| Thu | Feb 20 | Rest | **BLOCKED** |
| Fri | Feb 21 | Easy | **BLOCKED** |
| Sat | Feb 22 | Rest | **BLOCKED - Travel ends** |
| Sun | Feb 23 | Long Run | Long Run (back home, can run) |

Week focus should be: "TRAVEL WEEK - Forced rest, return to training Sunday"

---

## Implementation Steps

1. **Create corrected example plan** - Manually regenerate `example-moderate.json` following all constraints
2. **Update CLAUDE.md** - Add generation checklist
3. **Regenerate PDF** - Verify all constraints display correctly
4. **Add validation notes** - Document how to verify plan consistency

---

## Success Criteria

- [ ] Week 1 strength sessions are on Tue, Thu, Sat (not Mon, Wed, Fri)
- [ ] Week 5 Saturday shows blocked (travel starts)
- [ ] Week 5 Long run moved with adjustment note
- [ ] Week 6 Mon-Sat all show as blocked rest days
- [ ] Week 6 focus mentions "Travel week - forced rest"
- [ ] Week 8 skiing days display correctly (already working)
- [ ] All 15 weeks have strength ONLY on Tue/Thu/Sat
- [ ] No running on Thursdays (not in runningDays)

---

## Out of Scope

- Automated validation tooling (this is a data-driven project)
- Calendar integration
- Dynamic plan regeneration

The fix is to **correctly generate the example plan data** and **document the generation process** so future plans are consistent.
