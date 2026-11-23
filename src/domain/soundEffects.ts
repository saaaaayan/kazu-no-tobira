import type {SoundEffect} from './soundScore.ts';
// No browser AudioContext on native. The Expo mobile audio backend can be
// added when a native audio dependency is introduced. Never crash the app.
export function setSoundEffectsEnabled(_enabled:boolean):void{}
export function prepareSoundEffects():void{}
export function playSoundEffect(_effect:SoundEffect):void{}
