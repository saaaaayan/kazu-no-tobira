import type { BankDiagram } from './questionBank.ts';
import { countingTokenArt, type CountingToken } from './countingTokens.ts';
import { pictureNumberMatchAnswer, type PictureNumberMatch } from './preschoolNumberConnections.ts';

/** Numeral-learning tasks, separate from the counting-only preschool 01–05.
 * Child sees a numeral, hears/reads its name, or matches numeral and quantity.
 * No production approval is implied: public UI prototype only.
 */
export type PreschoolNumeralTask = {
  question:string;prompt:string;answer:string;choices:string[];
  explanation:string;hints:[string,string,string];
  numeralPractice:true;
  focalNumeral?:string;
  diagram?:BankDiagram;
  pictureNumberMatch?:PictureNumberMatch;
};

const sounds=['ぜろ','いち','に','さん','よん','ご','ろく','なな','はち','きゅう','じゅう'];
const toys:CountingToken[]=['bear','rabbit','cat','dog','chick','flower','apple','car','fish','turtle'];
const symbol=(t:CountingToken)=>countingTokenArt[t][0];
const label=(t:CountingToken)=>countingTokenArt[t][1];
function pick3(answer:string,alternatives:string[]):string[]{
  const options=[answer,...alternatives.filter(x=>x!==answer)];
  const three=[...new Set(options)].slice(0,3);
  if(three.length!==3)throw Error('Too few numeral options for '+answer);
  return three;
}
function values(n:number,lo:number,hi:number):number[]{
  const values=[n,n>lo?n-1:n+1,n<hi?n+1:n-2].filter(x=>x>=lo&&x<=hi);
  const options=[...new Set(values)];
  for(let k=lo;options.length<3&&k<=hi;k++)if(!options.includes(k))options.push(k);
  if(options.length!==3)throw Error('Insufficient number choices');
  return options;
}
function readDigit(n:number,lo:number,hi:number,variant=0):PreschoolNumeralTask {
  const names=values(n,lo,hi).map(k=>sounds[k]);
  return {
    question:['この すうじは なんて よむ？','この すうじの なまえは？','すうじを よんで みよう'][variant%3],
    prompt:'よみかたを えらぼう',
    answer:sounds[n],choices:pick3(sounds[n],names),
    focalNumeral:String(n),numeralPractice:true,
    hints:['おおきな すうじの かたちを みてね。',
      'すうじの せんを ゆびで なぞって みよう。',
      n===0?'なにも ない ときの すうじだよ。':
        'この すうじは '+n+' この ものと おなじ かずを あらわすよ。'],
    explanation:'この すうじは「'+n+'」。 「'+sounds[n]+'」と よむよ。',
  };
}
function findDigit(n:number,lo:number,hi:number,variant=0):PreschoolNumeralTask {
  return {
    question:['「'+sounds[n]+'」と よむ すうじは どれ？',
      '「'+sounds[n]+'」の すうじを みつけよう。',
      '「'+sounds[n]+'」は どの すうじ？'][variant%3],
    prompt:'すうじを えらぼう',
    answer:String(n),choices:pick3(String(n),values(n,lo,hi).map(String)),
    numeralPractice:true,
    hints:['すうじの かたちを ひとつずつ みてね。',
      '「'+sounds[n]+'」と こえに だして みよう。',
      n===0?'なにも ない かずは 0 だよ。':'「'+sounds[n]+'」は '+n+' の すうじだよ。'],
    explanation:'「'+sounds[n]+'」と よむ すうじは '+n+' だよ。',
  };
}
function picture(n:number,token:CountingToken):string{
  return n===0?'からっぽ':symbol(token).repeat(n);
}
function numeralToPictures(n:number,lo:number,hi:number,token:CountingToken):PreschoolNumeralTask{
  const opts=values(n,lo,hi);
  return {
    question:'この すうじと おなじ かずの '+label(token)+' は どれ？',
    prompt:'すうじと えの かずを あわせよう',
    answer:picture(n,token),choices:pick3(picture(n,token),opts.map(k=>picture(k,token))),
    focalNumeral:String(n),numeralPractice:true,
    hints:['すうじを よく みてね。',
      'えを ひとつずつ さわって かぞえよう。',
      'すうじの '+n+' と おなじ '+n+' こ の えを えらぼう。'],
    explanation:'すうじの '+n+' は、'+n+' こ の '+label(token)+' と おなじ かずだよ。',
  };
}
function picturesToNumeral(n:number,lo:number,hi:number,token:CountingToken):PreschoolNumeralTask{
  const pictured=Array.from({length:n},()=>token);
  return {
    question:'この '+label(token)+' の かずと おなじ すうじは どれ？',
    prompt:'えを かぞえたら、すうじを えらぼう',
    answer:String(n),choices:pick3(String(n),values(n,lo,hi).map(String)),
    numeralPractice:true,
    diagram:{kind:'countingBoard',rows:[{tokens:n===0?['empty']:pictured}]},
    hints:['えと すうじを みくらべよう。',
      'えを ひとつずつ かぞえて、かずを たしかめよう。',
      'えは '+n+' こ だから、すうじの '+n+' を えらぼう。'],
    explanation:label(token)+' は '+n+' こ。 この かずを すうじで かくと '+n+' だよ。',
  };
}
function plateQuestion(count:0|1|2,token:CountingToken,variant:number):PreschoolNumeralTask{
  // Contrast 0 with 1 and 2 on the SAME illustration. An empty plate is not
  // a clue that the answer must be zero on every question.
  const name=label(token);
  return {
    question:[
      'おさらに '+name+' は なんこ ある？',
      'おさらの '+name+' を かぞえよう。',
      'おさらに '+name+' は なんこ のっている？',
    ][variant%3],
    prompt:'えを みて、0・1・2の なかから えらぼう。',
    answer:String(count),
    choices:pick3(String(count),['0','1','2']),
    numeralPractice:true,
    diagram:{kind:'plateCount',token,count},
    hints:[
      'おさらの なかを よく みてね。',
      'ひとつずつ ゆびで さして かぞえよう。',
      count===0?'ひとつも なければ 0こ だよ。':
        name+' が '+count+'こ のっているよ。',
    ],
    explanation:count===0?'おさらは からっぽ。'+name+' は 0こ だよ。':
      'おさらに '+name+' が '+count+'こ のっているね。こたえは '+count+' だよ。',
  };
}
function zeroMeaning():PreschoolNumeralTask{
  return {
    question:'0こって どんな いみ？',
    prompt:'ことばを えらぼう。',
    answer:'なにも ない',
    choices:['なにも ない','1こ ある','2こ ある'],
    numeralPractice:true,
    focalNumeral:'0',
    hints:[
      'おおきな すうじは 0 だね。',
      'おさらが からっぽの ときを おもいだそう。',
      '1こも ない ことを 0こ と いうよ。',
    ],
    explanation:'0こは、ひとつも ない という いみだよ。',
  };
}

/** A real three-pair matching activity, not a multiple-choice shortcut.
 * The picture order and digit order vary; all ten have different cards. */
function connectPicturesAndNumbers(index:number):PreschoolNumeralTask {
  const counts=[1+index%5,1+(index+2)%5,1+(index+4)%5];
  const pictures=counts.map((count,j)=>({count,token:toys[(index*3+j*2)%toys.length]}));
  const digitOrders=[[2,0,1],[1,2,0],[2,1,0],[1,0,2]];
  const order=digitOrders[index%digitOrders.length];
  const match:PictureNumberMatch={
    pictures,
    numbers:order.map(j=>counts[j]),
  };
  const answer=pictureNumberMatchAnswer(match);
  const alternatives=[
    [counts[1],counts[0],counts[2]].join('-'),
    [counts[2],counts[1],counts[0]].join('-'),
  ];
  const names=pictures.map(p=>label(p.token)+'は '+p.count+'こ').join('。');
  return {
    question:'えと おなじ かずの すうじを せんで むすぼう。',
    prompt:'えを さわって、すうじを さわろう。',
    answer,choices:pick3(answer,alternatives),
    numeralPractice:true,pictureNumberMatch:match,
    hints:[
      'ひだりの えを、ひとつずつ かぞえよう。',
      'おなじ かずの すうじを みぎから さがそう。',
      'えを さわって、みつけた すうじを さわろう。',
    ],
    explanation:names+'。それぞれの えと すうじを つなげたね。',
  };
}

/** Exactly 10 tasks per stage, covering recognition and matching—not ten counts. */
export function preschoolNumeralTask(stageNumber:6|7|8|9|10,index:number):PreschoolNumeralTask{
  if(!Number.isInteger(index)||index<0||index>=10)throw new RangeError('Invalid numeral activity index');
  if(stageNumber===6){
    if(index<3)return readDigit(index+1,1,3,index);
    if(index<6)return findDigit(index-2,1,3,index);
    if(index<9)return numeralToPictures(index-5,1,3,toys[index]);
    return findDigit(2,1,3,2);
  }
  if(stageNumber===7){
    const n=4+index%2;
    if(index<2)return readDigit(n,3,5,index);
    if(index<4)return findDigit(n,3,5,index);
    if(index<6)return numeralToPictures(n,3,5,toys[index]);
    if(index<8)return picturesToNumeral(n,3,5,toys[index]);
    return findDigit(n,3,5,index===8?0:1);
  }
  if(stageNumber===8){
    // Include all three abilities: read numerals, find a named numeral,
    // and match its value to a picture. No mere counting-only questions.
    if(index<4)return readDigit(6+index,5,10,index);
    if(index<7)return findDigit([10,6,7][index-4],5,10,index);
    return numeralToPictures(index+1,5,10,toys[index]);
  }
  if(stageNumber===9){
    // Ten complementary tasks. The child must distinguish 0, 1 and 2,
    // recognise the symbol, and understand what "none" means.
    switch(index){
      case 0: return readDigit(0,0,2,0);
      case 1: return findDigit(0,0,2,1);
      case 2: return numeralToPictures(0,0,2,'cat');
      case 3: return plateQuestion(0,'apple',0);
      case 4: return plateQuestion(1,'apple',1);
      case 5: return plateQuestion(2,'apple',2);
      case 6: return plateQuestion(1,'bear',0);
      case 7: return plateQuestion(2,'rabbit',1);
      case 8: return plateQuestion(0,'flower',2);
      default: return zeroMeaning();
    }
  }
  return connectPicturesAndNumbers(index);
}
