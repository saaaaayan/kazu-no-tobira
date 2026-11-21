import {worldIslands} from '../src/domain/worldCatalog.ts';
import {ISLAND_SPRITES} from '../src/domain/islandPixelSprites.ts';
import {PIXEL_WORLD_MOTIFS,PIXEL_WORLD_CENTERS,PIXEL_WORLD_CONNECTIONS,PIXEL_WORLD_STAMPS} from '../src/domain/pixelWorldMap.ts';
// Small fixed palette: paper/ink plus two flat shades for each island family.
const palettes=[['#a9bfa4','#769a87'],['#afbfcb','#7898b1'],['#9eb69a','#6d9276'],['#d1b4ad','#b18783'],
 ['#bcaa84','#8b9871'],['#a3b5bd','#738e9f'],['#c5b599','#a18f70'],['#b6adc1','#8a819b'],
 ['#b4c7cc','#859eae'],['#b9adc4','#8b819e'],['#9aaec4','#748ba8'],['#99b39b','#6c947c'],
 ['#c6c7bb','#949f9d'],['#b9a9c3','#8b7d9f'],['#c6b49b','#a48e79'],['#a7b3c9','#7d8ba9']];
console.log(JSON.stringify({centers:PIXEL_WORLD_CENTERS,connections:PIXEL_WORLD_CONNECTIONS,
 islands:worldIslands.map((g,i)=>({id:g.id,grade:g.title,name:g.island,number:String(i+1).padStart(2,'0'),
 land:palettes[i][0],accent:palettes[i][1],motifs:PIXEL_WORLD_MOTIFS[g.id].map(kind=>({kind,rows:PIXEL_WORLD_STAMPS[kind]??ISLAND_SPRITES[kind]}))}))}));
