The Web adapter recognizes one handwritten digit per cell, using an on-device multilayer perceptron. It rasterizes the strokes locally and exposes tentative results for review. No API, credentials, or network requests are used for recognition. The attempt store receives only the submitted answer and its grade. Pen strokes and recognition candidates are held in UI memory.

The bundled `digit-model.json` weights were trained on the MNIST training partition and are distributed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). MNIST is attributed to Yann LeCun, Corinna Cortes and Christopher J. C. Burges and derives from NIST data. See the [Keras dataset and license notes](https://keras.io/api/datasets/mnist/). The weights are trained parameters; the original dataset is not bundled.

To regenerate the weights, install NumPy 2.2.6 and scikit-learn 1.7.2 in a local Python environment and run `python scripts/train-digits.py path/to/mnist.npz` using the Keras MNIST download.

The held-out MNIST test partition contains 10,000 single-digit images. This training run scored 97.32% top-1 accuracy. The confidence gate accepted 97.53% of those images, with 98.42% accuracy among accepted images. These figures measure MNIST images and do not estimate accuracy for children using the app, different input devices, or complete multi-digit answers.

Expo selects `digitRecognizer.web.ts` for Web and `digitRecognizer.ts` for native. An iOS or Android adapter can implement the same `DigitRecognizer` contract and provide its own availability and inference.
