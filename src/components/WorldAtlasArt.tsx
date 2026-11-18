import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { routeThrough, type worldMapLayout } from '../domain/worldMapLayout';

// Restrained, single-stroke pictograms. One theme per island; no gloss, glitter, or bright badges.
export const atlasIslandSymbols = [
  {name:'ぬいぐるみの島',land:'#92b1a4',rock:'#567f77',ink:'#f0e4c9',coast:'M-87 3Q-60-38-25-24Q-6-55 34-33Q64-30 81-3Q78 28 51 31Q19 48-7 29Q-31 41-53 22Q-82 27-87 3Z',icon:'M-27-16C-40-31-24-42-14-28C-5-34 5-34 14-28C24-42 40-31 27-16C35-2 31 26 0 27C-31 26-35-2-27-16Z M-13 1h2 M11 1h2 M-5 11q5 5 10 0'},
  {name:'おもちゃの島',land:'#a3afa4',rock:'#5c7d78',ink:'#f0e4c9',coast:'M-77 10Q-81-17-50-25Q-31-35-9-22Q12-47 44-28Q70-27 73-7Q92 3 75 19Q52 36 9 25Q-19 46-39 29Q-68 31-77 10Z',icon:'M-48 0H-17V27H-48Z M-9 0L13-29 35 0Z M19 6H51V27H19Z M-35 8V18 M-40 13H-29'},
  {name:'どうぶつの島',land:'#8fb4a1',rock:'#527e70',ink:'#f0e4c9',coast:'M-61 27Q-91 3-61-23Q-52-47-13-33Q7-56 24-31Q50-39 64-13Q89 11 56 24Q28 42 16 29Q-10 48-31 25Z',icon:'M-23 9C-13-5-7-1 0 1C7-1 13-5 23 9C29 19 18 28 0 25C-18 28-29 19-23 9Z M-33-14a5 7 0 1 0 1 0 M-14-24a5 7 0 1 0 1 0 M8-24a5 7 0 1 0 1 0 M29-14a5 7 0 1 0 1 0'},
  {name:'おかしの島',land:'#b4aa92',rock:'#8e7b67',ink:'#f0e4c9',coast:'M-88-2Q-71-24-34-22L0-32Q32-38 37-19Q72-23 84 2L61 16 31 14 9 32-24 27-44 13-77 18Z',icon:'M-22-16Q0-32 22-16Q31-1 22 14Q0 30-22 14Q-31-1-22-16Z M-24-8L-48-20V19L-23 7 M24-8L48-20V19L23 7 M-9-4Q0-16 9-4Q18 9 0 15'},
  {name:'恐竜の島',land:'#9fae99',rock:'#627d75',ink:'#f0e4c9',coast:'M-76-9Q-49-36-25-27L1-44Q18-41 27-29L60-32Q86-9 71 14L48 23 31 36-19 27-42 36Q-71 24-76-9Z',icon:'M-42 22L-40 1Q-31-14-13-8L1 1L5-21Q7-36 18-34L35-26L43-19L29-12L19-13L14 7L7 16L-13 15L-19 28 M-30 14L-28 28 M-3 15L-1 28 M27-23h2'},
  {name:'機械の島',land:'#96abb1',rock:'#596f81',ink:'#f0e4c9',coast:'M-82 17Q-83-18-53-30Q-13-49 23-32Q49-40 67-13Q71 5 47 6Q26-10 10 1Q-8 16 18 27Q33 36 7 40Q-17 51-28 31Q-71 41-82 17Z',icon:'M-10-32V-23L-21-17L-28-23L-38-12L-32-2L-37 11L-25 21L-14 14L-2 21L-2 31H13V21L24 15L32 23L42 12L36 1L39-11L28-21L17-14L8-23V-32Z M-7-5A12 12 0 1 0 17-5A12 12 0 1 0-7-5Z'},
  {name:'古代の島',land:'#adae9d',rock:'#7c806d',ink:'#f0e4c9',coast:'M-80 3Q-65-23-44-21L-24-41 9-37 37-46 62-29 75-8 64 15 40 26 15 38-14 24-41 29-65 15Z',icon:'M-47-12L0-36 47-12Z M-42-8H42 M-36-5V24 M-18-5V24 M0-5V24 M18-5V24 M36-5V24 M-47 29H47 M-44 23H44'},
  {name:'迷宮の島',land:'#9aaaa8',rock:'#607787',ink:'#f0e4c9',coast:'M-80 12Q-82-15-48-25L-19-43 21-35 31-19Q72-28 84-8L69 11Q75 29 38 33L18 24-16 42-54 30Z',icon:'M-40-28H40V27H-40Z M-30-18H20V-7H-13V4H29V16H-22V27 M-15-18V-8 M11 4V16'},
  {name:'鏡の島',land:'#9baec0',rock:'#647c95',ink:'#f0e4c9',coast:'M-87 5Q-71-22-47-18Q-23-40 5-32Q29-38 45-21L78-17 87 4 63 23 40 20 17 39-21 28-56 33Z',icon:'M-22-28Q0-36 22-28L27 13Q0 32-27 13Z M-17-18L0-24 M-20-7L-8-17 M-10 31H10 M0 24V31'},
  {name:'光と影の島',land:'#a9a7be',rock:'#767391',ink:'#f0e4c9',coast:'M-80-2Q-77-28-46-25L-31-40 2-34 21-24 45-35 67-16 81 7 62 30 35 24 8 37-28 30-43 19-68 23Z',icon:'M-31-28V24 M-43-28H-18 M-31-23L34-3L-31 17 M-29 0L26 26 M26 26H48 M-31-28H-19 M-36-29L-31-36L-26-29'},
  {name:'星座の島',land:'#9baabc',rock:'#65788e',ink:'#f0e4c9',coast:'M-69 23Q-89 10-73-12L-47-20-25-38 3-31 33-39 68-21 81 0 68 22 46 26 24 42-6 29-39 37Z',icon:'M-41 19L-14-11L12 2L40-23 M-41 19L5 26L40-23 M-42 19h2 M-14-11h2 M12 2h2 M40-23h2 M5 26h2'},
  {name:'大自然の島',land:'#9fae9f',rock:'#678477',ink:'#f0e4c9',coast:'M-78 11Q-82-13-57-21L-42-40-17-29 8-46 39-35 46-18 76-12 80 13 53 31 14 27-12 39-46 27Z',icon:'M-49 25L-18-27L-1 3L16-18L48 25Z M-25 25L-25 8L-13-8L0 8V25 M8 25Q14 11 25 11Q33 11 42 25'},
  {name:'アカデミーの島',land:'#a8adb2',rock:'#6d7785',ink:'#f0e4c9',coast:'M-78 8Q-89-11-62-24L-37-23-22-41 6-48 26-31 56-33 71-16 89-1 73 24 40 35 17 29-12 42-41 27-65 30Z',icon:'M-45-14L0-34 45-14Z M-39-10H39V26H-39Z M-29-7V23 M-10-7V23 M10-7V23 M29-7V23 M-45 29H45'},
  {name:'魔法使いの島',land:'#a49aaf',rock:'#716882',ink:'#f0e4c9',coast:'M-87 4L-61-23-30-31-16-45 16-45 31-29 63-20 88 6 70 28 31 35 0 45-31 35-70 28Z',icon:'M-31 3L0-37L32 3Z M-41 10Q0 22 41 10 M-33 14L-27 29H28L33 14 M40-23V26 M33 26H47 M-5-8L0-19L5-8'},
  {name:'王国',land:'#ada598',rock:'#7d746b',ink:'#f0e4c9',coast:'M-84 12L-75-13-54-27-31-23-13-39 16-53 31-37 66-26 85 1 69 23 38 26 16 40-19 32-62 28Z',icon:'M-47 28V-4H-32V5H-20V-4H-10V28 M-10 28V-23H10V28 M10 28V-4H21V5H34V-4H47V28 M-4 28V10Q0 4 4 10V28 M-50 28H50'},
  {name:'宇宙の島',land:'#9daac1',rock:'#626d8b',ink:'#f0e4c9',coast:'M-86 2Q-93-13-49-19Q-33-47 3-39Q34-41 48-27Q92-25 89-2Q66 25 38 26Q15 47-12 36Q-60 43-86 2Z',icon:'M-3-29A28 28 0 1 0-3 27A28 28 0 1 0-3-29Z M-48-15C-17 7 17 15 47 2 M-46 10C-8-23 27-18 49-5'},
] as const;

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
