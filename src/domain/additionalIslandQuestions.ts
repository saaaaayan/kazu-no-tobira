import type {WorldStage} from './worldCatalog.ts';
import type {MathQuestion} from './worldQuestions.ts';
import type {BankQuestion} from './questionBank.ts';
import {countingTokenArt, preschoolCountingTokens, type CountingToken} from './countingTokens.ts';

/**
 * Ten reproducible prototype items for each stage of the four non-grade islands.
 * Questions here are explicitly FIRST DRAFTS and require educational review.
 * Each item carries a worked explanation and three non-answer-revealing hints.
 */
type Draft=Omit<MathQuestion,'id'|'skillId'>;
const combinations=(n:number,r:number):number=>{
  let v=1;
  for(let k=1;k<=r;k++)v=v*(n-k+1)/k;
  return Math.round(v);
};
const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a;
const shapes=['dot','triangle','square','bear','star','heart','cat','dog','rabbit','flower',
  'apple','car','fish','balloon','cookie'] as const satisfies readonly CountingToken[];
function choices(n:number,zero=false):[string,string,string] {
  if(n<=0)return ['0','1','2'];
  if(n===1)return ['1','2',zero?'0':'3'];
  if(n>=10)return [String(n-2),String(n-1),String(n)];
  return [String(n-1),String(n),String(n+1)];
}
function preschoolQuestion(stage:WorldStage,index:number):BankQuestion {
  const unit=stage.kind==='secret'? (stage.unitIndex+7)%10 : stage.unitIndex;
  const token=shapes[(index+stage.order*7)%shapes.length];
  const name=countingTokenArt[token][1];
  const difficulty=stage.kind==='normal'?(stage.part<2?1:2):3;
  const variant=(index+stage.part+stage.unitIndex)%10;
  let n=1+variant, stem='',prompt='',answer=String(n);
  let diagram:BankQuestion['diagram'];
  let options:[string,string,string]=choices(n);
  let hints:[string,string,string]=['えを よく みよう。','ひとつずつ たしかめよう。','さいごに こたえを えらぼう。'];
  let explanation='';
  const rows=(values:readonly CountingToken[])=>[{tokens:[...values]}];
  if(unit===0||unit===1||unit===2||unit===9) {
    n=unit===0?1+((index+stage.part)%Math.min(10,3+stage.part)):
      unit===2?(index+stage.part)%10:1+variant;
    answer=String(n);
    options=choices(n,true);
    stem=unit===2? '「'+n+'」を ゆびで なぞって、ただしい すうじを えらぼう。':
      unit===1?'えに あう すうじは どれ？ '+name+'を かぞえよう。':
      name+'は いくつ？';
    prompt=unit===2?'すうじを なぞってから、こたえを えらぼう。':name+'を ひとつずつ さわって かぞえよう。';
    diagram={kind:'countingBoard',guide:true,rows:rows(Array.from({length:n},()=>token))};
    hints=['えと すうじを よく みよう。','ひとつ さわったら つぎへ。','さわった かずと、すうじを くらべよう。'];
    explanation=name+'は '+n+'こ。ひとつずつ たしかめると '+n+' だよ。';
    if(unit===2){
      stem='「'+n+'」を ゆびで なぞろう。 おなじ すうじは どれ？ ('+name+')';
      hints=['かたちを よく みよう。','ゆびで すうじの せんを なぞってね。','おなじ かたちの すうじを さがそう。'];
      explanation='「'+n+'」が ただしい すうじだよ。せんに そって なぞってみよう。';
    }
  } else if(unit===3) {
    n=1+((index+stage.part)%9);
    const before=index===9;
    answer=String(before?n-1:n+1);options=choices(Number(answer),true);
    stem=n+'、'+(n+1)+'、'+(n+2)+' の じゅんばんで、'+n+' の '+(before?'ひとつまえ':'つぎ')+'は？';
    prompt='ひとつ '+(before?'もどった':'すすんだ')+' すうじを えらぼう。';
    hints=['かずの じゅんばんを みよう。','かずは ひとつずつ ならんでいるよ。','ひとつ '+(before?'もどった':'すすんだ')+' ところを えらぼう。'];
    explanation=n+' の '+(before?'ひとつまえ':'つぎ')+'は '+answer+' だよ。';
  } else if(unit===4) {
    const other:CountingToken=shapes[(index+stage.order*7+4)%shapes.length];
    const a=1+variant, b=1+((variant+3)%7);
    n=Math.max(a,b);answer=String(n);options=choices(n);
    stem=name+'と '+countingTokenArt[other][1]+'、おおい ほうは なんこ？';
    prompt='それぞれ かぞえて くらべてね。';
    diagram={kind:'countingBoard',guide:true,rows:[
      {label:name,tokens:Array.from({length:a},()=>token)},
      {label:countingTokenArt[other][1],tokens:Array.from({length:b},()=>other)}
    ]};
    hints=['ふたつの ならびを かぞえよう。','おなじ かずだけ むすんで くらべてね。','おおい ほうの かずを えらぼう。'];
    explanation=name+'は '+a+'こ、'+countingTokenArt[other][1]+'は '+b+'こ。おおい ほうは '+n+'こ。';
  } else if(unit===5||unit===6) {
    const target:CountingToken=unit===6?(['dot','triangle','square'][index%3] as CountingToken):token;
    const other:CountingToken=unit===6?(['dot','triangle','square'][(index+1)%3] as CountingToken):
      shapes[(index+stage.order*7+3)%shapes.length];
    n=1+(index%7);answer=String(n);options=choices(n);
    const mixed:Array<CountingToken>=[];
    for(let j=0;j<n+3;j++)mixed.push(j<3?other:target);
    for(let j=mixed.length-1;j>0;j--){const k=(j*7+index*3)% (j+1);[mixed[j],mixed[k]]=[mixed[k],mixed[j]];}
    stem='この なかの '+countingTokenArt[target][1]+'は いくつ？ ('+name+')';
    prompt=countingTokenArt[target][1]+'だけを さわって かぞえよう。';
    diagram={kind:'countingBoard',guide:true,rows:rows(mixed),targetToken:target};
    hints=['いろいろな えが あるね。','さがすのは '+countingTokenArt[target][1]+' だけだよ。','ちがう えは かぞえないでね。'];
    explanation=countingTokenArt[target][1]+'は '+n+'こ。ちがう えは かぞえないよ。';
  } else if(unit===7) {
    const second=shapes[(index+stage.order*7+5)%shapes.length];
    const third=shapes[(index+stage.order*7+9)%shapes.length];
    const a=countingTokenArt[token][0],b=countingTokenArt[second][0];
    const next=(index+stage.part)%2===0?token:second;
    stem='ならびを みよう。 '+a+' '+b+' '+a+' '+b+' …… つぎは？ ('+index+')';
    answer=countingTokenArt[next][0];
    options=[countingTokenArt[token][0],countingTokenArt[second][0],countingTokenArt[third][0]];
    prompt='くりかえしの きまりを さがそう。';
    hints=['ふたつの えが くりかえすよ。','ひとつめと みっつめは おなじだね。','よっつめの つぎを かんがえよう。'];
    // A B A B always A; keep the actual answer A, irrespective of stage variation.
    answer=a;
    explanation=a+'と '+b+'が かわりばんこ。つぎは '+a+' だよ。';
  } else {
    const other=shapes[(index+stage.order*7+4)%shapes.length];
    n=1+(index%7);answer=String(n);options=choices(n);
    stem='したの ならびに ある '+name+'は いくつ？';
    prompt='うえではなく したの えを かぞえよう。';
    diagram={kind:'countingBoard',guide:true,rows:[
      {label:'うえ',tokens:Array.from({length:2+(index%4)},()=>other)},
      {label:'した',tokens:Array.from({length:n},()=>token)}
    ],targetToken:token};
    hints=['うえと したが あるよ。','したの ならびを みよう。','したに ある '+name+'を さわろう。'];
    explanation='したの '+name+'は '+n+'こ。うえの えは いれないよ。';
  }
  const wrongs=options.filter(v=>v!==answer);
  if(new Set(options).size!==3||!options.includes(answer))throw new Error('Preschool choices invalid '+stage.id+' '+index);
  return {id:stage.id+':draft10:'+String(index+1),skillId:stage.gradeId+'.'+stage.family,
    type:'choice',format:'counting',difficulty:difficulty as 1|2|3,
    question:stem,prompt,choices:options,answer,
    hint:hints[0],hints,explanation,steps:[
      {title:'みつける',body:hints[1]},{title:'たしかめる',body:explanation},
      {title:'くわしく しる',body:explanation}
    ],mistakes:wrongs.map(value=>({answer:value,explanation:'えを もういちど たしかめよう。'})),
    ...(diagram?{diagram}:{}),
  };
}

function advancedQuestion(stage:WorldStage,index:number):Draft {
  const unit=stage.kind==='secret'?(stage.unitIndex+5)%10:stage.unitIndex;
  const t=index+stage.order*3+1;
  const a=2+(t%11),b=3+((t*3)%13),c=2+((t*5)%7);
  let q='',ans=0,work='',hint='',next='';
  const grade=stage.gradeId;
  if(grade==='sage') {
    switch(unit) {
      case 0: { const d=2+t%10;q='ユークリッドの互除法で gcd('+d*8+', '+d*13+') を求めよ。';ans=d;hint='共通の約数を繰り返しの割り算で調べよう。';next='8と13は互いに素。';work='gcd(8d,13d)=d。d='+d+'なので最大公約数は'+d+'。';break; }
      case 1: { const x=a,y=a+2+(t%4);q='方程式 x²−'+(x+y)+'x＋'+x*y+'＝0 の大きい方の解は？';ans=y;hint='2つの数の和と積から因数分解しよう。';next='和は'+(x+y)+'、積は'+x*y+'。';work='(x−'+x+')(x−'+y+')=0。大きい方は'+y+'。';break; }
      case 2: {q='関数 y=−x²＋'+2*a+'x＋'+b+' の最大値は？';ans=a*a+b;hint='平方完成をして頂点を考えよう。';next='−(x−a)² の形にしよう。';work='y=−(x−'+a+')²＋'+ans+'。平方は0以上なので最大値は'+ans+'。';break; }
      case 3: {const n=5+t%10;q=n+'人から順序を付けずに3人を選ぶ方法は何通り？';ans=combinations(n,3);hint='順番を区別しない組合せを使おう。';next='nC3=n(n−1)(n−2)/6。';work=n+'C3='+n+'×'+(n-1)+'×'+(n-2)+'÷6='+ans+'。';break; }
      case 4: {const k=1+t%10;q='直角三角形の斜辺が'+5*k+'cm、一方の直角を挟む辺が'+3*k+'cm。もう一方の辺は何cm？';ans=4*k;hint='三平方の定理を使おう。';next='斜辺の2乗から他の辺の2乗を引こう。';work='√('+25*k*k+'−'+9*k*k+')='+4*k+'cm。';break; }
      case 5: {const n=4+t%10;const d=1+t%6;q='数列 a₁=2、aₙ₊₁=aₙ＋'+d+'n の第'+n+'項は？';ans=2+d*n*(n-1)/2;hint='隣り合う項の差を書き並べよう。';next='1からn−1までの和を使おう。';work='aₙ=2＋'+d+'×'+(n-1)+'×'+n+'÷2='+ans+'。';break; }
      case 6: {q='f(x)=−x³＋'+3*a*a+'x の極大となる正のx座標は？';ans=a;hint='微分して f′(x)=0 を解こう。';next='導関数は −3x²＋'+3*a*a+'。';work='f′(x)=−3(x−'+a+')(x＋'+a+')。x='+a+'で＋から−に変わるので極大。';break; }
      case 7: {q='定積分 ∫₀^'+a+' 2x dx の値は？';ans=a*a;hint='x²の微分が2xになることを使おう。';next='原始関数は x²。';work='[x²]₀^'+a+'='+a+'²='+ans+'。';break; }
      case 8: {q='ベクトル u=('+a+','+b+') と v=('+b+','+a+') の内積 u・v は？';ans=2*a*b;hint='対応する成分をかけて足そう。';next='第1成分の積と第2成分の積は等しい。';work=a+'×'+b+'＋'+b+'×'+a+'='+ans+'。';break; }
      default: {const n=2*a;q='周の長さ'+2*n+'cmの長方形で面積が最大となるとき、面積は何cm²？';ans=(n/2)**2;hint='和が一定の2辺の積を最大化しよう。';next='正方形になったとき積が最大。';work='縦と横の和は'+n+'cm。縦横とも'+n/2+'cmで最大面積'+ans+'cm²。';}
    }
  } else if(grade==='champion') {
    switch(unit) {
      case 0: {const mod=5+(t%9);const n=4+t;let v=1;for(let k=0;k<n;k++)v=v*2%mod;q='2^'+n+' を '+mod+' で割った余りは？';ans=v;hint='余りを順にかけて計算しよう。';next='2のべき乗の余りには周期がある。';work='2を'+n+'回かけ、途中でも'+mod+'で割った余りに置き換えると'+v+'。';break; }
      case 1: {const m=16+t;let count=0;for(let x=0;x<=m/3;x++)for(let y=0;y<=m/5;y++)if(3*x+5*y===m)count++;q='3x＋5y＝'+m+' を満たす非負整数(x,y)は何組？';ans=count;hint='xの値を小さい順に試そう。';next='5y='+m+'−3x が5の倍数になる条件。';work='xを0から'+Math.floor(m/3)+'まで動かし、'+m+'−3xが5の倍数となる場合を数えると'+count+'組。';break; }
      case 2: {q='実数xに対する x²−'+2*a+'x＋'+(a*a+b)+' の最小値は？';ans=b;hint='平方完成で非負の平方を取り出そう。';next='(x−'+a+')²の形にする。';work='(x−'+a+')²＋'+b+'だから最小値は'+b+'。';break; }
      case 3: {const n=4+t%10;q='どの2直線も平行でなく、3直線が1点に集まらない'+n+'本の直線は平面を最大いくつの領域に分ける？';ans=1+n*(n+1)/2;hint='直線を1本ずつ追加したときを考えよう。';next='k本目の直線はk個の領域を増やす。';work='最初1領域、増加は1＋2＋…＋'+n+'。合計'+ans+'領域。';break; }
      case 4: {q='整数の組 ('+a+','+b+') に (x,y)→(x＋1,y−1) を何度施しても変わらない和は？';ans=a+b;hint='操作の前後で2数の和を比べよう。';next='＋1と−1が打ち消し合う。';work='(x＋1)＋(y−1)=x＋y。初期値は'+a+'＋'+b+'='+ans+'。';break; }
      case 5: {const n=5+t%8;const k=2+t%3;ans=1;for(let j=0;j<k;j++)ans*=n-j;q=n+'種類の文字から重複を許さず長さ'+k+'の列を作る方法は何通り？';hint='順序を区別した並べ方を数えよう。';next='1文字目から候補は1つずつ減る。';work=n+'×'+Array.from({length:k-1},(_,i)=>n-1-i).join('×')+'='+ans+'。';break; }
      case 6: {const colors=3+t%5,need=2+t%4;q=色(colors)+'色の玉を箱に入れる。必ず同じ色が'+need+'個以上あると保証する最小個数は？';ans=colors*(need-1)+1;hint='各色が最大何個なら条件を満たさないか。';next='どの色も'+(need-1)+'個以下なら合計何個？';work='条件を満たさない最大は'+colors+'×'+(need-1)+'個。1個多い'+ans+'個で必ず成立。';break; }
      case 7: {const n=[3,4,5,6,8,9,10,12,15,18][index];q='正'+n+'角形の1つの内角は何度？';ans=180*(n-2)/n;hint='多角形の内角の和を考えよう。';next='n角形の内角の和は180(n−2)度。';work='180×('+n+'−2)÷'+n+'='+ans+'度。';break; }
      case 8: {const n=7+t;q='Σ[k=1,'+n+'] k(k＋1) の値を求めよ。';ans=n*(n+1)*(n+2)/3;hint='k(k＋1)を和の公式で整理しよう。';next='Σk²＋Σk に分けよう。';work='n(n＋1)(2n＋1)/6＋n(n＋1)/2='+ans+'。';break; }
      default: {const p=[11,13,17,19,23,29,31,37,41,43][index];q='n='+ (p-1) +'のとき、n²＋n＋'+p+'はいくつ？（素数を生むという予想の反例）';ans=p*p;hint='nの値を式に代入しよう。';next='n=p−1なら(p−1)²＋(p−1)＋pを整理する。';work='p²−2p＋1＋p−1＋p=p²='+ans+'。合成数となる。';}
    }
  } else {
    switch(unit) {
      case 0: {const ac=a+b,bc=b+c,overlap=b;q='有限集合A,Bについて |A|='+ac+'、|B|='+bc+'、|A∩B|='+overlap+'。|A∪B| は？';ans=ac+bc-overlap;hint='共通部分を2回数えないようにしよう。';next='包除原理 |A∪B|=|A|＋|B|−|A∩B|。';work=ac+'＋'+bc+'−'+overlap+'='+ans+'。';break; }
      case 1: {const primes=[2,3,5,7,11,13,17,19,23,29,31];const p=primes[index],r=primes[index+1];q='異なる素数'+p+'と'+r+'の積に対するオイラーのφ関数 φ('+p*r+') は？';ans=(p-1)*(r-1);hint='素数の積の互いに素な個数を考えよう。';next='φ(pq)=(p−1)(q−1)。';work='('+p+'−1)('+r+'−1)='+ans+'。';break; }
      case 2: {q='行列 A=[['+a+','+b+'],['+c+','+a+']] の行列式 det A は？';ans=a*a-b*c;hint='2×2行列の行列式を使おう。';next='左上×右下−右上×左下。';work=a+'×'+a+'−'+b+'×'+c+'='+ans+'。';break; }
      case 3: {q='上三角行列 A=[['+a+','+c+'],[0,'+(a+b)+']] の大きい方の実固有値は？';ans=a+b;hint='上三角行列の固有値は対角成分。';next='特性多項式は(λ−a)(λ−a−b)。';work='固有値は'+a+'と'+(a+b)+'。大きい方は'+ans+'。';break; }
      case 4: {q='lim[x→'+a+'] (x²−'+(a*a)+')/(x−'+a+') の値は？';ans=2*a;hint='分子を平方差で因数分解しよう。';next='x²−a²=(x−a)(x＋a)。';work='x≠'+a+'で式はx＋'+a+'。極限は'+ans+'。';break; }
      case 5: {const m=2+index;q='無限級数 Σ[n=0,∞] '+(m-1)+'/'+m+'^n の和は？';ans=m;hint='初項と公比を確認しよう。';next='等比級数の和は初項÷(1−公比)。';work='('+(m-1)+')/(1−1/'+m+')='+m+'。';break; }
      case 6: {const n=2+index;q='左右それぞれに確率1/2で移動する対称ランダムウォークが'+(2*n)+'歩後に原点に戻る道筋は何通り？';ans=combinations(2*n,n);hint='右移動と左移動は同数必要。';next='2n歩から右移動するn箇所を選ぶ。';work=(2*n)+'C'+n+'='+ans+'通り。';break; }
      case 7: {const k=2+t%11;q='微分方程式 y′='+2*k+'x、初期値 y(0)='+b+' の解の y(1) は？';ans=k+b;hint='導関数を積分して積分定数を求めよう。';next='y=kx²＋C、Cは初期値。';work='y(x)='+k+'x²＋'+b+'。y(1)='+ans+'。';break; }
      case 8: {q='R³の点 P=('+a+',0,0)、Q=(0,'+b+',0) の距離の2乗 |P−Q|² は？';ans=a*a+b*b;hint='各座標の差を2乗して足そう。';next='ユークリッド距離の2乗は差の2乗和。';work=a+'²＋'+b+'²='+ans+'。';break; }
      default: {const n=5+t;q='数列 1³＋2³＋…＋'+n+'³ の和は？';ans=(n*(n+1)/2)**2;hint='立方数の和と三角数の関係を探ろう。';next='Σk³=(Σk)² を使う。';work='('+n+'×'+(n+1)+'÷2)²='+ans+'。';}
    }
  }
  if(!q||!Number.isFinite(ans)||!Number.isInteger(ans))throw new Error('Invalid advanced stage item '+stage.id+':'+index);
  return {type:'number',question:q,prompt:'こたえを 数字で いれてね',answer:String(ans),
    hint,guidedHints:[hint,next,'途中の式を かいて、もとの もんだいと くらべよう。'],
    explanation:work,steps:[{title:'着眼点',body:hint},{title:'方針',body:next},{title:'計算・証明',body:work}]};
}
function 色(n:number){return String(n);}
export function generateAdditionalIslandQuestions(stage:WorldStage):MathQuestion[] {
  if(!['preschool','sage','champion','cosmos'].includes(stage.gradeId))throw new Error('Not a planned island: '+stage.gradeId);
  const questions:Array<MathQuestion>=[];
  const visible=new Set<string>();
  for(let i=0;i<stage.questions;i++){
    const item=stage.gradeId==='preschool'?preschoolQuestion(stage,i):{
      ...advancedQuestion(stage,i),id:stage.id+':draft10:'+String(i+1),skillId:stage.gradeId+'.'+stage.family,
    } as MathQuestion;
    const key=item.question.normalize('NFKC');
    if(visible.has(key))throw new Error('Duplicate visible item: '+stage.id+' / '+key);
    visible.add(key);
    questions.push(item);
  }
  return questions;
}
