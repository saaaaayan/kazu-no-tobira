import {writeFileSync,mkdirSync} from 'node:fs';
import {HERO_PIXEL_SPRITES} from '../src/domain/heroPixelSprites.ts';
import {WILDLIFE_COLORS} from '../src/domain/wildlifePixelSprites.ts';
export function spriteSvg(id,size=96,silhouette=false){
 const colors={X:'#454d3e',B:'#a17c57',A:'#816747',F:'#eee1c2',R:'#d6a1a0',...WILDLIFE_COLORS[id]};
 const pixels=HERO_PIXEL_SPRITES[id].flatMap((row,y)=>[...row].flatMap((c,x)=>c==='.'?[]:[`<rect x="${x}" y="${y}" width="1" height="1" fill="${silhouette?'#354739':colors[c]}"/>`])).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" shape-rendering="crispEdges" role="img">${pixels}</svg>`;
}
const names=['くま','うさぎ','きつね','りす','ふくろう','小鳥','ティラノサウルス','トリケラトプス','ブラキオサウルス','プテラノドン','ステゴサウルス'];
const entries=Object.keys(HERO_PIXEL_SPRITES);
const cards=(forest)=>entries.filter(id=>id.startsWith(forest?'forest':'prehistoric')).map(id=>`<article><h3>${names[entries.indexOf(id)]}</h3><div class="samples">${[96,64,32].map(size=>`<figure>${spriteSvg(id,size)}<figcaption>${size}px</figcaption></figure>`).join('')}<figure>${spriteSvg(id,64,true)}<figcaption>輪郭</figcaption></figure></div><small>32 × 32 master · ${id}</small></article>`).join('');
mkdirSync('public/art-review',{recursive:true});
writeFileSync('public/art-review/index.html',`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>どうぶつ・恐竜 スプライト一覧｜数のトビラ</title><style>*{box-sizing:border-box}body{margin:0;background:#f1efdf;color:#354739;font-family:system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:24px}a{color:inherit}h1{font-size:24px}h2{margin-top:36px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}article{padding:16px;background:#e0e6cb;border:1px solid #b0b99a;border-radius:12px}h3{margin:0 0 8px;font-size:18px}.samples{display:flex;align-items:end;gap:10px;min-height:128px}figure{margin:0;text-align:center}figcaption,small{font-size:11px;color:#526146}svg{display:block;image-rendering:pixelated}small{display:block;margin-top:14px}</style><main><a href="../">数のトビラへもどる</a><h1>どうぶつ・恐竜 スプライト一覧</h1><p>同じ背景・同じ表示枠で、大・中・小と輪郭を見くらべられます。島と同じ32×32の原画を表示しています。</p><h2>どうぶつの島</h2><div class="grid">${cards(true)}</div><h2>恐竜の島</h2><div class="grid">${cards(false)}</div></main></html>`);
