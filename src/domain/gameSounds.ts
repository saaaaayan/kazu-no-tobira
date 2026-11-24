import {Platform} from 'react-native';

/** Small original 8-bit-style cues. Web Audio is loaded only after an actual
 * user interaction; no auto-playing BGM, remote files, or sound permissions.
 * Non-web platforms remain silent until a native audio backend is installed.
 */
export type GameSound='tap'|'correct'|'incorrect'|'clear'|'title'|'unlock';

type Note={freq:number,at:number,length:number,kind?:OscillatorType,gain?:number};
const tones:Record<GameSound,readonly Note[]>={
  tap:[{freq:540,at:0,length:0.045,gain:0.09}],
  correct:[
    {freq:523.25,at:0,length:0.085,gain:0.12},
    {freq:659.25,at:0.08,length:0.085,gain:0.12},
    {freq:783.99,at:0.16,length:0.16,gain:0.11},
  ],
  // A gentle downward chime, not a frightening buzzer for young children.
  incorrect:[
    {freq:392,at:0,length:0.105,kind:'sine',gain:0.09},
    {freq:349.23,at:0.12,length:0.14,kind:'sine',gain:0.08},
  ],
  clear:[
    {freq:392,at:0,length:0.11,gain:0.11},
    {freq:523.25,at:0.12,length:0.11,gain:0.12},
    {freq:659.25,at:0.24,length:0.11,gain:0.11},
    {freq:783.99,at:0.36,length:0.23,gain:0.13},
    {freq:1046.5,at:0.6,length:0.25,gain:0.11},
  ],
  title:[
    {freq:587.33,at:0,length:0.09,gain:0.11},
    {freq:739.99,at:0.10,length:0.09,gain:0.11},
    {freq:880,at:0.2,length:0.15,gain:0.10},
    {freq:1174.66,at:0.38,length:0.32,gain:0.13},
  ],
  unlock:[
    {freq:261.63,at:0,length:0.11,gain:0.10},
    {freq:392,at:0.13,length:0.11,gain:0.10},
    {freq:523.25,at:0.26,length:0.24,gain:0.13},
  ],
};
let context:AudioContext|undefined;
let lastPlayed:Partial<Record<GameSound,number>>={};

function audioContext():AudioContext|undefined{
  if(Platform.OS!=='web'||typeof window==='undefined')return undefined;
  try{
    const ctor=window.AudioContext||
      (window as Window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
    if(!ctor)return undefined;
    if(!context||context.state==='closed')context=new ctor();
    return context;
  }catch{
    return undefined;
  }
}

export function playGameSound(kind:GameSound,enabled:boolean):void{
  if(!enabled)return;
  const audio=audioContext();
  if(!audio)return;
  try{
    if(audio.state==='suspended')void audio.resume().catch(()=>{});
    const now=audio.currentTime;
    // Prevent double taps or rerenders from stacking loud bursts.
    if(lastPlayed[kind]!==undefined&&now-lastPlayed[kind]!<0.075)return;
    lastPlayed[kind]=now;
    const notes=tones[kind];
    for(const note of notes){
      const osc=audio.createOscillator();
      const envelope=audio.createGain();
      const begin=now+note.at;
      const end=begin+note.length;
      osc.type=note.kind??'triangle';
      osc.frequency.setValueAtTime(note.freq,begin);
      envelope.gain.setValueAtTime(0.0001,begin);
      envelope.gain.exponentialRampToValueAtTime(note.gain??0.1,begin+0.012);
      envelope.gain.exponentialRampToValueAtTime(0.0001,end);
      osc.connect(envelope);
      envelope.connect(audio.destination);
      osc.start(begin);
      osc.stop(end+0.02);
      osc.onended=()=>{osc.disconnect();envelope.disconnect();};
    }
  }catch{
    // Browsers may prohibit audio until a gesture. Never block an answer.
  }
}
