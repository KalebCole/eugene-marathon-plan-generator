# End-to-End Automation Spec

## Overview

Automate the complete flow from Google Form submission to delivered PDF training plan.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Google Form    │────▶│  Google Sheet   │────▶│  n8n Workflow   │
│  (Athlete fills)│     │  (Responses)    │     │  (Poll & commit)│
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Email to       │◀────│  GitHub Actions │◀────│  GitHub Repo    │
│  Athlete        │     │  (Generate plan)│     │  intake/*.json  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │  Claude API     │
                        │  (Plan JSON)    │
                        └─────────────────┘
```

## Components

### 1. Google Form Updates

Add/update fields to capture:
- Email address (for notification)
- Running availability days (checkboxes)
- Strength training availability days (checkboxes)
- Preferred long run day (dropdown)
- Blocked dates with type (REST vs CROSS-TRAINING)

### 2. n8n Workflow Updates

**File:** `workflows/google-form-to-github.json`

Changes needed:
- Enable the workflow (`"active": true`)
- Enable the GitHub commit node (`"disabled": false`)
- Update transformation code to capture new availability fields
- Add email field to JSON output

### 3. GitHub Actions Workflow (NEW)

**File:** `.github/workflows/generate-plan.yml`

Triggers on: Push to `intake/*.json`

Steps:
1. Checkout repository
2. Set up Python environment
3. Run plan generation script with Claude API
4. Generate PDF from plan JSON
5. Commit plan + PDF to repository
6. Send email notification to athlete

### 4. Plan Generation Script (NEW)

**File:** `scripts/generate_plan.py`

Responsibilities:
- Read intake JSON from `intake/` folder
- Build prompt with athlete data + system instructions
- Call Claude API (claude-3-5-sonnet or claude-3-opus)
- Validate response against `schema/plan-schema.json`
- Save validated plan to `plans/` folder
- Return plan filename for PDF generation

### 5. Email Notification (NEW)

**File:** `scripts/send_notification.py`

Use GitHub Actions with:
- SendGrid API, or
- AWS SES, or
- SMTP relay

Email contains:
- Confirmation message
- Link to PDF in repository
- Summary of plan (target time, weekly hours, etc.)

## Data Flow

### Intake JSON Structure (from n8n)

```json
{
  "submittedAt": "2026-01-20T10:30:00Z",
  "email": "athlete@example.com",
  "recentRace": {
    "distance": "half marathon",
    "time": "1:52:30",
    "date": "2025-10-15"
  },
  "availability": {
    "runningDays": ["monday", "tuesday", "wednesday", "friday", "saturday", "sunday"],
    "strengthDays": ["tuesday", "thursday", "saturday"],
    "preferredLongRunDay": "sunday",
    "preferredRunTime": "morning",
    "preferredStrengthTime": "evening"
  },
  "weeklyHoursLimit": 8,
  "heartRate": {
    "maxHR": 185,
    "lthr": 168,
    "restingHR": 52
  },
  "bodyComposition": {
    "height": "5'10\"",
    "weight": 165,
    "age": 32,
    "sex": "male",
    "activityLevel": "sedentary"
  },
  "strengthPreferences": {
    "daysPerWeek": 3,
    "restrictions": "No heavy squats day before long run"
  },
  "dietaryRestrictions": "None",
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
      "type": "cross-training"
    }
  ],
  "goal": "target_time",
  "targetTime": "4:00:00"
}
```

### Generated Plan Filename Convention

```
plans/{email-prefix}-{goal}-{timestamp}.json
```

Example: `plans/athlete-moderate-20260120-103000.json`

### Generated PDF Filename Convention

```
output/{NAME}-eugene-marathon-{target}-plan-{date}.pdf
```

Example: `output/ATHLETE-eugene-marathon-4hr-plan-20260120.pdf`

## Environment Variables / Secrets

GitHub repository secrets needed:

| Secret | Purpose |
|--------|---------|
| `ANTHROPIC_API_KEY` | Claude API access |
| `SENDGRID_API_KEY` | Email notifications (if using SendGrid) |
| `NOTIFICATION_FROM_EMAIL` | Sender email address |

## Error Handling

1. **Invalid intake data**: Log error, notify admin, don't generate plan
2. **Claude API failure**: Retry 3x with backoff, then notify admin
3. **PDF generation failure**: Commit plan JSON anyway, notify admin
4. **Email failure**: Log error, plan/PDF still available in repo

## File Changes Summary

| File | Action |
|------|--------|
| `workflows/google-form-to-github.json` | Update (enable + new fields) |
| `.github/workflows/generate-plan.yml` | Create |
| `scripts/generate_plan.py` | Create |
| `scripts/send_notification.py` | Create |
| `scripts/prompt_template.md` | Create (system prompt for Claude) |
| `requirements.txt` | Update (add anthropic, sendgrid) |

## Testing

1. **Unit test**: `scripts/generate_plan.py` with mock intake JSON
2. **Integration test**: Full workflow with test form submission
3. **Manual test**: Verify email delivery and PDF content

## Security Considerations

- API keys stored as GitHub secrets (not in code)
- Athlete email only used for notification, not exposed in repo
- Intake JSON contains PII - consider `.gitignore` for production
