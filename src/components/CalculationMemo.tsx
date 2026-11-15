import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { clearInk, commitInk, emptyInkHistory, eraseStrokes, normalizePoint, toPixels, undoInk,
  type Drawing, type Point, type Size } from '../domain/ink';
import InkSurface from './InkSurface';

type Gesture =
  | { mode: 'pen'; points: Point[] }
  | { mode: 'eraser'; drawing: Drawing; last: Point };

export default function CalculationMemo({ onDrawingChange }: { onDrawingChange: (active: boolean) => void }) {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [history, setHistory] = useState(emptyInkHistory);
  const [preview, setPreview] = useState<Drawing>();
  const [erasing, setErasing] = useState(false);
  const gesture = useRef<Gesture | null>(null);

  function start(pixel: Point) {
    if (!size.width || !size.height) return;
    const point = normalizePoint(pixel, size);
    if (erasing) {
      const drawing = eraseStrokes(history.drawing, point, point, size);
      gesture.current = { mode: 'eraser', drawing, last: point };
      setPreview(drawing);
    } else {
      const points = [point];
      gesture.current = { mode: 'pen', points };
      setPreview([...history.drawing, points]);
    }
    onDrawingChange(true);
  }

  function move(pixel: Point) {
    const active = gesture.current;
    if (!active) return;
    const point = normalizePoint(pixel, size);
    if (active.mode === 'eraser') {
      active.drawing = eraseStrokes(active.drawing, active.last, point, size);
      active.last = point;
      setPreview(active.drawing);
    } else {
      const last = active.points[active.points.length - 1];
      if (last.x === point.x && last.y === point.y) return;
      active.points = [...active.points, point];
      setPreview([...history.drawing, active.points]);
    }
  }

  function end(commit: boolean) {
    const active = gesture.current;
    if (!active) return;
    gesture.current = null;
    if (commit) {
      setHistory(previous => commitInk(previous, active.mode === 'pen'
        ? [...previous.drawing, active.points]
        : active.drawing));
    }
    setPreview(undefined);
    onDrawingChange(false);
  }

  function updateHistory(update: typeof undoInk) {
    if (!gesture.current) setHistory(update);
  }

  const drawing = preview ?? history.drawing;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.label}>
          <Text accessibilityRole="header" style={styles.title}>けいさんメモ</Text>
          <Text style={styles.hint}>{erasing ? 'けしたい せんを なぞってね' : 'ゆびや ペンで かいてみよう'}</Text>
        </View>
        <View style={styles.tools}>
          <Tool label="1つ戻す" disabled={!history.previous.length || !!preview} onPress={() => updateHistory(undoInk)} />
          <Tool label="消しゴム" selected={erasing} disabled={!!preview} onPress={() => setErasing(value => !value)} />
          <Tool label="全部消す" accessibleLabel="メモを全部消す" disabled={!history.drawing.length || !!preview}
            onPress={() => updateHistory(clearInk)} />
        </View>
      </View>
      <View style={styles.paper} onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
      }}>
        <InkSurface start={start} move={move} finish={() => end(true)} cancel={() => end(false)}>
          {!!size.width && !!size.height && (
            <Svg width="100%" height="100%" viewBox={`0 0 ${size.width} ${size.height}`}>
              {Array.from({ length: Math.floor(size.height / 32) }, (_, index) => (
                <Line key={index} x1={0} y1={(index + 1) * 32} x2={size.width} y2={(index + 1) * 32} stroke="#e8e9f4" />
              ))}
              {drawing.map((stroke, index) => {
                const points = stroke.map(point => toPixels(point, size));
                return points.length === 1
                  ? <Circle key={index} cx={points[0].x} cy={points[0].y} r={2} fill="#393466" />
                  : <Path key={index} d={points.map(({ x, y }, i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')}
                    fill="none" stroke="#393466" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />;
              })}
            </Svg>
          )}
        </InkSurface>
      </View>
    </View>
  );
}

function Tool({ label, accessibleLabel, selected, disabled = false, onPress }: {
  label: string; accessibleLabel?: string; selected?: boolean; disabled?: boolean; onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibleLabel ?? label}
      accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.tool, selected && styles.activeTool, (disabled || pressed) && styles.dim]}>
      <Text style={[styles.toolText, selected && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0, gap: 12, backgroundColor: '#f4f3fb', padding: 14, borderRadius: 18 },
  header: { gap: 10 },
  label: { gap: 3 },
  title: { color: '#29234b', fontSize: 19, fontWeight: '800' },
  hint: { color: '#55516f', fontSize: 13 },
  tools: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tool: { minHeight: 44, paddingHorizontal: 10, justifyContent: 'center', borderRadius: 9, backgroundColor: '#e6e4f4' },
  toolText: { color: '#343055', fontSize: 13, fontWeight: '700' },
  activeTool: { backgroundColor: '#4b417d' },
  activeText: { color: 'white' },
  dim: { opacity: 0.55 },
  paper: { minHeight: 288, flexGrow: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1,
    borderColor: '#dcd9ef', overflow: 'hidden' },
});
