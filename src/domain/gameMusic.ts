// Original compositions for 数のトビラ. MIDI note numbers, eighth-note
// slots (-1 = hold, 0 = rest), four beats per bar.
export type MusicScene = 'title' | 'world' | 'study';
const scores = {
  "title": {
    "bpm": 88,
    "melody": "64 67 69 -1 72 71 69 -1;67 -1 64 62 64 -1 67 -1;65 69 72 -1 74 72 69 -1;67 -1 65 64 62 -1 -1 -1;64 67 69 72 76 -1 74 72;71 67 64 -1 67 69 71 -1;72 69 65 -1 67 65 64 62;64 -1 62 -1 60 -1 -1 -1;67 72 76 -1 74 72 71 -1;69 -1 67 64 67 -1 69 -1;65 69 72 76 74 -1 72 69;71 -1 67 65 64 62 64 -1;64 67 69 -1 72 76 74 72;71 -1 69 67 64 -1 67 -1;65 69 72 -1 71 69 67 62;60 -1 64 -1 67 -1 62 -1",
    "chords": "48 60 64 67;45 57 60 64;41 53 57 60;43 55 59 62;48 60 64 67;40 55 59 64;41 53 57 60;43 55 60 62;48 60 64 67;45 57 60 64;41 53 57 60;43 55 59 62;45 57 60 64;40 55 59 64;41 53 57 60;43 55 59 62"
  },
  "world": {
    "bpm": 116,
    "melody": "67 69 71 74 76 -1 74 71;69 66 62 66 69 -1 71 -1;67 69 71 74 79 -1 78 76;74 71 69 67 69 -1 -1 -1;76 74 72 71 72 74 76 -1;74 71 67 66 67 -1 71 -1;69 72 76 74 72 69 66 -1;67 -1 71 -1 74 -1 -1 -1;79 78 76 74 76 74 71 -1;69 71 74 76 74 -1 69 -1;76 74 72 69 72 76 79 -1;78 76 74 71 69 -1 66 -1;67 69 71 74 76 -1 79 -1;78 74 71 67 69 -1 71 -1;72 76 74 72 71 69 66 -1;67 -1 71 -1 74 -1 66 -1",
    "chords": "43 55 59 62;38 50 54 57;40 52 55 59;43 55 59 62;48 60 64 67;43 55 59 62;45 57 60 64;38 50 54 57;43 55 59 62;38 50 54 57;48 60 64 67;38 50 54 57;40 52 55 59;43 55 59 62;48 60 64 67;38 50 54 57"
  },
  "study": {
    "bpm": 76,
    "melody": "69 -1 72 -1 76 -1 -1 0;74 -1 72 -1 69 -1 -1 0;67 -1 69 -1 72 -1 -1 0;71 -1 69 -1 67 -1 -1 0;69 -1 72 -1 76 -1 74 -1;72 -1 -1 0 69 -1 -1 0;65 -1 69 -1 72 -1 71 -1;67 -1 -1 0 64 -1 -1 0;69 -1 72 -1 74 -1 -1 0;76 -1 74 -1 72 -1 -1 0;71 -1 69 -1 67 -1 -1 0;64 -1 67 -1 69 -1 -1 0;72 -1 76 -1 74 -1 -1 0;72 -1 69 -1 67 -1 -1 0;65 -1 69 -1 71 -1 72 -1;69 -1 -1 0 67 -1 -1 0",
    "chords": "45 57 60 64;41 53 57 60;48 60 64 67;43 55 59 62;45 57 60 64;40 55 59 64;41 53 57 60;43 55 59 62;45 57 60 64;41 53 57 60;43 55 59 62;48 60 64 67;45 57 60 64;40 55 59 64;41 53 57 60;43 55 59 62"
  }
} as const;
const rows = (s: string) => s.split(';').map(row => row.split(' ').map(Number));
type Voice = 'lead' | 'arp' | 'bass';
const cache = new Map<MusicScene, AudioBuffer>();
const sampleRate = 24000;
function render(ctx: AudioContext, scene: MusicScene) {
  const cached = cache.get(scene);
  if (cached) return cached;
  const score = scores[scene], beat = 60 / score.bpm;
  const melody = rows(score.melody), chords = rows(score.chords);
  const size = Math.round(melody.length * 4 * beat * sampleRate);
  const mono = new Float32Array(size);
  function note(n: number, start: number, dur: number, amp: number, voice: Voice) {
    const index = Math.round(start * beat * sampleRate);
    const count = Math.min(size - index, Math.round(dur * beat * sampleRate));
    const omega = 2 * Math.PI * 440 * Math.pow(2,(n-69)/12);
    const attack = voice === 'lead' ? .012 : .018;
    const release = scene === 'world' ? .065 : .12;
    for (let i=0;i<count;i++) {
      const t=i/sampleRate, phase=omega*t;
      const wave = voice === 'bass' ? Math.sin(phase)+.12*Math.sin(phase*2)
        : voice === 'lead' && scene === 'world' ? Math.sin(phase)+.24*Math.sin(phase*3)+.07*Math.sin(phase*5)
        : Math.sin(phase)+(voice === 'arp' ? .25 : .24)*Math.sin(phase*2)+.08*Math.sin(phase*3);
      const env=Math.min(1,t/attack)*Math.min(1,Math.max(0,(count/sampleRate-t)/release))*Math.exp(-t*(voice==='arp'?.85:.3));
      mono[index+i]+=amp*wave*env;
    }
  }
  melody.forEach((m,bar)=>{
    const b=bar*4,c=chords[bar];
    m.forEach((n,i)=>{
      if(n<=0)return;
      let j=i+1;while(j<8&&m[j]===-1)j++;
      note(n,b+i*.5,(j-i)*.5*(scene==='world'?.90:.94),scene==='world'?.31:scene==='title'?.26:.20,'lead');
    });
    if(scene==='study'){
      [c[1],c[2],c[3],c[2]].forEach((n,i)=>note(n,b+i,.90,.11,'arp'));
      note(c[0],b,3.8,.14,'bass');
    } else if(scene==='title'){
      [c[1],c[2],c[3],c[2],c[1],c[2],c[3],c[2]].forEach((n,i)=>note(n,b+i*.5,.45,.11,'arp'));
      [0,2].forEach(i=>note(c[0],b+i,1.8,.15,'bass'));
    } else {
      [c[0],c[0]+12,c[0],c[3]-12].forEach((n,i)=>note(n,b+i,.65,.19,'bass'));
      [.5,1.5,2.5,3.5].forEach(i=>c.slice(1).forEach(n=>note(n,b+i,.22,.055,'arp')));
    }
  });
  const buffer=ctx.createBuffer(2,size,sampleRate);
  let peak=.77;
  [.097,.143].forEach((delay,channel)=>{
    const dst=buffer.getChannelData(channel), lag=Math.round(delay*sampleRate);
    for(let i=0;i<size;i++){dst[i]=mono[i]+.12*mono[(i+size-lag)%size];peak=Math.max(peak,Math.abs(dst[i]));}
  });
  for(let channel=0;channel<2;channel++){const dst=buffer.getChannelData(channel);for(let i=0;i<size;i++)dst[i]*=.77/peak;}
  cache.set(scene,buffer);return buffer;
}

const enabledKey='kazu.bgm.enabled', volumeKey='kazu.bgm.volume';
let enabled=true, volume=30;
const clamp=(n:number)=>Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):30;
try {
  if(typeof window!=='undefined'){
    enabled=window.localStorage.getItem(enabledKey)!=='false';
    const saved=window.localStorage.getItem(volumeKey);
    if(saved!==null)volume=clamp(Number(saved));
  }
}catch{}
let context: AudioContext|undefined;
let gain: GainNode|undefined;
let source: AudioBufferSourceNode|undefined;
let desired: MusicScene|undefined;
let playing: MusicScene|undefined;
let unlocked=false;
const titleAsset='title-infinity-v3.flac';
const titleLoopStart=416500/44100;
const titleLoopEnd=3552500/44100;
let titleRequest: Promise<AudioBuffer> | undefined;
function loadApprovedTitle(ctx: AudioContext) {
  if (!titleRequest) {
    titleRequest = fetch(new URL(titleAsset,new URL('.',window.location.href)))
      .then(response=>{if(!response.ok)throw new Error('Title BGM asset unavailable');return response.arrayBuffer();})
      .then(bytes=>ctx.decodeAudioData(bytes))
      .then(buffer=>{
        if(Math.abs(buffer.duration-titleLoopEnd)>.015)throw new Error('Invalid approved title BGM duration');
        cache.set('title',buffer);
        titleRequest=undefined;
        return buffer;
      }).catch(error=>{titleRequest=undefined;throw error;});
  }
  return titleRequest;
}

// Decode the approved title even if autoplay is blocked. The first gesture
// can then start the cached buffer without waiting for a network download.
function prepareTitle(ctx: AudioContext){
  if(desired==='title'&&!cache.has('title')&&!titleRequest){
    void loadApprovedTitle(ctx).then(sync).catch(()=>{});
  }
}

export const musicEnabled=()=>enabled;
export const musicVolume=()=>volume;
function save(key:string,value:unknown){try{if(typeof window!=='undefined')window.localStorage.setItem(key,String(value));}catch{}}
function stop(){
  if(source){try{source.stop();source.disconnect();}catch{}}
  source=undefined;playing=undefined;
}
function sync(){
  if(!context||!gain||!unlocked||!enabled||!volume||!desired||typeof document==='undefined'||document.hidden){stop();return;}
  if(context.state!=='running')return;
  if(source&&playing===desired)return;
  stop();
  if(desired==='title'&&!cache.has('title')){
    prepareTitle(context);
    return;
  }
  try{
    const next=context.createBufferSource();next.buffer=render(context,desired);next.loop=true;
    if(desired==='title'){
      next.loopStart=titleLoopStart;
      next.loopEnd=Math.min(titleLoopEnd,next.buffer.duration);
    }
    next.connect(gain);gain.gain.setValueAtTime(volume/100*.55,context.currentTime);
    next.start();source=next;playing=desired;
  }catch{}
}
export function setMusicScene(scene: MusicScene|undefined){
  desired=scene;
  // Try browser-permitted autoplay on entry, rather than requiring a click
  // even on browsers which already allow audio for this site.
  if(scene&&enabled&&volume>0)unlockMusic();
  else sync();
}
export function setMusicEnabled(on:boolean){enabled=on;save(enabledKey,on);if(on&&desired&&volume>0)unlockMusic();else sync();}
export function setMusicVolume(level:number){
  volume=clamp(level);save(volumeKey,volume);
  if(gain&&context)gain.gain.setTargetAtTime(volume/100*.55,context.currentTime,.025);
  if(enabled&&volume>0&&desired)unlockMusic();else sync();
}
export function unlockMusic(){
  if(typeof window==='undefined'||typeof document==='undefined'||document.hidden||!enabled||!volume||!desired)return;
  try{
    const Constructor=window.AudioContext??(window as Window & {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
    if(!Constructor)return;
    if(!context){
      context=new Constructor();gain=context.createGain();gain.connect(context.destination);
      context.addEventListener('statechange',sync);
    }
    unlocked=true;
    // Start fetching before resume: resume may stay pending until a user gesture.
    prepareTitle(context);
    if(context.state!=='running')void context.resume().then(sync).catch(()=>{});
    else sync();
  }catch{}
}
export function refreshMusicVisibility(){
  if(typeof document!=='undefined'&&!document.hidden&&enabled&&volume>0&&desired)unlockMusic();
  else sync();
}
