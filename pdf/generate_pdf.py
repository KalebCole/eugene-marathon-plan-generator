#!/usr/bin/env python3
"""
Reign or Shine - Marathon Training Plan PDF Generator

Generates a branded PDF training plan from a JSON plan file.
Uses the twilight aesthetic inspired by Seattle's Reign or Shine run club.

Usage:
    python generate_pdf.py <plan.json> [output.pdf]

Example:
    python generate_pdf.py ../plans/example-moderate.json ../output/training-plan.pdf
"""

import argparse
import json
import os
import sys
from datetime import datetime

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pdf.styles import PAGE_WIDTH, PAGE_HEIGHT
from pdf.components import (
    draw_cover_page,
    draw_zones_card,
    draw_overview_pages,
    draw_week_detail_page,
    draw_race_week_page,
)


def load_plan(plan_path: str) -> dict:
    """Load training plan from JSON file"""
    with open(plan_path, 'r') as f:
        return json.load(f)


def generate_pdf(plan_data: dict, output_path: str):
    """Generate the complete training plan PDF"""
    # Create canvas
    c = canvas.Canvas(output_path, pagesize=letter)

    # Set document metadata
    metadata = plan_data.get('metadata', {})
    c.setTitle(metadata.get('planName', 'Training Plan'))
    c.setAuthor('Reign or Shine Training')
    c.setSubject(f"Marathon Training Plan - {metadata.get('raceName', 'Marathon')}")
    c.setCreator('Reign or Shine PDF Generator')

    print(f"Generating PDF: {output_path}")
    print(f"Plan: {metadata.get('planName', 'Unknown')}")
    print(f"Race: {metadata.get('raceName', 'Unknown')} on {metadata.get('raceDate', 'Unknown')}")

    # Page 1: Cover
    print("  - Drawing cover page...")
    draw_cover_page(c, plan_data)

    # Page 2: Zones Reference Card
    print("  - Drawing zones reference card...")
    draw_zones_card(c, plan_data)

    # Pages 3-4: Training Overview
    print("  - Drawing training overview...")
    draw_overview_pages(c, plan_data)

    # Pages 5+: Weekly Detail Pages
    weeks = plan_data.get('weeks', [])
    print(f"  - Drawing {len(weeks)} weekly detail pages...")

    race_week_data = None
    for week in weeks:
        week_num = week.get('weekNumber', 0)
        phase = week.get('phase', '')

        # Save race week for special page
        if phase == 'taper' and week.get('weeksUntilRace', 99) <= 1:
            race_week_data = week

        draw_week_detail_page(c, week, week_num)

    # Final Page: Race Week Special
    if race_week_data:
        print("  - Drawing race week special page...")
        draw_race_week_page(c, plan_data, race_week_data)

    # Save PDF
    c.save()
    print(f"\nPDF generated successfully: {output_path}")
    print(f"Total pages: {len(weeks) + 4}")  # cover + zones + overview(2) + weeks + race


def main():
    parser = argparse.ArgumentParser(
        description='Generate Reign or Shine branded training plan PDF'
    )
    parser.add_argument(
        'plan_file',
        help='Path to the training plan JSON file'
    )
    parser.add_argument(
        'output_file',
        nargs='?',
        help='Output PDF path (default: output/<plan-name>.pdf)'
    )

    args = parser.parse_args()

    # Validate input file
    if not os.path.exists(args.plan_file):
        print(f"Error: Plan file not found: {args.plan_file}")
        sys.exit(1)

    # Load plan
    try:
        plan_data = load_plan(args.plan_file)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in plan file: {e}")
        sys.exit(1)

    # Determine output path
    if args.output_file:
        output_path = args.output_file
    else:
        # Default output path
        output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'output')
        os.makedirs(output_dir, exist_ok=True)

        plan_name = plan_data.get('metadata', {}).get('planName', 'training-plan')
        safe_name = plan_name.lower().replace(' ', '-').replace('/', '-')
        timestamp = datetime.now().strftime('%Y%m%d')
        output_path = os.path.join(output_dir, f"{safe_name}-{timestamp}.pdf")

    # Generate PDF
    try:
        generate_pdf(plan_data, output_path)
    except Exception as e:
        print(f"Error generating PDF: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
