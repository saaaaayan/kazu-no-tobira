import { createHash } from 'node:crypto';
import { existsSync,readFileSync,writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
export const responsiveWorldMapAssets = [
  {
    "key": "pc",
    "filename": "world-map-pc-20261124.png",
    "width": 1672,
    "height": 941,
    "bytes": 3127684,
    "sha256": "ca94289b5fbc0474be31e181c1ecf8daf54e313de8418f0b6c11b6ff1f44fef7",
    "chunks": 7
  },
  {
    "key": "mobile",
    "filename": "world-map-mobile-20261124.png",
    "width": 882,
    "height": 1780,
    "bytes": 2755048,
    "sha256": "f57bb95b02e1931932c0ad9fcca16ec929854c8a326d69385e12b041e277e472",
    "chunks": 6
  }
];
export function verifyResponsiveWorldMap(bytes,spec) {
  if(bytes.length!==spec.bytes || bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a' || bytes.readUInt32BE(16)!==spec.width || bytes.readUInt32BE(20)!==spec.height || createHash('sha256').update(bytes).digest('hex')!==spec.sha256)
    throw new Error('Approved responsive world map differs from source: '+spec.filename);
  return bytes;
}
export function materializeResponsiveWorldMaps(root) {
  for(const spec of responsiveWorldMapAssets) {
    const target=resolve(root,'public',spec.filename);
    if(existsSync(target)) {try {verifyResponsiveWorldMap(readFileSync(target),spec);continue;} catch {}}
    const parts=Array.from({length:spec.chunks},(_,i)=>readFileSync(resolve(root,'assets/world-map-responsive-20261124',spec.key,'part'+String(i).padStart(2,'0')+'.bin')));
    writeFileSync(target,verifyResponsiveWorldMap(Buffer.concat(parts),spec));
  }
}
