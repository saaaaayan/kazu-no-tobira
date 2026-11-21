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

test('home illustration crops its painted buttons without cropping the title scene', () => {
  assert.match(source, /illustrationClip:\s*\{[^}]*aspectRatio:\s*1448\s*\/\s*761/);
  assert.match(source, /illustration:\s*\{[^}]*aspectRatio:\s*1448\s*\/\s*1086/);
});

test('home shows actionable start, help, player, titles, settings and share buttons', () => {
  for (const label of [
    'ぼうけんを つづける', 'はじめて あそぶ', '♟ プレイヤー',
    '🏆 しょうごう', '⚙ せってい', '↥ きょうゆう',
  ]) {
    assert.ok(source.includes(label), `Missing visible action: ${label}`);
  }
  assert.match(source, /onPress=\{onStart\} style=\{styles\.mobileStart\}/);
  assert.match(source, /onPress=\{switchIntro\}/);
  assert.match(source, /onPress=\{switchPlayers\}/);
  assert.match(source, /onPress=\{onTitles \?\? onStart\}/);
  assert.match(source, /onPress=\{shareHome\}/);
});
