#!/usr/bin/env python3
"""
Send email notification to athlete when their training plan is ready.

Usage:
    python scripts/send_notification.py intake/athlete-submission.json

Requires environment variables:
    - SENDGRID_API_KEY: SendGrid API key
    - NOTIFICATION_FROM_EMAIL: Sender email address
    - GITHUB_REPOSITORY: Repository name (auto-set by GitHub Actions)
    - GITHUB_SERVER_URL: GitHub server URL (auto-set by GitHub Actions)
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail, Email, To, Content
    SENDGRID_AVAILABLE = True
except ImportError:
    SENDGRID_AVAILABLE = False
    print("Warning: sendgrid package not installed. Email notifications disabled.")


def load_intake(intake_path: str) -> dict:
    """Load athlete intake JSON."""
    with open(intake_path, 'r') as f:
        return json.load(f)


def find_generated_plans(intake: dict) -> list[str]:
    """Find the generated plan files (conservative, moderate, ambitious)."""
    plans_dir = Path(__file__).parent.parent / 'plans'

    # TypeScript generator outputs these fixed filenames
    plan_files = ['conservative.json', 'moderate.json', 'ambitious.json']

    found_plans = []
    for plan_file in plan_files:
        plan_path = plans_dir / plan_file
        if plan_path.exists():
            found_plans.append(str(plan_path))

    return found_plans


def find_generated_pdfs() -> list[str]:
    """Find the generated PDF files."""
    output_dir = Path(__file__).parent.parent / 'output'

    # PDF naming convention: eugene-full-marathon---{level}-plan-{date}.pdf
    # Find the most recent PDFs for each level
    found_pdfs = []
    for level in ['conservative', 'moderate', 'ambitious']:
        matching = list(output_dir.glob(f"*{level}*.pdf"))
        if matching:
            # Get most recent
            most_recent = max(matching, key=lambda p: p.stat().st_mtime)
            found_pdfs.append(str(most_recent))

    return found_pdfs


def get_github_url(file_path: str) -> str:
    """Generate GitHub URL for a file."""
    repo = os.environ.get('GITHUB_REPOSITORY', 'KalebCole/eugene-marathon-plan-generator')
    server = os.environ.get('GITHUB_SERVER_URL', 'https://github.com')
    branch = os.environ.get('GITHUB_REF_NAME', 'main')

    # Convert absolute path to relative
    repo_root = Path(__file__).parent.parent
    try:
        relative_path = Path(file_path).relative_to(repo_root)
    except ValueError:
        relative_path = Path(file_path).name

    return f"{server}/{repo}/blob/{branch}/{relative_path}"


def build_email_content(intake: dict, plan_paths: list[str], pdf_paths: list[str]) -> tuple[str, str]:
    """Build email subject and body."""
    goal = intake.get('goal', 'your marathon')
    target_time = intake.get('targetTime', '')

    subject = "Your Eugene Marathon Training Plans are Ready!"

    # Build HTML body
    body_parts = [
        "<h1>Your Training Plans are Ready!</h1>",
        "<p>Great news! Your personalized training plans for the Eugene Marathon have been generated.</p>",
        "<p>We've created <strong>3 plan options</strong> for you: Conservative, Moderate, and Ambitious.</p>",
    ]

    if target_time:
        body_parts.append(f"<p><strong>Target Time:</strong> {target_time}</p>")

    body_parts.append("<h2>Your PDF Plans</h2>")
    body_parts.append("<ul>")

    for pdf_path in pdf_paths:
        pdf_url = get_github_url(pdf_path)
        pdf_name = Path(pdf_path).stem
        # Extract level from filename
        level = 'Plan'
        for l in ['conservative', 'moderate', 'ambitious']:
            if l in pdf_name.lower():
                level = l.capitalize()
                break
        body_parts.append(f'<li><a href="{pdf_url}">{level} Plan (PDF)</a></li>')

    body_parts.append("</ul>")

    if plan_paths:
        body_parts.append("<h2>Plan Data (JSON)</h2>")
        body_parts.append("<ul>")
        for plan_path in plan_paths:
            plan_url = get_github_url(plan_path)
            plan_name = Path(plan_path).stem.capitalize()
            body_parts.append(f'<li><a href="{plan_url}">{plan_name} (JSON data)</a></li>')
        body_parts.append("</ul>")

    body_parts.extend([
        "<h2>Which Plan Should I Choose?</h2>",
        "<ul>",
        "<li><strong>Conservative:</strong> Lower risk, more recovery - great if injury-prone or new to marathons</li>",
        "<li><strong>Moderate:</strong> Balanced approach - recommended for most runners</li>",
        "<li><strong>Ambitious:</strong> Higher volume/intensity - for experienced runners ready to push</li>",
        "</ul>",
        "<h2>What's Next?</h2>",
        "<ol>",
        "<li>Review all three plans and pick the one that fits your schedule</li>",
        "<li>Mark your calendar with key workouts</li>",
        "<li>Set up your Garmin/watch with your HR zones</li>",
        "<li>Start Week 1 on Monday!</li>",
        "</ol>",
        "<p>Remember: Easy runs should feel <em>easy</em>. If you can't hold a conversation, slow down!</p>",
        "<hr>",
        "<p><em>This plan was automatically generated based on your intake form submission.</em></p>",
        "<p>Questions? Reply to this email or open an issue on GitHub.</p>",
    ])

    html_body = "\n".join(body_parts)

    return subject, html_body


def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send email via SendGrid."""
    if not SENDGRID_AVAILABLE:
        print("SendGrid not available, skipping email")
        return False

    api_key = os.environ.get('SENDGRID_API_KEY')
    from_email = os.environ.get('NOTIFICATION_FROM_EMAIL')

    if not api_key:
        print("Warning: SENDGRID_API_KEY not set, skipping email")
        return False

    if not from_email:
        print("Warning: NOTIFICATION_FROM_EMAIL not set, skipping email")
        return False

    message = Mail(
        from_email=Email(from_email),
        to_emails=To(to_email),
        subject=subject,
        html_content=Content("text/html", html_content)
    )

    try:
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)
        print(f"Email sent to {to_email}, status: {response.status_code}")
        return response.status_code == 202
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


def main():
    if len(sys.argv) < 2:
        print("Usage: python send_notification.py <intake_json_path>")
        sys.exit(1)

    intake_path = sys.argv[1]

    if not os.path.exists(intake_path):
        print(f"Error: Intake file not found: {intake_path}")
        sys.exit(1)

    print(f"Loading intake from: {intake_path}")
    intake = load_intake(intake_path)

    # Get athlete email
    email = intake.get('email', '')
    if not email:
        print("Warning: No email address in intake, cannot send notification")
        sys.exit(0)

    print(f"Athlete email: {email}")

    # Find generated files
    plan_paths = find_generated_plans(intake)
    print(f"Found plans: {plan_paths}")

    pdf_paths = find_generated_pdfs()
    print(f"Found PDFs: {pdf_paths}")

    if not plan_paths and not pdf_paths:
        print("Warning: No generated files found, skipping notification")
        sys.exit(0)

    # Build and send email
    subject, html_content = build_email_content(intake, plan_paths, pdf_paths)

    print(f"Sending notification to: {email}")
    success = send_email(email, subject, html_content)

    if success:
        print("Notification sent successfully!")
    else:
        print("Notification could not be sent (see warnings above)")

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
