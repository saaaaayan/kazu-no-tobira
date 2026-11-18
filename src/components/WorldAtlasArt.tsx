import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { routeThrough, type worldMapLayout } from '../domain/worldMapLayout';
import {atlasIslandSymbols} from '../domain/worldAtlasSymbols';

function AtlasIsland({ index, x, y, scale, available, next }: {
  index: number; x: number; y: number; scale: number; available: boolean; next: boolean;
}) {
  const art = atlasIslandSymbols[index];
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      {next && <Ellipse cy={2} rx={100} ry={53} fill="#f0dcb7" opacity={0.15} />}
      <Path d={art.coast} transform="translate(0 12)" fill="#122e41" opacity={0.33} />
      <Path d={art.coast} transform="translate(0 6)" fill={art.rock} />
      <Path d={art.coast} fill={art.land} stroke="#d5c7a5" strokeWidth={next ? 3.1 : 2.2} strokeLinejoin="round" />
      <Path d={art.icon} fill="none" stroke={art.ink} strokeWidth={3.7}
        strokeLinecap="round" strokeLinejoin="round" opacity={0.94} />
      {!available && <Path d={art.coast} fill="#253552" fillOpacity={0.13} />}
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
      {Array.from({ length: compact ? 30 : 24 }, (_, i) => {
        const x = 15 + (i * 137) % (width - 32);
        const y = 22 + (i * 109) % (height - 43);
        return <Path key={i} d={`M${x} ${y}q7-3 14 0m-16 7q5-2 10 0`} fill="none"
          stroke="#9bc5bc" strokeWidth={1.4} opacity={i % 3 === 0 ? .26 : .12} />;
      })}
      <G transform={`translate(${compact ? width * .79 : width * .13} ${compact ? 52 : height * .13})`} opacity={.48}>
        <Circle r={30} stroke="#d6c58f" fill="none" strokeWidth={1} />
        <Circle r={23} stroke="#d6c58f" fill="none" strokeWidth={1} />
        <Path d="M0-40 6-6 39 0 6 6 0 39-6 6-39 0-6-6Z" fill="#d6c58f" />
        <Path d="M0-40 0 0-6-6ZM39 0 0 0 6-6ZM0 39 0 0 6 6ZM-39 0 0 0-6 6Z" fill="#417478" />
      </G>
      <Path d={routeThrough(positions, .3)} stroke="#172f4a" strokeWidth={5} opacity={.65} fill="none" />
      <Path d={routeThrough(positions, .3)} stroke="#e3d5b4" strokeWidth={2.2} strokeDasharray="3 7" strokeLinecap="round" fill="none" opacity={.9} />
      {positions.map(({ x, y }, index) => <AtlasIsland key={index} index={index} x={x} y={y} scale={scale}
        next={index === current} available={available[index]} />)}
    </Svg>
  );
}
