"""Read the published Telkom Test.rar split as images. Do not use for training."""
import argparse
import json
from pathlib import Path

from PIL import Image, ImageOps

LABELS = "nol satu dua tiga empat lima enam tujuh delapan sembilan".split()


def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("test_dir", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    samples = []
    for label, name in enumerate(LABELS):
        paths = sorted((args.test_dir / f"{name}_test").glob("*.png"))
        if len(paths) != 20:
            raise ValueError(f"{name}: expected 20 images, got {len(paths)}")
        for path in paths:
            with Image.open(path) as source:
                raw = ImageOps.invert(source.convert("RGB").convert("L"))
            bounds = raw.point(lambda value: 255 if value >= 45 else 0).getbbox()
            if bounds is None:
                raise ValueError(f"Empty digit: {path}")
            glyph = raw.crop(bounds)
            width = max(2, round(23 * glyph.width / glyph.height))
            if width > 70:
                raise ValueError(f"Unexpected digit aspect ratio: {path}")
            glyph = glyph.resize((width, 23), Image.Resampling.LANCZOS)
            samples.append({"label": label, "name": f"{name}/{path.name}", "width": width, "pixels": list(glyph.getdata())})
    args.output.write_text(json.dumps(samples, separators=(",", ":")) + "\n", encoding="utf-8")


if __name__ == "__main__":
    run()
