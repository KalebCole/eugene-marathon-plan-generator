"""
Training Overview Pages - Weekly strips showing all weeks
"""

from reportlab.lib.units import inch
from ..styles import (
    PAGE_WIDTH, PAGE_HEIGHT, MARGIN, COLORS, FONT_SIZES,
    STRIP_RADIUS, draw_twilight_gradient, draw_stars,
    draw_rounded_rect, get_phase_color
)


def draw_overview_pages(canvas, plan_data):
    """Draw the training overview with weekly strips"""
    weeks = plan_data.get('weeks', [])
    if not weeks:
        return

    # Background
    draw_twilight_gradient(canvas, PAGE_WIDTH, PAGE_HEIGHT)
    draw_stars(canvas, PAGE_WIDTH, PAGE_HEIGHT, count=60)

    # Page title
    title_y = PAGE_HEIGHT - MARGIN - 0.5 * inch
    canvas.setFillColor(COLORS['cyan_glow'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['page_title'])
    canvas.drawString(MARGIN, title_y, "Training Overview")

    # Subtitle
    total_weeks = plan_data.get('metadata', {}).get('totalWeeks', len(weeks))
    subtitle_y = title_y - 0.4 * inch
    canvas.setFillColor(COLORS['soft_white'])
    canvas.setFont("Helvetica", FONT_SIZES['body'])
    canvas.drawString(MARGIN, subtitle_y, f"{total_weeks} weeks to race day")

    # Calculate strip dimensions
    strip_width = PAGE_WIDTH - 2 * MARGIN
    strip_height = 0.45 * inch
    strip_spacing = 6
    strips_per_page = 12  # How many weeks fit on one page

    current_y = subtitle_y - 0.6 * inch
    week_count = 0

    for week in weeks:
        # Check if we need a new page
        if week_count > 0 and week_count % strips_per_page == 0:
            canvas.showPage()
            draw_twilight_gradient(canvas, PAGE_WIDTH, PAGE_HEIGHT)
            draw_stars(canvas, PAGE_WIDTH, PAGE_HEIGHT, count=60)

            # Continuation header
            title_y = PAGE_HEIGHT - MARGIN - 0.5 * inch
            canvas.setFillColor(COLORS['cyan_glow'])
            canvas.setFont("Helvetica-Bold", FONT_SIZES['page_title'])
            canvas.drawString(MARGIN, title_y, "Training Overview (cont.)")
            current_y = title_y - 0.8 * inch

        week_num = week.get('weekNumber', week_count + 1)
        phase = week.get('phase', 'base')
        is_recovery = week.get('isRecoveryWeek', False)
        total_mileage = week.get('totalMileage', 0)
        focus = week.get('focus', '')

        # Find long run distance
        long_run_dist = 0
        days = week.get('days', {})
        for day_name, day_data in days.items():
            running = day_data.get('running', {})
            if running.get('type') in ['long', 'progression', 'race_pace']:
                dist = running.get('totalDistance', 0)
                if dist > long_run_dist:
                    long_run_dist = dist

        # Draw strip background
        strip_color = COLORS['strip_purple']
        if is_recovery:
            strip_color = COLORS['deep_purple']

        draw_rounded_rect(
            canvas, MARGIN, current_y - strip_height,
            strip_width, strip_height,
            STRIP_RADIUS, strip_color, alpha=0.85
        )

        # Phase color indicator (left bar)
        phase_color = get_phase_color(phase)
        bar_width = 6
        draw_rounded_rect(
            canvas, MARGIN + 4, current_y - strip_height + 5,
            bar_width, strip_height - 10,
            3, phase_color, alpha=1.0
        )

        # Week number
        canvas.setFillColor(COLORS['soft_white'])
        canvas.setFont("Helvetica-Bold", FONT_SIZES['body_small'])
        week_text = f"Wk {week_num}"
        canvas.drawString(MARGIN + 18, current_y - strip_height + 14, week_text)

        # Phase tag
        phase_x = MARGIN + 65
        canvas.setFillColor(phase_color)
        canvas.setFont("Helvetica-Bold", FONT_SIZES['caption'])
        phase_label = phase.upper()[:3]  # Shortened: BAS, BUI, PEA, TAP
        if is_recovery:
            phase_label = "REC"
        canvas.drawString(phase_x, current_y - strip_height + 14, phase_label)

        # Total miles
        miles_x = MARGIN + 105
        canvas.setFillColor(COLORS['soft_white'])
        canvas.setFont("Helvetica", FONT_SIZES['caption'])
        canvas.drawString(miles_x, current_y - strip_height + 14, f"{total_mileage}mi")

        # Long run
        long_x = MARGIN + 150
        canvas.setFillColor(COLORS['cyan_glow'])
        canvas.setFont("Helvetica", FONT_SIZES['caption'])
        canvas.drawString(long_x, current_y - strip_height + 14, f"LR:{long_run_dist}mi")

        # Focus/Description - now with much more space, no truncation
        if focus:
            focus_x = MARGIN + 210
            max_focus_width = strip_width - 230  # Much more space now
            canvas.setFillColor(COLORS['soft_white'])
            canvas.setFont("Helvetica-Oblique", FONT_SIZES['caption'])

            # Only truncate if absolutely necessary (very long text)
            display_focus = focus
            if canvas.stringWidth(focus, "Helvetica-Oblique", FONT_SIZES['caption']) > max_focus_width:
                while canvas.stringWidth(display_focus + "…", "Helvetica-Oblique", FONT_SIZES['caption']) > max_focus_width and len(display_focus) > 0:
                    display_focus = display_focus[:-1]
                display_focus += "…"

            canvas.drawString(focus_x, current_y - strip_height + 14, display_focus)

        current_y -= strip_height + strip_spacing
        week_count += 1

    # Legend at bottom of last page
    legend_y = MARGIN + 0.8 * inch

    canvas.setFillColor(COLORS['soft_white'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['caption'])
    canvas.drawString(MARGIN, legend_y, "Phases:")

    phases = [('base', 'Base'), ('build', 'Build'), ('peak', 'Peak'), ('taper', 'Taper')]
    legend_x = MARGIN + 50
    for phase_key, phase_name in phases:
        color = get_phase_color(phase_key)
        # Draw color dot
        canvas.setFillColor(color)
        canvas.circle(legend_x, legend_y + 3, 4, fill=1, stroke=0)
        # Draw label
        canvas.setFillColor(COLORS['soft_white'])
        canvas.setFont("Helvetica", FONT_SIZES['caption'])
        canvas.drawString(legend_x + 10, legend_y, phase_name)
        legend_x += 70

    canvas.showPage()
