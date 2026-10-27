# Research behind TUFF's colour science and recommendations

What we read, what it says, and where it lives in the code. Thresholds set by inspection rather than by a paper are marked as such.

## Skin colour measurement

**Thong & Xiang, "Beyond Skin Tone: A Multidimensional Measure of Apparent Skin Color", ICCV 2023** ([arXiv 2309.05148](https://arxiv.org/abs/2309.05148), [Sony AI summary](https://ai.sony/blog/beyond-skin-tone-a-multidimensional-measure-of-apparent-skin-color)).
Skin colour should be described by two dimensions: perceptual lightness L\* and hue angle h\* = atan(b\*/a\*) (red ↔ yellow), not by a single light-to-dark scale. They k-means skin pixels into 5 clusters, take each cluster's histogram mode (Sturges bins), keep the 3 lightest clusters (dropping shadows and facial hair) and size-weight them. Under relighting, L\* moved by up to about 6 points while h\* stayed stable. Thresholds: L\* 60 (light/dark), h\* 55° (red/yellow).
→ `skin_tone_analyzer._measure_skin` follows this procedure. Warmth comes from h\* with 55° as the neutral point, weighted by chroma because hue is unreliable for near-grey pixels. Value comes from L\*.
→ *Deviation:* the paper's L\*=60 is a population split for dataset analysis. With this measurement our white-balanced photos sit higher, so the value midpoint is **68, set by inspection** and still to be fitted on labelled portraits.

**Critiques of ITA°** ([arXiv 2410.21005](https://arxiv.org/abs/2410.21005); Thong & Xiang): ITA uses only L\* and b\* and correlates poorly with expert ratings.
→ ITA° is still reported, as a familiar dermatology category, but it no longer drives the season.

**Hierarchical seasonal classification, JICCE 2025** ([paper](https://www.jicce.org/journal/view.html?uid=1349&vmd=Full)): a season model followed by per-season subtone models (ConvNeXt, Deep Armocromia data) reaches 70% for 4 seasons and about 68% for subtones. Prior methods reach 51–55%. Errors stay mostly within a temperature: Spring↔Autumn, Summer↔Winter.
→ `SkinToneAnalyzer.analyze` decides temperature first when the undertone is clear, then picks the season within it. Alternatives come from the same temperature.
→ *Honesty:* even a trained deep model reaches about 70%. TUFF reports a confidence and alternatives instead of a single verdict.

## Garment colour and harmony

**Henry & Westland, "Investigation of Complementary Colour Harmony in CIELAB", AIC 2007** ([PDF listing](https://www.academia.edu/1425236/Investigation_of_Complementary_Colour_Harmony_in_CIELAB_Colour_Space)): hues opposite each other in CIELAB are not reliably perceived as complementary.
→ `color_harmony.py` scores complementary pairs cautiously, and judges complementarity in CIELAB rather than on a paint wheel. Royal blue and orange are about 130° apart in CIELAB, so they aren't treated as complements.

**Learning fashion compatibility across categories** ([arXiv 1905.03703](https://arxiv.org/pdf/1905.03703)) and **Learning Color Compatibility in Fashion Outfits** ([arXiv 2007.02388](https://arxiv.org/abs/2007.02388)): explicit colour features improve compatibility prediction; well-rated outfits lean on neutrals or colours close to the hero piece; garment palettes are extracted with k-means in Lab.
→ Harmony ranking: fashion neutral > analogous ≈ tone-on-tone with value contrast > muted complement > bold complement > clash. Neutrals include low-chroma earth tones and navy (**thresholds by inspection**). Used by "Complete the look" (`outfit_builder.py`).
→ `garment_color.py` extracts the dominant colour with weighted k-means in CIELAB after removing background and skin. Against Myntra's own colour labels on 30 live products, the shade visibly matched in about 24; the colour *name* agreed with the store label in 13 (the labels are coarse, and printed fabrics are the main failure).

**Colour-harmony evaluation for clothing, Fashion and Textiles 2025** ([s40691-025-00433-y](https://fashionandtextiles.springeropen.com/articles/10.1186/s40691-025-00433-y)): predicts harmony from L\*, C\*, h\* and garment area proportions. Not read in full (the publisher requires a login). A good next step is weighting harmony by garment area.

## Learning taste from swipes

**Conversational Thompson Sampling for cold-start users** (Li et al., [arXiv 2005.12979](https://arxiv.org/abs/2005.12979)): treat attributes as bandit arms and use Thompson sampling to balance asking/exploring against recommending.
→ `adaptive_deck.py`: colour-family and category arms with Beta posteriors (love counts double, 21-day recency half-life). Palette fit acts as a prior worth two pseudo-swipes. Cards are tagged *For you* or *New direction*, with at most 3 explorations per deck. Each request also searches one colour family the user hasn't been shown, so the deck can discover tastes the palette prior would never surface.
→ Measured live: after 30 swipes, a simulated user who loves greens and olives went from 2/10 to 8/10 such cards per deck.

## Design references

The brief asked for a Dribbble audit, but no specific shots were given, Dribbble pages render client-side (not readable without a browser), and the browser tool was unavailable. Patterns were taken from documented luxury-fashion app case studies ([Contra: high-converting luxury fashion app](https://contra.com/p/c63R6eQ2-high-converting-luxury-fashion-app-uiux-overview), [Contra: Evon Secret](https://contra.com/p/FbbRsLNE-luxury-women-fashion-app-ui-ux-design-for-evon-secret)): thumb-reach bottom navigation, image-led minimal layouts, favourites and browse-by-style. Applied: mobile tab bar, product quick view, category chips.
