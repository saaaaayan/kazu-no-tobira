import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { naturalJapaneseSpeechText, preferredJapaneseVoice } from '../src/domain/japaneseSpeech.ts';

const voice=(name,lang='ja-JP',localService=true)=>({name,lang,localService});

test('natural-sounding Japanese voices are preferred over a default local Japanese voice',()=>{
  const installed=[
    voice('Microsoft Haruka Desktop','ja-JP',true),
    voice('Google 日本語','ja-JP',false),
    voice('Microsoft Nanami Online (Natural)','ja-JP',false),
    voice('English US Voice','en-US',true),
  ];
  assert.equal(preferredJapaneseVoice(installed)?.name,'Microsoft Nanami Online (Natural)');
  assert.equal(preferredJapaneseVoice(installed.slice(0,2))?.name,'Google 日本語');
  assert.equal(preferredJapaneseVoice([voice('English US Voice','en-US')]),undefined);
  assert.equal(preferredJapaneseVoice([voice('日本語（端末標準）')])?.lang,'ja-JP');
  assert.equal(preferredJapaneseVoice([]),undefined);
});

test('the Japanese question is spoken with natural pauses and without ?。',()=>{
  assert.equal(
    naturalJapaneseSpeechText('はなは いくつ？。はなを さわって かぞえよう'),
    'はなは、いくつ？　はなを、さわってかぞえよう'
  );
  assert.equal(naturalJapaneseSpeechText('おくりものは いくつ？。おくりものを さわって かぞえよう'),
    'おくりものは、いくつ？　おくりものを、さわってかぞえよう');
});

test('the Japanese explanation says native counting words without changing what was counted',()=>{
  assert.equal(
    naturalJapaneseSpeechText('はなは 3 こ。ひとつずつ かぞえたよ。'),
    'はなは、みっつ。　ひとつずつかぞえたよ。'
  );
  assert.equal(naturalJapaneseSpeechText('くまは 1 こ。'),'くまは、ひとつ。');
  assert.equal(naturalJapaneseSpeechText('うさぎは 2 こ。'),'うさぎは、ふたつ。');
});

test('the actual listen button uses the selected Japanese voice and adjusted pace',()=>{
  const source=readFileSync(new URL('../src/components/QuestionReadAloud.web.tsx',import.meta.url),'utf8');
  assert.match(source,/preferredJapaneseVoice\(speech\.getVoices\(\)\)/);
  assert.match(source,/new SpeechSynthesisUtterance\(naturalJapaneseSpeechText\(text\)\)/);
  assert.match(source,/message\.rate=0\.96/);
  assert.match(source,/message\.lang='ja-JP'/);
  assert.doesNotMatch(source,/item\.localService &&/);
});
