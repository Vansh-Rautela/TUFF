"""
Seasonal color palettes used to turn a skin-tone estimate into wardrobe advice.

These are rule-based palettes from classic four-season color analysis, not model
output. Every color carries a plain name so it can be matched against product
titles (see catalog.extract_color).
"""
from typing import Dict, List

# Each entry: (name, hex). Names must be lowercase-friendly retail color words.
_PALETTES: Dict[str, Dict[str, list]] = {
    'Spring': {
        'primary': [('Coral', '#FF7F50'), ('Peach', '#FFDAB9'), ('Warm Yellow', '#FFD54F'),
                    ('Turquoise', '#40E0D0'), ('Salmon', '#FA8072')],
        'neutrals': [('Cream', '#FFFDD0'), ('Camel', '#C19A6B'), ('Ivory', '#FFFFF0'), ('Light Navy', '#3B5998')],
        'accent': [('Poppy Red', '#E35335'), ('Apple Green', '#8DB600'), ('Golden Yellow', '#FFC000')],
        'jewelry_metals': ['Yellow Gold', 'Rose Gold', 'Brass'],
        'key_characteristics': ['Warm undertone', 'Light to medium depth', 'Clear, bright colors'],
        'avoid': ['Black', 'Grey', 'Burgundy'],
    },
    'Summer': {
        'primary': [('Powder Blue', '#B0E0E6'), ('Lavender', '#E6E6FA'), ('Dusty Rose', '#DCAE96'),
                    ('Periwinkle', '#C0C0FF'), ('Mauve', '#E0B0FF')],
        'neutrals': [('Soft White', '#F5F5F5'), ('Grey', '#A9A9A9'), ('Taupe', '#B38B6D'), ('Navy', '#1F3A5F')],
        'accent': [('Raspberry', '#E30B5C'), ('Plum', '#DDA0DD'), ('Teal', '#5F9EA0')],
        'jewelry_metals': ['Silver', 'White Gold', 'Platinum'],
        'key_characteristics': ['Cool undertone', 'Light to medium depth', 'Soft, muted colors'],
        'avoid': ['Orange', 'Mustard', 'Black'],
    },
    'Autumn': {
        'primary': [('Olive', '#556B2F'), ('Rust', '#B7410E'), ('Mustard', '#E1AD01'),
                    ('Terracotta', '#E2725B'), ('Sienna', '#A0522D')],
        'neutrals': [('Beige', '#F5F5DC'), ('Brown', '#8B4513'), ('Khaki', '#C3B091'), ('Off White', '#FAF9F6')],
        'accent': [('Burnt Orange', '#CC5500'), ('Teal', '#008080'), ('Maroon', '#800000')],
        'jewelry_metals': ['Yellow Gold', 'Bronze', 'Copper'],
        'key_characteristics': ['Warm undertone', 'Medium to deep depth', 'Rich, earthy colors'],
        'avoid': ['Pastel Pink', 'Icy Blue', 'Pure White'],
    },
    'Winter': {
        'primary': [('Royal Blue', '#4169E1'), ('Emerald', '#50C878'), ('Fuchsia', '#FF00FF'),
                    ('Burgundy', '#800020'), ('Navy', '#000080')],
        'neutrals': [('Black', '#000000'), ('White', '#FFFFFF'), ('Charcoal', '#36454F'), ('Grey', '#808080')],
        'accent': [('Red', '#D2042D'), ('Icy Blue', '#A5F2F3'), ('Purple', '#6A0DAD')],
        'jewelry_metals': ['Silver', 'Platinum', 'White Gold'],
        'key_characteristics': ['Cool undertone', 'High contrast', 'Clear, saturated colors'],
        'avoid': ['Orange', 'Beige', 'Mustard'],
    },
}

_DESCRIPTIONS = {
    'Spring': 'Warm, clear and light colors echo the golden warmth in your skin.',
    'Summer': 'Soft, cool and muted colors harmonise with your gentle undertone.',
    'Autumn': 'Rich, warm and earthy colors bring out your natural depth.',
    'Winter': 'Bold, cool and high-contrast colors make your features stand out.',
}


def _hexes(entries: list) -> List[str]:
    return [hex_value for _, hex_value in entries]


def _names(entries: list) -> List[str]:
    return [name for name, _ in entries]


def get_season_palette(season: str) -> dict:
    """
    Return the palette object consumed by the frontend color-analysis page:
    hex lists per role, jewelry metals, characteristics and color relationships.
    """
    data = _PALETTES.get(season) or _PALETTES['Spring']
    primary = data['primary']
    return {
        'season': season if season in _PALETTES else 'Spring',
        'description': _DESCRIPTIONS.get(season, _DESCRIPTIONS['Spring']),
        'key_characteristics': list(data['key_characteristics']),
        'palettes': {
            'primary': _hexes(primary),
            'neutrals': _hexes(data['neutrals']),
            'accent': _hexes(data['accent']),
            'jewelry_metals': list(data['jewelry_metals']),
        },
        'color_names': {
            'primary': _names(primary),
            'neutrals': _names(data['neutrals']),
            'accent': _names(data['accent']),
        },
        'avoid': list(data['avoid']),
        'color_relationships': {
            # Tonal: the primary family; analogous: neighbours in the same
            # temperature; complementary contrast: the accent pops.
            'tonal': _hexes(primary[:3]),
            'analogous': _hexes(primary[2:] + data['neutrals'][:1]),
            'complementary_contrast': _hexes(data['accent']),
        },
    }


def get_complementary_colors(season: str) -> List[dict]:
    """Legacy shape used by onboarding and recommendations: [{name, hex, color}]."""
    data = _PALETTES.get(season) or _PALETTES['Spring']
    return [{'name': name, 'hex': hex_value, 'color': hex_value} for name, hex_value in data['primary'][:4]]


def palette_color_names(season: str) -> List[str]:
    """All wearable color names for a season (primary, neutrals, accent)."""
    data = _PALETTES.get(season)
    if not data:
        return []
    return _names(data['primary']) + _names(data['neutrals']) + _names(data['accent'])


def avoid_color_names(season: str) -> List[str]:
    data = _PALETTES.get(season)
    return list(data['avoid']) if data else []
