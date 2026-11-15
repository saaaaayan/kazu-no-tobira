"""Train the whole-line OCR model from MNIST and the UJI training partition."""
import argparse
import json
from pathlib import Path

import numpy as np
import torch
from torch import nn
from torch.nn import functional as F

from importlib import import_module
distort = import_module("train-digits").distort

HEIGHT = 28
WIDTH = 144


def compose(glyphs, labels, rng):
    lines = np.zeros((len(labels), HEIGHT, WIDTH), dtype=np.float32)
    aligned = np.full((len(labels), WIDTH // 2), 10, dtype=np.int64)
    for line, images, digits, frames in zip(lines, glyphs, labels, aligned):
        x = int(rng.integers(3, 10))
        for glyph, digit in zip(images, digits):
            ys, xs = np.nonzero(glyph > 0.12)
            if not len(xs):
                raise ValueError("Empty training digit")
            glyph = glyph[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
            height = int(rng.integers(16, 24))
            width = max(3, min(25, round(height * glyph.shape[1] / glyph.shape[0] * rng.uniform(0.82, 1.18))))
            y_index = np.linspace(0, glyph.shape[0] - 1, height).round().astype(int)
            x_index = np.linspace(0, glyph.shape[1] - 1, width).round().astype(int)
            y = int(rng.integers(2, HEIGHT - height - 1))
            patch = line[y:y + height, x:x + width]
            np.maximum(patch, glyph[np.ix_(y_index, x_index)][:, :patch.shape[1]], out=patch)
            center = (x + width // 2) // 2
            frames[center - 1:center + 2] = digit
            x += width + int(rng.integers(-3, 8))
    return torch.from_numpy(lines), torch.from_numpy(aligned)


def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("mnist", type=Path)
    parser.add_argument("pen", type=Path)
    parser.add_argument("--steps", type=int, default=1600)
    args = parser.parse_args()
    torch.set_num_threads(4)
    torch.manual_seed(146)
    rng = np.random.default_rng(642)
    augment_rng = torch.Generator().manual_seed(301)
    with np.load(args.mnist, allow_pickle=False) as data:
        images = data["x_train"].astype(np.float32) / 255
        labels = data["y_train"]

    pen = [sample for sample in json.loads(args.pen.read_text(encoding="utf-8")) if sample["writer"].startswith("trn_")]
    pen_images = np.array([sample["pixels"] for sample in pen], dtype=np.float32).reshape(-1, 28, 28) / 255
    pen_labels = np.array([sample["digit"] for sample in pen])
    layers = nn.ModuleList([
        nn.Conv1d(14, 40, 5, padding=2),
        nn.Conv1d(40, 48, 5, dilation=2, padding=4),
        nn.Conv1d(48, 48, 5, dilation=3, padding=6),
        nn.Conv1d(48, 11, 1),
    ])
    optimizer = torch.optim.AdamW(layers.parameters(), lr=0.002)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, args.steps, eta_min=0.00025)
    batch = 64
    class_weight = torch.ones(11)
    class_weight[10] = 0.20
    input_lengths = torch.full((batch,), WIDTH // 2, dtype=torch.long)

    for step in range(args.steps):
        length = int(rng.integers(1, 5))
        corpus, targets = (pen_images, pen_labels) if step % 3 == 0 else (images, labels)
        index = rng.integers(len(corpus), size=(batch, length))
        glyphs = torch.from_numpy(corpus[index].reshape(-1, 1, 28, 28))
        if step % 4 != 0:
            glyphs = distort(glyphs, augment_rng)
        lines, aligned = compose(glyphs.numpy().reshape(batch, length, 28, 28), targets[index], rng)
        out = F.avg_pool2d(lines.unsqueeze(1), 2).squeeze(1)
        for layer in layers[:-1]:
            out = F.relu(layer(out))
        logits = layers[-1](out)
        emissions = logits.permute(2, 0, 1).log_softmax(2)
        lengths = torch.full((batch,), length, dtype=torch.long)
        ctc = F.ctc_loss(emissions, torch.from_numpy(targets[index].astype(np.int64)), input_lengths, lengths, blank=10)
        aligned_loss = F.cross_entropy(logits, aligned, weight=class_weight)
        loss = aligned_loss if step < 400 else ctc + 0.25 * aligned_loss
        optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(layers.parameters(), 5)
        optimizer.step()
        scheduler.step()
        if (step + 1) % 200 == 0:
            print(f"{step + 1}/{args.steps}: CTC loss {loss.item():.3f}", flush=True)

    output = Path(__file__).resolve().parents[1] / "src" / "recognition" / "sequence-model.json"
    weights = [{
        "kernel": layer.kernel_size[0], "dilation": layer.dilation[0],
        "weights": np.round(layer.weight.detach().numpy().astype("float64"), 5).reshape(layer.out_channels, -1).tolist(),
        "bias": np.round(layer.bias.detach().numpy().astype("float64"), 5).tolist(),
    } for layer in layers]
    output.write_text(json.dumps(weights, separators=(",", ":")) + "\n", encoding="utf-8")


if __name__ == "__main__":
    run()
