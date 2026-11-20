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
/** All 55 distinct equations up to 9, in increasing total order.
 * Different consecutive stages use different equations. */
const smallAddPairs:[number,number][]=Array.from({length:10},(_,sum)=>
  Array.from({length:sum+1},(_,a)=>[a,sum-a] as [number,number])).flat();
function limitedAdd(i:number,stage=6):readonly [number,number]{
  const group=stage>=6&&stage<=10 ? stage-6 : 0;
  return smallAddPairs[(group*10+i)%smallAddPairs.length];
}
/** Different objectives each use their own ten carry-addition examples. */
function carryPair(i:number,stage:number):readonly [number,number]{
  const batches:Readonly<Record<number,readonly [number,number][]>>={
    26:[[6,5],[6,6],[6,7],[6,8],[7,4],[7,5],[7,6],[7,7],[8,3],[9,2]],
    27:[[2,9],[3,8],[4,7],[5,6],[6,9],[7,8],[8,7],[9,6],[5,9],[4,9]],
    28:[[9,3],[8,4],[9,4],[8,5],[9,5],[8,6],[8,9],[9,8],[9,7],[8,8]],
    29:[[7,9],[6,8],[7,7],[4,8],[5,8],[3,9],[8,9],[9,8],[6,7],[5,7]],
    30:[[6,5],[7,4],[8,4],[9,3],[7,9],[7,5],[9,5],[8,6],[7,8],[9,9]],
  };
  return batches[stage]?.[i%10]??batches[26][i%10];
}
function borrowPair(i:number,stage:number){
  // Stage 33 teaches 11–15, stage 34 teaches 16–18.
  const min=stage===33?11:stage===34?16:11;
  const max=stage===33?15:18;
  const width=max-min+1;
  const a=min+i%width,b=a%10+1+Math.floor(i/width);
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
  const [a,b]=cross?carryPair(i,stage):limitedAdd(i,stage);
  const value=a+b;
  const word=i%5===4;
  const gap=10-a;
  const hint:[string,string,string]=cross?[
    '10の まとまりを つくろう。',
    a+'から 10に するには、あと '+gap+'だよ。',
    b+'を '+gap+'と '+(b-gap)+'に わけて たそう。'
  ]:hintsSum;
  const explain=cross?a+'＋'+gap+'＝10。のこりの '+(b-gap)+'を たして '+value+'だよ。':
    a+'＋'+b+'＝'+value+'。かずを あわせると '+value+'だよ。';
  return task(word?'たまが '+a+'こ。'+b+'こ ふえたよ。ぜんぶで いくつ？':
    a+' ＋ '+b+' ＝ □',value,'calculation',
    explain,hint,{kind:'tenFrame',first:a,second:b},nums(value,20));
}
function directSub(i:number,stage:number,borrow=false):Task{
  const [a,b]=borrow?borrowPair(i,stage):[4+i%6,1+Math.floor(i/3)%3] as const;
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
function basicNumberLine(i:number,upTo:10|20|100=20):Task{
  const step=upTo===100?10:1;
  const start=upTo===100?10+(i%5)*10:upTo===10?i%6:Math.max(0,1+i%9);
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
  const a=i%10,b=10-a;
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
  const masks=[[0],[1],[2],[3],[0,1],[0,2],[0,3],[1,2],[0,1,2],[1,2,3]];
  if(part===0||part===1){
    const target:'●'|'▲'|'■'=part===0?'●':i%2===0?'▲':'■';
    const other:'●'|'▲'|'■'=target==='●'?(i%2===0?'▲':'■'):'●';
    const marks=masks[i%10];
    const symbols:Array<'●'|'▲'|'■'>=Array.from({length:4},(_,j)=>
      marks.includes(j)?target:other);
    return task('えの なかの '+target+' は いくつ？',
      marks.length,'counting',
      target+'を ひとつずつ かぞえると '+marks.length+'こ あるよ。',
      ['きかれた かたちを みつけよう。','おなじ かたちに めを むけよう。',
       'みつけた かたちを ひとつずつ かぞえよう。'],
      {kind:'gradeOneShapes',symbols,arrangement:'row'},nums(marks.length,4));
  }
  if(part===2){
    // Three pieces can make many stacks; vary both the stack and the position.
    const seed=(i*7+Math.floor(i/3))%27;
    const symbols:Array<'●'|'▲'|'■'>=[
      glyphs[seed%3],glyphs[Math.floor(seed/3)%3],glyphs[Math.floor(seed/9)%3]
    ];
    const position=i%3;
    return task(['いちばん うえ','まんなか','いちばん した'][position]+'の かたちは どれ？',
      symbols[position],'position',
      'みっつの かたちを たてに ならべたよ。'+['うえ','まんなか','した'][position]+'は '+symbols[position]+'だよ。',
      ['うえから じゅんに みてね。','みっつの かたちを ひとつずつ みよう。',
       'きかれた ばしょに ある かたちを えらぼう。'],
      {kind:'gradeOneShapes',symbols,arrangement:'house'},['●','▲','■']);
  }
  if(part===3){
    const a=glyphs[i%3],b=glyphs[(i%3+1+Math.floor(i/3)%2)%3];
    const threePattern=i>=6;
    const symbols:Array<'●'|'▲'|'■'>=threePattern?[a,a,b,a]:[a,b,a,b];
    return task('つぎに くる かたちは どれ？',a,'sequence',
      threePattern?a+'、'+a+'、'+b+'の ならびが くりかえすよ。':
        a+'、'+b+'の ならびが くりかえすよ。',
      ['ひだりから じゅんに みよう。',
       threePattern?'3この かたちで ひとつの ならびだよ。':'2この かたちで ひとつの ならびだよ。',
       'ひとつめと おなじ かたちに もどるかな？'],
      {kind:'gradeOneShapes',symbols,arrangement:'row'},['●','▲','■']);
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
  const hour=1+i%12,half=i%2===1;
  const time=hour*60+(half?30:0);
  const answer=hour+(half?'じはん':'じ');
  const choices=[hour===1?12:hour-1,hour,hour===12?1:hour+1]
    .map(h=>h+(half?'じはん':'じ'));
  return task(half?'とけいは なんじはん？':'とけいは なんじ？',answer,'comparison',
    'ながい はりが '+(half?'6':'12')+'の とき、みじかい はりを みよう。'+hour+
      (half?'じはん':'じ')+'だよ。',
    ['ながい はりを みよう。','みじかい はりが さす じこくを みよう。',
      half?'ながい はりは 6、みじかい はりは ふたつの じの あいだだよ。':
      'ながい はりが 12なら、ちょうど なんじかな？'],
    undefined,choices,{start:time,end:time,read:true});
}
function graphTask(i:number):Task{
  const names=['くま','ねこ','うさぎ'],ids:CountingToken[]=['bear','cat','rabbit'];
  // Ten different graphs, with a unique tallest/shortest row in each.
  const pictures=[
    [2,3,5],[1,4,3],[4,2,5],[5,1,3],[3,5,2],
    [4,3,1],[2,5,4],[1,3,6],[5,2,1],[3,6,4]
  ];
  const counts=pictures[i%pictures.length];
  const rows=counts.map((count,j)=>({label:names[j],token:ids[j],count}));
  const mode=i%3;
  const question=mode===0?names[i%3]+'の えは いくつ？'
    :mode===1?'いちばん おおい えは どれ？':'いちばん すくない えは どれ？';
  const answer=mode===0?String(counts[i%3])
    :names[counts.indexOf(mode===1?Math.max(...counts):Math.min(...counts))];
  return task(question,answer,'comparison',
    'えを ひとつずつ かぞえて くらべると、こたえは '+answer+'だよ。',
    ['えを よこに ならべて みよう。','それぞれの えを かぞえて みよう。',
      mode===0?'きかれた どうぶつの えだけ かぞえよう。':
        mode===1?'いちばん おおい ならびを さがそう。':'いちばん すくない ならびを さがそう。'],
    {kind:'gradeOnePictureGraph',rows},mode===0?nums(Number(answer),6):names);
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
    if(part===3)return basicNumberLine(i,10);
    const left=1+i%6,right=2+(i*2)%7;
    return task('どちらが おおい？',left===right?'おなじ':left>right?'ひだり':'みぎ',
      'comparison','ひだりは '+left+'こ、みぎは '+right+'こ。',
      ['ひだりの えを かぞえよう。','みぎも かぞえよう。',
       'おなじ なら「おなじ」を えらぼう。'],
      twoBoards(token,left,right),['ひだり','おなじ','みぎ']);
  }
  if(unit===1){
    if(part===3){
      const [a,b]=limitedAdd(i,n),total=a+b;
      return task(a+' ＋ '+b+' ＝ □ ＋ '+a,b,'missingPart',
        'たす じゅんばんを かえても おなじ。'+a+'＋'+b+'＝'+b+'＋'+a+'だよ。',
        ['ひだりと みぎの しきを くらべよう。','たす じゅんばんを かえられるよ。',
         a+'と '+b+'を いれかえて みよう。'],
        {kind:'tenFrame',first:a,second:b},nums(b,10));
    }
    return directAdd(i,n);
  }
  if(unit===2){
    if(part===2){
      const a=i;
      return task(a+' − '+a+' ＝ □',0,'calculation',
        'ぜんぶ とると 0だよ。',hintsSub,
        {kind:'takeAway',total:a,used:a},['0','1','2']);
    }
    if(part===3){
      const a=4+i%6,b=1+Math.floor(i/6)+i%(a-1),remain=a-b;
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
    if(part===4){
      const value=11+i;
      if(i%3===0)return task('10と いくつで '+value+'？',value-10,'decomposition',
        '10と '+(value-10)+'で '+value+'だよ。',
        hintsTwenty,{kind:'bundlesAndOnes',tens:1,ones:value-10},nums(value-10,10));
      if(i%3===1){
        const other=20-i,answer=Math.max(value,other);
        return task(value+'と '+other+'。おおきい ほうは？',answer,'comparison',
          'かずを くらべると '+answer+'が おおきいよ。',
          ['ふたつの かずを みてね。','10を こえている かずを くらべよう。',
           'おおきい ほうを えらぼう。'],undefined,nums(answer,20));
      }
      return basicNumberLine(i+11,20);
    }
    return basicNumberLine(i,20);
  }
  if(unit===5){
    if(part===4){
      const [a,b]=carryPair(i,n),sum=a+b,gap=10-a;
      const explanation=a+'に '+gap+'を たして 10。のこりの '+(b-gap)+'を たすと '+sum+'だよ。';
      const hints:[string,string,string]=[
        '10の まとまりを つくろう。',
        'はじめの '+a+'に '+gap+'を たすと 10だよ。',
        'のこりの '+(b-gap)+'を たして たしかめよう。'
      ];
      return i%2===0?task('たまが '+a+'こ。'+b+'こ ふえたよ。ぜんぶで いくつ？',
        sum,'story',explanation,hints,
        {kind:'tenFrame',first:a,second:b},nums(sum,20)):
        task(a+' ＋ □ ＝ '+sum,b,'missingPart',explanation,hints,
          {kind:'tenFrame',first:a,second:b},nums(b,10));
    }
    if(part===3){
      const [a,b]=carryPair(i,n),sum=a+b,gap=10-a;
      return task(a+' ＋ □ ＝ '+sum,b,'missingPart',
        a+'を 10に するには '+gap+'。さらに '+(b-gap)+'を たすから、□は '+b+'だよ。',
        ['10を つくる かずを みつけよう。',a+'から 10までは あと '+gap+'だよ。',
          'のこりの '+(b-gap)+'も わすれずに たそう。'],
        {kind:'tenFrame',first:a,second:b},nums(b,10));
    }
    if(part===2){
      const [a,b]=carryPair(i,n);
      return task(a+' ＋ '+b+' ＝ □',a+b,'calculation',
        a+'を 10に するには '+(10-a)+'。のこりを たすと '+(a+b)+'だよ。',
        ['10になるまで あと いくつ？',
          a+'に '+(10-a)+'を たすと 10だよ。',
         'のこりの '+(b-(10-a))+'を 10に たそう。'],
        {kind:'tenFrame',first:a,second:b},nums(a+b,20));
    }
    return directAdd(i,n,true);
  }
  if(unit===6){
    if(part===3){
      // There are only six borrowing facts starting at 16,17,18.
      // Use inverse equations for four additional, distinct exercises.
      const pairs:[[number,number],...[number,number][]]=[
        [16,7],[16,8],[16,9],[17,8],[17,9],[18,9]
      ];
      const [a,b]=pairs[i%pairs.length],left=a-b;
      return i<6?task(a+' − '+b+' ＝ □',left,'calculation',
        '10の まとまりを くずすと '+a+'−'+b+'＝'+left+'だよ。',
        ['ばらだけで ひけるかな？','10の まとまりを くずそう。',
         'のこった かずを たしかめよう。'],
        {kind:'borrowTen',total:a,used:b},nums(left,20)):
        task(a+' − □ ＝ '+left,b,'missingPart',
          a+'から '+b+'を ひくと '+left+'だよ。',
          ['10の まとまりを くずす しきだよ。',
           'どれだけ ひくと '+left+'に なるか かんがえよう。',
           left+'に □を たして '+a+'に なる かずを さがそう。'],
          {kind:'borrowTen',total:a,used:b},nums(b,20));
    }
    return directSub(i,n,true);
  }
  if(unit===7){
    if(part===2)return basicNumberLine(i,100);
    const value=part===0?(i+1)*10:part===1?[9,19,29,39,49,59,69,79,89,100][i]:
      10+i*9;
    const more=13+i*8;
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
    return i%7===0?measureTask(i,'length'):i%7===1?measureTask(i,'capacity'):
      i%7===2?clockTask(i):i%7===3?graphTask(i):i%7===4?directAdd(i,n):
      i%7===5?shapeTask(i,2):directSub(i,n);
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
    // Children practice entering answers to simple equations; picture and
    // matching activities retain one-tap choices.
    const numericInput=source.format==='calculation'&&i%3!==0&&
      /^\d+\s*[＋−]\s*\d+\s*＝/u.test(source.question);
    return {
      id:'ui-preview-'+stage.id+'-curriculum-'+String(i+1).padStart(2,'0'),
      stageId:stage.id,
      skillId:'e1.preview.'+info.domain,
      type:numericInput?'number':'choice',format:source.format,
      difficulty:(i<3?1:i<8?2:3) as 1|2|3,
      question:source.question,prompt:numericInput?'こたえを 数字で いれてね':
        source.prompt??'こたえを えらぼう',
      answer:source.answer,...(numericInput?{}:{choices:shifted}),
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
