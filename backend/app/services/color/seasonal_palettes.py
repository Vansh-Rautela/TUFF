"""The 12-season color system.

Each season belongs to a family (Spring/Summer/Autumn/Winter) and is defined
by its dominant characteristic: value (light/deep), temperature (warm/cool)
or chroma (bright/soft). Palettes are curated swatches; recommendations
compare product colors to them with CIEDE2000, so the hex values matter.
"""
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Swatch:
    name: str
    hex: str


@dataclass(frozen=True)
class Season:
    name: str
    family: str
    dominant: str  # light | deep | warm | cool | bright | soft
    tagline: str
    description: str
    signature: tuple[Swatch, ...]
    neutrals: tuple[Swatch, ...]
    accents: tuple[Swatch, ...]
    avoid: tuple[Swatch, ...]
    metals: tuple[str, ...]
    style_notes: tuple[str, ...] = field(default=())

    @property
    def wearable(self) -> tuple[Swatch, ...]:
        return self.signature + self.neutrals + self.accents


def _s(*pairs: str) -> tuple[Swatch, ...]:
    return tuple(Swatch(pairs[i], pairs[i + 1]) for i in range(0, len(pairs), 2))


SEASONS: dict[str, Season] = {s.name: s for s in [
    Season(
        "Light Spring", "Spring", "light", "Sunlit and delicate",
        "Light, warm and clear. Soft pastels with a golden glow flatter you more than heavy darks.",
        _s("Peach", "#F7C4A5", "Warm Pink", "#F4A3A0", "Butter Yellow", "#F6E27F", "Light Aqua", "#8FD8D2",
           "Periwinkle", "#9FA8DA", "Mint", "#B4E3C8"),
        _s("Ivory", "#FFF8E7", "Camel", "#C9A27E", "Light Grey", "#C9C6C0", "Light Navy", "#3D5A80"),
        _s("Coral", "#F88379", "Turquoise", "#40C9C0", "Golden Yellow", "#F4C430"),
        _s("Black", "#111111", "Burgundy", "#7B1E35", "Charcoal", "#36454F", "Olive", "#6B6B2E"),
        ("Light gold", "Rose gold"),
        ("Keep contrast gentle: pair pastels with ivory or camel.", "Swap black for light navy or camel."),
    ),
    Season(
        "Warm Spring", "Spring", "warm", "Golden and fresh",
        "Warm first: clear, sunny colors with yellow undertones bring your skin to life.",
        _s("Coral", "#F88379", "Warm Yellow", "#F5C04A", "Apple Green", "#7DBA3C", "Turquoise", "#30BFB4",
           "Tomato Red", "#E5533D", "Peach", "#F6B38A"),
        _s("Cream", "#F3E5C3", "Camel", "#C19A6B", "Warm Beige", "#D9B98C", "Chocolate", "#5C3A21"),
        _s("Orange", "#F28C28", "Golden Yellow", "#F4C430", "Aqua", "#4FC3C3"),
        _s("Black", "#111111", "Fuchsia", "#D6247D", "Icy Blue", "#CFE6F2", "Charcoal", "#36454F"),
        ("Yellow gold", "Brass", "Copper"),
        ("Cream beats stark white near your face.",),
    ),
    Season(
        "Bright Spring", "Spring", "bright", "Vivid and sparkling",
        "Clear and saturated with warmth. High-energy colors and crisp contrast suit you.",
        _s("Poppy Red", "#E8341C", "Turquoise", "#14B8B0", "Bright Coral", "#FF6F5E", "Kelly Green", "#2BA84A",
           "Sunflower", "#F7C51E", "Hot Pink", "#F2569B"),
        _s("Off White", "#F2EEE3", "Navy", "#1B2A4A", "Warm Grey", "#9E978E", "Camel", "#C19A6B"),
        _s("Cobalt", "#1F4FA8", "Bright Orange", "#FF7F11", "Violet", "#7F4FC9"),
        _s("Dusty Rose", "#C9909A", "Taupe", "#8B7D6B", "Sage", "#9CAF88", "Mustard", "#C9A227"),
        ("Yellow gold", "Polished silver"),
        ("Muted, dusty colors drain you; keep at least one clear color in every outfit.",),
    ),
    Season(
        "Light Summer", "Summer", "light", "Airy and cool",
        "Light and cool with soft edges: think sky, sea glass and sweet pea.",
        _s("Powder Blue", "#B6D0E2", "Lavender", "#C8B6E2", "Rose Pink", "#E8A0B4", "Soft Aqua", "#9ED9D4",
           "Periwinkle", "#A5B4E8", "Sea Green", "#7FC4A6"),
        _s("Soft White", "#F5F5F2", "Light Grey", "#C8C9CC", "Grey Navy", "#4A5A78", "Taupe", "#A39A8E"),
        _s("Raspberry", "#D1456E", "Cornflower", "#6F8FD9", "Orchid", "#C77DC0"),
        _s("Black", "#111111", "Orange", "#F28C28", "Mustard", "#D4A017", "Rust", "#B7410E"),
        ("Silver", "White gold", "Platinum"),
        ("Tonal outfits in light, cool shades look effortless on you.",),
    ),
    Season(
        "Cool Summer", "Summer", "cool", "Cool and refined",
        "Cool first: blue-based colors of medium depth, never orange or golden.",
        _s("Soft Fuchsia", "#C8508C", "Blue Spruce", "#3E7C8C", "Raspberry", "#B83A5E", "Periwinkle", "#8A97D6",
           "Cool Pink", "#E58FB0", "Lavender", "#B9A6DB"),
        _s("Grey", "#8A8D91", "Navy", "#1F3A5F", "Rose Brown", "#8C6A6A", "Soft White", "#F4F4F2"),
        _s("Ruby", "#9B1B30", "Teal", "#137C7C", "Plum", "#6E2C5E"),
        _s("Orange", "#F28C28", "Camel", "#C19A6B", "Mustard", "#D4A017", "Olive", "#6B6B2E"),
        ("Silver", "Platinum", "White gold"),
        ("Grey and navy are your base neutrals instead of brown and black.",),
    ),
    Season(
        "Soft Summer", "Summer", "soft", "Muted and elegant",
        "Soft, cool and blended. Smoky, grey-tinged colors look expensive on you.",
        _s("Dusty Rose", "#C9909A", "Sage", "#9CAF88", "Slate Blue", "#6A7FA3", "Mauve", "#B784A7",
           "Soft Teal", "#5F9EA0", "Heather", "#A99BB5"),
        _s("Taupe", "#8B7D6B", "Charcoal", "#36454F", "Pewter", "#8E9196", "Mushroom", "#B8A99A"),
        _s("Raspberry", "#B9506F", "Denim", "#4A6A8A", "Plum", "#7A4A6E"),
        _s("Black", "#111111", "Bright Orange", "#FF7F11", "Lemon", "#FFF06A", "Fuchsia", "#D6247D"),
        ("Pewter", "Brushed silver", "Rose gold"),
        ("Low contrast is your friend; avoid stark black and white together.",),
    ),
    Season(
        "Soft Autumn", "Autumn", "soft", "Earthy and gentle",
        "Soft and warm. Muted, earthy shades blend beautifully with your colouring.",
        _s("Sage", "#9CAF88", "Camel", "#C19A6B", "Salmon", "#E59A7F", "Moss", "#7A7A4A",
           "Soft Teal", "#5F8F8A", "Warm Rose", "#C98A7D"),
        _s("Mushroom", "#B8A99A", "Khaki", "#B5A07A", "Coffee", "#5B3A29", "Cream", "#F3E5C3"),
        _s("Terracotta", "#C8603F", "Mustard", "#C9A227", "Olive", "#6B6B2E"),
        _s("Black", "#111111", "Fuchsia", "#D6247D", "Royal Blue", "#2C4FB8", "Icy Blue", "#CFE6F2"),
        ("Brushed gold", "Bronze", "Rose gold"),
        ("Layer neighbouring earth tones rather than high-contrast pairs.",),
    ),
    Season(
        "Warm Autumn", "Autumn", "warm", "Rich and golden",
        "Warm first: spiced, golden and earthy colors make your skin glow.",
        _s("Rust", "#B7410E", "Mustard", "#D4A017", "Olive", "#6B6B2E", "Terracotta", "#C8603F",
           "Pumpkin", "#E07B39", "Warm Teal", "#2F7F7A"),
        _s("Camel", "#C19A6B", "Chocolate", "#4E2A1E", "Khaki", "#B5A07A", "Cream", "#F3E5C3"),
        _s("Burnt Orange", "#CC5500", "Forest Green", "#2E5E3E", "Brick", "#9C4A2F"),
        _s("Fuchsia", "#D6247D", "Icy Blue", "#CFE6F2", "Black", "#111111", "Lavender", "#C8B6E2"),
        ("Yellow gold", "Bronze", "Copper"),
        ("Chocolate and camel replace black as your darkest neutrals.",),
    ),
    Season(
        "Deep Autumn", "Autumn", "deep", "Deep and opulent",
        "Deep and warm. Rich jewel-earth tones and strong darks give you presence.",
        _s("Deep Teal", "#0F5E5E", "Burgundy", "#7B1E35", "Olive", "#556B2F", "Rust", "#A0401A",
           "Mustard", "#C9A227", "Forest Green", "#1F4D2E"),
        _s("Chocolate", "#3E2318", "Espresso", "#2B1A12", "Camel", "#C19A6B", "Olive Brown", "#5A4A2A"),
        _s("Tomato Red", "#C8361E", "Burnt Orange", "#CC5500", "Aubergine", "#4B2142"),
        _s("Pastel Pink", "#F8C8D4", "Powder Blue", "#B6D0E2", "Light Grey", "#C8C9CC", "Lavender", "#C8B6E2"),
        ("Antique gold", "Bronze", "Copper"),
        ("You carry dark, saturated colors that would overpower others.",),
    ),
    Season(
        "Deep Winter", "Winter", "deep", "Dramatic and deep",
        "Deep and cool. Dark, intense colors with crisp white contrast are your power look.",
        _s("Emerald", "#1E8A5A", "Ruby", "#9B1B30", "Sapphire", "#1F3F8F", "Deep Purple", "#4B1F6F",
           "Pine", "#1F4D3A", "True Red", "#C8102E"),
        _s("Black", "#111111", "Charcoal", "#36454F", "Navy", "#1B2A4A", "Pure White", "#FAFAFA"),
        _s("Fuchsia", "#C2187F", "Icy Pink", "#F4D6E4", "Royal Blue", "#2C4FB8"),
        _s("Camel", "#C19A6B", "Mustard", "#D4A017", "Peach", "#F7B994", "Sage", "#9CAF88"),
        ("Silver", "Platinum", "White gold"),
        ("Black is genuinely your color; add one jewel tone.",),
    ),
    Season(
        "Cool Winter", "Winter", "cool", "Icy and crisp",
        "Cool first: blue-based, clear colors and icy tints sharpen your features.",
        _s("Royal Blue", "#2C4FB8", "Magenta", "#C2187F", "Emerald", "#1E8A5A", "Icy Blue", "#CFE6F2",
           "Blue Red", "#C41E3A", "Violet", "#6A3D9A"),
        _s("Black", "#111111", "Charcoal", "#36454F", "Pure White", "#FAFAFA", "Navy", "#1B2A4A"),
        _s("Fuchsia", "#D6247D", "Icy Lavender", "#E3DAF2", "Turquoise", "#14B8B0"),
        _s("Orange", "#F28C28", "Camel", "#C19A6B", "Mustard", "#D4A017", "Rust", "#B7410E"),
        ("Silver", "Platinum", "White gold"),
        ("Choose stark white over cream, and silver over gold.",),
    ),
    Season(
        "Bright Winter", "Winter", "bright", "Electric and bold",
        "Clear, cool and high-contrast. Saturated brights and black-and-white pairings are made for you.",
        _s("Hot Pink", "#F2569B", "Cobalt", "#1F4FA8", "Emerald", "#1E8A5A", "True Red", "#D2042D",
           "Electric Purple", "#8A2BE2", "Lemon", "#FFF06A"),
        _s("Black", "#111111", "Pure White", "#FAFAFA", "Charcoal", "#36454F", "Navy", "#1B2A4A"),
        _s("Turquoise", "#14B8B0", "Icy Blue", "#CFE6F2", "Fuchsia", "#D6247D"),
        _s("Dusty Rose", "#C9909A", "Khaki", "#B5A07A", "Mushroom", "#B8A99A", "Rust", "#B7410E"),
        ("Silver", "Platinum"),
        ("Muted, greyed colors look tired on you; go clear and saturated.",),
    ),
]}

# (family, dominant characteristic) -> season
_BY_FAMILY_AND_DOMINANT = {(s.family, s.dominant): s for s in SEASONS.values()}
_FAMILY_AXES = {  # which characteristics define each family's three sub-seasons
    "Spring": ("warm", "light", "bright"),
    "Summer": ("cool", "light", "soft"),
    "Autumn": ("warm", "deep", "soft"),
    "Winter": ("cool", "deep", "bright"),
}


def season_for(family: str, dominant: str) -> Season:
    return _BY_FAMILY_AND_DOMINANT[(family, dominant)]


def family_axes(family: str) -> tuple[str, str, str]:
    return _FAMILY_AXES[family]


def get_season(name: str | None) -> Season | None:
    if not name:
        return None
    if name in SEASONS:
        return SEASONS[name]
    # Legacy 4-season profiles ("Autumn") map to the family's warm/cool representative.
    legacy = {"Spring": "Warm Spring", "Summer": "Cool Summer", "Autumn": "Warm Autumn", "Winter": "Cool Winter"}
    return SEASONS.get(legacy.get(name, ""))
