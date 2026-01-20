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


def find_generated_plan(intake: dict) -> str | None:
    """Find the most recently generated plan for this athlete."""
    plans_dir = Path(__file__).parent.parent / 'plans'

    email = intake.get('email', '')
    email_prefix = email.split('@')[0].replace('.', '-').replace('_', '-') if '@' in email else None

    if not email_prefix:
        return None

    # Find matching plan files
    matching_plans = list(plans_dir.glob(f"{email_prefix}*-generated-*.json"))

    if not matching_plans:
        return None

    # Return most recent
    return str(max(matching_plans, key=lambda p: p.stat().st_mtime))


def find_generated_pdf(plan_path: str) -> str | None:
    """Find the PDF generated from this plan."""
    if not plan_path:
        return None

    output_dir = Path(__file__).parent.parent / 'output'
    plan_name = Path(plan_path).stem

    pdf_path = output_dir / f"{plan_name}.pdf"
    if pdf_path.exists():
        return str(pdf_path)

    return None


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


def build_email_content(intake: dict, plan_path: str, pdf_path: str) -> tuple[str, str]:
    """Build email subject and body."""
    goal = intake.get('goal', 'your marathon')
    target_time = intake.get('targetTime', '')

    subject = "Your Eugene Marathon Training Plan is Ready!"

    # Build HTML body
    body_parts = [
        "<h1>Your Training Plan is Ready!</h1>",
        "<p>Great news! Your personalized training plan for the Eugene Marathon has been generated.</p>",
    ]

    if target_time:
        body_parts.append(f"<p><strong>Target Time:</strong> {target_time}</p>")

    body_parts.append("<h2>Your Files</h2>")
    body_parts.append("<ul>")

    if pdf_path:
        pdf_url = get_github_url(pdf_path)
        body_parts.append(f'<li><a href="{pdf_url}">Download your PDF Training Plan</a></li>')

    if plan_path:
        plan_url = get_github_url(plan_path)
        body_parts.append(f'<li><a href="{plan_url}">View detailed plan data (JSON)</a></li>')

    body_parts.append("</ul>")

    body_parts.extend([
        "<h2>What's Next?</h2>",
        "<ol>",
        "<li>Review your training plan and pace zones</li>",
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
    plan_path = find_generated_plan(intake)
    print(f"Found plan: {plan_path}")

    pdf_path = find_generated_pdf(plan_path)
    print(f"Found PDF: {pdf_path}")

    if not plan_path and not pdf_path:
        print("Warning: No generated files found, skipping notification")
        sys.exit(0)

    # Build and send email
    subject, html_content = build_email_content(intake, plan_path, pdf_path)

    print(f"Sending notification to: {email}")
    success = send_email(email, subject, html_content)

    if success:
        print("Notification sent successfully!")
    else:
        print("Notification could not be sent (see warnings above)")

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
