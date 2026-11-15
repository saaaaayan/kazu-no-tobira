import type { DigitInk, RecognitionResult } from './contracts.ts';
import { decodeCtc } from './ctc.ts';
import { lineHeight, rasterizeLine, type LineImage } from './lineRaster.ts';
import model from './sequence-model.json' with { type: 'json' };

export function rankLine({ width, pixels }: LineImage) {
  const steps = width / 2;
  let features = new Float32Array((lineHeight / 2) * steps);
  for (let row = 0; row < lineHeight / 2; row++) {
    for (let t = 0; t < steps; t++) {
      const i = row * 2 * width + t * 2;
      features[row * steps + t] = (pixels[i] + pixels[i + 1] + pixels[i + width] + pixels[i + width + 1]) / 4;
    }
  }
  for (const [layerIndex, { weights, bias, kernel, dilation }] of model.entries()) {
    const output = new Float32Array(weights.length * steps);
    const padding = Math.floor(kernel / 2) * dilation;
    const inChannels = features.length / steps;
    for (let channel = 0; channel < weights.length; channel++) {
      const weight = weights[channel];
      for (let t = 0; t < steps; t++) {
        let sum = bias[channel];
        for (let input = 0; input < inChannels; input++) {
          for (let k = 0; k < kernel; k++) {
            const offset = t + k * dilation - padding;
            if (offset >= 0 && offset < steps) sum += features[input * steps + offset] * weight[input * kernel + k];
          }
        }
        output[channel * steps + t] = layerIndex === model.length - 1 ? sum : Math.max(0, sum);
      }
    }
    features = output;
  }
  const frames = Array.from({ length: steps }, (_, t) => Array.from({ length: 11 }, (_, label) => features[label * steps + t]));
  return decodeCtc(frames);
}

export function recognizeSequence(ink: DigitInk): RecognitionResult {
  if (!ink.drawing.some(stroke => stroke.length)) return { status: 'empty' };
  const image = rasterizeLine(ink);
  if (!image) return { status: 'uncertain' };
  return decideSequence(rankLine(image));
}

export function decideSequence(ranked: ReturnType<typeof rankLine>): RecognitionResult {
  const [best, runnerUp] = ranked;
  if (!best?.value) return { status: 'uncertain' };
  if (best.score >= 0.78 && best.score - (runnerUp?.score ?? 0) >= 0.35) {
    return { status: 'recognized', value: best.value };
  }
  return { status: 'ambiguous', candidates: ranked.filter(candidate => candidate.value).slice(0, 3).map(candidate => candidate.value) };
}
