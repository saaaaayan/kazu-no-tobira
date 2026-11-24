import { materializeResponsiveWorldMaps } from './responsive-world-map-assets.mjs';
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

 
// Restore the new, user-selected 2026-11-23 version as an additional immutable
// asset. Keep the original PNG above for rollbacks and older release snapshots.
const richMapDestination=join(root,'public','world-map-rich-20261123.png');
const richMapSha='7f2573fe2850e626012d6d36c65d665e1e9a820d9f8ed2762663418abdfe564c';
const richMapValid=bytes=>bytes.length===3_555_946 &&
  bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a' &&
  bytes.readUInt32BE(16)===1448 && bytes.readUInt32BE(20)===1086 &&
  digest(bytes)===richMapSha;
if(existsSync(richMapDestination)&&richMapValid(readFileSync(richMapDestination))) {
  console.log('2026-11-23 world map verified: '+richMapSha);
} else {
  const chunks=[];
  for(let n=0;n<14;n++){
    const part=readFileSync(join(root,'assets/world-map-rich-base64',
      `part${String(n).padStart(2,'0')}.txt`),'utf8');
    if(!/^[A-Za-z0-9+/]*={0,2}$/.test(part) ||
       part.length!==(n===13?338658:338662))
      throw new Error('Invalid rich world-map chunk '+n);
    chunks.push(part);
  }
  const image=Buffer.from(chunks.join(''),'base64');
  if(!richMapValid(image))
    throw new Error('2026-11-23 world-map image bytes differ from user-approved image.');
  writeFileSync(richMapDestination,image);
  console.log('Restored exact 2026-11-23 world map: '+richMapSha);
}

// Restore the exact losslessly compressed title track approved by the owner.
const musicDestination=join(root,'public','title-infinity-v3.flac');
const musicSha='1a7afff5e8836510a138ae611308a481aef5543b4b25643b22b80d572b65a1aa';
const musicValid=bytes=>bytes.length===6633014 && bytes.subarray(0,4).toString('ascii')==='fLaC' && digest(bytes)===musicSha;
if(!existsSync(musicDestination)||!musicValid(readFileSync(musicDestination))){
  const chunks=Array.from({length:8},(_,n)=>readFileSync(join(root,'assets/title-infinity-v3',`part${String(n).padStart(2,'0')}.bin`)));
  const audio=Buffer.concat(chunks);
  if(!musicValid(audio))throw new Error('Approved title BGM differs from original lossless asset.');
  writeFileSync(musicDestination,audio);
}
console.log('Approved title BGM verified: '+musicSha);

materializeResponsiveWorldMaps(root);
