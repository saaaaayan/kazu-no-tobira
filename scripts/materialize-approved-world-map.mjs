import {createHash} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join,resolve} from 'node:path';

// Restore the user's exact 2026-11-22 artwork byte-for-byte before preview,
// tests or build. The original PNG exceeds the connector's single-blob limit,
// so its base64 representation is stored in fourteen numbered text chunks.
// No lossy conversion, resizing, filtering, or image regeneration is involved.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const destination=join(root,'public','world-map-approved-20261122.png');
const expectedSha='5e91554bc4de79192d5a1b04994149e866c7c8e1b0f17963dc21f9cc88cddc2c';
const expectedBytes=7_804_072;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const valid=bytes=>bytes.length===expectedBytes &&
  bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a' &&
  bytes.readUInt32BE(16)===2048 && bytes.readUInt32BE(20)===1522 &&
  digest(bytes)===expectedSha;
if(existsSync(destination)&&valid(readFileSync(destination))) {
  console.log('Approved world map verified: '+expectedSha);
} else {
  const parts=[];
  for(let n=0;n<14;n++){
    const part=readFileSync(join(root,'assets/world-map-base64',`part${String(n).padStart(2,'0')}.txt`),'utf8');
    if(!/^[A-Za-z0-9+/]*={0,2}$/.test(part)||part.length!==(n===13?655432:750000))
      throw new Error('Invalid original world-map chunk '+n);
    parts.push(part);
  }
  const bytes=Buffer.from(parts.join(''),'base64');
  if(!valid(bytes))throw new Error('World-map image bytes differ from the approved original.');
  writeFileSync(destination,bytes);
  console.log('Restored original approved world map: '+expectedSha);
}
