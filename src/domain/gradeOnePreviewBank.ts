import type {WorldStage} from './worldCatalog.ts';
import type {BankQuestion,BankDiagram} from './questionBank.ts';
import type {MathQuestion} from './worldQuestions.ts';
import {countingTokenArt,type CountingToken} from './countingTokens.ts';
import {gradeOnePreviewStageInfo} from './gradeOnePreviewCurriculum.ts';

type Format=BankQuestion['format'];
type Task={
  question:string;answer:string;format:Format;explanation:string;
  hints:[string,string,string];choices?:string[];
  diagram?:BankDiagram;clock?:MathQuestion['clock'];prompt?:string;
};
const tokens:CountingToken[]=['bear','rabbit','cat','car','apple','chick'];
const glyphs=['●','▲','■'] as const;
const tokenFor=(i:number)=>tokens[i%tokens.length];
const tokenName=(token:CountingToken)=>countingTokenArt[token][1];
const repeat=(token:CountingToken,count:number)=>Array.from({length:count},()=>token);
const cap=(text:string)=>text.replaceAll('　',' ').trim();

function nums(value:number,max=100):string[]{
  const options=[value,value>0?value-1:value+1,value<max?value+1:value-2].filter(n=>n>=0&&n<=max).map(String);
  for(let n=0;new Set(options).size<3;n++){
    const candidate=String(n);
    if(!options.includes(candidate))options.push(candidate);
  }
  return [...new Set(options)].slice(0,3);
}
function task(question:string,answer:number|string,format:Format,explanation:string,
  hints:[string,string,string],diagram?:BankDiagram,
  choices?:string[],clock?:MathQuestion['clock']):Task {
  return {question:cap(question),answer:String(answer),format,explanation,hints,
    ...(diagram?{diagram}:{}),...(clock?{clock}:{}),...(choices?{choices}:{}),
    prompt:'こたえの ボタンを おしてね'};
}
const board=(token:CountingToken,n:number):BankDiagram=>
  ({kind:'countingBoard',rows:[{tokens:repeat(token,n)}]});
const twoBoards=(token:CountingToken,left:number,right:number):BankDiagram=>
  ({kind:'countingBoard',arrangement:'side-by-side',
    rows:[{label:'ひだり',tokens:repeat(token,left)},{label:'みぎ',tokens:repeat(token,right)}]});
const hintsCount=(title:string):[string,string,string]=>[
  title+' を みてね。','ひとつずつ ゆっくり かぞえよう。','さいごに いった かずを えらぼう。'
];
const hintsSum:[string,string,string]=[
  'はじめの かずを みてね。','あとから たす かずを みつけよう。','ふたつを あわせて かぞえよう。'
];
const hintsSub:[string,string,string]=[
  'はじめの かずを みてね。','とった ぶんだけ へるよ。','のこりを ゆっくり かぞえよう。'
];
const hintsTen:[string,string,string]=[
  '10こを おもいうかべよう。','10までに あと なんこ あるかな？','あいている ぶんを かぞえよう。'
];
const hintsTwenty:[string,string,string]=[
  '10の まとまりを さがそう。','10こと ばらの かずを みてね。','まとまりと ばらを あわせよう。'
];
const hintsHundred:[string,string,string]=[
  '10の まとまりを さがそう。','十の くらいと 一の くらいを みよう。','まとまりの かずを 10ずつ かぞえよう。'
];
function limitedAdd(i:number,limit=9){
  const a=1+(i%5),b=1+((i*3+Math.floor(i/5))%4);
  return [a,Math.min(b,limit-a)] as const;
}
function carryPair(i:number){
  const a=7+i%3,b=4+Math.floor(i/3);
  return [a,b] as const;
}
function borrowPair(i:number){
  const a=11+i%8,b=a%10+1+Math.floor(i/8);
  return [a,b] as const;
}
function numberLine(start:number,step:1|10,hiddenOffset:number):BankDiagram{
  return {kind:'gradeOneNumberLine',start,end:start+step*5,hidden:start+step*hiddenOffset,step};
}
function countingTask(i:number,lower:number,upper:number):Task{
  const token=tokenFor(i),n=lower+i%(upper-lower+1);
  return task(tokenName(token)+'は いくつ ある？',n,'counting',
    tokenName(token)+'は '+n+'こ。ひとつずつ かぞえたよ。',
    hintsCount(tokenName(token)),board(token,n),nums(n,upper+1));
}
function directAdd(i:number,stage:number,cross=false):Task{
  const [a,b]=cross?carryPair(i):limitedAdd(i);
  const value=a+b;
  const word=i%5===4;
  return task(word?'●が '+a+'こ、▲が '+b+'こ。ぜんぶで いくつ？':
    a+' ＋ '+b+' ＝ □',value,'calculation',
    a+'＋'+b+'＝'+value+'。かずを あわせると '+value+'だよ。',
    hintsSum,{kind:'tenFrame',first:a,second:b},nums(value,20));
}
function directSub(i:number,stage:number,borrow=false):Task{
  const [a,b]=borrow?borrowPair(i):[4+i%6,1+Math.floor(i/3)%3] as const;
  const value=a-b;
  const form=i%5===4? '●が '+a+'こ あり、'+b+'こ とったよ。のこりは？':
    a+' − '+b+' ＝ □';
  return task(form,value,'calculation',
    a+'−'+b+'＝'+value+'。とった ぶんを ひくと '+value+'だよ。',
    borrow?[
      '10の まとまりと ばらを みてね。',
      'ばらだけで ひけないときは、10を くずそう。',
      'ひいてから ばらを あわせよう。'
    ]:hintsSub,borrow?{kind:'borrowTen',total:a,used:b}:{kind:'takeAway',total:a,used:b},
    nums(value,20));
}
function basicNumberLine(i:number,upTo:20|100=20):Task{
  const step=upTo===100?10:1;
  const start=upTo===100?10+(i%4)*10:Math.max(0,1+i%9);
  const offset=1+(i*3)%4;
  const missing=start+offset*step;
  return task('？ に はいる かずは？',missing,'sequence',
    'かずは '+step+'ずつ ふえるよ。？は '+missing+'だよ。',
    ['ひだりから じゅんばんに みてね。',
      step===10?'10ずつ すすんで みよう。':'ひとつずつ すすんで みよう。',
      '？ の まえと あとの かずを みくらべよう。'],
    numberLine(start,step,offset),nums(missing,100));
}
function tenParts(i:number,part:number):Task{
  const a=1+i%9,b=10-a;
  if(part===0)return task('ぜんぶで 10こ。ひだりに '+a+'こ。みぎに はいるのは？',
    b,'missingPart','10こを '+a+'こと '+b+'こに わけたよ。',
    hintsTen,{kind:'preschoolSplit',token:tokenFor(i),total:10,placedLeft:a},nums(b,10));
  if(part===1||part===3)return task(a+' ＋ □ ＝ 10',b,'missingPart',
    a+'＋'+b+'＝10。あいている ところは '+b+'だよ。',
    hintsTen,undefined,nums(b,10));
  if(part===2)return task('10 − '+a+' ＝ □',b,'calculation',
    '10−'+a+'＝'+b+'だよ。',hintsSub,undefined,nums(b,10));
  return task(a+'と '+b+'を あわせると？',10,'calculation',
    a+'＋'+b+'＝10。10の まとまりが できたよ。',
    hintsTen,{kind:'tenFrame',first:a,second:b},nums(10,11));
}
function shapeTask(i:number,part:number):Task {
  const target=glyphs[i%3];
  const other=glyphs[(i+1)%3];
  const shapes:readonly ('●'|'▲'|'■')[]=i%2===0?[target,other,glyphs[(i+2)%3]]:[glyphs[(i+2)%3],target,other,target];
  const baseDiagram:BankDiagram={kind:'gradeOneShapes',symbols:shapes,arrangement:'row'};
  const hints:[string,string,string]=[
    'えの かたちを みてね。','まる・さんかく・しかくを くらべよう。',
    'こたえと おなじ かたちを さがそう。'
  ];
  if(part===0||part===1)return task(
    (part===0?'まる':'さんかく')+'は どれ？',
    part===0?'●':'▲','comparison',
    'まるは ●、さんかくは ▲、しかくは ■ だよ。',
    hints,baseDiagram,['●','▲','■']);
  if(part===2){
    const bottom: '●'|'▲'|'■' = glyphs[(i+2)%3];
    const top: '●'|'▲'|'■' = glyphs[i%3];
    const middle: '●'|'▲'|'■'=glyphs[(i+1)%3];
    const house:BankDiagram={kind:'gradeOneShapes',symbols:[top,middle,bottom],arrangement:'house'};
    const position=i%3;
    return task(position===0?'いちばん うえは どれ？':position===1?'まんなかは どれ？':'いちばん したは どれ？',
      [top,middle,bottom][position],'position',
      'ふたつの かたちを たてに ならべたよ。',
      ['うえと したを みてね。','かたちを ひとつずつ たしかめよう。',
       'きかれた ばしょの かたちを えらぼう。'],house,['●','▲','■']);
  }
  if(part===3){
    const a=glyphs[i%3],b=glyphs[(i+1+Math.floor(i/3))%3===i%3?(i+2)%3:(i+1+Math.floor(i/3))%3];
    const pattern:BankDiagram={kind:'gradeOneShapes',symbols:i%2===0?[a,b,a,b]:[a,b,a,b,a],arrangement:'row'};
    return task('この ならびの つぎは どれ？',a,'sequence',
      a+'、'+b+'の じゅんばんが くりかえして いるよ。',
      ['ひだりから かたちを みてね。','ふたつずつ くりかえして いるよ。',
       'さいしょと おなじ かたちは どれかな？'],pattern,['●','▲','■']);
  }
  return shapeTask(i,i%4);
}
const magnitudePairs:[[number,number],...[number,number][]]=[
  [1,3],[4,2],[2,2],[3,1],[1,4],[4,4],[2,4],[3,3],[4,1],[2,3]
];
function measureTask(i:number,kind:'length'|'capacity'):Task{
  const [a,b]=magnitudePairs[i%10];
  const larger=i%2===0;
  const answer=a===b?'おなじ':(larger?a>b:a<b)?'あか':'あお';
  return task(kind==='length'?(larger?'ながい ひもは どれ？':'みじかい ひもは どれ？'):
    (larger?'みずが おおい コップは どれ？':'みずが すくない コップは どれ？'),
    answer,'comparison',
    a===b?'あかも あおも おなじ くらいだよ。':
      answer+'の ほうが '+(kind==='length'?(larger?'ながい':'みじかい'):(larger?'おおい':'すくない'))+'よ。',
    kind==='length'?[
      'ひもの はじを そろえて みてね。','あかと あおの のびかたを くらべよう。',
      'おなじ ながさの ときは「おなじ」。'
    ]:[
      'おなじ おおきさの コップだよ。','みずの たかさを くらべよう。',
      'おなじ りょうなら「おなじ」。'
    ],
    kind==='length'?{kind:'magnitudeCompare',metric:'length',first:a,second:b}:
      {kind:'gradeOneCapacity',first:a,second:b},['あか','あお','おなじ']);
}
function clockTask(i:number):Task{
  const hour=1+i%10,half=i%2===1;
  const time=hour*60+(half?30:0);
  return task(half?'とけいは なんじはん？':'とけいは なんじ？',hour,'comparison',
    'ながい はりが '+(half?'6':'12')+'の とき、みじかい はりを みよう。'+hour+
      (half?'じはん':'じ')+'だよ。',
    ['ながい はりを みよう。','みじかい はりが さす じこくを みよう。',
      half?'ながい はりは 6、みじかい はりは ふたつの じの あいだだよ。':
      'ながい はりが 12なら、ちょうど なんじかな？'],
    undefined,nums(hour,12),{start:time,end:time,read:true});
}
function graphTask(i:number):Task{
  const names=['くま','ねこ','うさぎ'],ids:CountingToken[]=['bear','cat','rabbit'];
  const base=[2,3,5];
  const counts=[base[i%3],base[(i+1)%3],base[(i+2)%3]];
  const row=counts.map((count,j)=>({label:names[j],token:ids[j],count}));
  const biggest=counts.indexOf(5);
  const askBiggest=i%2===0;
  const answer=askBiggest?names[biggest]:names[counts.indexOf(2)];
  return task(askBiggest?'いちばん おおい えは どれ？':'いちばん すくない えは どれ？',
    answer,'comparison',
    'えを かぞえて くらべると、'+answer+'だよ。',
    ['えを よこに ならべて みてね。','それぞれの えを かぞえよう。',
      askBiggest?'いちばん ながい ならびは どれかな？':'いちばん みじかい ならびは どれかな？'],
    {kind:'gradeOnePictureGraph',rows:row},names);
}
function makeTask(n:number,i:number):Task{
  const unit=Math.floor((n-1)/5),part=(n-1)%5,token=tokenFor(i);
  if(unit===0){
    if(part===0)return countingTask(i,1,5);
    if(part===1)return countingTask(i,6,10);
    if(part===2){
      const total=3+i%7,left=1+Math.floor(i/2)%(total-1),remain=total-left;
      return task('ぜんぶで '+total+'こ。ひだりに '+left+'こ。みぎは いくつ？',
        remain,'decomposition','ぜんぶ '+total+'こを '+left+'こと '+remain+'こに わけたよ。',
        ['ぜんぶの かずを みてね。','ひだりに ある ぶんを みてね。',
         'のこりが みぎに はいるよ。'],
        {kind:'preschoolSplit',token,total,placedLeft:left},nums(remain,10));
    }
    if(part===3)return basicNumberLine(i,20);
    const left=1+i%6,right=2+(i*2)%7;
    return task('どちらが おおい？',left===right?'おなじ':left>right?'ひだり':'みぎ',
      'comparison','ひだりは '+left+'こ、みぎは '+right+'こ。',
      ['ひだりの えを かぞえよう。','みぎも かぞえよう。',
       'おなじ なら「おなじ」を えらぼう。'],
      twoBoards(token,left,right),['ひだり','おなじ','みぎ']);
  }
  if(unit===1){
    if(part===3){
      const [a,b]=limitedAdd(i),total=a+b;
      return task('□ ＋ '+b+' ＝ '+total,a,'missingPart',
        a+'＋'+b+'＝'+total+'。□は '+a+'だよ。',
        ['ぜんぶは '+total+'だよ。','すでに '+b+'を たして いるよ。',
         'あと いくつ あると '+total+'に なるかな？'],
        {kind:'preschoolSplit',token,total,placedLeft:b},nums(a,10));
    }
    return directAdd(i,n);
  }
  if(unit===2){
    if(part===2){
      const a=1+i%9;
      return task(a+' − '+a+' ＝ □',0,'calculation',
        'ぜんぶ とると 0だよ。',hintsSub,
        {kind:'takeAway',total:a,used:a},['0','1','2']);
    }
    if(part===3){
      const a=4+i%6,b=1+i%(a-1),remain=a-b;
      return task('□ ＋ '+b+' ＝ '+a,remain,'missingPart',
        remain+'＋'+b+'＝'+a+'だよ。',
        ['ぜんぶは '+a+'だよ。','たす かずを みてね。',
         'あと なんこ あれば ぜんぶの かずに なる？'],
        {kind:'preschoolSplit',token,total:a,placedLeft:b},nums(remain,10));
    }
    return directSub(i,n);
  }
  if(unit===3)return tenParts(i,part);
  if(unit===4){
    const value=11+i;
    if(part===0||part===1)return task(part===0?'ぜんぶで いくつ？':'10の まとまりと ばらで いくつ？',
      value,'counting','10と '+(value-10)+'で '+value+'だよ。',
      hintsTwenty,part===0?{kind:'tenFrame',first:10,second:value-10}:
        {kind:'bundlesAndOnes',tens:Math.floor(value/10),ones:value%10},
      nums(value,21));
    if(part===2)return basicNumberLine(i,20);
    if(part===3){
      const other=20-i;
      const answer=Math.max(value,other);
      return task(value+'と '+other+'。おおきい かずは？',answer,'comparison',
        'かずの じゅんばんで さきの ほうが おおきいよ。',
        ['ふたつの かずを みてね。','10より おおきい かずを かんがえよう。',
         '20までの ならびを おもいだそう。'],
        undefined,nums(answer,21));
    }
    return basicNumberLine(i,20);
  }
  if(unit===5){
    if(part===2){
      const b=3+i%7;
      return task('9 ＋ '+b+' ＝ □',9+b,'calculation',
        '9に 1を たして 10。のこりを たすと '+(9+b)+'だよ。',
        ['9は あと 1で 10。','たす かずから 1を つかって 10に しよう。',
         'のこりを 10に たそう。'],
        {kind:'tenFrame',first:9,second:b},nums(9+b,20));
    }
    return directAdd(i,n,true);
  }
  if(unit===6)return directSub(i,n,true);
  if(unit===7){
    if(part===2)return basicNumberLine(i,100);
    const value=10+i*9,more=13+i*8;
    if(part===3){
      const a=value,b=more,answer=Math.max(a,b);
      return task(a+'と '+b+'。おおきい かずは？',answer,'comparison',
        '十の くらいから くらべると '+answer+'が おおきいよ。',
        ['十の くらいを みてね。','おなじ なら 一の くらいを みよう。',
         'おおきい ほうの かずを えらぼう。'],
        undefined,nums(answer,100));
    }
    return task(part===0?'10の まとまりと ばら。ぜんぶで いくつ？':
      part===1?'この かずは いくつ？':'10の まとまりで かぞえると？',
      value,'counting',
      '10が '+Math.floor(value/10)+'こ、ばらが '+value%10+'こ。'+value+'だよ。',
      hintsHundred,{kind:'bundlesAndOnes',tens:Math.floor(value/10),ones:value%10},
      nums(value,100));
  }
  if(unit===8)return shapeTask(i,part);
  if(unit===9){
    if(part===0)return measureTask(i,'length');
    if(part===1)return measureTask(i,'capacity');
    if(part===2)return clockTask(i);
    if(part===3)return graphTask(i);
    return i%5===0?measureTask(i,'length'):i%5===1?measureTask(i,'capacity'):
      i%5===2?clockTask(i):i%5===3?graphTask(i):directAdd(i,n);
  }
  throw new Error('Unknown grade-one unit: '+unit);
}

export function gradeOnePreviewBank(stage:Pick<WorldStage,'id'|'gradeId'|'kind'|'order'>):BankQuestion[]{
  const info=gradeOnePreviewStageInfo(stage);
  if(!info)return [];
  return Array.from({length:10},(_,i)=>{
    const source=makeTask(stage.order+1,i);
    const choices=source.choices??nums(Number(source.answer),100);
    const distinct=[...new Set(choices)];
    if(distinct.length!==3||!distinct.includes(source.answer))
      throw new Error('Invalid grade-one options '+stage.id+' #'+(i+1)+': '+distinct.join(','));
    const offset=(stage.order+i)%3;
    const shifted=[...distinct.slice(offset),...distinct.slice(0,offset)];
    return {
      id:'ui-preview-'+stage.id+'-curriculum-'+String(i+1).padStart(2,'0'),
      stageId:stage.id,
      skillId:'e1.preview.'+info.domain,
      type:'choice',format:source.format,
      difficulty:(i<3?1:i<8?2:3) as 1|2|3,
      question:source.question,prompt:source.prompt??'こたえを えらぼう',
      answer:source.answer,choices:shifted,
      hint:source.hints[0],hints:source.hints,
      explanation:source.explanation,
      steps:[{title:'かんがえかた',body:source.hints[1]},
        {title:'たしかめよう',body:source.explanation}],
      mistakes:[],
      ...(source.diagram?{diagram:source.diagram}:{}),
      ...(source.clock?{clock:source.clock}:{}),
    } as BankQuestion;
  });
}
