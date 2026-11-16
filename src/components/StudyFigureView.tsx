import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import type { StudyFigure } from '../domain/gradeFiveGeometry';

const strokes = '#263b66';
const fills = ['#dbeafe', '#eaf4ee', '#bed5f6'] as const;

export function StudyFigureView({ figure }: { figure: StudyFigure }) {
  return <View accessible accessibilityRole="image" accessibilityLabel={figure.description} style={styles.card}>
    <Svg width="100%" height={188} viewBox="0 0 320 188" accessible={false}>
      {figure.outline.map((points,i)=><Polygon key={i} points={points.map(point=>point.join(',')).join(' ')}
        fill={fills[i%fills.length]} stroke={strokes} strokeWidth={2} strokeLinejoin="round"/>)}
      {figure.circle && <Circle cx={figure.circle.center[0]} cy={figure.circle.center[1]}
        r={figure.circle.radius} fill={fills[0]} stroke={strokes} strokeWidth={2}/>}
      {figure.lines.map(({from,to,dashed},i)=><Line key={i} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}
        stroke={dashed?'#8a3b31':strokes} strokeWidth={2} strokeDasharray={dashed?'5 4':undefined}/>)}
      {figure.circle && <Circle cx={figure.circle.center[0]} cy={figure.circle.center[1]} r={3.5} fill={strokes}/>}
      {figure.labels.map(({at,text},i)=><SvgText key={i} x={at[0]} y={at[1]} textAnchor="middle"
        fontWeight="700" fontSize={14} fill={strokes}>{text}</SvgText>)}
    </Svg>
  </View>;
}

const styles = StyleSheet.create({
  card: { width:'100%', maxWidth:460, alignSelf:'center', borderRadius:12, backgroundColor:'#fffdf5', paddingVertical:3 },
});
