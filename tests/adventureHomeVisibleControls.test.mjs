import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../src/components/AdventureHome.tsx', import.meta.url), 'utf8');

test('home actions use visible controls on every viewport', () => {
  assert.match(source, /<View style=\{\[styles\.mobileControls, !compact && styles\.wideControls\]\}>/);
  assert.doesNotMatch(source, /\{compact && <View style=\{styles\.mobileControls\}>/);
  assert.doesNotMatch(source, /\{!compact && <>/);
  assert.doesNotMatch(source, /styles\.hotspot/);
});

test('illustration fills its entire frame with no letterbox or crop', () => {
  assert.match(source, /illustrationClip:\s*\{[^}]*aspectRatio:\s*1448\s*\/\s*1086/);
  assert.match(source, /illustration:\s*\{[^}]*width:\s*'100%',\s*height:\s*'100%'/);
  assert.match(source, /<Image source=\{EULER_HOME_ART\} resizeMode="stretch"/);
  assert.doesNotMatch(source, /resizeMode="contain"/);
});

test('gold pictured primary action is interactive and not duplicated', () => {
  assert.match(source, /onPress=\{onStart\}\s+hitSlop=\{8\} style=\{styles\.artStartHotspot\}/);
  assert.doesNotMatch(source, /style=\{styles\.mobileStart\}/);
});

test('all five secondary controls share one muted bevelled 8-bit frame', () => {
  assert.equal((source.match(/styles\.pixelFrame/g) || []).length, 5);
  assert.equal((source.match(/styles\.pixelLabel/g) || []).length, 5);
  assert.match(source, /pixelFrame:\s*\{\s*borderRadius:\s*0, borderWidth:\s*3, backgroundColor:\s*'#203b54'/);
  assert.match(source, /borderTopColor:\s*'#c0d5c8'/);
  assert.doesNotMatch(source, /borderColor:\s*'#ffe5a0'/);
  assert.doesNotMatch(source, /mobileIntro:\s*\{[^}]*backgroundColor:/);
});

test('home shows actionable start, help, player, titles, settings and share buttons', () => {
  for (const label of [
    'ぼうけんを つづける', 'はじめて あそぶ', '♟ プレイヤー',
    '🏆 しょうごう', '⚙ せってい', '↥ きょうゆう',
  ]) {
    assert.ok(source.includes(label), `Missing visible action: ${label}`);
  }
  assert.match(source, /style=\{styles\.artStartHotspot\}/);
  assert.match(source, /onPress=\{switchIntro\}/);
  assert.match(source, /onPress=\{switchPlayers\}/);
  assert.match(source, /onPress=\{onTitles \?\? onStart\}/);
  assert.match(source, /onPress=\{shareHome\}/);
});
