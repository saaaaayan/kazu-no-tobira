import type { WorldStage } from './worldCatalog.ts';
import type { BankQuestion, BankDiagram } from './questionBank.ts';
import { countingTokenArt, type CountingToken } from './countingTokens.ts';
import { preschoolNumeralTask } from './preschoolNumeralActivities.ts';
import type { PictureNumberMatch } from './preschoolNumberConnections.ts';

/**
 * Public prototype only. These ten activities per stage are NOT approved
 * question_catalog records and do not modify publishing/review state.
 * Existing preschool.n01–n05 sample banks are deliberately left intact.
 */
const toys: CountingToken[]=['bear','cat','dog','rabbit','chick','car','flower','star','apple','fish'];
const shapes=['●','▲','■'] as const;
type Task={question:string;answer:string;choices:string[];prompt?:string;diagram?:BankDiagram;
  trace?:string; spatial?:true; explanation?:string;hints?:[string,string,string];
  numeralPractice?:true;focalNumeral?:string;
  pictureNumberMatch?:PictureNumberMatch;
  twoRules?:{color:'あか'|'あお';shape:'まる'|'さんかく'|'しかく'};};
const image=(token:CountingToken)=>countingTokenArt[token][0];
const name=(token:CountingToken)=>countingTokenArt[token][1];
const repeat=(token:CountingToken,n:number)=>Array.from({length:n},()=>token);
const groups=(left:CountingToken[],right?:CountingToken[],target?:CountingToken):BankDiagram=>({
  kind:'countingBoard',rows:[{label:right?'ひだり':'',tokens:left},...(right?[{label:'みぎ',tokens:right}]:[])],
  // Two distinct labeled groups must occupy left and right columns, never
  // top and bottom: spatial questions depend on their actual placement.
  ...(right?{arrangement:'side-by-side' as const}:{}),
  ...(target?{targetToken:target}:{}),
});
const numbers=(n:number,max=10)=>[n,Math.max(0,n-1),Math.min(max,n+1)].map(String)
  .filter((v,j,a)=>a.indexOf(v)===j).concat(n<=1?['3']:['0']).slice(0,3);
function choose(question:string,answer:string,other:string[],rest:Partial<Task>={}):Task{
  const choices=[answer,...other.filter(x=>x!==answer)].filter((x,i,a)=>a.indexOf(x)===i).slice(0,3);
  if(choices.length!==3) throw Error('Three distinct answers required: '+question);
  return {question,answer,choices,...rest};
}
const numberTask=(question:string,value:number,extra:Partial<Task>={},max=10):Task=>
  choose(question,String(value),numbers(value,max),extra);
const stageNo=(s:WorldStage)=>s.kind==='normal'?s.order+1:s.kind==='extra'?s.order+1:s.order+1;
const t=(i:number)=>toys[(i*7+3)%toys.length];
const visible=(tokens:CountingToken[])=>tokens.map(image).join(' ');
const seq=(values:readonly string[])=>values.join('　');
const sequence=(i:number,mode:'two'|'double'|'three'|'shape'|'mixed'):Task=>{
  const pool=['●','▲','■','★','♥'];
  const offset=i%3;
  const pattern=mode==='two'?[pool[offset],pool[(offset+1)%3]]
    :mode==='double'?[pool[offset],pool[offset],pool[(offset+1)%3]]
    :mode==='three'?[pool[offset],pool[(offset+1)%3],pool[(offset+2)%3]]
    :mode==='shape'?[shapes[offset],shapes[(offset+1)%3],shapes[(offset+2)%3]]
    :[pool[offset],pool[(offset+1)%3],pool[(offset+1)%3]];
  const shift=i%4;
  const items=Array.from({length:5+shift},(_,p)=>pattern[p%pattern.length]);
  const answer=pattern[items.length%pattern.length];
  return choose(seq(items)+'　？　つぎは どれ？',answer,pool,
    {explanation:'おなじ じゅんばんが くりかえしているよ。 '+answer+' が つづくよ。'});
};
/** Practical comparisons: unnumbered same-start ropes and circles, never
 * rote shape naming or formulas. The illustrated sizes determine the answer.
 */
function magnitudeTask(i:number,metric:'length'|'size'):Task{
 const pairs:[[number,number],...[number,number][]]=[
   [4,2],[2,4],[3,3],[1,3],[4,1],[2,2],[3,1],[1,4],[2,3],[3,2],
 ];
 const [first,second]=pairs[i%pairs.length];
 const positive=i%2===0;
 const quality=metric==='length'?(positive?'ながい':'みじかい'):(positive?'おおきい':'ちいさい');
 const answer=first===second?'おなじ':
   (positive?(first>second):(first<second))?'あか':'あお';
 const object=metric==='length'?'ひも':'まる';
 return choose('あかい '+object+'と あおい '+object+'。'+quality+'のは どれ？',
   answer,['あか','あお','おなじ'],{
     diagram:{kind:'magnitudeCompare',metric,first,second},
     prompt:'ふたつの えを みくらべよう。',
     hints:[metric==='length'?'ひもの はじまりを そろえて みよう。':'まるを ふたつ みてね。',
       metric==='length'?'どちらが さきまで のびているかな？':'どちらの まるが おおきいかな？',
       'おなじ くらいなら「おなじ」を えらぼう。'],
     explanation:first===second?'あかも あおも、おなじ '+quality+'だよ。':
       answer+'の '+object+'が '+quality+'ね。',
   });
}

function combineTask(i:number):Task{
 const token=t(i),first=1+i%4,second=1+(i*3)%4,total=first+second;
 return numberTask(name(token)+'が あつまったよ。ぜんぶで いくつ？',total,{
   diagram:{kind:'countingBoard',arrangement:'side-by-side',
     rows:[{label:'はじめ',tokens:repeat(token,first)},
       {label:'あとから',tokens:repeat(token,second)}]},
   prompt:'ふたつの ばしょを あわせて かぞえよう。',
   hints:['はじめの えを かぞえてね。','あとから きた えも かぞえてね。',
     'はじめから さいごまで、ぜんぶ かぞえよう。'],
   explanation:'はじめに '+first+'こ、あとから '+second+'こ。あわせて '+total+'こだよ。',
 });
}

function splitTask(i:number):Task{
 const token=t(i),total=3+i%6,left=1+(i*3)%(total-1),right=total-left;
 return numberTask(name(token)+'を ふたつの はこに わけたよ。みぎは いくつ？',right,{
   diagram:{kind:'countingBoard',arrangement:'side-by-side',
     rows:[{label:'ひだりの はこ',tokens:repeat(token,left)},
       {label:'みぎの はこ',tokens:repeat(token,right)}]},
   prompt:'みぎの はこを みてね。',
   hints:['はこは ふたつ あるよ。','みぎの はこだけ かぞえよう。',
     'ひだりと みぎを あわせると '+total+'こだよ。'],
   explanation:'ぜんぶで '+total+'こ。ひだりは '+left+'こ、みぎは '+right+'こだよ。',
 });
}

function equalizeTask(i:number):Task{
 const token=t(i),left=2+i%5,right=left+(i%3===0?0:i%3===1?1:-1);
 const answer=left===right?'おなじ':left<right?'ひだり':'みぎ';
 return choose('1こ ふやして おなじに するなら、どっち？',
   answer,['ひだり','おなじ','みぎ'],{
     diagram:groups(repeat(token,left),repeat(token,right)),
     prompt:'ひだりと みぎの かずを くらべよう。',
     hints:['ひだりを かぞえてね。','みぎを かぞえてね。',
       'すくない ほうに 1こ ふやすと どうなる？'],
     explanation:left===right?'ひだりも みぎも '+left+'こ。もう おなじだよ。':
       'ひだりは '+left+'こ、みぎは '+right+'こ。'+answer+'に 1こ ふやすと おなじだよ。',
   });
}
function shapeTask(i:number,part:number):Task{
  const here=shapes[(i+part)%3],other=shapes[(i+part+1)%3],third=shapes[(i+part+2)%3];
  if(part===0) return choose('まるは どれかな？　'+seq([here,other,third]),'●',[other,third,'▲','■'],
    {explanation:'まるは、かどの ない かたちだよ。'});
  if(part===1) return choose('さんかくは どれかな？　'+seq([here,other,third]),'▲',['●','■'],
    {explanation:'さんかくは、かどが 3つ あるよ。'});
  if(part===2) return choose('しかくは どれかな？　'+seq([here,other,third]),'■',['●','▲'],
    {explanation:'しかくは、かどが 4つ あるよ。'});
  if(part===3)return magnitudeTask(i,'length');
  const pair=[['▲','■'],['●','●'],['●','■']][i%3];
  const answer=['おうち','ゆきだるま','くるま'][i%3];
  return choose(seq(pair)+' を つかって つくるよ。どの かたちが できそう？',answer,
    ['おうち','ゆきだるま','くるま','ほし'],
    {explanation:'かたちの ちがいを みて、くみあわせよう。'});
}
function compare(i:number,level:number):Task{
  const token=t(i),x=level===0?1+i%5:1+i%9,delta=(i%3)-1;
  const a=Math.min(10,x),b=Math.max(1,Math.min(10,a+delta));
  const correct=a===b?'おなじ':a>b?'ひだり':'みぎ';
  return choose('どちらの '+name(token)+' が おおい？',correct,
    ['ひだり','みぎ','おなじ'],{diagram:groups(repeat(token,a),repeat(token,b)),
    explanation:'ひだりは '+a+'こ、みぎは '+b+'こ。'+correct+' だよ。'});
}
function order(i:number,max:number,mode:number):Task{
 const val=mode===1 ? Math.max(2,Math.min(max-1,2+(i%Math.max(1,max-2))))
   :1+(i*3)%Math.max(1,max-2),answer=mode===0?val+1:mode===1?val-1:val+2;
 const strip=mode===0?val+'　□　'+(val+2):mode===1?'□　'+val+'　'+(val+1):val+'　'+(val+1)+'　□';
 // One blank slot and a separate, literal instruction: "hidden number"
 // is an unexplained metaphor for children who are learning number order.
 return numberTask(strip+'\nあいている ところに はいる すうじは？',answer,
   {prompt:'すうじを ひとつ えらぼう。',
    hints:['すうじを ひとつずつ みてね。',
      'じゅんばんに かぞえてみよう。',
      'あいている ところの まえや あとを みてね。'],
    explanation:'すうじは 1こずつ すすむよ。あいている ところに はいるのは '+answer+' だよ。'},max);
}
function position(i:number,level:number):Task{
 const items=[toys[(i+2)%toys.length],toys[(i+5)%toys.length],toys[(i+8)%toys.length]];
 const names=items.map(name);
 // The three toys are rendered as an actual one-row diagram, not inline
 // emoji text that may wrap across lines on narrow phone screens.
 const visual={diagram:{kind:'countingBoard' as const,arrangement:'position-row' as const,
   rows:[{tokens:items}]},spatial:true as const};
 const q=level%5;
 if(q===0)return choose('まんなかは だれ？',names[1],[names[0],names[2]],{...visual,explanation:'3つの えの まんなかは '+names[1]+' だよ。'});
 if(q===1)return choose('いちばん ひだりは だれ？',names[0],[names[1],names[2]],{...visual,explanation:'ひだりはしに いるのは '+names[0]+' だよ。'});
 if(q===2)return choose('いちばん みぎは だれ？',names[2],[names[0],names[1]],{...visual,explanation:'みぎはしに いるのは '+names[2]+' だよ。'});
 if(q===3)return choose(names[1]+' の ひだりは？',names[0],[names[1],names[2]],{...visual,explanation:'まんなかの ひだりに '+names[0]+' が いるよ。'});
 return choose(names[1]+' の みぎは？',names[2],[names[0],names[1]],{...visual,explanation:'まんなかの みぎに '+names[2]+' が いるよ。'});
}
function classify(i:number,level:number):Task{
 const variants=[
  {question:'まるの なかまは どれ？　●　▲　■',answer:'●',other:['▲','■']},
  {question:'さんかくの なかまは どれ？　●　▲　■',answer:'▲',other:['●','■']},
  {question:'しかくの なかまは どれ？　●　▲　■',answer:'■',other:['●','▲']},
  {question:'くだものの なかまは どれ？　🍎　🐻　🚗',answer:'🍎',other:['🐻','🚗']},
  {question:'どうぶつの なかまは どれ？　🐰　🍎　🚗',answer:'🐰',other:['🍎','🚗']},
  {question:'のりものの なかまは どれ？　🚗　🍎　🐻',answer:'🚗',other:['🍎','🐻']},
  {question:'あかい ものは どれ？　🍎　🍌　🍀',answer:'🍎',other:['🍌','🍀']},
  {question:'きいろい ものは どれ？　🍎　🍌　🍀',answer:'🍌',other:['🍎','🍀']},
  {question:'みどりの ものは どれ？　🍎　🍌　🍀',answer:'🍀',other:['🍎','🍌']},
  {question:'おなじ かたちを えらぼう　▲　●　■',answer:'▲',other:['●','■']},
 ];
 const q=variants[(i+level*2)%variants.length];
 return choose(q.question,q.answer,q.other,{explanation:'なかまに なる ところを みて えらぼう。'});
}
function match(i:number,max=10):Task{
 const count=i%max+1,token=t(i);
 return numberTask(name(token)+' が いくつ ある？',count,
    {diagram:groups(repeat(token,count)),explanation:'ひとつずつ かぞえると '+count+' こ だよ。'},max);
}
function trace(i:number,part:number):Task{
 const digits=[['1','2','3'],['4','5'],['6','7'],['8','9'],['0','1','0','10']][part];
 const target=digits[i%digits.length];
 return choose(target+' を ゆびで なぞってみよう','できた',['もういちど','みてみる'],
    {trace:target,prompt:'おてほんの うえを ゆびで かこう',
    explanation:target+' の かたちを ゆびで れんしゅうしたよ。'});
}
function mixed(i:number,kind:number):Task{
 if(kind===0)return match(i,10);
 if(kind===1)return compare(i,1);
 if(kind===2)return order(i,10,i%3);
 if(kind===3)return sequence(i,['two','double','three','shape','mixed'][i%5] as 'two'|'double'|'three'|'shape'|'mixed');
 if(kind===4)return position(i,i);
 return classify(i,i%3);
}
function makeTask(n:number,i:number):Task{
 const toy=t(i),k=i%3, num=1+i%10;
 if(n>=6&&n<=10)return preschoolNumeralTask(n as 6|7|8|9|10,i);
 if(n>=11&&n<=15)return trace(i,n-11);
 if(n>=16&&n<=20)return order((i+n)%10,n===16?3:n===17?5:10,(n===19?i%2:n===20?2:i%3));
 if(n>=21&&n<=25)return compare(i+(n-21)*3,n===21?0:1);
 if(n===26){
   const colors=[
    ['🔴','🔵','🟢'],['🔵','🟡','🔴'],['🟢','🟣','🟡'],
    ['🟡','🔴','🔵'],['🟣','🟢','🔵'],
   ];
   const [target,wrong1,wrong2]=colors[i%5];
   return choose('この まる '+target+' と おなじ いろは どれ？',target,[wrong1,wrong2],
     {explanation:'おなじ いろの まるを えらんだよ。'});
 }
 if(n===27){
   const correct=shapes[i%3];
   return choose('この かたち '+correct+' と おなじ かたちは どれ？',correct,
     [shapes[(i+1)%3],shapes[(i+2)%3]],{explanation:'かたちの せんと かどを みくらべよう。'});
 }
 if(n===28)return classify(i,0);
 if(n===29){
   // Two genuine constraints: one incorrect candidate shares the COLOR,
   // another shares the SHAPE. Never print the correct figure in the stem.
   const conditions=[
     {color:'あか',shape:'まる',answer:'🔴',sameColor:'🔺',sameShape:'🔵'},
     {color:'あお',shape:'まる',answer:'🔵',sameColor:'🟦',sameShape:'🔴'},
     {color:'あか',shape:'さんかく',answer:'🔺',sameColor:'🔴',sameShape:'🔼'},
     {color:'あお',shape:'さんかく',answer:'🔼',sameColor:'🔵',sameShape:'🔺'},
     {color:'あか',shape:'しかく',answer:'🟥',sameColor:'🔴',sameShape:'🟦'},
     {color:'あお',shape:'しかく',answer:'🟦',sameColor:'🔵',sameShape:'🟥'},
   ] as const;
   const c=conditions[i%conditions.length];
   return choose('2つの おやくそくに あうのは どれ？',c.answer,
     [c.sameColor,c.sameShape],{
       twoRules:{color:c.color,shape:c.shape},
       prompt:'いろと かたち、りょうほう みて えらぼう。',
       hints:['いろは '+c.color+' だよ。',
         'かたちは '+c.shape+' だよ。',
         'いろも かたちも あう ものを えらぼう。'],
       explanation:'いろは '+c.color+'、かたちは '+c.shape+'。どちらも あうのが せいかいだよ。',
     });
 }
 if(n===30)return classify(i,4);
 if(n>=31&&n<=33)return shapeTask(i,n-31);
 if(n===34)return magnitudeTask(i,'length');
 if(n===35)return magnitudeTask(i,'size');
 if(n>=36&&n<=40)return sequence(i,['two','double','three','shape','mixed'][n-36] as 'two'|'double'|'three'|'shape'|'mixed');
 if(n===41){
   const top=toys[(i+2)%toys.length],bottom=toys[(i+5)%toys.length];
   const askTop=i%2===0;
   const target=askTop?top:bottom;
   const place=askTop?'うえ':'した';
   // Children must SEE one object above the other, not merely read
   // "うえ / した" alongside emoji written on the same line.
   // Only the two toys visible in the drawing are valid picture options.
   // Do not invent a third choice that is absent from the learning scene.
   return {question:place+'に いるのは だあれ？',
     answer:name(target),choices:[name(top),name(bottom)],
       spatial:true,
       diagram:{kind:'countingBoard',arrangement:'vertical-position',
         rows:[{label:'うえ',tokens:[top]},{label:'した',tokens:[bottom]}]},
       hints:['うえと したの えを みてね。',
         'いちばん '+place+'の えを さがそう。',
         place+'に いるのは だれかな？'],
       explanation:place+'に いるのは '+name(target)+' だよ。',
     };
 }
 if(n===42)return position(i,i%2===0?1:2);
 if(n===43)return position(i,i%2===0?3:4);
 if(n===44)return position(i,0);
 if(n===45)return position(i,i%5);
 if(n===46)return combineTask(i);
 if(n===47)return splitTask(i);
 if(n===48){
   const left=2+i%6,right=i%3===0?left:i%3===1?left-1:left+1;
   const answer=left===right?'ぴったり':left>right?'たりない':'あまる';
   return choose('ぬいぐるみに おやつを ひとつずつ くばるよ。 おやつは？',
     answer,['ぴったり','たりない','あまる'],{
       diagram:groups(repeat('bear',left),repeat('cookie',right)),
       explanation:'ぬいぐるみは '+left+'ひき。おやつは '+right+'こ。'+answer+' だよ。'
     });
 }
 if(n===49)return equalizeTask(i);
 if(n===50)return i%5===0?magnitudeTask(i,'length'):
   i%5===1?combineTask(i):i%5===2?splitTask(i):i%5===3?equalizeTask(i):mixed(i,i%6);
 if(n>=51&&n<=60){
   const theme=n-51;
   if(theme===0)return match(i,10);
   if(theme===1)return match((i*3+1)%10,10);
   if(theme===2||theme===3)return order(i,10,i%3);
   if(theme===4)return compare(i+3,1);
   if(theme===5)return classify(i,4);
   if(theme===6)return shapeTask(i,(i+1)%5);
   if(theme===7)return sequence(i,['three','shape','double'][i%3] as 'three'|'shape'|'double');
   if(theme===8)return position(i,i);
   return mixed(i,i%6);
 }
 if(n===61)return sequence(i,i%2===0?'mixed':'double');
 if(n===62)return classify(i,4);
 if(n===63)return i%2===0?position(i,i):compare(i,1);
 if(n===64)return shapeTask(i,(i+2)%5);
 if(n===65)return mixed((i+n)%10,(i+n)%6);
 return numberTask('いくつ ある？',num,{diagram:groups(repeat(toy,num))});
}
const specificHints=(q:Task,n:number):[string,string,string]=>{
 if(q.hints)return q.hints;
 if(q.trace)return ['おてほんを みてね。','うえから ゆっくり ゆびを うごかそう。','かきおわったら、かたちを くらべよう。'];
 if(q.spatial)return ['えを ひだりから みてね。','ひだり・まんなか・みぎを たしかめよう。','きかれた ばしょの えを えらぼう。'];
 if(q.diagram?.kind==='countingBoard')return [
   'えを よく みてね。',
   'ひとつずつ さわって かぞえよう。',
   'さいごに いった かずや ばしょを えらぼう。'
 ];
 if(n>=36&&n<=40||n===58)return ['ならびを みてね。','おなじ じゅんばんが あるかな？','さいしょから もういちど ならべて みよう。'];
 return ['えと ことばを よく みてね。','どこが おなじで、どこが ちがうかな？','こたえを ひとつずつ たしかめてみよう。'];
};
/** Generate exactly ten playable prototype tasks for each of stages 06–65. */
export function preschoolPrototypeBank(stage:Pick<WorldStage,'id'|'gradeId'|'kind'|'order'|'unitIndex'>):BankQuestion[]{
 if(stage.gradeId!=='preschool'||stage.order<5||stage.order>=65)return [];
 const n=stageNo(stage as WorldStage),group=stage.unitIndex;
 return Array.from({length:10},(_,i)=>{
   const q=makeTask(n,i);
   const hints=specificHints(q,n);
   const answer=q.answer, choices=q.choices;
   const expectedOptions=q.diagram?.kind==='countingBoard' &&
     q.diagram.arrangement==='vertical-position' ? 2 : 3;
   if(!choices.includes(answer)||choices.length!==expectedOptions||new Set(choices).size!==expectedOptions)
     throw Error('Invalid prototype options '+n+':'+i);
   // Correct answers must not always occupy the first button.
   const shift=(n+i)%choices.length;
   const displayedChoices=[...choices.slice(shift),...choices.slice(0,shift)];
   return {
     id:'ui-preview-'+stage.id+'-activity-'+String(i+1).padStart(2,'0'),
     skillId:'preschool.'+group,
     type:'choice',format:q.numeralPractice?'numeral':q.trace?'tracing':'counting',difficulty:i<3?1:i<8?2:3,
     question:q.question,prompt:q.prompt??'えを よく みて、こたえを えらぼう。',
     answer,choices:displayedChoices,hint:hints[0],hints,
     explanation:q.explanation??'えを ひとつずつ みて たしかめよう。',
     steps:[{title:'みる',body:hints[1]},{title:'たしかめる',body:q.explanation??'えを よく みて たしかめたよ。'}],
     mistakes:choices.filter(c=>c!==answer).map(c=>({answer:c,explanation:'よく みて、もういちど やってみよう。'})),
     ...(q.diagram?{diagram:q.diagram}:{}),
     ...(q.trace?{preschoolTrace:q.trace}:{}),
     ...(q.numeralPractice?{preschoolNumberActivity:true as const}:{}),
     ...(q.pictureNumberMatch?{preschoolNumberMatch:q.pictureNumberMatch}:{}),
     ...(q.focalNumeral!==undefined?{preschoolNumeral:q.focalNumeral}:{}),
     ...(q.twoRules?{preschoolTwoRules:q.twoRules}:{}),
   } as BankQuestion;
 });
}
