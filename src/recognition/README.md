## Browser recognition

The Web adapter runs a local convolutional neural network with two convolution and pooling layers and two dense layers. It joins consecutive coordinates within each stroke, then rasterizes, scales and centers each digit in a 28 × 28 image. Pen order is used for reconstructing the lines. Timestamps travel with the points for future digital-ink adapters, and are not a classifier feature.

After 650 ms without a new stroke, the latest ink is recognized. Manual edits, new strokes, and leaving the input cancel pending results. The Web adapter auto-fills only when each digit scores at least 0.70 and leads its runner-up by at least 0.25. Otherwise it may offer up to three full-answer candidates. These are model scores, not calibrated probabilities. The recognizer receives only ink and cell dimensions, with no access to the exercise or its correct answer. The learner can edit the answer and submits it with the normal grading button. Unresolved recognition cannot be graded in handwriting mode.

Recognition requires no account, API key or per-request fee. Ink and intermediate results stay in UI memory; only the submitted answer and grade follow the existing local learning history flow.

## Data, license and reproduction

The bundled `digit-model.json` contains trained weights and is distributed under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). It was trained on the training partitions of:

- [MNIST](https://keras.io/api/datasets/mnist/), attributed to Yann LeCun, Corinna Cortes and Christopher J. C. Burges, derived from NIST, CC BY-SA 3.0.
- [UJI Pen Characters (Version 2)](https://doi.org/10.24432/C5FG8S), Prat, Castro, Llorens, Marzal and Vilar, 2008, UCI Machine Learning Repository, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The digit trajectories were rasterized for training, using only writers in the published training partition.

Source datasets are not bundled. Training applies rotation, stretching, shear, small local warps, shifts and thickness changes. With NumPy 2.2.6, CPU PyTorch 2.7.1 and the downloaded data files:

```sh
node scripts/prepare-pen-digits.mjs ujipenchars2.txt pen-digits.json
python scripts/train-digits.py mnist.npz --pen pen-digits.json
git show 95fa8c9:src/recognition/digit-model.json > previous-model.json
node scripts/benchmark-digits.mjs pen-digits.json previous-model.json
```

## Evaluation

The benchmark used both repetitions of digits 0–9 from 20 held-out UJI stylus writers (400 digits). The distorted set reuses the same samples and adds rotation, skew, size changes and local warping after rasterization. It is a stress test, not another cohort. Inference timing measures Node.js classifier time after warm-up, excluding rasterization and the UI delay.

| Data | Previous MLP top-1 | CNN top-1 | Previous automatic coverage / accuracy among accepted | CNN automatic coverage / accuracy among accepted |
| --- | ---: | ---: | ---: | ---: |
| UJI stylus | 350/400 | 384/400 | 368/400 · 337/368 | 388/400 · 378/388 |
| UJI stylus, distorted | 266/400 | 343/400 | 329/400 · 240/329 | 357/400 · 323/357 |
| MNIST test images | 97.32% | 98.85% | 97.53% · 98.42% | 98.62% · 99.37% |

On UJI the new classifier took about 0.8 ms median and 1.3 ms p95 in the local Node.js run. Composing real single digits by writer and classifying them into left-to-right cells gave 36/40 for 10, 35/40 for 12, 37/40 for 20, and 35/40 for 100 (previously 20/40, 17/40, 34/40, and 19/40). These are highest-ranked exact matches, not separately collected multi-digit recordings. The two zeroes in 100 use different repetitions. See the script output for acceptance and confusion counts.

Browser mouse smoke tests recognized 12 and 100; narrow screen grading and history were also checked. These do not establish a population-level mouse, finger, stylus, or first-grade accuracy claim. Distorted 7→2, 9→8 and 6→5 remain prominent errors.

## Other adapters

- [Chrome Handwriting Recognition API](https://developer.chrome.com/docs/web-platform/handwriting-recognition) consumes strokes and optional timing locally where supported. The documented ChromeOS support and feature detection requirements make it unsuitable as the sole Web engine.
- [MyScript iink Cloud](https://developer.myscript.com/docs/cloud/4.5/overview/introduction/) recognizes digital ink using a remote service. Its [published pricing](https://developer.myscript.com/pricing/) offers 2,000 development requests and requires a contract for deployment. Adopting it requires approval and review of ink transmission, retention and processing terms.
- [ML Kit Digital Ink Recognition](https://developers.google.com/ml-kit/vision/digital-ink-recognition/) is a native Android/iOS option with on-device recognition after model download. The `DigitRecognizer` contract supports a future native adapter. The current native fallback directs learners to keyboard or number panel.
