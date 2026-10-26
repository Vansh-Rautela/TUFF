from pydantic import BaseModel


class Swatch(BaseModel):
    name: str
    hex: str


class Palette(BaseModel):
    signature: list[Swatch]
    neutrals: list[Swatch]
    accents: list[Swatch]
    avoid: list[Swatch]
    metals: list[str]


class SeasonResult(BaseModel):
    name: str
    family: str
    dominant: str
    tagline: str
    description: str
    palette: Palette
    style_notes: list[str]
    confidence: float


class AlternativeSeason(BaseModel):
    name: str
    family: str
    likelihood: float


class SkinReading(BaseModel):
    hex: str
    lab: list[float]
    ita: float
    depth: str
    undertone: str
    hue_angle: float
    chroma: float
    pixels_measured: int


class FeatureReading(BaseModel):
    eyes_hex: str | None
    brows_hex: str | None
    contrast: str
    contrast_value: float


class Axes(BaseModel):
    warmth: int
    lightness: int
    clarity: int


class QualityReport(BaseModel):
    score: float
    issues: list[str]
    white_balance: str
    detector: str
    faces_found: int


class ColorAnalysis(BaseModel):
    season: SeasonResult
    alternatives: list[AlternativeSeason]
    skin: SkinReading
    features: FeatureReading
    axes: Axes
    quality: QualityReport
    face_box: list[int]
    disclaimer: str
    elapsed_ms: int = 0
