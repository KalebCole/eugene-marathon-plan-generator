"""
Reign or Shine - PDF Style Definitions
Twilight aesthetic with neon accents
"""

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import json
import os

# Page dimensions
PAGE_WIDTH, PAGE_HEIGHT = letter
MARGIN = 0.5 * inch

# Load brand colors
BRAND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'brand')

def load_brand_colors():
    """Load color palette from brand/colors.json"""
    colors_path = os.path.join(BRAND_DIR, 'colors.json')
    with open(colors_path, 'r') as f:
        return json.load(f)

def load_fonts_config():
    """Load font config from brand/fonts.json"""
    fonts_path = os.path.join(BRAND_DIR, 'fonts.json')
    with open(fonts_path, 'r') as f:
        return json.load(f)

# Color definitions (Reign or Shine palette)
COLORS = {
    'twilight_navy': HexColor('#1a1a3e'),
    'deep_purple': HexColor('#2d1b4e'),
    'neon_pink': HexColor('#ff6bb3'),
    'cyan_glow': HexColor('#7dd3fc'),
    'soft_white': HexColor('#f0f0ff'),
    'strip_purple': HexColor('#3d2a5c'),
    # Phase colors
    'phase_base': HexColor('#7dd3fc'),
    'phase_build': HexColor('#ff6bb3'),
    'phase_peak': HexColor('#f0f0ff'),
    'phase_taper': HexColor('#a78bfa'),
    'phase_race': HexColor('#fbbf24'),
    # Workout type colors
    'workout_easy': HexColor('#7dd3fc'),
    'workout_long': HexColor('#a78bfa'),
    'workout_tempo': HexColor('#ff6bb3'),
    'workout_intervals': HexColor('#f472b6'),
    'workout_hill': HexColor('#fb923c'),
    'workout_race_pace': HexColor('#fbbf24'),
    'workout_rest': HexColor('#6b7280'),
    'workout_cross': HexColor('#34d399'),
    'workout_recovery': HexColor('#94a3b8'),
}

# Font sizes
FONT_SIZES = {
    'brand_title': 48,
    'page_title': 28,
    'section_header': 20,
    'subsection': 16,
    'body': 14,
    'body_small': 12,
    'caption': 10,
}

# Strip/row styling
STRIP_HEIGHT = 0.6 * inch
STRIP_RADIUS = 8
STRIP_PADDING = 10

def get_phase_color(phase: str) -> Color:
    """Get color for training phase"""
    phase_map = {
        'base': COLORS['phase_base'],
        'build': COLORS['phase_build'],
        'peak': COLORS['phase_peak'],
        'taper': COLORS['phase_taper'],
        'race': COLORS['phase_race'],
    }
    return phase_map.get(phase.lower(), COLORS['soft_white'])

def get_workout_color(workout_type: str) -> Color:
    """Get color for workout type"""
    type_map = {
        'easy': COLORS['workout_easy'],
        'long': COLORS['workout_long'],
        'tempo': COLORS['workout_tempo'],
        'intervals': COLORS['workout_intervals'],
        'fartlek': COLORS['workout_intervals'],
        'hill_repeats': COLORS['workout_hill'],
        'race_pace': COLORS['workout_race_pace'],
        'rest': COLORS['workout_rest'],
        'cross_training': COLORS['workout_cross'],
        'recovery': COLORS['workout_recovery'],
        'progression': COLORS['workout_long'],
    }
    return type_map.get(workout_type.lower(), COLORS['soft_white'])

def draw_rounded_rect(canvas, x, y, width, height, radius, fill_color, stroke_color=None, alpha=1.0):
    """Draw a rounded rectangle with optional transparency"""
    canvas.saveState()
    if alpha < 1.0:
        canvas.setFillAlpha(alpha)
    canvas.setFillColor(fill_color)
    if stroke_color:
        canvas.setStrokeColor(stroke_color)
    else:
        canvas.setStrokeColor(fill_color)

    # Draw rounded rectangle using bezier curves
    p = canvas.beginPath()
    p.moveTo(x + radius, y)
    p.lineTo(x + width - radius, y)
    p.arcTo(x + width - radius, y, x + width, y + radius, radius)
    p.lineTo(x + width, y + height - radius)
    p.arcTo(x + width, y + height - radius, x + width - radius, y + height, radius)
    p.lineTo(x + radius, y + height)
    p.arcTo(x + radius, y + height, x, y + height - radius, radius)
    p.lineTo(x, y + radius)
    p.arcTo(x, y + radius, x + radius, y, radius)
    p.close()
    canvas.drawPath(p, fill=1, stroke=0)
    canvas.restoreState()

def draw_twilight_gradient(canvas, width, height):
    """Draw twilight gradient background from navy to purple"""
    steps = 50
    for i in range(steps):
        ratio = i / steps
        # Interpolate between twilight_navy and deep_purple
        r = int(26 + (45 - 26) * ratio)
        g = int(26 + (27 - 26) * ratio)
        b = int(62 + (78 - 62) * ratio)
        color = Color(r/255, g/255, b/255)

        y = height - (height / steps) * (i + 1)
        h = height / steps + 1
        canvas.setFillColor(color)
        canvas.rect(0, y, width, h, fill=1, stroke=0)

def draw_stars(canvas, width, height, count=100):
    """Draw scattered stars on background"""
    import random
    random.seed(42)  # Consistent star pattern

    canvas.setFillColor(COLORS['soft_white'])
    for _ in range(count):
        x = random.uniform(0, width)
        y = random.uniform(0, height)
        size = random.uniform(1, 3)
        alpha = random.uniform(0.3, 1.0)
        canvas.saveState()
        canvas.setFillAlpha(alpha)
        canvas.circle(x, y, size, fill=1, stroke=0)
        canvas.restoreState()

def draw_glow_text(canvas, text, x, y, font_name, font_size, main_color, glow_color, glow_offset=2):
    """Draw text with glow effect"""
    # Draw glow layers (offset and slightly transparent)
    canvas.saveState()
    canvas.setFillColor(glow_color)
    for offset in [(glow_offset, glow_offset), (-glow_offset, -glow_offset),
                   (glow_offset, -glow_offset), (-glow_offset, glow_offset)]:
        canvas.setFillAlpha(0.3)
        canvas.setFont(font_name, font_size)
        canvas.drawString(x + offset[0], y + offset[1], text)
    canvas.restoreState()

    # Draw main text
    canvas.setFillColor(main_color)
    canvas.setFont(font_name, font_size)
    canvas.drawString(x, y, text)

def draw_crown(canvas, x, y, size=40):
    """Draw a simple crown icon"""
    # Simple crown using lines
    canvas.saveState()
    canvas.setStrokeColor(COLORS['cyan_glow'])
    canvas.setLineWidth(2)

    # Crown base
    half = size / 2
    canvas.line(x - half, y, x + half, y)

    # Crown peaks (3 points)
    peak_height = size * 0.8
    canvas.line(x - half, y, x - half * 0.6, y + peak_height * 0.6)
    canvas.line(x - half * 0.6, y + peak_height * 0.6, x - half * 0.3, y + peak_height * 0.3)
    canvas.line(x - half * 0.3, y + peak_height * 0.3, x, y + peak_height)
    canvas.line(x, y + peak_height, x + half * 0.3, y + peak_height * 0.3)
    canvas.line(x + half * 0.3, y + peak_height * 0.3, x + half * 0.6, y + peak_height * 0.6)
    canvas.line(x + half * 0.6, y + peak_height * 0.6, x + half, y)

    canvas.restoreState()
