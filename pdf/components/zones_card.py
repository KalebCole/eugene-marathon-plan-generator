"""
Zones Reference Card - Pace and HR Zones
"""

from reportlab.lib.units import inch
from ..styles import (
    PAGE_WIDTH, PAGE_HEIGHT, MARGIN, COLORS, FONT_SIZES,
    STRIP_HEIGHT, STRIP_RADIUS,
    draw_twilight_gradient, draw_stars, draw_rounded_rect
)


def draw_zones_card(canvas, plan_data):
    """Draw the pace zones and HR zones reference card"""
    # Background
    draw_twilight_gradient(canvas, PAGE_WIDTH, PAGE_HEIGHT)
    draw_stars(canvas, PAGE_WIDTH, PAGE_HEIGHT, count=80)

    # Page title
    title_y = PAGE_HEIGHT - MARGIN - 0.5 * inch
    canvas.setFillColor(COLORS['cyan_glow'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['page_title'])
    canvas.drawString(MARGIN, title_y, "Your Training Zones")

    # Pace Zones Section
    pace_zones = plan_data.get('paceZones', {})
    pace_y = title_y - 0.8 * inch

    canvas.setFillColor(COLORS['neon_pink'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['section_header'])
    canvas.drawString(MARGIN, pace_y, "Pace Zones")

    # Pace zone strips
    zone_order = ['easy', 'marathon', 'tempo', 'fiveK', 'interval', 'recovery']
    zone_labels = {
        'easy': 'Easy',
        'marathon': 'Marathon',
        'tempo': 'Tempo',
        'fiveK': '5K',
        'interval': 'Interval',
        'recovery': 'Recovery'
    }

    strip_y = pace_y - 0.6 * inch
    strip_width = PAGE_WIDTH - 2 * MARGIN
    strip_height = 0.5 * inch

    for zone_key in zone_order:
        zone_data = pace_zones.get(zone_key, {})
        if not zone_data:
            continue

        # Draw strip background
        draw_rounded_rect(
            canvas, MARGIN, strip_y - strip_height,
            strip_width, strip_height,
            STRIP_RADIUS, COLORS['strip_purple'], alpha=0.8
        )

        # Zone name
        canvas.setFillColor(COLORS['cyan_glow'])
        canvas.setFont("Helvetica-Bold", FONT_SIZES['body'])
        canvas.drawString(MARGIN + 15, strip_y - strip_height + 15, zone_labels.get(zone_key, zone_key))

        # Pace range
        min_pace = zone_data.get('min', '')
        max_pace = zone_data.get('max', '')
        if min_pace and max_pace:
            pace_text = f"{min_pace} - {max_pace} /mile"
        elif min_pace:
            pace_text = f"{min_pace} /mile"
        else:
            pace_text = ""

        canvas.setFillColor(COLORS['soft_white'])
        canvas.setFont("Helvetica-Bold", FONT_SIZES['body'])
        text_width = canvas.stringWidth(pace_text, "Helvetica-Bold", FONT_SIZES['body'])
        canvas.drawString(PAGE_WIDTH - MARGIN - text_width - 15, strip_y - strip_height + 15, pace_text)

        strip_y -= strip_height + 8

    # HR Zones Section
    hr_zones = plan_data.get('hrZones', {})
    hr_y = strip_y - 0.6 * inch

    canvas.setFillColor(COLORS['neon_pink'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['section_header'])
    canvas.drawString(MARGIN, hr_y, "Heart Rate Zones")

    # HR zone strips
    hr_order = ['zone1', 'zone2', 'zone3', 'zone4', 'zone5']
    hr_colors = [
        COLORS['workout_recovery'],
        COLORS['workout_easy'],
        COLORS['workout_tempo'],
        COLORS['workout_intervals'],
        COLORS['workout_race_pace'],
    ]

    strip_y = hr_y - 0.6 * inch

    for i, zone_key in enumerate(hr_order):
        zone_data = hr_zones.get(zone_key, {})
        if not zone_data:
            continue

        # Draw strip background
        draw_rounded_rect(
            canvas, MARGIN, strip_y - strip_height,
            strip_width, strip_height,
            STRIP_RADIUS, COLORS['strip_purple'], alpha=0.8
        )

        # Zone indicator (colored bar on left)
        bar_width = 6
        draw_rounded_rect(
            canvas, MARGIN + 5, strip_y - strip_height + 5,
            bar_width, strip_height - 10,
            3, hr_colors[i], alpha=1.0
        )

        # Zone name
        zone_name = zone_data.get('name', f'Zone {i+1}')
        canvas.setFillColor(COLORS['cyan_glow'])
        canvas.setFont("Helvetica-Bold", FONT_SIZES['body'])
        canvas.drawString(MARGIN + 20, strip_y - strip_height + 15, zone_name)

        # HR range
        min_hr = zone_data.get('minHR', '')
        max_hr = zone_data.get('maxHR', '')
        percent = zone_data.get('percentMaxHR', '')

        hr_text = f"{min_hr}-{max_hr} bpm ({percent})" if min_hr and max_hr else ""

        canvas.setFillColor(COLORS['soft_white'])
        canvas.setFont("Helvetica", FONT_SIZES['body_small'])
        text_width = canvas.stringWidth(hr_text, "Helvetica", FONT_SIZES['body_small'])
        canvas.drawString(PAGE_WIDTH - MARGIN - text_width - 15, strip_y - strip_height + 15, hr_text)

        strip_y -= strip_height + 8

    # Footer note
    footer_y = MARGIN + 0.3 * inch
    canvas.setFillColor(COLORS['soft_white'])
    canvas.setFont("Helvetica-Oblique", FONT_SIZES['caption'])
    note = "80% of training should be in Zone 2 (Easy/Aerobic)"
    text_width = canvas.stringWidth(note, "Helvetica-Oblique", FONT_SIZES['caption'])
    canvas.drawString((PAGE_WIDTH - text_width) / 2, footer_y, note)

    canvas.showPage()
