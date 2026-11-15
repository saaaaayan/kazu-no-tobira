"""Train the bundled digit classifier. Pass an MNIST .npz file from Keras."""
import argparse
import json
from pathlib import Path

import numpy as np
from sklearn.neural_network import MLPClassifier


def features(images):
    return (images.astype(np.float32) / 255).reshape(-1, 14, 2, 14, 2).mean(axis=(2, 4)).reshape(-1, 196)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mnist", type=Path)
    args = parser.parse_args()
    with np.load(args.mnist, allow_pickle=False) as dataset:
        train = features(dataset["x_train"])
        test = features(dataset["x_test"])
        train_labels = dataset["y_train"]
        test_labels = dataset["y_test"]

    model = MLPClassifier(hidden_layer_sizes=(64,), batch_size=256, max_iter=24, random_state=42)
    model.fit(train, train_labels)

    layers = []
    for weights, bias in zip(model.coefs_, model.intercepts_):
        layers.append({
            "weights": np.round(weights.T, 5).tolist(),
            "bias": np.round(bias, 5).tolist(),
        })
    output = Path(__file__).resolve().parents[1] / "src" / "recognition" / "digit-model.json"
    output.write_text(json.dumps(layers, separators=(",", ":")) + "\n", encoding="utf-8")
    probabilities = model.predict_proba(test)
    ordered = np.sort(probabilities, axis=1)
    accepted = (ordered[:, -1] >= 0.65) & (ordered[:, -1] - ordered[:, -2] >= 0.20)
    correct = probabilities.argmax(axis=1) == test_labels
    print(f"MNIST test accuracy: {correct.mean():.2%}")
    print(f"Threshold acceptance: {accepted.mean():.2%}; accuracy among accepted: {correct[accepted].mean():.2%}")


if __name__ == "__main__":
    main()
