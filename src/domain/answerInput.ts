/** Applies a digit-panel action to the single shared answer value. */
export function applyNumberPadKey(current: string, key: string): string {
  if (key === '全部消す') return '';
  if (key === 'けす') return current.slice(0, -1);
  if (/^[0-9]$/.test(key)) return current + key;
  return current;
}
