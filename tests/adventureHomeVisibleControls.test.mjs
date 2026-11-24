import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../src/components/AdventureHome.tsx', import.meta.url), 'utf8');

test('desktop illustration remains full frame without cropping or letterboxing', () => {
  assert.match(source, /illustrationFrame:\s*\{[\s\S]*?aspectRatio:\s*1448\s*\/\s*1086/);
  assert.match(source, /illustration:\s*\{\s*width:\s*'100%',\s*height:\s*'100%'/);
  assert.match(source, /<Image source=\{EULER_HOME_ART\} resizeMode="stretch"/);
  assert.doesNotMatch(source, /resizeMode="contain"/);
});

test('desktop retains all six image hotspots; portrait controls are separate', () => {
  const sixStyles = ['Resume', 'Intro', 'Players', 'Titles', 'Settings', 'Share'];
  for (const name of sixStyles) {
    assert.match(source, new RegExp('styles\\.art' + name + 'Hit'));
  }
  assert.equal((source.match(/accessibilityRole="button" accessibilityLabel="/g) || []).length >= 6, true);
  assert.doesNotMatch(source, /styles\.mobileControls|styles\.pixelFrame|styles\.mobileStart/);
  assert.doesNotMatch(source, /<View style=\{styles\.mobileRow\}>/);
});

test('hotspots match the actual art button positions and do not overlap', () => {
  const expected = {
    Resume: [0.5, 0.762], Intro: [0.5, 0.842],
    Players: [0.32, 0.925], Titles: [0.68, 0.925],
    Settings: [0.05, 0.93], Share: [0.95, 0.93],
  };
  const positions = Object.entries(expected).map(([name, point]) => {
    const rx = new RegExp('art' + name + "Hit:\\s*\\{ left: '([\\d.]+)%', top: '([\\d.]+)%', width: '([\\d.]+)%', height: '([\\d.]+)%' \\}");
    const m = source.match(rx);
    assert.ok(m, 'missing rectangle for ' + name);
    const [, left, top, width, height] = m.map(Number);
    const rect = { name, left: left / 100, top: top / 100, width: width / 100, height: height / 100 };
    assert.ok(rect.left > 0 && rect.top > 0 && rect.left + rect.width < 1 && rect.top + rect.height < 1);
    const [cx, cy] = point;
    assert.ok(cx >= rect.left && cx <= rect.left + rect.width, name + ' x center inaccurate');
    assert.ok(cy >= rect.top && cy <= rect.top + rect.height, name + ' y center inaccurate');
    return rect;
  });
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i], b = positions[j];
      const overlaps = a.left < b.left + b.width && b.left < a.left + a.width
        && a.top < b.top + b.height && b.top < a.top + a.height;
      assert.equal(overlaps, false, a.name + ' and ' + b.name + ' overlap');
    }
  }
});

test('each image hotspot has the correct action and preview settings remain usable', () => {
  assert.match(source, /disabled=\{loading\} onPress=\{onStart\}/);
  assert.match(source, /onPress=\{\(\) => togglePanel\('intro'\)\}/);
  assert.match(source, /onPress=\{\(\) => togglePanel\('players'\)\}/);
  assert.match(source, /onPress=\{onTitles \?\? onStart\}/);
  assert.match(source, /onPress=\{\(\) => togglePanel\('settings'\)\}/);
  assert.match(source, /onPress=\{shareHome\}/);
  assert.match(source, /activePanel === 'settings'/);
  assert.doesNotMatch(source, /activePanel === 'settings' && !preview/);
  assert.match(source, /onPress=\{closePanel\}/);
});

const adventure = readFileSync(new URL('../src/FullAdventure.tsx', import.meta.url), 'utf8');
test('narrow home uses proportionate art and six accessible portrait controls without changing desktop art', () => {
  assert.match(adventure, /compactHome = viewport <= 600 && screen === 'home' && !round/);
  assert.match(adventure, /<AdventureHome compact=\{compactHome\}/);
  assert.match(source, /\{compact \? <>/);
  assert.match(source, /portraitArtCrop: \{[^\n]*aspectRatio:1448\/\(1086\*\.72\)/);
  const portrait = source.split('testID="portrait-home-menu"')[1].split('</> : <View style={styles.illustrationFrame}>')[0];
  assert.equal((portrait.match(/accessibilityRole="button"/g)||[]).length,6);
  assert.match(source, /portraitButton: \{ minHeight:46/);
  assert.match(source, /portraitOverlay: \{ top:8, bottom:8/);
  assert.match(adventure, /portraitHomeShell: \{ flexGrow:1/);
  assert.match(adventure, /portraitHomeScroll: \{ padding: 6, paddingBottom: 6/);
  assert.match(adventure, /compactHome \? styles.portraitVersion : styles.hintNote/);
});
