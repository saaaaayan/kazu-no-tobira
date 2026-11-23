import {soundScore,type SoundEffect} from './soundScore.ts';

let enabled=true;
let context:AudioContext|undefined;
type SafariAudioWindow=Window&{webkitAudioContext?:typeof AudioContext};

export function setSoundEffectsEnabled(value:boolean):void{
  enabled=value;
}

/** Call synchronously from a user tap so Safari/Chrome can unlock Web Audio.
 * No audio starts on page load; speech and music are unaffected.
 */
export function prepareSoundEffects():void{
  if(!enabled||typeof window==='undefined')return;
  try{
    const Ctor=window.AudioContext||(window as SafariAudioWindow).webkitAudioContext;
    if(!Ctor)return;
    if(!context)context=new Ctor();
    if(context.state==='suspended')void context.resume().catch(()=>{});
  }catch{
    // Unsupported browser, disabled sound hardware or an unavailable audio API.
  }
}

/** Non-blocking: scoring/navigation never depend on sound playback. */
export function playSoundEffect(effect:SoundEffect):void{
  if(!enabled)return;
  prepareSoundEffects();
  const audio=context;
  if(!audio)return;
  try{
    const base=audio.currentTime+.008;
    for(const tone of soundScore[effect]){
      const start=base+tone.at;
      const stop=start+tone.duration;
      const oscillator=audio.createOscillator();
      const envelope=audio.createGain();
      oscillator.type=tone.wave;
      oscillator.frequency.setValueAtTime(440*Math.pow(2,(tone.midi-69)/12),start);
      envelope.gain.setValueAtTime(.0001,start);
      envelope.gain.linearRampToValueAtTime(tone.volume,start+Math.min(.013,tone.duration*.22));
      envelope.gain.exponentialRampToValueAtTime(.0001,stop);
      oscillator.connect(envelope);
      envelope.connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(stop+.01);
      oscillator.onended=()=>{
        oscillator.disconnect();
        envelope.disconnect();
      };
    }
  }catch{
    // Keep the learning flow working even when audio playback is unavailable.
  }
}
