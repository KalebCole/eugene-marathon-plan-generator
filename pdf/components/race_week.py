"""
Race Week Special Page - Final countdown and race day info
"""

from reportlab.lib.units import inch
from ..styles import (
    PAGE_WIDTH, PAGE_HEIGHT, MARGIN, COLORS, FONT_SIZES,
    STRIP_RADIUS, draw_twilight_gradient, draw_stars,
    draw_rounded_rect, draw_glow_text, draw_crown
)
import json
import os


def load_quotes():
    """Load motivational quotes"""
    quotes_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'quotes.json')
    try:
        with open(quotes_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"race_day": {}}


def draw_race_week_page(canvas, plan_data, race_week_data):
    """Draw the special race week page"""
    quotes = load_quotes()
    race_day_quotes = quotes.get('race_day', {})

    # Background with extra stars for celebration
    draw_twilight_gradient(canvas, PAGE_WIDTH, PAGE_HEIGHT)
    draw_stars(canvas, PAGE_WIDTH, PAGE_HEIGHT, count=200)

    # Crown at top
    crown_y = PAGE_HEIGHT - 1.2 * inch
    draw_crown(canvas, PAGE_WIDTH / 2, crown_y, size=50)

    # Title with glow
    title_y = crown_y - 0.6 * inch
    draw_glow_text(
        canvas,
        "RACE WEEK",
        PAGE_WIDTH / 2 - 1.3 * inch,
        title_y,
        "Helvetica-Bold",
        FONT_SIZES['page_title'] + 8,
        COLORS['soft_white'],
        COLORS['neon_pink'],
        glow_offset=3
    )

    # Race info
    metadata = plan_data.get('metadata', {})
    race_name = metadata.get('raceName', 'Marathon')
    race_date = metadata.get('raceDate', '')
    target_time = metadata.get('predictedFinishTime', {}).get('target', '')

    info_y = title_y - 0.8 * inch
    canvas.setFillColor(COLORS['cyan_glow'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['section_header'])
    text_width = canvas.stringWidth(race_name, "Helvetica-Bold", FONT_SIZES['section_header'])
    canvas.drawString((PAGE_WIDTH - text_width) / 2, info_y, race_name)

    if race_date:
        from datetime import datetime
        try:
            date_obj = datetime.strptime(race_date, '%Y-%m-%d')
            formatted_date = date_obj.strftime('%A, %B %d, %Y')
        except ValueError:
            formatted_date = race_date

        date_y = info_y - 0.4 * inch
        canvas.setFillColor(COLORS['soft_white'])
        canvas.setFont("Helvetica", FONT_SIZES['body'])
        text_width = canvas.stringWidth(formatted_date, "Helvetica", FONT_SIZES['body'])
        canvas.drawString((PAGE_WIDTH - text_width) / 2, date_y, formatted_date)

    # Pre-race affirmation
    affirmation = race_day_quotes.get('pre_race', "You've done the work. Now go shine.")
    aff_y = date_y - 0.6 * inch if race_date else info_y - 0.6 * inch
    canvas.setFillColor(COLORS['neon_pink'])
    canvas.setFont("Helvetica-Oblique", FONT_SIZES['body'])
    text_width = canvas.stringWidth(f'"{affirmation}"', "Helvetica-Oblique", FONT_SIZES['body'])
    canvas.drawString((PAGE_WIDTH - text_width) / 2, aff_y, f'"{affirmation}"')

    # Race day strategy section
    strategy_y = aff_y - 0.8 * inch
    section_width = PAGE_WIDTH - 2 * MARGIN

    # Section header
    canvas.setFillColor(COLORS['cyan_glow'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['section_header'])
    canvas.drawString(MARGIN, strategy_y, "Race Day Strategy")

    # Strategy box
    box_y = strategy_y - 0.4 * inch
    box_height = 1.8 * inch

    draw_rounded_rect(
        canvas, MARGIN, box_y - box_height,
        section_width, box_height,
        STRIP_RADIUS, COLORS['strip_purple'], alpha=0.85
    )

    # Pacing strategy
    pace_zones = plan_data.get('paceZones', {})
    marathon_pace = pace_zones.get('marathon', {})
    target_pace = f"{marathon_pace.get('min', '9:00')} - {marathon_pace.get('max', '9:15')}/mile"

    content_y = box_y - 0.3 * inch
    canvas.setFillColor(COLORS['soft_white'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['body'])
    canvas.drawString(MARGIN + 15, content_y, "Target Pace:")
    canvas.setFillColor(COLORS['neon_pink'])
    canvas.drawString(MARGIN + 120, content_y, target_pace)

    if target_time:
        content_y -= 0.3 * inch
        canvas.setFillColor(COLORS['soft_white'])
        canvas.setFont("Helvetica-Bold", FONT_SIZES['body'])
        canvas.drawString(MARGIN + 15, content_y, "Goal Time:")
        canvas.setFillColor(COLORS['cyan_glow'])
        canvas.drawString(MARGIN + 120, content_y, target_time)

    # Pacing tips
    tips = [
        "Start conservative - first 5K at easy pace",
        "Settle into marathon pace by mile 6",
        "Stay steady through halfway",
        "Fuel every 45 minutes",
    ]

    content_y -= 0.4 * inch
    canvas.setFillColor(COLORS['soft_white'])
    canvas.setFont("Helvetica", FONT_SIZES['body_small'])
    for tip in tips:
        canvas.drawString(MARGIN + 15, content_y, f"• {tip}")
        content_y -= 0.25 * inch

    # Pre-race checklist
    checklist_y = box_y - box_height - 0.6 * inch
    canvas.setFillColor(COLORS['cyan_glow'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['section_header'])
    canvas.drawString(MARGIN, checklist_y, "Pre-Race Checklist")

    checklist_items = [
        ("Race day -2", "Lay out all race gear, check weather forecast"),
        ("Race day -1", "Carb-load dinner, hydrate well, sleep early"),
        ("Race morning", "Wake 3hrs before start, light breakfast, arrive early"),
        ("Start line", "Dynamic stretches, stay warm, trust your training"),
    ]

    item_y = checklist_y - 0.5 * inch
    for label, description in checklist_items:
        # Draw small strip
        strip_height = 0.35 * inch
        draw_rounded_rect(
            canvas, MARGIN, item_y - strip_height,
            section_width, strip_height,
            6, COLORS['strip_purple'], alpha=0.7
        )

        # Checkbox placeholder
        canvas.setStrokeColor(COLORS['soft_white'])
        canvas.rect(MARGIN + 10, item_y - strip_height + 8, 12, 12, fill=0, stroke=1)

        # Label
        canvas.setFillColor(COLORS['neon_pink'])
        canvas.setFont("Helvetica-Bold", FONT_SIZES['caption'])
        canvas.drawString(MARGIN + 30, item_y - strip_height + 10, label)

        # Description
        canvas.setFillColor(COLORS['soft_white'])
        canvas.setFont("Helvetica", FONT_SIZES['caption'])
        canvas.drawString(MARGIN + 110, item_y - strip_height + 10, description)

        item_y -= strip_height + 5

    # Final affirmation at bottom
    final_quote = race_day_quotes.get('start_line', "Reign or shine, you've got this.")
    footer_y = MARGIN + 0.5 * inch
    canvas.setFillColor(COLORS['neon_pink'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['body'])
    text_width = canvas.stringWidth(final_quote, "Helvetica-Bold", FONT_SIZES['body'])
    canvas.drawString((PAGE_WIDTH - text_width) / 2, footer_y, final_quote)

    canvas.showPage()
