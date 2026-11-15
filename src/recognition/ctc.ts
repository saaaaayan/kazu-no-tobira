type Prefix = { blank: number; digit: number };

function add(a: number, b: number): number {
  if (a === -Infinity) return b;
  if (b === -Infinity) return a;
  return Math.max(a, b) + Math.log1p(Math.exp(-Math.abs(a - b)));
}

function total(prefix: Prefix): number {
  return add(prefix.blank, prefix.digit);
}

/** Prefix beam search sums alignments of the same string, including repeated digits separated by blank. */
export function decodeCtc(frames: readonly (readonly number[])[], limit = 8) {
  let beam = new Map<string, Prefix>([['', { blank: 0, digit: -Infinity }]]);
  for (const frame of frames) {
    const next = new Map<string, Prefix>();
    const max = Math.max(...frame);
    const normalizer = max + Math.log(frame.reduce((sum, value) => sum + Math.exp(value - max), 0));
    function accumulate(text: string, state: keyof Prefix, score: number) {
      const prefix = next.get(text) ?? { blank: -Infinity, digit: -Infinity };
      prefix[state] = add(prefix[state], score);
      next.set(text, prefix);
    }
    for (const [text, prefix] of beam) {
      const sum = total(prefix);
      accumulate(text, 'blank', sum + frame[10] - normalizer);
      for (let digit = 0; digit < 10; digit++) {
        const label = String(digit);
        const score = frame[digit] - normalizer;
        if (text.endsWith(label)) {
          accumulate(text, 'digit', prefix.digit + score);
          accumulate(text + label, 'digit', prefix.blank + score);
        } else {
          accumulate(text + label, 'digit', sum + score);
        }
      }
    }
    beam = new Map([...next].sort((a, b) => total(b[1]) - total(a[1])).slice(0, limit));
  }
  return [...beam].map(([value, prefix]) => ({ value, score: Math.exp(total(prefix)) }));
}
