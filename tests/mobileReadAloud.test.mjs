import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { preferredJapaneseVoice, naturalJapaneseSpeechText } from '../src/domain/japaneseSpeech.ts';

const component=readFileSync(new URL('../src/components/QuestionReadAloud.web.tsx',import.meta.url),'utf8');

test('listen button is visible even when mobile browsers report no voices',()=>{
  assert.deepEqual(preferredJapaneseVoice([]),undefined);
  assert.deepEqual(preferredJapaneseVoice([{name:'English',lang:'en-US',localService:true}]),undefined);
  assert.match(component,/🔊 きく/u);
  assert.match(component,/onPress=\{read\}/u);
  assert.doesNotMatch(component,/if \(!voice\) return null/u);
  assert.match(component,/const selected=preferredJapaneseVoice\(speech\.getVoices\(\)\) \?\? voice/u);
  assert.match(component,/if \(selected\) message\.voice=selected/u);
  assert.match(component,/message\.lang='ja-JP'/u);
  assert.match(component,/speech\.speak\(message\)/u);
});

test('mobile speech is triggered directly from a tap and reports browser failures',()=>{
  assert.match(component,/const read=\(\)=>\{/u);
  assert.match(component,/typeof SpeechSynthesisUtterance==='undefined'/u);
  assert.match(component,/message\.onerror=event=>/u);
  assert.match(component,/setError\(unavailableMessage\)/u);
  assert.match(component,/activeUtterance\.current=message/u);
  assert.match(component,/speech\.addEventListener\?\.\('voiceschanged',update\)/u);
  assert.match(component,/accessibilityLiveRegion="polite"/u);
  assert.ok(naturalJapaneseSpeechText('はなは いくつ？').includes('いくつ？'));
});
