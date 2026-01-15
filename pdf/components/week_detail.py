"""
Weekly Detail Page - Individual week with daily workouts
"""

from reportlab.lib.units import inch
from ..styles import (
    PAGE_WIDTH, PAGE_HEIGHT, MARGIN, COLORS, FONT_SIZES,
    STRIP_RADIUS, draw_twilight_gradient, draw_stars,
    draw_rounded_rect, get_phase_color, get_workout_color
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
        return {"weekly_quotes": {}}


def draw_week_detail_page(canvas, week_data, week_number):
    """Draw a detailed page for one training week"""
    quotes = load_quotes()

    # Background
    draw_twilight_gradient(canvas, PAGE_WIDTH, PAGE_HEIGHT)
    draw_stars(canvas, PAGE_WIDTH, PAGE_HEIGHT, count=50)

    phase = week_data.get('phase', 'base')
    is_recovery = week_data.get('isRecoveryWeek', False)
    weeks_until = week_data.get('weeksUntilRace', 0)
    focus = week_data.get('focus', '')
    total_mileage = week_data.get('totalMileage', 0)
    total_hours = week_data.get('totalHours', 0)

    # Week header
    title_y = PAGE_HEIGHT - MARGIN - 0.5 * inch
    phase_color = get_phase_color(phase)

    # Week number with phase indicator
    canvas.setFillColor(phase_color)
    canvas.setFont("Helvetica-Bold", FONT_SIZES['page_title'])
    canvas.drawString(MARGIN, title_y, f"Week {week_number}")

    # Phase badge
    badge_x = MARGIN + 120
    phase_text = phase.upper()
    if is_recovery:
        phase_text = "RECOVERY"
        canvas.setFillColor(COLORS['neon_pink'])
    else:
        canvas.setFillColor(phase_color)
    canvas.setFont("Helvetica-Bold", FONT_SIZES['body'])
    canvas.drawString(badge_x, title_y + 5, phase_text)

    # Weeks until race
    countdown_x = PAGE_WIDTH - MARGIN - 100
    canvas.setFillColor(COLORS['soft_white'])
    canvas.setFont("Helvetica", FONT_SIZES['body'])
    canvas.drawString(countdown_x, title_y + 5, f"{weeks_until} weeks to go")

    # Motivational quote
    quote_data = quotes.get('weekly_quotes', {}).get(str(week_number), {})
    quote_text = quote_data.get('quote', '')
    if quote_text:
        quote_y = title_y - 0.4 * inch
        canvas.setFillColor(COLORS['neon_pink'])
        canvas.setFont("Helvetica-Oblique", FONT_SIZES['body'])
        # Center the quote
        text_width = canvas.stringWidth(f'"{quote_text}"', "Helvetica-Oblique", FONT_SIZES['body'])
        canvas.drawString((PAGE_WIDTH - text_width) / 2, quote_y, f'"{quote_text}"')
        start_y = quote_y - 0.5 * inch
    else:
        start_y = title_y - 0.6 * inch

    # Weekly totals bar
    totals_y = start_y
    totals_height = 0.4 * inch

    draw_rounded_rect(
        canvas, MARGIN, totals_y - totals_height,
        PAGE_WIDTH - 2 * MARGIN, totals_height,
        STRIP_RADIUS, COLORS['deep_purple'], alpha=0.9
    )

    canvas.setFillColor(COLORS['soft_white'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['body_small'])
    canvas.drawString(MARGIN + 15, totals_y - totals_height + 12, f"Total: {total_mileage} miles")

    canvas.drawString(MARGIN + 150, totals_y - totals_height + 12, f"~{total_hours} hours")

    strength_days = week_data.get('strengthDays', 0)
    canvas.drawString(MARGIN + 280, totals_y - totals_height + 12, f"Strength: {strength_days}x")

    # Focus
    if focus:
        canvas.setFillColor(COLORS['cyan_glow'])
        canvas.setFont("Helvetica-Oblique", FONT_SIZES['body_small'])
        # Truncate if needed
        max_width = 200
        display_focus = focus
        while canvas.stringWidth(display_focus, "Helvetica-Oblique", FONT_SIZES['body_small']) > max_width and len(display_focus) > 0:
            display_focus = display_focus[:-1]
        if len(display_focus) < len(focus):
            display_focus += "..."
        canvas.drawString(PAGE_WIDTH - MARGIN - max_width - 15, totals_y - totals_height + 12, display_focus)

    # Daily workout strips
    days_order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    day_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    days = week_data.get('days', {})

    strip_y = totals_y - totals_height - 0.3 * inch
    strip_width = PAGE_WIDTH - 2 * MARGIN
    strip_height = 0.7 * inch

    for i, day_key in enumerate(days_order):
        day_data = days.get(day_key, {})
        if not day_data:
            continue

        running = day_data.get('running', {})
        strength = day_data.get('strength', {})
        notes = day_data.get('notes', '')

        workout_type = running.get('type', 'rest')
        workout_color = get_workout_color(workout_type)

        # Draw strip background
        draw_rounded_rect(
            canvas, MARGIN, strip_y - strip_height,
            strip_width, strip_height,
            STRIP_RADIUS, COLORS['strip_purple'], alpha=0.8
        )

        # Workout type color indicator
        bar_width = 6
        draw_rounded_rect(
            canvas, MARGIN + 4, strip_y - strip_height + 8,
            bar_width, strip_height - 16,
            3, workout_color, alpha=1.0
        )

        # Day label
        canvas.setFillColor(COLORS['soft_white'])
        canvas.setFont("Helvetica-Bold", FONT_SIZES['body'])
        canvas.drawString(MARGIN + 18, strip_y - strip_height + strip_height/2 + 8, day_labels[i])

        # Date
        date_str = day_data.get('date', '')
        if date_str:
            from datetime import datetime
            try:
                date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                formatted_date = date_obj.strftime('%m/%d')
            except ValueError:
                formatted_date = ''
            canvas.setFillColor(COLORS['soft_white'])
            canvas.setFont("Helvetica", FONT_SIZES['caption'])
            canvas.drawString(MARGIN + 18, strip_y - strip_height + strip_height/2 - 8, formatted_date)

        # Workout title
        workout_title = running.get('title', 'Rest Day')
        canvas.setFillColor(workout_color)
        canvas.setFont("Helvetica-Bold", FONT_SIZES['body'])
        canvas.drawString(MARGIN + 65, strip_y - strip_height + strip_height/2 + 8, workout_title)

        # Distance and duration
        distance = running.get('totalDistance', 0)
        duration = running.get('estimatedDuration', 0)
        hr_zone = running.get('hrZone', '')

        if distance:
            canvas.setFillColor(COLORS['soft_white'])
            canvas.setFont("Helvetica", FONT_SIZES['body_small'])
            dist_text = f"{distance} mi"
            if duration:
                dist_text += f" | ~{duration} min"
            canvas.drawString(MARGIN + 65, strip_y - strip_height + strip_height/2 - 8, dist_text)

        # HR Zone indicator (right side)
        if hr_zone:
            canvas.setFillColor(COLORS['cyan_glow'])
            canvas.setFont("Helvetica", FONT_SIZES['caption'])
            canvas.drawString(PAGE_WIDTH - MARGIN - 80, strip_y - strip_height + strip_height/2 + 8, hr_zone)

        # Strength indicator
        if strength and strength.get('scheduled'):
            strength_type = strength.get('type', 'strength')
            strength_dur = strength.get('duration', 0)
            canvas.setFillColor(COLORS['neon_pink'])
            canvas.setFont("Helvetica", FONT_SIZES['caption'])
            strength_text = f"+ {strength_type.replace('_', ' ')} {strength_dur}min"
            canvas.drawString(PAGE_WIDTH - MARGIN - 150, strip_y - strip_height + strip_height/2 - 8, strength_text)

        # Workout description (if present, show below)
        description = running.get('description', '')
        if description and workout_type != 'rest':
            canvas.setFillColor(COLORS['soft_white'])
            canvas.setFont("Helvetica-Oblique", FONT_SIZES['caption'])
            # Truncate if needed
            max_desc_width = strip_width - 100
            while canvas.stringWidth(description, "Helvetica-Oblique", FONT_SIZES['caption']) > max_desc_width and len(description) > 0:
                description = description[:-1]
            if len(description) < len(running.get('description', '')):
                description += "..."
            canvas.drawString(MARGIN + 65, strip_y - strip_height + 10, description)

        strip_y -= strip_height + 6

    canvas.showPage()
