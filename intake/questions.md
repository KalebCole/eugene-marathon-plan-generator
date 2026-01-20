# Athlete Intake Questions

Send these questions via text message to gather the information needed for comprehensive plan generation (running + lifting + nutrition).

---

## Text Message Template

```
Hey! I'm building a comprehensive training plan system for your
Eugene Marathon. Need some info to generate personalized options:

RUNNING
1. What was your recent half marathon time? (or any recent race)
2. Which days are you available to RUN? (Select all that apply)
   - [ ] Monday
   - [ ] Tuesday
   - [ ] Wednesday
   - [ ] Thursday
   - [ ] Friday
   - [ ] Saturday
   - [ ] Sunday
   Preferred time: Morning / Afternoon / Evening / Flexible
3. Which day do you prefer for your LONG RUN?
   - Friday / Saturday / Sunday
4. How many hours/week total for training (running + lifting)?

HEART RATE (from Garmin)
5. What's your max HR? (Check Garmin Connect > Performance Stats)
6. Do you have a lactate threshold HR? (If tested)
7. Resting HR?

STRENGTH TRAINING
8. How many days/week do you want to lift?
9. Which days are you available to STRENGTH TRAIN? (Select all that apply)
   - [ ] Monday
   - [ ] Tuesday
   - [ ] Wednesday
   - [ ] Thursday
   - [ ] Friday
   - [ ] Saturday
   - [ ] Sunday
   Preferred time: Morning / Afternoon / Evening / Flexible
10. Any exercises you want to include or avoid?

BODY & NUTRITION
11. Height and weight?
12. Age?
13. Gender (for calorie calculation)?
14. Activity level outside training? (desk job, on your feet, etc.)
15. Any dietary restrictions or preferences?

SCHEDULE
16. Any dates you'll be unavailable? Please include:
    - Date range (e.g., Feb 15-22)
    - Reason (e.g., work travel, skiing trip, wedding)
    - Type: REST (no training possible) or CROSS-TRAINING (active but not running)

    Example:
    | Dates | Reason | Type |
    |-------|--------|------|
    | Feb 15-22 | Work travel | REST |
    | Mar 7-8 | Skiing trip | CROSS-TRAINING |

17. What's your goal for Eugene?
    - Just finish comfortably
    - Target a specific time
    - Push for best possible performance
```

---

## Example Responses

**Good response:**
> RUNNING
> 1. 1:52:30 half marathon last October
> 2. Available to run: Mon, Wed, Fri, Sat, Sun. Preferred time: Morning
> 3. Long run day: Sunday
> 4. About 8-10 hours total
>
> HEART RATE
> 5. Max HR is 185 according to Garmin
> 6. LTHR is 168 from a threshold test
> 7. Resting is around 52
>
> STRENGTH
> 8. 2-3 days lifting
> 9. Available to lift: Tue, Thu, Sat. Preferred time: Evening
> 10. No heavy squats the day before a long run
>
> BODY & NUTRITION
> 11. 5'10", 165 lbs
> 12. 32
> 13. Male
> 14. Desk job, mostly sedentary outside training
> 15. No restrictions, try to eat clean
>
> SCHEDULE
> 16. Blocked dates:
>     - Feb 15-22 | Work travel | REST
>     - Mar 7-8 | Skiing trip | CROSS-TRAINING
> 17. Target sub-4:00 if realistic

**Minimal response (still workable):**
> 1. Did a half in about 2 hours
> 2. Available to run: Mon, Tue, Wed, Thu, Fri, Sat. Mornings preferred
> 3. Long run: Saturday
> 4. 6-7 hours total
> 5. Max HR around 180 I think
> 6. Don't know LTHR
> 7. Resting ~55
> 8. 2 days lifting
> 9. Available to lift: Tue, Thu. Evenings
> 10. Nothing specific
> 11. 5'9", 170 lbs
> 12. 35
> 13. Male
> 14. Office job
> 15. None
> 16. No blocked dates yet
> 17. Just want to finish

---

## How Responses Map to Plan Generation

### Running & Performance
| Question | What It Determines |
|----------|-------------------|
| Race time | Pace zones, finish time predictions |
| Running availability days | Which days can have running workouts scheduled |
| Preferred run time | Morning/evening workout recommendations |
| Long run day preference | Which weekend day gets the long run |
| Weekly hours | Plan intensity level, total volume |
| Goal | How aggressive the predictions/plan |

### Heart Rate
| Question | What It Determines |
|----------|-------------------|
| Max HR | HR zone ceilings (Zone 5 = 90-100% Max) |
| LTHR | More accurate zones if available |
| Resting HR | Heart rate reserve calculations |

### Strength Training
| Question | What It Determines |
|----------|-------------------|
| Days/week | Lifting frequency in plan |
| Strength availability days | Which days can have lifting scheduled |
| Preferred strength time | When to schedule strength relative to runs |
| Preferences | Sequencing rules (e.g., no legs before long run) |

### Nutrition (TDEE Calculation)
| Question | What It Determines |
|----------|-------------------|
| Height/Weight | BMR calculation |
| Age | BMR adjustment |
| Sex | BMR formula selection |
| Activity level | Base TDEE multiplier |
| Restrictions | Food recommendations |

### Schedule & Availability
| Question | What It Determines |
|----------|-------------------|
| Blocked dates (REST) | Days with no training - workouts shifted to other days |
| Blocked dates (CROSS-TRAINING) | Days marked as active but no running scheduled |
| Goal | Plan aggressiveness, finish time targets |

### Availability Algorithm
When scheduling conflicts occur:
1. **Long runs** (highest priority) - moved to nearest available weekend day
2. **Quality sessions** (tempo, intervals) - moved to available weekday, maintaining 48hr spacing
3. **Easy runs** - moved or dropped if no slots available
4. **Strength training** - moved to available strength days, respecting sequencing rules
5. **Recovery runs** (lowest priority) - dropped if needed

Volume is NOT redistributed when workouts are dropped (to prevent injury from cramming miles).

---

## Garmin Connect HR Data Location

To find HR data in Garmin Connect:
1. Open Garmin Connect app or website
2. Go to **Performance Stats** or **Health Stats**
3. Look for:
   - **Max HR**: Often auto-detected from hard efforts
   - **Lactate Threshold HR**: Under Training Status (if you've done a threshold test)
   - **Resting HR**: Under Health Stats > Heart Rate

If Max HR isn't accurate, a simple field test:
1. Warm up 10-15 minutes
2. Run hard uphill for 2-3 minutes
3. Check the peak HR recorded
