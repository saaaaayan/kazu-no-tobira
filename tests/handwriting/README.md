# Handwriting recognition reference samples

These are faithful line-traced SVG reconstructions of two real user-submitted screenshots (not synthetic ideal digits). Their recognized ground-truth strings are **234** and **568**, respectively.

- `reference-234.svg` — expected: `234`
- `reference-568.svg` — expected: `568`

They preserve approximately the original visible stroke layout, dimensions and severe distortions; they **are not the original PNG bytes or time-series pen strokes**. Treat them as rasterizable image samples rather than digital-ink stroke data. Do not claim a model has successfully recognized them without running inference. Do not use answer correctness or adjacent digits as OCR hints.

Test these plus independent, genuine child-written examples. Evaluate exact-match accuracy and error modes, not just clean handwritten fonts.
