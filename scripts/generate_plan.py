#!/usr/bin/env python3
"""
Generate a marathon training plan from athlete intake data using Claude API.

Usage:
    python scripts/generate_plan.py intake/athlete-submission.json
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("Error: anthropic package not installed. Run: pip install anthropic")
    sys.exit(1)


def load_intake(intake_path: str) -> dict:
    """Load and validate athlete intake JSON."""
    with open(intake_path, 'r') as f:
        data = json.load(f)

    # Validate required fields
    required = ['availability', 'recentRace', 'heartRate', 'bodyComposition']
    missing = [f for f in required if f not in data or not data[f]]

    if missing:
        print(f"Warning: Missing fields in intake: {missing}")

    return data


def load_prompt_template() -> str:
    """Load the prompt template."""
    template_path = Path(__file__).parent / 'prompt_template.md'
    with open(template_path, 'r') as f:
        return f.read()


def load_schema() -> dict:
    """Load the plan schema for reference."""
    schema_path = Path(__file__).parent.parent / 'schema' / 'plan-schema.json'
    with open(schema_path, 'r') as f:
        return json.load(f)


def load_example_plan() -> dict:
    """Load the example plan for reference."""
    example_path = Path(__file__).parent.parent / 'plans' / 'example-moderate.json'
    with open(example_path, 'r') as f:
        return json.load(f)


def load_guides() -> str:
    """Load relevant training guides for context."""
    guides_dir = Path(__file__).parent.parent / 'guides'
    guides_content = []

    guide_files = [
        'availability-scheduling.md',
        'periodization.md',
        'pace-zones.md',
    ]

    for guide_file in guide_files:
        guide_path = guides_dir / guide_file
        if guide_path.exists():
            with open(guide_path, 'r') as f:
                guides_content.append(f"## {guide_file}\n\n{f.read()}")

    return "\n\n---\n\n".join(guides_content)


def format_blocked_dates(blocked_dates: list, date_type: str) -> str:
    """Format blocked dates by type."""
    if not blocked_dates:
        return "None"

    filtered = [d for d in blocked_dates if d.get('type', '').lower() == date_type]
    if not filtered:
        return "None"

    return ", ".join([
        f"{d.get('startDate', '')} to {d.get('endDate', '')} ({d.get('reason', 'N/A')})"
        for d in filtered
    ])


def build_prompt(intake: dict, template: str) -> str:
    """Build the full prompt with athlete data."""
    today = datetime.now().strftime("%Y-%m-%d")

    # Extract availability data
    availability = intake.get('availability', {})
    running_days = availability.get('runningDays', ['monday', 'tuesday', 'wednesday', 'friday', 'saturday', 'sunday'])
    strength_days = availability.get('strengthDays', ['tuesday', 'thursday', 'saturday'])
    long_run_day = availability.get('preferredLongRunDay', 'sunday')
    blocked_dates = intake.get('blockedDates', [])

    # Format the prompt
    prompt = template.format(
        athlete_data=json.dumps(intake, indent=2),
        today_date=today,
        running_days=", ".join(running_days),
        strength_days=", ".join(strength_days),
        long_run_day=long_run_day,
        blocked_dates_rest=format_blocked_dates(blocked_dates, 'rest'),
        blocked_dates_cross=format_blocked_dates(blocked_dates, 'cross-training'),
    )

    return prompt


def generate_plan_with_claude(prompt: str, guides: str, example: dict) -> dict:
    """Call Claude API to generate the training plan."""
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY environment variable not set")

    client = anthropic.Anthropic(api_key=api_key)

    # Build system message with guides and example
    system_message = f"""You are an expert marathon coach creating personalized training plans.

## Training Guides

{guides}

## Example Plan Structure (for reference)

```json
{json.dumps(example, indent=2)[:10000]}...
```

Follow the exact JSON structure from the example. Output ONLY valid JSON."""

    print("Calling Claude API...")

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=16000,
        system=system_message,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    # Extract JSON from response
    response_text = response.content[0].text

    # Try to parse JSON (handle potential markdown code blocks)
    if "```json" in response_text:
        json_start = response_text.find("```json") + 7
        json_end = response_text.find("```", json_start)
        response_text = response_text[json_start:json_end].strip()
    elif "```" in response_text:
        json_start = response_text.find("```") + 3
        json_end = response_text.find("```", json_start)
        response_text = response_text[json_start:json_end].strip()

    try:
        plan = json.loads(response_text)
        return plan
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON response: {e}")
        print(f"Response text (first 1000 chars): {response_text[:1000]}")
        raise


def validate_plan(plan: dict) -> bool:
    """Basic validation of the generated plan."""
    required_keys = ['metadata', 'athlete', 'paceZones', 'hrZones', 'weeks']

    for key in required_keys:
        if key not in plan:
            print(f"Validation error: Missing required key '{key}'")
            return False

    weeks = plan.get('weeks', [])
    if len(weeks) < 10:
        print(f"Validation error: Only {len(weeks)} weeks generated, expected at least 10")
        return False

    # Check that each week has days
    for i, week in enumerate(weeks):
        if 'days' not in week:
            print(f"Validation error: Week {i+1} missing 'days' object")
            return False

    print(f"Validation passed: {len(weeks)} weeks generated")
    return True


def save_plan(plan: dict, intake: dict, intake_path: str) -> str:
    """Save the generated plan to the plans directory."""
    plans_dir = Path(__file__).parent.parent / 'plans'
    plans_dir.mkdir(exist_ok=True)

    # Generate filename
    email = intake.get('email', 'athlete')
    email_prefix = email.split('@')[0].replace('.', '-').replace('_', '-') if '@' in email else 'athlete'
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    goal = intake.get('goal', 'moderate').lower().replace(' ', '-')

    filename = f"{email_prefix}-{goal}-generated-{timestamp}.json"
    output_path = plans_dir / filename

    with open(output_path, 'w') as f:
        json.dump(plan, indent=2, fp=f)

    print(f"Plan saved to: {output_path}")
    return str(output_path)


def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_plan.py <intake_json_path>")
        sys.exit(1)

    intake_path = sys.argv[1]

    if not os.path.exists(intake_path):
        print(f"Error: Intake file not found: {intake_path}")
        sys.exit(1)

    print(f"Loading intake from: {intake_path}")
    intake = load_intake(intake_path)

    print("Loading prompt template...")
    template = load_prompt_template()

    print("Loading training guides...")
    guides = load_guides()

    print("Loading example plan...")
    example = load_example_plan()

    print("Building prompt...")
    prompt = build_prompt(intake, template)

    print("Generating plan with Claude...")
    plan = generate_plan_with_claude(prompt, guides, example)

    print("Validating plan...")
    if not validate_plan(plan):
        print("Plan validation failed, but saving anyway for review")

    print("Saving plan...")
    output_path = save_plan(plan, intake, intake_path)

    print(f"\nSuccess! Plan generated: {output_path}")
    return output_path


if __name__ == "__main__":
    main()
