"""
Cover Page Component - Reign or Shine Training Plan
"""

from reportlab.lib.units import inch
from ..styles import (
    PAGE_WIDTH, PAGE_HEIGHT, MARGIN, COLORS, FONT_SIZES,
    draw_twilight_gradient, draw_stars, draw_glow_text, draw_crown
)


def draw_cover_page(canvas, plan_data):
    """Draw the branded cover page"""
    # Background
    draw_twilight_gradient(canvas, PAGE_WIDTH, PAGE_HEIGHT)
    draw_stars(canvas, PAGE_WIDTH, PAGE_HEIGHT, count=150)

    # Crown icon
    crown_y = PAGE_HEIGHT - 2 * inch
    draw_crown(canvas, PAGE_WIDTH / 2, crown_y, size=60)

    # Brand title "Reign or Shine"
    title_y = crown_y - 0.8 * inch
    canvas.setFont("Helvetica-Bold", FONT_SIZES['brand_title'])

    # Draw with glow effect
    draw_glow_text(
        canvas,
        "Reign or Shine",
        PAGE_WIDTH / 2 - 2.2 * inch,
        title_y,
        "Helvetica-Bold",
        FONT_SIZES['brand_title'],
        COLORS['cyan_glow'],
        COLORS['neon_pink'],
        glow_offset=2
    )

    # Race name
    metadata = plan_data.get('metadata', {})
    race_name = metadata.get('raceName', 'Marathon Training Plan')
    race_date = metadata.get('raceDate', '')

    race_y = title_y - 1.2 * inch
    canvas.setFillColor(COLORS['neon_pink'])
    canvas.setFont("Helvetica-Bold", FONT_SIZES['page_title'])
    text_width = canvas.stringWidth(race_name, "Helvetica-Bold", FONT_SIZES['page_title'])
    canvas.drawString((PAGE_WIDTH - text_width) / 2, race_y, race_name)

    # Race date
    if race_date:
        from datetime import datetime
        try:
            date_obj = datetime.strptime(race_date, '%Y-%m-%d')
            formatted_date = date_obj.strftime('%B %d, %Y')
        except ValueError:
            formatted_date = race_date

        date_y = race_y - 0.5 * inch
        canvas.setFillColor(COLORS['soft_white'])
        canvas.setFont("Helvetica", FONT_SIZES['section_header'])
        text_width = canvas.stringWidth(formatted_date, "Helvetica", FONT_SIZES['section_header'])
        canvas.drawString((PAGE_WIDTH - text_width) / 2, date_y, formatted_date)

    # Predicted finish time
    predicted = metadata.get('predictedFinishTime', {})
    target_time = predicted.get('target', '')
    if target_time:
        goal_y = date_y - 1 * inch
        goal_text = f"Goal Time: {target_time}"
        canvas.setFillColor(COLORS['cyan_glow'])
        canvas.setFont("Helvetica-Bold", FONT_SIZES['section_header'])
        text_width = canvas.stringWidth(goal_text, "Helvetica-Bold", FONT_SIZES['section_header'])
        canvas.drawString((PAGE_WIDTH - text_width) / 2, goal_y, goal_text)

    # Plan level badge
    plan_level = metadata.get('planLevel', 'moderate').upper()
    total_weeks = metadata.get('totalWeeks', 15)

    badge_y = goal_y - 0.8 * inch if target_time else date_y - 1 * inch
    badge_text = f"{total_weeks}-WEEK {plan_level} PLAN"
    canvas.setFillColor(COLORS['soft_white'])
    canvas.setFont("Helvetica", FONT_SIZES['body'])
    text_width = canvas.stringWidth(badge_text, "Helvetica", FONT_SIZES['body'])
    canvas.drawString((PAGE_WIDTH - text_width) / 2, badge_y, badge_text)

    # Footer
    footer_y = MARGIN + 0.5 * inch
    canvas.setFillColor(COLORS['soft_white'])
    canvas.setFont("Helvetica-Oblique", FONT_SIZES['caption'])
    footer_text = "Generated with Reign or Shine Training"
    text_width = canvas.stringWidth(footer_text, "Helvetica-Oblique", FONT_SIZES['caption'])
    canvas.drawString((PAGE_WIDTH - text_width) / 2, footer_y, footer_text)

    canvas.showPage()
