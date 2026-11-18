import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

export const islandHeight = 540;
export const islandWidth = (compact: boolean) => compact ? 420 : 900;

export function islandSites(compact: boolean) {
  return compact
    ? [{ x: 119, y: 414 }, { x: 274, y: 270 }, { x: 152, y: 124 }]
    : [{ x: 225, y: 379 }, { x: 464, y: 292 }, { x: 695, y: 175 }];
}

function Pine({ x, y, scale = 1, dark = false }: { x: number; y: number; scale?: number; dark?: boolean }) {
  return <G transform={`translate(${x} ${y}) scale(${scale})`}>
    <Ellipse cy={1} rx={13} ry={4} fill="#143b42" opacity={0.25} />
    <Path d="M-2 0V-17H2V0Z" fill="#624641" />
    <Path d="M0-49L14-27H8L18-11Q0-5-18-11L-8-27H-14Z" fill={dark ? '#265b61' : '#438476'} />
    <Path d="M0-49L-8-27H-3L-12-12Q-5-9 0-10Z" fill={dark ? '#38716f' : '#72aa88'} />
  </G>;
}

function Clouds({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <G transform={`translate(${x} ${y}) scale(${scale})`} fill="#e0ebf6" opacity={0.57}>
    <Ellipse rx={62} ry={8} /><Ellipse cx={-23} cy={-5} rx={24} ry={11} />
    <Ellipse cx={10} cy={-10} rx={30} ry={15} /><Ellipse cx={35} cy={-5} rx={19} ry={9} />
  </G>;
}

const sparkle = 'M0-12Q1-2 10 0Q1 2 0 12Q-1 2-10 0Q-1-2 0-12Z';

export default function IslandScene({ compact, nextIndex }: { compact: boolean; nextIndex: number }) {
  const w = islandWidth(compact);
  const [forest, bridge, tower] = islandSites(compact);
  const coast = compact
    ? 'M75 500C27 473 27 414 58 368C84 331 112 322 105 267C98 218 56 205 72 150C87 91 147 72 198 91C241 108 240 158 268 183C300 213 368 210 375 260C384 312 347 338 303 358C254 380 253 415 220 464C186 514 115 526 75 500Z'
    : 'M117 445C55 403 67 337 122 303C186 263 225 278 269 232C303 194 380 165 431 176C491 188 507 119 579 119C622 119 658 76 730 100C812 127 838 175 825 239C817 282 764 301 729 323C686 352 702 404 616 431C555 451 486 434 430 457C347 492 237 508 117 445Z';
  const trail = compact
    ? `M${forest.x} ${forest.y}C128 370 233 372 256 332S312 275 ${bridge.x} ${bridge.y}C237 265 210 259 195 225S203 153 ${tower.x} ${tower.y}`
    : `M${forest.x} ${forest.y}C288 413 329 380 355 348S407 278 ${bridge.x} ${bridge.y}C523 303 557 270 583 237S634 184 ${tower.x} ${tower.y}`;
  const river = compact
    ? 'M339 207C293 207 287 238 276 269S234 302 233 330C232 351 259 364 279 377'
    : 'M505 149C476 190 508 208 479 257S433 312 464 350C487 377 487 420 458 462';
  const trees = [
    [-60, -12, 0.9], [-45, -42, 1.14], [-25, -52, 1.1], [-72, 23, 1.02],
    [-49, 20, 1.25], [14, -34, 1.13], [35, -9, 0.94], [53, 10, 0.75],
    [-29, -13, 1.24], [-49, 46, 0.77], [59, 39, 0.69], [75, 12, 0.73],
  ];
  const next = [forest, bridge, tower][nextIndex];

  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${islandHeight}`} preserveAspectRatio="none" accessible={false}>
      {/* Subtle north indicator, intentionally flat and without decorative sparkles. */}
      <G transform="translate(39 40)" opacity={0.78}>
        <Circle r={24} fill="#e9edf0" fillOpacity={0.12} stroke="#e3e9e8" strokeOpacity={0.55} strokeWidth={1} />
        <Path d="M0-18L-6 7L0 3L6 7Z" fill="#eef0e7" stroke="#536a77" strokeWidth={0.9} strokeLinejoin="round" />
        <Path d="M0 3L-6 7L0 18L6 7Z" fill="#718696" stroke="#e1e7e5" strokeWidth={0.7} strokeLinejoin="round" />
        <SvgText x={0} y={-29} fontSize={10} fontWeight="700" fill="#f2f2eb" textAnchor="middle">N</SvgText>
      </G>
      <Defs>
        <LinearGradient id="islandSea" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#424d83" /><Stop offset=".47" stopColor="#6996bb" /><Stop offset="1" stopColor="#92c8c8" />
        </LinearGradient>
        <LinearGradient id="islandGrass" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#a6a4cc" /><Stop offset=".56" stopColor="#88ac98" /><Stop offset="1" stopColor="#659d81" />
        </LinearGradient>
      </Defs>
      <Path d={`M0 0H${w}V540H0Z`} fill="url(#islandSea)" />
      <Circle cx={w - 65} cy={72} r={38} fill="#e9cf9c" opacity={0.14} />
      <Circle cx={w - 65} cy={72} r={26} fill="#fbdfa6" opacity={0.23} />
      <Circle cx={w - 65} cy={72} r={19} fill="#fbe6b5" />
      <Clouds x={compact ? 64 : 123} y={61} scale={compact ? 0.65 : 1.05} />
      <Clouds x={w * 0.52} y={44} scale={0.55} /><Clouds x={w - 46} y={137} scale={0.83} />
      {[[.28, 35], [.57, 69], [.72, 30], [.42, 20], [.93, 42], [.09, 113]].map(([x, y], i) =>
        <Path key={i} d={sparkle} transform={`translate(${x * w} ${y}) scale(${i % 2 ? .29 : .47})`} fill="#ffe9bd" />)}
      {Array.from({ length: compact ? 13 : 21 }, (_, i) => {
        const x = (32 + i * 119) % w;
        const y = 151 + (i * 47) % 369;
        return <Path key={i} d={`M${x} ${y}q12-5 25 0m-18 8q9-4 17 0`} stroke="#d5e8ed" strokeWidth={2} opacity={0.42} fill="none" />;
      })}
      <Path d={coast} transform="translate(0 12)" fill="#395c71" opacity={0.56} />
      <Path d={coast} transform="translate(0 5)" fill="#628677" stroke="#bedcd0" strokeWidth={9} />
      <Path d={coast} fill="url(#islandGrass)" stroke="#dae0b4" strokeWidth={6} />
      <Ellipse cx={forest.x} cy={forest.y - 22} rx={compact ? 76 : 129} ry={58} fill="#578b76" opacity={0.68} />
      <Ellipse cx={tower.x - 1} cy={tower.y + 23} rx={compact ? 65 : 116} ry={46} fill="#8a8cb5" opacity={0.57} />
      <G transform={`translate(${tower.x} ${tower.y}) scale(${compact ? .8 : 1.15})`}>
        <Path d="M-80 30L-56-18L-32 20L-11-38L13 19L42-18L70 31Z" fill="#747fa9" />
        <Path d="M-69 12L-56-18L-43 5L-55 1L-62 7ZM-22-11L-11-38L4-7L-10-14L-16-7ZM31 2L42-18L51-1L43-5Z" fill="#cbd4e7" />
      </G>
      <Path d={river} fill="none" stroke="#bed6b8" strokeWidth={29} />
      <Path d={river} fill="none" stroke="#648fb3" strokeWidth={22} />
      <Path d={river} fill="none" stroke="#a7d9df" strokeWidth={3} strokeDasharray="13 8 4 12" />
      <Path d={trail} fill="none" stroke="#4a766f" strokeWidth={19} strokeLinecap="round" opacity={0.40} />
      <Path d={trail} fill="none" stroke="#f1d9a0" strokeWidth={13} strokeLinecap="round" />
      <Path d={trail} fill="none" stroke="#fff1c9" strokeWidth={2.5} strokeLinecap="round" strokeDasharray="3 10" />
      {trees.map(([x, y, scale], i) => <Pine key={i} x={forest.x + x} y={forest.y + y} scale={scale} dark={i % 3 === 0} />)}
      <G transform={`translate(${forest.x} ${forest.y})`}>
        <Ellipse cy={1} rx={26} ry={7} fill="#3f7266" />
        <Path d="M-16 1V-20Q0-43 16-20V1Z" fill="#365d5b" stroke="#b8cc99" strokeWidth={4} />
        <Path d="M-8 1V-18Q0-31 8-18V1Z" fill="#e6c78a" />
        <Path d="M-13 5H13" stroke="#f1d9a0" strokeWidth={4} strokeLinecap="round" />
      </G>
      <G transform={`translate(${bridge.x} ${bridge.y}) rotate(${compact ? -23 : 13})`}>
        <Ellipse rx={45} ry={17} fill="#46677d" opacity={0.34} />
        <Path d="M-43 10Q0-22 43 10L39 16Q0-10-39 16Z" fill="#785e76" />
        <Path d="M-43 3Q0-29 43 3L41 12Q0-16-41 12Z" fill="#ebc988" stroke="#886c81" strokeWidth={2} />
        <Path d="M-39-5Q0-37 39-5M-38 10Q0-18 38 10M-36-8v18m17-28v18M0-24v19m19-14v18m17-8v17" fill="none" stroke="#f8e2b0" strokeWidth={3} strokeLinecap="round" />
        <Circle cx={-37} cy={-11} r={4} fill="#ffe5a8" /><Circle cx={37} cy={-11} r={4} fill="#ffe5a8" />
      </G>
      <G transform={`translate(${tower.x} ${tower.y})`}>
        <Ellipse cy={4} rx={29} ry={8} fill="#505b89" opacity={0.43} />
        <Path d="M-17 1L-14-47H14L17 1Z" fill="#bec3df" stroke="#6c739d" strokeWidth={2} />
        <Path d="M-1-45H14L17 1H-1Z" fill="#959bc6" />
        <Path d="M-21-44L0-74L21-44Z" fill="#555985" stroke="#c0b5da" strokeWidth={2} />
        <Path d="M-6 0V-13Q0-23 6-13V0Z" fill="#4d557e" />
        <Path d="M-3-27v-8q3-6 6 0v8Z" fill="#ffe0a3" />
        <Path d={sparkle} transform="translate(0 -80) scale(.72)" fill="#ffdf97" />
      </G>
      {next && <G transform={`translate(${next.x} ${next.y + 13})`}>
        <Ellipse rx={22} ry={10} stroke="#fff2c2" strokeWidth={2} fill="#eaca84" fillOpacity={0.28} />
        <Circle r={5} fill="#fff0bc" stroke="#8e6b37" strokeWidth={2} />
      </G>}
    </Svg>
  );
}
