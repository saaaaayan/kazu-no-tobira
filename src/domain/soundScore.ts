/**
 * Original, synthesized retro game cues. No downloaded or licensed recordings.
 * Timing is in seconds; MIDI pitches keep the melodies easy to maintain.
 * A gentle wrong-answer cue encourages retrying without a harsh buzzer.
 */
export type SoundEffect='tap'|'select'|'start'|'correct'|'incorrect'|'clear'|'achievement'|'hint'|'island';
export type SoundTone={
  midi:number;
  at:number;
  duration:number;
  volume:number;
  wave:'sine'|'triangle'|'square';
};
const note=(midi:number,at:number,duration:number,volume:number,
  wave:SoundTone['wave']='triangle'):SoundTone=>({midi,at,duration,volume,wave});

export const soundScore:Readonly<Record<SoundEffect,readonly SoundTone[]>>={
  tap:         [note(76,0,.045,.012)],
  select:      [note(72,0,.055,.018),note(79,.048,.07,.012)],
  start:       [note(60,0,.09,.022),note(64,.09,.09,.022),note(67,.18,.18,.025)],
  correct:     [note(76,0,.10,.025),note(79,.10,.17,.029)],
  incorrect:   [note(62,0,.11,.015,'sine'),note(60,.13,.18,.013,'sine')],
  clear:       [note(60,0,.14,.027),note(64,.16,.14,.027),
                note(67,.32,.14,.028),note(72,.48,.36,.030)],
  achievement: [note(67,0,.13,.024),note(71,.13,.13,.025),note(74,.26,.13,.028),
                note(79,.39,.18,.030),note(83,.57,.38,.024)],
  hint:        [note(72,0,.06,.013),note(76,.085,.11,.015)],
  island:      [note(65,0,.10,.018),note(69,.11,.15,.021)],
};

export function soundDuration(effect:SoundEffect):number{
  return Math.max(...soundScore[effect].map(tone=>tone.at+tone.duration));
}
