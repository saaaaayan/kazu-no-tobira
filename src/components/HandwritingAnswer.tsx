import { useLayoutEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { normalizePoint, type Drawing, type Point } from '../domain/ink';
import digitRecognizer from '../recognition/digitRecognizer';
import { createRecognitionQueue } from '../recognition/recognitionQueue';
import type { RecognitionResult } from '../recognition/contracts';
import InkSurface from './InkSurface';

const size = { width: 90, height: 90 };
type Status = RecognitionResult | { status: 'idle' } | { status: 'pending' };
const failures = {
  empty: '',
  gap: 'ひだりの わくから ひとつずつ かいてね。',
  uncertain: 'よみとれなかったよ。かきなおすか、こたえを なおしてね。',
  unavailable: 'この たんまつでは キーボードか すうじパネルを つかってね。',
};

export default function HandwritingAnswer({ value, disabled, onChange, onBlockedChange, onDrawingChange }: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onBlockedChange: (blocked: boolean) => void;
  onDrawingChange: (active: boolean) => void;
}) {
  const [cells, setCells] = useState<Drawing[]>([[], [], []]);
  const cellsRef = useRef(cells);
  const [status, setStatus] = useState<Status>({ status: 'idle' });
  const drawing = useRef(false);
  const automaticValue = useRef<string | undefined>(undefined);
  const editedWhileDrawing = useRef(false);
  const callbacks = useRef({ onChange, onBlockedChange });
  callbacks.current = { onChange, onBlockedChange };
  const [queue] = useState(() => createRecognitionQueue(digitRecognizer.recognize, result => {
    if (result.status === 'recognized') {
      automaticValue.current = result.value;
      callbacks.current.onChange(result.value);
    }
    callbacks.current.onBlockedChange(result.status !== 'recognized' && result.status !== 'empty');
    setStatus(result);
  }));

  useLayoutEffect(() => () => queue.cancel(), [queue]);

  function begin() {
    if (disabled || drawing.current) return false;
    drawing.current = true;
    editedWhileDrawing.current = false;
    queue.cancel();
    onBlockedChange(true);
    onDrawingChange(true);
    setStatus({ status: 'pending' });
    return true;
  }

  function end(index: number, ink?: Drawing) {
    drawing.current = false;
    onDrawingChange(false);
    if (ink) {
      cellsRef.current = cellsRef.current.map((cell, i) => i === index ? ink : cell);
      setCells(cellsRef.current);
    }
    if (editedWhileDrawing.current) return;
    if (cellsRef.current.some(cell => cell.length)) {
      queue.schedule(cellsRef.current.map(drawing => ({ drawing, size })));
    } else {
      onBlockedChange(false);
      setStatus({ status: 'idle' });
    }
  }

  function correct(next: string) {
    automaticValue.current = undefined;
    editedWhileDrawing.current = drawing.current;
    queue.cancel();
    onChange(next);
    onBlockedChange(false);
    setStatus({ status: 'idle' });
  }

  if (!digitRecognizer.available) return <Text style={styles.hint}>{failures.unavailable}</Text>;

  const message = status.status === 'pending' ? 'てがきを よみとりちゅう…'
    : status.status === 'ambiguous' ? 'どの すうじかな？ えらぶか、こたえを なおしてね。'
    : status.status === 'recognized' ? 'よみとった すうじを たしかめてね。'
    : status.status === 'idle' ? '' : failures[status.status];

  return (
    <View style={styles.section}>
      <TextInput accessibilityLabel="こたえ" inputMode="numeric" value={value} editable={!disabled}
        onChangeText={correct} placeholder="すうじ" placeholderTextColor="#535b73" style={styles.input} />
      <Text style={styles.hint}>ひだりから、ひとわくに すうじを ひとつ。</Text>
      <View style={styles.cells}>
        {cells.map((cell, index) => (
          <DigitCell key={index} index={index} ink={cell} onBegin={begin}
            onEnd={ink => end(index, ink)} />
        ))}
      </View>
      <View style={styles.tools}>
        <Button label="わくを ふやす" disabled={disabled || drawing.current} onPress={() => {
          if (drawing.current) return;
          cellsRef.current = [...cellsRef.current, []];
          setCells(cellsRef.current);
        }} />
        <Button label="手書きを けす" disabled={disabled || drawing.current || !cells.some(cell => cell.length)} onPress={() => {
          if (drawing.current) return;
          cellsRef.current = cellsRef.current.map(() => []);
          setCells(cellsRef.current);
          correct(value === automaticValue.current ? '' : value);
        }} />
      </View>
      {!!message && <Text accessibilityLiveRegion="polite" style={styles.hint}>{message}</Text>}
      {status.status === 'ambiguous' && (
        <View style={styles.tools}>
          {status.candidates.map(candidate => (
            <Button key={candidate} label={candidate} disabled={disabled} onPress={() => correct(candidate)} />
          ))}
        </View>
      )}
    </View>
  );
}

function DigitCell({ index, ink, onBegin, onEnd }: {
  index: number; ink: Drawing; onBegin: () => boolean;
  onEnd: (value?: Drawing) => void;
}) {
  const active = useRef<Point[] | null>(null);
  const [preview, setPreview] = useState<readonly Point[]>();

  function end(commit: boolean) {
    const points = active.current;
    if (!points) return;
    active.current = null;
    setPreview(undefined);
    onEnd(commit ? [...ink, points] : undefined);
  }

  const strokes = preview ? [...ink, preview] : ink;
  return (
    <View style={styles.cell}>
      <InkSurface label={`手書き ${index + 1}けた目`} start={point => {
        if (!onBegin()) return;
        active.current = [normalizePoint(point, size)];
        setPreview(active.current);
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

function Button({ label, onPress, disabled = false }: {
  label: string; onPress: () => void; disabled?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={[styles.button, disabled && styles.disabled]}>
      <Text style={styles.buttonText}>{label}</Text>
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
  disabled: { opacity: 0.55 },
  input: { color: '#232b56', fontSize: 22, backgroundColor: 'white', borderWidth: 1, borderColor: '#858caf',
    borderRadius: 8, minHeight: 46, paddingHorizontal: 10 },
});
