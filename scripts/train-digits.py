"""Train the browser digit CNN from the Keras MNIST archive (PyTorch CPU)."""
import argparse
import json
from pathlib import Path

import numpy as np
import torch
from torch import nn
from torch.nn import functional as F


def distort(images, rng):
    n = len(images)
    affine = torch.eye(2, 3).repeat(n, 1, 1)
    angle = torch.rand(n, generator=rng) * 0.8 - 0.4
    stretch = torch.rand(n, 2, generator=rng) * 0.45 + 0.78
    affine[:, 0, 0] = angle.cos() * stretch[:, 0]
    affine[:, 1, 1] = angle.cos() * stretch[:, 1]
    affine[:, 0, 1] = -angle.sin() + torch.rand(n, generator=rng) * 0.32 - 0.16
    affine[:, 1, 0] = angle.sin()
    affine[:, :, 2] = torch.rand(n, 2, generator=rng) * 0.20 - 0.10
    grid = F.affine_grid(affine, images.shape, align_corners=False)
    noise = torch.rand(n, 2, 4, 4, generator=rng) * 0.13 - 0.065
    grid += F.interpolate(noise, size=(28, 28), mode="bicubic", align_corners=False).permute(0, 2, 3, 1)
    warped = F.grid_sample(images, grid, align_corners=False)
    thickness = torch.rand(n, 1, 1, 1, generator=rng)
    thick = (warped + F.max_pool2d(warped, 3, stride=1, padding=1)) / 2
    thin = warped * (0.5 + 0.5 * -F.max_pool2d(-warped, 3, stride=1, padding=1))
    return torch.where(thickness < 0.25, thick, torch.where(thickness > 0.75, thin, warped))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mnist", type=Path)
    parser.add_argument("--pen", type=Path, required=True)
    parser.add_argument("--epochs", type=int, default=10)
    args = parser.parse_args()
    torch.manual_seed(42)
    torch.set_num_threads(4)
    rng = torch.Generator().manual_seed(120)
    with np.load(args.mnist, allow_pickle=False) as data:
        train, test = [torch.from_numpy(data[key]).float().unsqueeze(1) / 255 for key in ("x_train", "x_test")]
        labels, expected = [torch.from_numpy(data[key]).long() for key in ("y_train", "y_test")]

    pen = [sample for sample in json.loads(args.pen.read_text(encoding="utf-8")) if sample["writer"].startswith("trn_")]
    strokes = torch.tensor([sample["pixels"] for sample in pen]).float().reshape(-1, 1, 28, 28) / 255
    train = torch.cat([train, strokes.repeat(8, 1, 1, 1)])
    labels = torch.cat([labels, torch.tensor([sample["digit"] for sample in pen]).repeat(8)])

    model = nn.Sequential(
        nn.Conv2d(1, 8, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
        nn.Conv2d(8, 16, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
        nn.Flatten(), nn.Linear(16 * 7 * 7, 32), nn.ReLU(), nn.Linear(32, 10),
    )
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.002)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, args.epochs)
    for epoch in range(args.epochs):
        for batch in torch.randperm(len(train), generator=rng).split(256):
            images = train[batch]
            if torch.rand((), generator=rng) > 0.20:
                images = distort(images, rng)
            optimizer.zero_grad()
            F.cross_entropy(model(images), labels[batch]).backward()
            optimizer.step()
        scheduler.step()
        print(f"Epoch {epoch + 1}/{args.epochs}", flush=True)

    output = Path(__file__).resolve().parents[1] / "src" / "recognition" / "digit-model.json"
    layers = [
        {
            "weights": np.round(layer.weight.detach().numpy().astype("float64"), 5).reshape(layer.weight.shape[0], -1).tolist(),
            "bias": np.round(layer.bias.detach().numpy().astype("float64"), 5).tolist(),
        }
        for layer in model if isinstance(layer, (nn.Conv2d, nn.Linear))
    ]
    output.write_text(json.dumps(layers, separators=(",", ":")) + "\n", encoding="utf-8")

    with torch.inference_mode():
        eval_rng = torch.Generator().manual_seed(20261115)
        for name, images in (("held-out MNIST", test), ("distorted MNIST", distort(test, eval_rng))):
            probabilities = torch.cat([model(batch).softmax(1) for batch in images.split(256)])
            best = probabilities.topk(2, dim=1)
            accepted = (best.values[:, 0] >= 0.70) & (best.values[:, 0] - best.values[:, 1] >= 0.25)
            correct = best.indices[:, 0] == expected
            print(f"{name}: top-1 {correct.float().mean():.2%}, accepted {accepted.float().mean():.2%}, "
                  f"accepted accuracy {correct[accepted].float().mean():.2%}")


if __name__ == "__main__":
    main()
