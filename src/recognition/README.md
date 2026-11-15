## Current Web engine

The Web adapter combines the existing single-digit CNN, a stroke-partition search scored by that CNN, and a whole-line temporal CNN trained with [CTC](https://www.cs.utoronto.ca/~graves/icml_2006.pdf). The old adapter merged strokes with overlapping horizontal spans before classifying each group. That made two touching digits irrecoverable once grouped. The new adapter uses the old path for clearly separated ink, and considers several stroke partitions and whole-line candidates for wide groups. The two recognizers must agree strongly to auto-fill a longer result. Close competing lengths are shown as choices instead of silently auto-filling a shorter result. The exercise and its correct answer are outside the recognizer contract.

The line raster preserves aspect ratio, normalizes height and position, and anti-aliases interpolated strokes. Training varies spacing, overlap, rotation, shear, thickness and local warping. Stroke geometry is used to generate alternative groupings. Within-stroke point order reconstructs each line. Timestamps are retained for future online models, and the current classifiers do not infer from timing or stroke speed.

The single drawing area and 650 ms idle delay apply to all results. The grading button is required for any learning record. Recognition costs no API fees and runs locally without sending or persisting pen traces. See the license and attribution below. The same CC BY-SA 3.0 distribution terms apply to the new sequence weights.

### Independent test partitions

The UJI dataset's published test split contains 400 isolated pen digits, 40 per digit across 20 writers. Two- and three-digit lines were assembled from those digits, 400 lines per length and condition. The difficult condition changes size, baseline, slant, local shape and overlap. These are tests of recognition on real individual strokes; multi-digit examples are composed, not naturally recorded sequences. UJI's test writers were excluded from training. We used the benchmark to compare the standalone sequence model and combined engine. It is not a first-grade or production acceptance test.

| Condition | Length | First candidate exact, old → new | Wrong auto-fill, old → new | User action needed, old → new | New mean / p95 / max ms |
|---|---:|---:|---:|---:|---:|
| Spaced | 1 | 383 → 383 | 11 → 11 | 23 → 33 | 1.95 / 5.77 / 17.09 |
| Spaced | 2 | 368 → 368 | 20 → 20 | 43 → 60 | 6.92 / 15.70 / 52.53 |
| Spaced | 3 | 353 → 353 | 23 → 21 | 58 → 77 | 8.74 / 18.47 / 24.23 |
| Distorted/overlap | 1 | 381 → 381 | 13 → 12 | 25 → 36 | 2.20 / 5.99 / 7.50 |
| Distorted/overlap | 2 | 34 → 281 | 262 → 42 | 368 → 350 | 8.20 / 13.86 / 23.74 |
| Distorted/overlap | 3 | 0 → 226 | 229 → 14 | 400 → 399 | 12.58 / 19.06 / 36.21 |

All counts are out of 400 per row. First candidate includes choices that require a tap. A wrong auto-fill is an incorrect value offered directly in the answer field, not an automatically graded attempt. User action needed includes rejected cases, candidate selection and wrong auto-fill. Node.js timings include rasterization and inference, excluding the 650 ms wait. Single-digit error counts for 0 through 9 were 1, 3, 2, 0, 3, 1, 1, 3, 2, 1 without perturbation and 1, 3, 1, 2, 7, 1, 2, 0, 1, 1 with perturbation, each out of 40. Example errors were 2 → 8, 1 → 7, 4 → 6, 60 → 0 and 841 → 84.

We also used the [Telkom public CC0 Paint test split](https://doi.org/10.34820/FK2/KQX7BX), Mikogizka Satria Kartika, 2023. It contains 200 Western digit images, 20 per label, and was not used for training. The repository description does not verify the writers' ages. Static-image evaluation is separate from the pen-trajectory benchmark: with known digit boundaries the old CNN scored 134/200 single digits. The standalone sequence model scored 77/200 single digits, 25/200 composed two-digit images and 6/200 composed three-digit images. The combined Web engine uses stroke geometry and these images cannot measure its full path. The two original images labeled 234 and 568 were unavailable in the workspace. New Web mouse checks recognized spaced 234 and 568, and a deliberately distorted overlapping 568 produced candidates 8 and 58 without auto-filling. That failure remains open. The 98% target is unmet.

### Engine options

| Option | Accuracy and speed evidence | Integration, operating cost and data |
|---|---|---|
| Single-digit CNN alone | Fast and strongest on the isolated Paint test. Hard span grouping drops touching digits. | Existing local TypeScript inference, no API fees, weights CC BY-SA 3.0. |
| Combined CNN + CTC (selected) | Preserves spaced top-1 scores and improves overlap scores, with slower inference and frequent intervention. | Local TypeScript and downloadable app assets, no service dependencies. |
| [Chrome Handwriting Recognition API](https://developer.chrome.com/docs/web-platform/handwriting-recognition) | Online ink, with platform-specific recognition. Accuracy and speed on these samples are unmeasured. | Feature detection required. Chrome documents a limited ChromeOS implementation. Local processing, no service contract. |
| [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/) / [TensorFlow.js](https://github.com/tensorflow/tfjs) | Inference runtimes; recognition accuracy depends on weights and training data. No same-model speed comparison was run. | MIT / Apache-2.0, respectively. Model export, runtime assets and device profiling required. Can run locally. |
| [ML Kit Digital Ink](https://developers.google.com/ml-kit/vision/digital-ink-recognition/) | Uses ordered strokes and can run offline after model download. No results on this benchmark. | Free native SDK with Android/iOS integration and an Expo native build. No Web adapter. |
| [MyScript iink Cloud](https://developer.myscript.com/pricing/) | Commercial online handwriting recognition. Accuracy and latency on these samples are unmeasured. | Development quota, production contract, network round trips and remote ink processing. No account or contract was opened. |

The next acceptance test needs separately collected, appropriately authorized first-grade stroke data for all 0–9 and naturally written strings. Keep whole writers out of training and use the same samples to compare a stronger online ink model, native ML Kit, and a commercial trial only if authorized. Android and iOS are still using the native fallback.

```sh
python scripts/train-sequences.py mnist.npz pen-digits.json --steps 2200
node scripts/evaluate-sequences.mjs ujipenchars2.txt
python scripts/prepare-paint-evaluation.py path/to/Test paint-evaluation.json
node scripts/evaluate-paint.mjs paint-evaluation.json
```

## Single-digit classifier history

## Browser recognition

The Web adapter runs a local convolutional neural network with two convolution and pooling layers and two dense layers. It joins consecutive coordinates within each stroke, then rasterizes, scales and centers each digit in a 28 × 28 image. Pen order is used for reconstructing the lines. Timestamps travel with the points for future digital-ink adapters, and are not a classifier feature. The Web adapter accepts one writing surface. It groups strokes with overlapping horizontal spans, then recognizes the groups from left to right. Neighboring digits need some horizontal space. Touching digits may be merged; the previous classifier benchmark below measures isolated digits and does not measure segmentation.

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

Browser mouse tests recognized 5, 12 and 108 on the shared surface. Grading after switching input modes was also checked, and the layout and mouse input were tested at 390, 820 and 1280 px. These do not establish a population-level mouse, finger, stylus, or first-grade accuracy claim. Distorted 7→2, 9→8 and 6→5 remain prominent errors.

## Other adapters

- [Chrome Handwriting Recognition API](https://developer.chrome.com/docs/web-platform/handwriting-recognition) consumes strokes and optional timing locally where supported. The documented ChromeOS support and feature detection requirements make it unsuitable as the sole Web engine.
- [MyScript iink Cloud](https://developer.myscript.com/docs/cloud/4.5/overview/introduction/) recognizes digital ink using a remote service. Its [published pricing](https://developer.myscript.com/pricing/) offers 2,000 development requests and requires a contract for deployment. Adopting it requires approval and review of ink transmission, retention and processing terms.
- [ML Kit Digital Ink Recognition](https://developers.google.com/ml-kit/vision/digital-ink-recognition/) is a native Android/iOS option with on-device recognition after model download. The `DigitRecognizer` contract supports a future native adapter. The current native fallback directs learners to keyboard or number panel.
