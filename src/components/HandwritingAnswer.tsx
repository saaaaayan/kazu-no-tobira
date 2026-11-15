import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { normalizePoint, type Drawing, type Point } from '../domain/ink';
import digitRecognizer from '../recognition/digitRecognizer';
import type { RecognitionResult } from '../recognition/contracts';
import InkSurface from './InkSurface';

const size = { width: 90, height: 90 };
const failures = {
  empty: 'わくに すうじを かいてね。',
  gap: 'ひだりの わくから ひとつずつ かいてね。',
  uncertain: 'よみとれなかったよ。かきなおすか、ほかの 入力を つかってね。',
  unavailable: 'この たんまつでは キーボードか すうじパネルを つかってね。',
};

export default function HandwritingAnswer({ onApply, onDrawingChange }: {
  onApply: (value: string) => void;
  onDrawingChange: (active: boolean) => void;
}) {
  const [cells, setCells] = useState<Drawing[]>([[], []]);
  const [candidate, setCandidate] = useState<string>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [drawing, setDrawing] = useState(false);

  function drawingChange(active: boolean) {
    setDrawing(active);
    onDrawingChange(active);
  }

  function updateCell(index: number, drawing: Drawing) {
    setCells(previous => previous.map((cell, i) => i === index ? drawing : cell));
    setCandidate(undefined);
    setMessage('');
  }

  async function recognize() {
    setCandidate(undefined);
    setMessage('');
    setBusy(true);
    let result: RecognitionResult;
    try {
      result = await digitRecognizer.recognize(cells.map(drawing => ({ drawing, size })));
    } catch {
      result = { status: 'uncertain' };
    } finally {
      setBusy(false);
    }
    if (result.status === 'recognized') setCandidate(result.value);
    else setMessage(failures[result.status]);
  }

  if (!digitRecognizer.available) return <Text style={styles.hint}>{failures.unavailable}</Text>;

  const disabled = busy || drawing;
  const validCandidate = candidate !== undefined && /^[0-9０-９]+$/.test(candidate.trim());

  return (
    <View style={styles.section}>
      <Text style={styles.hint}>ひだりから、ひとわくに すうじを ひとつ。</Text>
      <View style={styles.cells}>
        {cells.map((cell, index) => (
          <DigitCell key={index} index={index} ink={cell} disabled={busy} onDrawingChange={drawingChange}
            onChange={value => updateCell(index, value)} />
        ))}
      </View>
      <View style={styles.tools}>
        <Button label="わくを ふやす" disabled={disabled} onPress={() => setCells(previous => [...previous, []])} />
        <Button label="手書きを けす" disabled={disabled || !cells.some(cell => cell.length)} onPress={() => {
          setCells(previous => previous.map(() => []));
          setCandidate(undefined);
          setMessage('');
        }} />
      </View>
      <Button label={busy ? 'よみとりちゅう…' : 'すうじを よみとる'} primary disabled={disabled} onPress={recognize} />
      {!!message && <Text accessibilityLiveRegion="polite" style={styles.hint}>{message}</Text>}
      {candidate !== undefined && (
        <View style={styles.section} accessibilityLiveRegion="polite">
          <Text style={styles.hint}>よみとった すうじ。ちがったら なおしてね。</Text>
          <TextInput accessibilityLabel="よみとった すうじ" inputMode="numeric" value={candidate}
            onChangeText={setCandidate} style={styles.input} />
          <Button label="この こたえを つかう" primary disabled={disabled || !validCandidate}
            onPress={() => onApply(candidate.trim())} />
        </View>
      )}
    </View>
  );
}

function DigitCell({ index, ink, disabled, onDrawingChange, onChange }: {
  index: number; ink: Drawing; disabled: boolean; onDrawingChange: (active: boolean) => void;
  onChange: (value: Drawing) => void;
}) {
  const active = useRef<Point[] | null>(null);
  const [preview, setPreview] = useState<readonly Point[]>();

  function end(commit: boolean) {
    const points = active.current;
    if (!points) return;
    active.current = null;
    setPreview(undefined);
    onDrawingChange(false);
    if (commit) onChange([...ink, points]);
  }

  const strokes = preview ? [...ink, preview] : ink;
  return (
    <View style={styles.cell}>
      <InkSurface label={`手書き ${index + 1}けた目`} start={point => {
        if (disabled) return;
        active.current = [normalizePoint(point, size)];
        setPreview(active.current);
        onDrawingChange(true);
      }} move={point => {
        if (!active.current) return;
        const next = normalizePoint(point, size);
        const last = active.current.at(-1);
        if (last?.x === next.x && last.y === next.y) return;
        active.current = [...active.current, next];
        setPreview(active.current);
      }} finish={() => end(true)} cancel={() => end(false)}>
        <Svg width="100%" height="100%" viewBox="0 0 90 90">
          {strokes.map((stroke, i) => stroke.length === 1
            ? <Circle key={i} cx={stroke[0].x * 90} cy={stroke[0].y * 90} r={2} fill="#393466" />
            : <Polyline key={i} points={stroke.map(point => `${point.x * 90},${point.y * 90}`).join(' ')}
              fill="none" stroke="#393466" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />)}
        </Svg>
      </InkSurface>
    </View>
  );
}

function Button({ label, onPress, primary, disabled }: {
  label: string; onPress: () => void; primary?: boolean; disabled: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={[styles.button, primary && styles.primary, disabled && styles.disabled]}>
      <Text style={[styles.buttonText, primary && styles.primaryText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: 9 },
  hint: { fontSize: 14, lineHeight: 21, color: '#454b6b' },
  cells: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: 92, height: 92, borderWidth: 1, borderColor: '#858caf', backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' },
  tools: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  button: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#e8ecfa' },
  buttonText: { color: '#232b56', fontSize: 13, fontWeight: '700' },
  primary: { backgroundColor: '#36488c' },
  primaryText: { color: 'white' },
  disabled: { opacity: 0.55 },
  input: { color: '#232b56', fontSize: 22, backgroundColor: 'white', borderWidth: 1, borderColor: '#858caf',
    borderRadius: 8, minHeight: 46, paddingHorizontal: 10 },
});
