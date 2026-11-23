import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { displayMathParts } from '../domain/mathDisplayParts';
import { renderMathSvg } from '../domain/mathSvg';

function Formula({ latex, fallback, fontSize, color, maxWidth }: {
  latex: string; fallback: string; fontSize: number; color?: TextStyle['color']; maxWidth: number;
}) {
  try {
    const drawing = renderMathSvg(latex);
    const naturalWidth = Math.ceil(drawing.width * fontSize);
    const fittedSize = Math.max(fontSize * 0.8, Math.min(fontSize, fontSize * maxWidth / naturalWidth));
    const width = Math.ceil(drawing.width * fittedSize);
    const height = Math.ceil(drawing.height * fittedSize);
    const svg = <SvgXml xml={drawing.xml} width={width} height={height} color={color} />;
    return width > maxWidth && Number.isFinite(maxWidth)
      ? <ScrollView horizontal style={{ maxWidth }} keyboardShouldPersistTaps="handled">{svg}</ScrollView>
      : svg;
  } catch {
    return <Text style={{ fontSize, color, maxWidth }}>{fallback}</Text>;
  }
}

export function MathDisplay({ latex }: { latex: string }) {
  const [width, setWidth] = useState<number | null>(null);
  return <View style={styles.display}
    onLayout={({ nativeEvent }) => {
      if (nativeEvent.layout.width > 0) setWidth(nativeEvent.layout.width);
    }}>
    {width !== null && <Formula latex={latex} fallback={latex} fontSize={19} color="#233859" maxWidth={width} />}
  </View>;
}

export function MathText({ value, style, prefix = '', format = true }: {
  value: string; style?: StyleProp<TextStyle>; prefix?: string; format?: boolean;
}) {
  const [width, setWidth] = useState(Infinity);
  const { color, fontSize = 16, marginTop, marginBottom, ...textStyle } = StyleSheet.flatten(style) ?? {};
  const parts=displayMathParts(value,format);
  if (!parts.some(part => part.kind !== 'text')) return <Text style={style}>{prefix}{value}</Text>;
  const squareSide=Math.max(19,Math.round(fontSize));
  const squareBorder=Math.max(2,Math.round(fontSize/10));

  return <View accessible accessibilityLabel={prefix + value}
    onLayout={({ nativeEvent }) => { if (nativeEvent.layout.width > 0) setWidth(nativeEvent.layout.width); }}
    style={[styles.line, { marginTop, marginBottom }]}>
    {prefix ? <Text accessible={false} style={{ ...textStyle, color, fontSize }}>{prefix}</Text> : null}
    {parts.map((part,index)=>part.kind==='square'
      ? <View key={index} testID="math-empty-square" accessible={false}
          accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
          style={{width:squareSide,height:squareSide,borderWidth:squareBorder,
            borderColor:color??'#29345d',borderRadius:2,
            alignSelf:'center',marginHorizontal:2,flexShrink:0}}/>
      : part.kind==='text'
      ? <Text key={index} accessible={false} style={[styles.prose,textStyle,{color,fontSize}]}>{part.text}</Text>
      : <View key={index} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Formula latex={part.latex} fallback={part.text} fontSize={fontSize} color={color} maxWidth={width}/>
        </View>)}
  </View>;
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', rowGap: 4, alignSelf: 'stretch', minWidth: 0 },
  prose: { maxWidth: '100%', flexShrink: 1 },
  display: { alignSelf: 'stretch', minWidth: 0, paddingVertical: 3 },
});
