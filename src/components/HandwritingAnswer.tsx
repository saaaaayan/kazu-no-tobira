import { useLayoutEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { normalizePoint, toPixels, type Drawing, type Point, type Size } from '../domain/ink';
import digitRecognizer from '../recognition/digitRecognizer';
import { createRecognitionQueue } from '../recognition/recognitionQueue';
import type { RecognitionResult } from '../recognition/contracts';
import InkSurface from './InkSurface';

type Status = RecognitionResult | { status: 'idle' } | { status: 'pending' };
const failures = {
  empty: '',
  gap: 'すうじの あいだを すこし あけて かいてね。',
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
  const [ink, setInk] = useState<Drawing>([]);
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

  function end(size: Size, next?: Drawing) {
    drawing.current = false;
    onDrawingChange(false);
    if (next) setInk(next);
    if (editedWhileDrawing.current) return;
    const completed = next ?? ink;
    if (completed.length) {
      queue.schedule({ drawing: completed, size });
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
      <WritingArea ink={ink} onBegin={begin} onEnd={end} />
      <View style={styles.tools}>
        <Button label="てがきを けす" disabled={disabled || drawing.current || !ink.length} onPress={() => {
          if (drawing.current) return;
          setInk([]);
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

function WritingArea({ ink, onBegin, onEnd }: {
  ink: Drawing;
  onBegin: () => boolean;
  onEnd: (size: Size, ink?: Drawing) => void;
}) {
  const active = useRef<Point[] | null>(null);
  const [preview, setPreview] = useState<readonly Point[]>();
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  function end(commit: boolean) {
    const points = active.current;
    if (!points) return;
    active.current = null;
    setPreview(undefined);
    onEnd(size, commit ? [...ink, points] : undefined);
  }

  const strokes = preview ? [...ink, preview] : ink;
  return (
    <View style={styles.paper} onLayout={event => {
      const { width, height } = event.nativeEvent.layout;
      setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    }}>
      <InkSurface label="ここに すうじを かいてね" start={point => {
        if (!size.width || !size.height || !onBegin()) return;
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
        {strokes.length === 0 && (
          <View style={styles.placeholder}>
            <Text style={styles.hint}>ここに すうじを かいてね</Text>
            <Text style={styles.example}>ひだりから つづけて かこう</Text>
          </View>
        )}
        {!!size.width && !!size.height && (
          <Svg width="100%" height="100%" viewBox={`0 0 ${size.width} ${size.height}`}>
            {strokes.map((stroke, i) => {
              const pixels = stroke.map(point => toPixels(point, size));
              return pixels.length === 1
                ? <Circle key={i} cx={pixels[0].x} cy={pixels[0].y} r={2} fill="#393466" />
                : <Polyline key={i} points={pixels.map(point => `${point.x},${point.y}`).join(' ')}
                  fill="none" stroke="#393466" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />;
            })}
          </Svg>
        )}
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
  paper: { width: '100%', minHeight: 150, borderWidth: 1, borderColor: '#858caf',
    backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' },
  placeholder: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center', gap: 5 },
  example: { color: '#5e6483', fontSize: 12 },
  tools: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  button: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#e8ecfa' },
  buttonText: { color: '#232b56', fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.55 },
  input: { color: '#232b56', fontSize: 22, backgroundColor: 'white', borderWidth: 1, borderColor: '#858caf',
    borderRadius: 8, minHeight: 46, paddingHorizontal: 10 },
});
