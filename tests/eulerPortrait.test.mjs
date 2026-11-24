import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {eulerPortraitUri} from '../src/domain/eulerPortrait.ts';

test('Euler dialogue uses the exact extracted PNG portrait instead of the temporary emblem',()=>{
  assert.match(eulerPortraitUri,/^data:image\/png;base64,/);
  const bytes=Buffer.from(eulerPortraitUri.split(',')[1],'base64');
  assert.equal(bytes.length,27173);
  assert.equal(bytes.readUInt32BE(16),128);
  assert.equal(bytes.readUInt32BE(20),128);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'39e6d62b7d06784c3b973f91d00a40e1be8c6b01113c6c35b95cf57808666bc9');
  const ui=readFileSync(new URL('../src/components/AdventureCompanion.tsx',import.meta.url),'utf8');
  assert.ok(ui.includes('source={{uri:eulerPortraitUri}}'));
  assert.ok(ui.includes('testID="euler-companion-portrait"'));
  assert.ok(ui.includes('<CompanionAvatar mood={mood}'));
  assert.doesNotMatch(ui,/styles\.eulerMark/);
});
