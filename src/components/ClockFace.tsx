import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { clockAngles, clockLabel } from '../domain/clockFace';

function tip(angle: number, length: number) {
  const radians = angle * Math.PI / 180;
  return { x: 100 + Math.sin(radians) * length, y: 100 - Math.cos(radians) * length };
}

export function ClockFace({ time, caption, read = false }: { time: number; caption?: string; read?: boolean }) {
  const angles = clockAngles(time);
  const hour = tip(angles.hour, 38);
  const minute = tip(angles.minute, 58);
  const minuteValue = angles.minute / 6;
  const hourMarker = Math.floor(angles.hour / 30) || 12;
  const label = read
    ? '長い針は12から時計回りに ' + minuteValue + '目盛り。短い針は ' + hourMarker +
      (minuteValue === 0 ? ' を指しています。' : ' を過ぎた位置です。')
    : (caption ? caption + '、' : '') + clockLabel(time);
  return (
    <View style={styles.face} accessible accessibilityRole="image" accessibilityLabel={label}>
      {caption && <Text style={styles.caption}>{caption}</Text>}
      <Svg width={176} height={176} viewBox="0 0 200 200" accessible={false}>
        <Circle cx={100} cy={100} r={96} fill="#fffdf5" stroke="#33466d" strokeWidth={3}/>
        {Array.from({length:60}, (_, i) => {
          const outer = tip(i*6, 91);
          const inner = tip(i*6, i%5 === 0 ? 84 : 87);
          return <Line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
            stroke="#344666" strokeWidth={i%5 === 0 ? 2.3 : 1}/>;
        })}
        {Array.from({length:12}, (_, i) => {
          const point = tip(i*30, 73);
          return <SvgText key={i} x={point.x} y={point.y+5} textAnchor="middle" fontSize={17} fontWeight="700" fill="#28385a">{i || 12}</SvgText>;
        })}
        <Line x1={100} y1={100} x2={hour.x} y2={hour.y} stroke="#233359" strokeWidth={8} strokeLinecap="round"/>
        <Line x1={100} y1={100} x2={minute.x} y2={minute.y} stroke="#a34625" strokeWidth={4} strokeLinecap="round"/>
        <Circle cx={100} cy={100} r={5} fill="#233359"/>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  face: { alignSelf: 'flex-start', alignItems: 'center', padding: 6, backgroundColor: '#fffdf5', borderRadius: 14 },
  caption: { fontWeight: '700', color: '#233359', marginBottom: 4 },
});
