"""
Weekly Detail Page - Individual week with daily workouts
Redesigned with sections: Summary, Running, Strength, Nutrition
"""

from reportlab.lib.units import inch
from ..styles import (
    PAGE_WIDTH, PAGE_HEIGHT, MARGIN, COLORS, FONT_SIZES,
    STRIP_RADIUS, STRIP_HEIGHT_COMPACT, STRIP_HEIGHT_MINI,
    draw_twilight_gradient, draw_stars,
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


def draw_day_dots(canvas, x, y, days_data, check_key, days_order):
    """Draw day indicator dots (filled = has activity, empty = no activity)"""
    day_labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    dot_spacing = 18
    dot_radius = 5

    for i, day_key in enumerate(days_order):
        day_data = days_data.get(day_key, {})

        # Check if this day has the activity
        has_activity = False
        if check_key == 'running':
            running = day_data.get('running', {})
            has_activity = running.get('type', 'rest') != 'rest'
        elif check_key == 'strength':
            strength = day_data.get('strength', {})
            has_activity = strength.get('scheduled', False)

        dot_x = x + (i * dot_spacing)

        # Draw dot
        if has_activity:
            canvas.setFillColor(COLORS['dot_active'])
        else:
            canvas.setFillColor(COLORS['dot_inactive'])
        canvas.circle(dot_x, y, dot_radius, fill=1, stroke=0)

    # Draw day labels below
    canvas.setFillColor(COLORS['soft_white'])
    canvas.setFont("Helvetica", 8)
    for i, label in enumerate(day_labels):
        label_x = x + (i * dot_spacing) - 3
        canvas.drawString(label_x, y - 14, label)


def draw_week_detail_page(canvas, week_data, week_number):
    """Draw a detailed page for one training week with sections"""
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
    strength_days = week_data.get('strengthDays', 0)
    weekly_nutrition = week_data.get('weeklyNutrition', {})
    days = week_data.get('days', {})

    days_order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    day_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    current_y = PAGE_HEIGHT - MARGIN

    # =========================================================================
    # HEADER SECTION
    # =========================================================================
    title_y = current_y - 0.4 * inch
    phase_color = get_phase_color(phase)

    # Week number
    canvas.setFillColor(phase_color)
    canvas.setFont("Helvetica-Bold", FONT_SIZES['page_title'])
    canvas.drawString(MARGIN, title_y, f"Week {week_number}")

    # Phase badge with background (prevents stars from showing through)
    badge_x = MARGIN + 120
    phase_text = phase.upper()
    if is_recovery:
        phase_text = "RECOVERY"
        badge_color = COLORS['neon_pink']
    else:
        badge_color = phase_color

    # Draw badge background
    badge_text_width = len(phase_text) * 9 + 16  # Approximate width
    badge_height = 22
    draw_rounded_rect(
        canvas, badge_x - 8, title_y - 2,
        badge_text_width, badge_height,
        4, COLORS['deep_purple'], alpha=0.95
    )

    # Draw badge text
    canvas.setFillColor(badge_color)
    canvas.setFont("Helvetica-Bold", FONT_SIZES['body'])
    canvas.drawString(badge_x, title_y + 5, phase_text)

    # Weeks until race
    countdown_x = PAGE_WIDTH - MARGIN - 120
    canvas.setFillColor(COLORS['soft_white'])
    canvas.setFont("Helvetica", FONT_SIZES['body'])
    canvas.drawString(countdown_x, title_y + 5, f"{weeks_until} weeks to go")

    current_y = title_y - 0.3 * inch

    # Motivational quote
    quote_data = quotes.get('weekly_quotes', {}).get(str(week_number), {})
    quote_text = quote_data.get('quote', '')
    if quote_text:
        canvas.setFillColor(COLORS['neon_pink'])
        canvas.setFont("Helvetica-Oblique", FONT_SIZES['body_small'])
        text_width = canvas.stringWidth(f'"{quote_text}"', "Helvetica-Oblique", FONT_SIZES['body_small'])
        canvas.drawString((PAGE_WIDTH - text_width) / 2, current_y, f'"{quote_text}"')
        current_y -= 0.35 * inch

    # =========================================================================
    # WEEKLY SUMMARY BAR
    # =========================================================================
    # Increased height to properly fit three rows: values, labels, day indicators
    summary_height = 1.1 * inch
    summary_y = current_y - summary_height

    draw_rounded_rect(
        canvas, MARGIN, summary_y,
        PAGE_WIDTH - 2 * MARGIN, summary_height,
        STRIP_RADIUS, COLORS['deep_purple'], alpha=0.9
    )

    col_width = (PAGE_WIDTH - 2 * MARGIN) / 4

    # Row 1: Stat values (top of box)
    values_y = summary_y + summary_height - 0.32 * inch

    # Row 2: Unit labels (below values)
    labels_y = values_y - 20

    # Row 3: Day indicators (bottom, with room for day letter labels)
    dots_y = summary_y + 0.28 * inch

    # --- Column 1: Miles ---
    canvas.setFillColor(COLORS['soft_white'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['subsection'])
    canvas.drawString(MARGIN + 15, values_y, f"{total_mileage}")
    canvas.setFont("Helvetica", FONT_SIZES['body_small'])
    canvas.drawString(MARGIN + 15, labels_y, "miles")

    # --- Column 2: Hours ---
    canvas.setFillColor(COLORS['soft_white'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['subsection'])
    canvas.drawString(MARGIN + col_width + 15, values_y, f"~{total_hours}")
    canvas.setFont("Helvetica", FONT_SIZES['body_small'])
    canvas.drawString(MARGIN + col_width + 15, labels_y, "hours")

    # --- Column 3: Strength ---
    canvas.setFillColor(COLORS['neon_pink'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['subsection'])
    canvas.drawString(MARGIN + col_width * 2 + 15, values_y, f"{strength_days}")
    canvas.setFillColor(COLORS['soft_white'])
    canvas.setFont("Helvetica", FONT_SIZES['body_small'])
    canvas.drawString(MARGIN + col_width * 2 + 15, labels_y, "strength")

    # --- Column 4: Calories ---
    daily_calories = weekly_nutrition.get('dailyCalories', 0)
    canvas.setFillColor(COLORS['cyan_glow'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['subsection'])
    canvas.drawString(MARGIN + col_width * 3 + 15, values_y, f"~{daily_calories}")
    canvas.setFillColor(COLORS['soft_white'])
    canvas.setFont("Helvetica", FONT_SIZES['body_small'])
    canvas.drawString(MARGIN + col_width * 3 + 15, labels_y, "cal/day")

    # --- Day indicator dots row (spans bottom of summary bar) ---
    canvas.setFillColor(COLORS['soft_white'])
    canvas.setFont("Helvetica", FONT_SIZES['caption'])
    canvas.drawString(MARGIN + 15, dots_y, "Running:")
    draw_day_dots(canvas, MARGIN + 75, dots_y + 3, days, 'running', days_order)

    canvas.drawString(MARGIN + col_width * 2 + 15, dots_y, "Strength:")
    draw_day_dots(canvas, MARGIN + col_width * 2 + 80, dots_y + 3, days, 'strength', days_order)

    current_y = summary_y - 0.2 * inch

    # =========================================================================
    # RUNNING SCHEDULE SECTION
    # =========================================================================
    section_header_height = 0.3 * inch

    # Section header
    canvas.setFillColor(COLORS['cyan_glow'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['body'])
    canvas.drawString(MARGIN, current_y, "RUNNING SCHEDULE")
    current_y -= 0.25 * inch

    # Running rows (all 7 days)
    strip_width = PAGE_WIDTH - 2 * MARGIN
    strip_height = STRIP_HEIGHT_COMPACT

    for i, day_key in enumerate(days_order):
        day_data = days.get(day_key, {})
        if not day_data:
            continue

        running = day_data.get('running', {})
        workout_type = running.get('type', 'rest')
        workout_color = get_workout_color(workout_type)

        # Draw strip background
        draw_rounded_rect(
            canvas, MARGIN, current_y - strip_height,
            strip_width, strip_height,
            STRIP_RADIUS, COLORS['strip_purple'], alpha=0.8
        )

        # Workout type color indicator
        bar_width = 5
        draw_rounded_rect(
            canvas, MARGIN + 3, current_y - strip_height + 6,
            bar_width, strip_height - 12,
            2, workout_color, alpha=1.0
        )

        # Day label
        canvas.setFillColor(COLORS['soft_white'])
        canvas.setFont("Helvetica-Bold", FONT_SIZES['body_small'])
        canvas.drawString(MARGIN + 14, current_y - strip_height + strip_height/2, day_labels[i])

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
            canvas.drawString(MARGIN + 50, current_y - strip_height + strip_height/2, formatted_date)

        # Workout title
        workout_title = running.get('title', 'Rest Day')
        canvas.setFillColor(workout_color)
        canvas.setFont("Helvetica-Bold", FONT_SIZES['body_small'])
        canvas.drawString(MARGIN + 95, current_y - strip_height + strip_height/2, workout_title)

        # Distance
        distance = running.get('totalDistance', 0)
        if distance:
            canvas.setFillColor(COLORS['soft_white'])
            canvas.setFont("Helvetica", FONT_SIZES['body_small'])
            canvas.drawString(MARGIN + 260, current_y - strip_height + strip_height/2, f"{distance} mi")
        else:
            canvas.setFillColor(COLORS['dot_inactive'])
            canvas.setFont("Helvetica", FONT_SIZES['body_small'])
            canvas.drawString(MARGIN + 260, current_y - strip_height + strip_height/2, "—")

        # Duration
        duration = running.get('estimatedDuration', 0)
        if duration:
            canvas.setFillColor(COLORS['soft_white'])
            canvas.setFont("Helvetica", FONT_SIZES['body_small'])
            canvas.drawString(MARGIN + 320, current_y - strip_height + strip_height/2, f"~{duration}min")
        else:
            canvas.setFillColor(COLORS['dot_inactive'])
            canvas.setFont("Helvetica", FONT_SIZES['body_small'])
            canvas.drawString(MARGIN + 320, current_y - strip_height + strip_height/2, "—")

        # HR Zone
        hr_zone = running.get('hrZone', '')
        if hr_zone:
            canvas.setFillColor(COLORS['cyan_glow'])
            canvas.setFont("Helvetica", FONT_SIZES['caption'])
            # Truncate long HR zone text
            if len(hr_zone) > 15:
                hr_zone = hr_zone[:15] + "..."
            canvas.drawString(MARGIN + 400, current_y - strip_height + strip_height/2, hr_zone)

        current_y -= strip_height + 4

    current_y -= 0.15 * inch

    # =========================================================================
    # STRENGTH SCHEDULE SECTION
    # =========================================================================
    canvas.setFillColor(COLORS['neon_pink'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['body'])
    canvas.drawString(MARGIN, current_y, "STRENGTH SCHEDULE")
    current_y -= 0.25 * inch

    # Collect strength days
    strength_sessions = []
    for i, day_key in enumerate(days_order):
        day_data = days.get(day_key, {})
        strength = day_data.get('strength', {})
        if strength.get('scheduled'):
            strength_sessions.append({
                'day_label': day_labels[i],
                'type': strength.get('type', 'strength'),
                'duration': strength.get('duration', 0),
                'timing': strength.get('timing', ''),
                'notes': strength.get('notes', '')
            })

    strip_height = STRIP_HEIGHT_MINI

    if strength_sessions:
        for session in strength_sessions:
            # Draw strip background
            draw_rounded_rect(
                canvas, MARGIN, current_y - strip_height,
                strip_width, strip_height,
                STRIP_RADIUS, COLORS['strip_purple'], alpha=0.8
            )

            # Color indicator
            draw_rounded_rect(
                canvas, MARGIN + 3, current_y - strip_height + 5,
                5, strip_height - 10,
                2, COLORS['neon_pink'], alpha=1.0
            )

            # Day
            canvas.setFillColor(COLORS['soft_white'])
            canvas.setFont("Helvetica-Bold", FONT_SIZES['body_small'])
            canvas.drawString(MARGIN + 14, current_y - strip_height + strip_height/2, session['day_label'])

            # Type
            session_type = session['type'].replace('_', ' ').title()
            canvas.setFillColor(COLORS['neon_pink'])
            canvas.setFont("Helvetica-Bold", FONT_SIZES['body_small'])
            canvas.drawString(MARGIN + 55, current_y - strip_height + strip_height/2, session_type)

            # Duration
            canvas.setFillColor(COLORS['soft_white'])
            canvas.setFont("Helvetica", FONT_SIZES['body_small'])
            canvas.drawString(MARGIN + 160, current_y - strip_height + strip_height/2, f"{session['duration']} min")

            # Timing
            if session['timing']:
                canvas.setFillColor(COLORS['soft_white'])
                canvas.setFont("Helvetica-Oblique", FONT_SIZES['caption'])
                timing_text = session['timing']
                if len(timing_text) > 30:
                    timing_text = timing_text[:30] + "..."
                canvas.drawString(MARGIN + 230, current_y - strip_height + strip_height/2, timing_text)

            current_y -= strip_height + 4
    else:
        # No strength this week
        canvas.setFillColor(COLORS['dot_inactive'])
        canvas.setFont("Helvetica-Oblique", FONT_SIZES['body_small'])
        if phase == 'taper':
            canvas.drawString(MARGIN + 10, current_y - 12, "Taper week — no strength training")
        else:
            canvas.drawString(MARGIN + 10, current_y - 12, "No strength sessions this week")
        current_y -= 0.3 * inch

    current_y -= 0.15 * inch

    # =========================================================================
    # NUTRITION SECTION
    # =========================================================================
    canvas.setFillColor(COLORS['section_nutrition'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['body'])
    canvas.drawString(MARGIN, current_y, "NUTRITION TARGET")
    current_y -= 0.25 * inch

    # Nutrition box
    nutrition_box_height = 0.7 * inch
    draw_rounded_rect(
        canvas, MARGIN, current_y - nutrition_box_height,
        strip_width, nutrition_box_height,
        STRIP_RADIUS, COLORS['nutrition_box'], alpha=0.9
    )

    # Daily calories (prominent)
    daily_calories = weekly_nutrition.get('dailyCalories', 0)
    macros = weekly_nutrition.get('macros', {})
    nutrition_notes = weekly_nutrition.get('notes', '')

    canvas.setFillColor(COLORS['soft_white'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['section_header'])
    canvas.drawString(MARGIN + 15, current_y - 0.32 * inch, f"~{daily_calories} calories/day")

    # Macro breakdown
    if macros:
        protein = macros.get('protein', {})
        carbs = macros.get('carbs', {})
        fat = macros.get('fat', {})

        macro_y = current_y - 0.55 * inch
        canvas.setFont("Helvetica", FONT_SIZES['body_small'])

        # Protein
        canvas.setFillColor(COLORS['cyan_glow'])
        p_text = f"Protein: {protein.get('grams', 0)}g ({protein.get('percentage', 0)}%)"
        canvas.drawString(MARGIN + 15, macro_y, p_text)

        # Carbs
        canvas.setFillColor(COLORS['neon_pink'])
        c_text = f"Carbs: {carbs.get('grams', 0)}g ({carbs.get('percentage', 0)}%)"
        canvas.drawString(MARGIN + 180, macro_y, c_text)

        # Fat
        canvas.setFillColor(COLORS['section_nutrition'])
        f_text = f"Fat: {fat.get('grams', 0)}g ({fat.get('percentage', 0)}%)"
        canvas.drawString(MARGIN + 340, macro_y, f_text)

    # Nutrition notes (if any)
    if nutrition_notes:
        canvas.setFillColor(COLORS['soft_white'])
        canvas.setFont("Helvetica-Oblique", FONT_SIZES['caption'])
        notes_x = strip_width - 15 - canvas.stringWidth(nutrition_notes, "Helvetica-Oblique", FONT_SIZES['caption'])
        canvas.drawString(MARGIN + notes_x, current_y - 0.32 * inch, nutrition_notes)

    canvas.showPage()
