"""PDF Components for Reign or Shine Training Plan"""

from .cover import draw_cover_page
from .zones_card import draw_zones_card
from .overview import draw_overview_pages
from .week_detail import draw_week_detail_page
from .race_week import draw_race_week_page

__all__ = [
    'draw_cover_page',
    'draw_zones_card',
    'draw_overview_pages',
    'draw_week_detail_page',
    'draw_race_week_page',
]
