export type GradeResult =
  | { status: 'invalid' }
  | { status: 'correct' | 'incorrect'; submitted: number };

export function gradeInteger(expected: number, input: string): GradeResult {
  const normalized = input.trim().replace(/[０-９]/g, digit =>
    String(digit.charCodeAt(0) - '０'.charCodeAt(0)),
  );
  if (!/^\d+$/.test(normalized)) return { status: 'invalid' };

  const submitted = Number(normalized);
  if (!Number.isSafeInteger(submitted)) return { status: 'invalid' };
  return { status: submitted === expected ? 'correct' : 'incorrect', submitted };
}
