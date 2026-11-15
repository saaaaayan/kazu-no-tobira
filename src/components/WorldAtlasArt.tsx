import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { routeThrough, type worldMapLayout } from '../domain/worldMapLayout';

const islands = [
  { land: '#9dbd7d', rock: '#4e8064', light: '#fff0af', coast: 'M-77 10Q-81-17-50-25Q-31-35-9-22Q12-47 44-28Q70-27 73-7Q92 3 75 19Q52 36 9 25Q-19 46-39 29Q-68 31-77 10Z', feature: 'M-53 16l12-29 12 29Zm13 6 15-32 14 32ZM-5 21V3q15-25 30 0v18Zm8 0V6q7-12 14 0v15ZM42 17l12-27 12 27Z' },
  { land: '#7fba90', rock: '#276d60', light: '#e9dba5', coast: 'M-61 27Q-91 3-61-23Q-52-47-13-33Q7-56 24-31Q50-39 64-13Q89 11 56 24Q28 42 16 29Q-10 48-31 25Z', feature: 'M-64 13l12-25 12 25Zm18 6 16-36 16 36ZM-8 25V1L4-12l13 13v24Zm31-5V0L37-14 51 0v20ZM45 22l12-20 13 20Z' },
  { land: '#d6ae7d', rock: '#956a59', light: '#f9d5a1', coast: 'M-88-2Q-71-24-34-22L0-32Q32-38 37-19Q72-23 84 2L61 16 31 14 9 32-24 27-44 13-77 18Z', feature: 'M-69 3l22-27 15 5 21 27Zm56 5 22-33 17 8 21 25Zm45 0 18-22 16 5 16 17ZM-39 19h49v6h-49Z' },
  { land: '#b6b795', rock: '#666980', light: '#f8dfa8', coast: 'M-76-9Q-49-36-25-27L1-44Q18-41 27-29L60-32Q86-9 71 14L48 23 31 36-19 27-42 36Q-71 24-76-9Z', feature: 'M-47 20V-2h17v22Zm20 0v-32h12v7h7v-7H5v32Zm35 0V-2h17v22Zm-3 0h27v-29l11-10 11 10v29Z' },
  { land: '#90c7b3', rock: '#448e91', light: '#ffefc1', coast: 'M-82 17Q-83-18-53-30Q-13-49 23-32Q49-40 67-13Q71 5 47 6Q26-10 10 1Q-8 16 18 27Q33 36 7 40Q-17 51-28 31Q-71 41-82 17Z', feature: 'M-66 13q39-27 75-25 26-19 46 1-16-6-37 7Q-18-2-50 22ZM-25-9v-15l11 15Z M26-18h15v14H26Z' },
  { land: '#c1cde4', rock: '#6579a9', light: '#f9e6b3', coast: 'M-80 3Q-65-23-44-21L-24-41 9-37 37-46 62-29 75-8 64 15 40 26 15 38-14 24-41 29-65 15Z', feature: 'M-67 10l27-47 28 47Zm45 4 30-57 30 57Zm53-1 17-33 22 33ZM-19 18l23-26 23 26Z' },
  { land: '#bace97', rock: '#608464', light: '#e9e8ad', coast: 'M-80 12Q-82-15-48-25L-19-43 21-35 31-19Q72-28 84-8L69 11Q75 29 38 33L18 24-16 42-54 30Z', feature: 'M-58 15V-7l18-15 18 15v22Zm32-4L-7-8 11 11Zm24 10V-15l11-10 13 10v36Zm26-2L46-7l22 26Z' },
  { land: '#aac280', rock: '#4d886a', light: '#fff0ad', coast: 'M-87 5Q-71-22-47-18Q-23-40 5-32Q29-38 45-21L78-17 87 4 63 23 40 20 17 39-21 28-56 33Z', feature: 'M-65 17q32-29 68-18t62-15v8Q43 15 9 7T-57 23ZM-19 20v-20h22v20ZM3-9v-23l13 9Z' },
  { land: '#b6a5cb', rock: '#72668e', light: '#e9d5f6', coast: 'M-80-2Q-77-28-46-25L-31-40 2-34 21-24 45-35 67-16 81 7 62 30 35 24 8 37-28 30-43 19-68 23Z', feature: 'M-58 20V-9h47v13h-33v5h43v11Zm56-15v-23h43v18H14v5h45v15H19V11Zm48-18 10-18 10 18Z' },
  { land: '#d0ba91', rock: '#8b716c', light: '#fbdeb4', coast: 'M-69 23Q-89 10-73-12L-47-20-25-38 3-31 33-39 68-21 81 0 68 22 46 26 24 42-6 29-39 37Z', feature: 'M-66 16V-7h12v-6h6v6h10v23Zm25 7V-2h29v25ZM-11 24V-11L8-29l17 18v35Zm39-3V-4h25v25Zm23-4V-10h13v-7h6v34Z' },
  { land: '#a4b2d2', rock: '#566890', light: '#d5eed4', coast: 'M-78 11Q-82-13-57-21L-42-40-17-29 8-46 39-35 46-18 76-12 80 13 53 31 14 27-12 39-46 27Z', feature: 'M-61 20V-8l15-22 15 22v28Zm33 0V-13L0-42l27 29v33Zm57 0V-8l15-22 15 22v28ZM-8 20v-15q8-12 16 0v15Z' },
  { land: '#bfa5cd', rock: '#6c5984', light: '#fae6ab', coast: 'M-78 8Q-89-11-62-24L-37-23-22-41 6-48 26-31 56-33 71-16 89-1 73 24 40 35 17 29-12 42-41 27-65 30Z', feature: 'M-59 19l19-21 18 21Zm33 4V1Q-23-26 0-28Q23-26 26 1v22Zm13-23L0-36 13 0Zm38 20 19-24 20 24Z' },
] as const;

function AtlasIsland({ index, x, y, scale, available, next }: {
  index: number; x: number; y: number; scale: number; available: boolean; next: boolean;
}) {
  const art = islands[index];
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      {next && <Ellipse cy={2} rx={100} ry={53} fill="#ffdb8f" opacity={0.32} />}
      <Path d={art.coast} transform="translate(0 12)" fill="#092d43" opacity={0.48} />
      <Path d={art.coast} transform="translate(0 6)" fill={art.rock} />
      <Path d={art.coast} fill={art.land} stroke="#e9d8aa" strokeWidth={next ? 4.8 : 2.8} strokeLinejoin="round" />
      <Ellipse cx={-2} cy={5} rx={60} ry={20} fill={art.rock} opacity={0.23} />
      <Path d={art.feature} fill={art.rock} fillRule="evenodd" stroke={art.light} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M-60 15q14-7 25 4m46 6q17-6 26-5m6-38 6-1 5 3" fill="none" stroke={art.light} strokeWidth={1.9} opacity={0.75} />
      {[[-67,-21],[59,-24],[81,20]].map(([dx, dy], detail) => (
        <Circle key={detail} cx={dx} cy={dy} r={1.8} fill={art.light} opacity={0.78} />
      ))}
      {!available && <Path d={art.coast} fill="#253552" fillOpacity={0.11} />}
    </G>
  );
}

export default function WorldAtlasArt({ layout, available, current }: {
  layout: ReturnType<typeof worldMapLayout>; available: readonly boolean[]; current: number;
}) {
  const { width, height, positions, compact } = layout;
  const scale = compact ? Math.min(.76, width / 455) : width / 1100;
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} accessible={false}>
      <Defs>
        <LinearGradient id="atlasSea" x1="0%" y1="80%" x2="100%" y2="0%">
          <Stop offset="0" stopColor="#266366" /><Stop offset=".43" stopColor="#244e68" /><Stop offset="1" stopColor="#253958" />
        </LinearGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#atlasSea)" />
      <Path d={`M0 ${height * .32}Q${width * .56} ${height * .39} ${width} ${height * .14}M0 ${height * .38}Q${width * .56} ${height * .45} ${width} ${height * .2}M0 ${height * .83}Q${width * .56} ${height * .89} ${width} ${height * .62}`}
        stroke="#80b6b9" strokeWidth={1} opacity={0.28} fill="none" />
      {Array.from({ length: compact ? 60 : 47 }, (_, i) => {
        const x = 15 + (i * 137) % (width - 32);
        const y = 22 + (i * 109) % (height - 43);
        return <Path key={i} d={`M${x} ${y}q7-3 14 0m-16 7q5-2 10 0`} fill="none"
          stroke="#9bc5bc" strokeWidth={1.4} opacity={i % 3 === 0 ? .40 : .19} />;
      })}
      <G transform={`translate(${compact ? width * .79 : width * .13} ${compact ? 52 : height * .13})`} opacity={.62}>
        <Circle r={30} stroke="#d6c58f" fill="none" strokeWidth={1} />
        <Circle r={23} stroke="#d6c58f" fill="none" strokeWidth={1} />
        <Path d="M0-40 6-6 39 0 6 6 0 39-6 6-39 0-6-6Z" fill="#d6c58f" />
        <Path d="M0-40 0 0-6-6ZM39 0 0 0 6-6ZM0 39 0 0 6 6ZM-39 0 0 0-6 6Z" fill="#417478" />
      </G>
      <Path d={routeThrough(positions, .3)} stroke="#172f4a" strokeWidth={5} opacity={.65} fill="none" />
      <Path d={routeThrough(positions, .3)} stroke="#f6dda0" strokeWidth={2} strokeDasharray="3 7" strokeLinecap="round" fill="none" opacity={.9} />
      {positions.map(({ x, y }, index) => <AtlasIsland key={index} index={index} x={x} y={y} scale={scale}
        next={index === current} available={available[index]} />)}
    </Svg>
  );
}
