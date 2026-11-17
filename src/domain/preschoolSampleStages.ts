import { countingTokenArt, type CountingToken } from './countingTokens.ts';
import type { BankQuestion } from './questionBank.ts';

/** 試作版の幼児02〜05。構造と個数は2026-11-18の原稿40問に対応する。 */
type Layout = 'wide-gaps' | 'even-gaps' | 'small' | 'large' | 'left-packed';
type CountingPreviewDiagram = {
  kind:'countingBoard';guide:true;
  rows:{tokens:CountingToken[]}[];
  targetToken?:CountingToken;
  layoutComparison?:{before:Layout;after:Layout};
};
const labels = countingTokenArt;
const basic:readonly (readonly [CountingToken,number])[][]=[
  [['bear',4],['dot',5],['flower',4],['car',5],['dog',4],['star',5],['apple',4],['fish',5],['rabbit',4],['square',5]],
  [['bear',6],['star',7],['flower',8],['apple',9],['dot',10],['cat',6],['dog',7],['fish',8],['car',9],['rabbit',10]],
];
// 混ざった絵は、原稿に指定された並びを維持する。
const tokenCode:Record<string,CountingToken>={
  '.':'dot','^':'triangle','#':'square','B':'bear','C':'cat','D':'dog','a':'apple','b':'banana','k':'cookie',
  '*':'star','h':'heart','m':'moon','f':'flower','l':'clover','v':'car','t':'train','r':'rabbit'
};
const mixed:readonly (readonly [CountingToken,string])[]=[
  ['dot','.^#.^'],['triangle','#^.^|^#'.replace('|','')],['bear','CBDCDC'],
  ['apple','baaka aab'.replaceAll(' ','')],['star','*hmhh*h'],['flower','flffal'],
  ['square','^##.#^#'],['car','vttvttt'],['rabbit','CrDrrDrC'],['heart','m*hm**m'],
];
// [対象、個数、最初の配置、あとの配置]。同じものが増減することはない。
const moved:readonly (readonly [CountingToken,number,Layout,Layout])[]=[
  ['bear',3,'wide-gaps','even-gaps'],['dot',4,'small','large'],['flower',5,'even-gaps','wide-gaps'],
  ['cat',6,'large','small'],['star',7,'left-packed','even-gaps'],['square',3,'small','large'],
  ['rabbit',8,'even-gaps','left-packed'],['heart',5,'wide-gaps','small'],['car',4,'large','even-gaps'],
  ['apple',6,'left-packed','wide-gaps'],
];
const asRows=(token:CountingToken,count:number)=>count<=5?[{tokens:Array.from({length:count},()=>token)}]:[
  {tokens:Array.from({length:5},()=>token)}, {tokens:Array.from({length:count-5},()=>token)}
];
const answers=(n:number)=>[n===10?8:Math.max(n-1,1),n===10?9:n,n===10?10:n+1].map(String);
function make(stage:number,index:number,token:CountingToken,number:number,diagram:CountingPreviewDiagram):BankQuestion {
  const name=labels[token][1];
  const isMixed=stage===4;
  const isMoved=stage===5;
  const prompt=isMixed?`${name}だけを さわって かぞえよう。`
    :isMoved?`${name}を ならべかえたよ。あとで いくつ あるかな？`
      :`${name}を ひとつずつ さわって かぞえよう。`;
  const hints=isMixed?[
    'えを よく みてね。',
    `かぞえるのは ${name}だけだよ。`,
    `ちがう えは そのまま。 ${name}を ひとつずつ さわろう。`,
  ]:isMoved?[
    'さいしょの えと、あとの えを みてね。',
    `ならべかえても、${name}は なくなっていないよ。`,
    `あとの ${name}を ひとつずつ さわって たしかめよう。`,
  ]:[
    'ひだりから みてね。',
    `まだ さわっていない ${name}を みつけよう。`,
    `ひとつ さわったら、つぎの ${name}に すすもう。`,
  ];
  const explanation=isMixed?`${name}は ${number}こ。ちがう えは かぞえないよ。`
    :isMoved?`${name}は ${number}こ。ならびを かえても、かずは おなじだよ。`
      :`${name}は ${number}こ。ひとつずつ さわって かぞえたよ。`;
  const detail=isMixed?
    `${name}を さがして しるしを つけよう。 ほかの えには しるしを つけないよ。 ${name}についた さいごの すうじは ${number}。`
    :isMoved?
      `さいしょに ${number}この ${name}が あったよ。 ならびかえた あとにも、${name}は ひとつも ふえていないし、へっていないよ。 あとで もういちど かぞえると ${number}こだよ。`
      :`${name}を ひとつずつ かぞえるよ。 さわった ところに 1、2…と すうじが つくよ。 さいごに ついた すうじが こたえだよ。`;
  const steps=isMixed?[
    {title:'みつける',body:`${name}だけを みつけるよ。`},
    {title:'かぞえる',body:`ほかの えは かぞえずに、${name}を ${number}こ かぞえたよ。`}
  ]:isMoved?[
    {title:'ならべる',body:'ならびを かえても、ものは ふえていないし へっていないよ。'},
    {title:'かぞえる',body:`ひとつずつ かぞえると ${number}こだよ。`}
  ]:[{title:'ひとつずつ かぞえる',body:`ひとつに ひとつ すうじを つけるよ。 さいごは ${number}。`}];
  const choices=stage===2?['3','4','5']:answers(number);
  return {
    id:`ui-preview-preschool.n0${stage}-draft-${String(index+1).padStart(2,'0')}`,
    skillId:'preschool.objects',type:'choice',format:'counting',difficulty:stage>=4?2:1,
    question:`${name}は いくつ？`,prompt,choices,answer:String(number),
    hint:hints[0],hints,explanation:detail?explanation:explanation,
    steps:[...steps,{title:'くわしく しる',body:detail}],
    mistakes:choices.filter(choice=>choice!==String(number)).map(choice=>({answer:choice,explanation:'えを ひとつずつ さわって たしかめよう。'})),
    diagram,
  };
}
export const preschoolSample02to05: Readonly<Record<string,readonly BankQuestion[]>>=Object.fromEntries(
  [2,3,4,5].map(stage=>{
    const records=stage===2?basic[0].map(([token,n])=>({token,n,diagram:{kind:'countingBoard' as const,guide:true as const,rows:asRows(token,n)}}))
      :stage===3?basic[1].map(([token,n])=>({token,n,diagram:{kind:'countingBoard' as const,guide:true as const,rows:asRows(token,n)}}))
        :stage===4?mixed.map(([token,sequence])=>{
          const tokens=[...sequence].map(char=>tokenCode[char]);
          if(tokens.some(item=>!item)) throw Error('Unknown preschool token.');
          const n=tokens.filter(item=>item===token).length;
          return {token,n,diagram:{kind:'countingBoard' as const,guide:true as const,rows:[{tokens}],targetToken:token}};
        })
        :moved.map(([token,n,before,after])=>({token,n,diagram:{
          kind:'countingBoard' as const,guide:true as const,rows:asRows(token,n),layoutComparison:{before,after}
        }}));
    return [`preschool.n0${stage}`,records.map(({token,n,diagram},index)=>make(stage,index,token,n,diagram))];
  })
);
