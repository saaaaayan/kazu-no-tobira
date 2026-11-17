import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { countingTokenArt } from '../domain/countingTokens';
import type { DraftQuestion, PrivateDraftStage } from '../domain/privateDraftReview';

const pictures: Record<string, readonly [string, string]> = countingTokenArt;
function picture(token: string) { return pictures[token]?.[0] ?? '？'; }

function Choice({value, selected, onPress}: {value:string;selected?:boolean;onPress:()=>void}) {
  return <Pressable accessibilityRole="button" accessibilityState={{selected:Boolean(selected)}}
    onPress={onPress} style={[styles.choice,selected&&styles.chosen]}>
    <Text style={[styles.choiceText,selected&&styles.chosenText]}>{value}</Text>
  </Pressable>;
}
function TokenRow({tokens}: {tokens: readonly string[]}) {
  return <View style={styles.tokens}>
    {tokens.map((token,i)=><Text key={i} accessibilityLabel={pictures[token]?.[1]??token}
      style={styles.token}>{picture(token)}</Text>)}
  </View>;
}

function Figure({q, selectedPicture, onPicture}: {
  q:DraftQuestion;selectedPicture?:string;onPicture:(id:string)=>void;
}) {
  const d=q.diagram;
  if (!d) return <Text style={styles.notice}>この問題には絵の指定がありません。</Text>;
  if (d.kind==='countingBoard') {
    const before=q.visualPlan?.before?.tokens;
    const after=q.visualPlan?.after?.tokens;
    return <View style={styles.figure}>
      {before&&after&&<>
        <Text style={styles.caption}>さいしょ</Text>
        <TokenRow tokens={before}/>
        <Text style={styles.caption}>ならべかえた あと</Text>
        <TokenRow tokens={after}/>
      </>}
      {!before&&d.emptyContainer&&<Text style={styles.caption}>はこ・おさらを みてみよう</Text>}
      {d.emptyContainer&&<View style={styles.empty}><Text style={styles.caption}>
        {d.emptyContainer.kind==='plate'?'おさら':d.emptyContainer.kind==='toy-box'?'おもちゃばこ':'たな'}
      </Text>{d.rows?.map((row,i)=><TokenRow key={i} tokens={row.tokens}/>)}</View>}
      {!d.emptyContainer && !before && d.rows?.map((row,i)=><TokenRow key={i} tokens={row.tokens}/>)}
    </View>;
  }
  if (d.kind==='spokenNumeralPrompt')
    return <View style={styles.figure}><Text style={styles.bigKana}>{d.fallbackKana??d.spokenText??'こえを きこう'}</Text>
      <Text style={styles.caption}>この ことばに あう すうじを えらぼう</Text></View>;
  if (d.kind==='numeralShapePanel')
    return <View style={styles.figure}><Text style={styles.caption}>この すうじと おなじ かたちを えらぼう</Text>
      <Text style={styles.bigNumeral}>{d.sourceNumeral}</Text></View>;
  if (d.kind==='three-container-choice')
    return <View style={styles.figure}><View style={styles.containerRow}>
      {d.containers?.map(c=><View key={c.id} style={styles.container}>
        <Text style={styles.caption}>{c.id}</Text><TokenRow tokens={c.tokens}/></View>)}
      </View></View>;
  if (d.kind==='picture-number-connection')
    return <View style={styles.figure}>
      <Text style={styles.caption}>えを えらんで、すうじを タップしよう</Text>
      <View style={styles.containerRow}>{d.pictureCards?.map(c=>
        <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={'え '+c.id} onPress={()=>onPicture(c.id)}
          style={[styles.container, selectedPicture===c.id && styles.chosen]}>
          <Text style={styles.caption}>{c.id}</Text>
          {c.rows.map((row,i)=><TokenRow key={i} tokens={row.tokens}/>)}
          {c.rows.every(row=>row.tokens.length===0)&&<Text style={styles.caption}>からっぽ</Text>}
        </Pressable>)}</View>
    </View>;
  return <Text style={styles.notice}>図の操作は制作中（{d.kind}）。問題文と解説を下で確認できます。</Text>;
}

export default function PrivateDraftReview({stage,onBack}:{stage:PrivateDraftStage;onBack:()=>void}) {
  const [index,setIndex]=useState(0);
  const [chosen,setChosen]=useState<string>();
  const [result,setResult]=useState<boolean>();
  const [show,setShow]=useState(false);
  const [activePicture,setActivePicture]=useState<string>();
  const [connected,setConnected]=useState<Record<string,string>>({});
  const q=stage.questions[index];
  const match=q.diagram?.kind==='picture-number-connection';
  function clear() {setChosen(undefined);setResult(undefined);setShow(false);setConnected({});setActivePicture(undefined);}
  function move(step:number) {setIndex(i=>Math.max(0,Math.min(stage.questions.length-1,i+step)));clear();}
  function select(value:string) {setChosen(value);setResult(undefined);}
  function link(value:string) {
    if (!activePicture) return;
    setConnected(old=>({...old,[activePicture]:value}));
    setActivePicture(undefined);setResult(undefined);
  }
  function check() {
    if (match) {
      const mapping=q.answer;
      setResult(typeof mapping==='object'&&Object.keys(mapping).every(key=>connected[key]===mapping[key]));
    } else setResult(chosen===q.answer);
  }
  return <View style={styles.panel} testID="private-draft-review">
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
      <Text style={styles.backText}>‹ しまの マップへ もどる</Text>
    </Pressable>
    <Text accessibilityRole="header" style={styles.heading}>冒険の道 {stage.stageId.slice(-2)}　{stage.title}</Text>
    <Text style={styles.notice}>非公開・教材評価用の下書き（{stage.questions.length}問）。学習記録は保存されません。</Text>
    <Text style={styles.progress}>{index+1} / {stage.questions.length} もん</Text>
    <View style={styles.questionCard} key={q.id}>
      <Text style={styles.question}>{q.question}</Text>
      {!!q.prompt&&<Text style={styles.prompt}>{q.prompt}</Text>}
      <Figure q={q} selectedPicture={activePicture} onPicture={id=>{
        setActivePicture(id);setConnected(old=>{const next={...old};delete next[id];return next;});setResult(undefined);
      }}/>
      {match ? <>
        <Text style={styles.caption}>えと すうじを むすんで みよう</Text>
        <View style={styles.choices}>{q.diagram?.numberCards?.map((card,i)=>
          <Choice key={card.id??i} value={card.text} onPress={()=>link(card.text)}/>)}</View>
        <Text style={styles.caption}>つないだ え：{Object.entries(connected).map(([k,v])=>k+' → '+v).join('、')||'まだ ないよ'}</Text>
        <Pressable accessibilityRole="button" style={styles.smallButton} onPress={()=>{setConnected({});setActivePicture(undefined);setResult(undefined);}}>
          <Text style={styles.smallText}>ぜんぶ やりなおす</Text>
        </Pressable>
      </> : <View style={styles.choices}>{q.choices?.map((value,i)=>
        <Choice key={i} value={value} selected={chosen===value} onPress={()=>select(value)}/>)}</View>}
      <Pressable accessibilityRole="button" disabled={match?Object.keys(connected).length<3:!chosen}
        style={[styles.checkButton,(match?Object.keys(connected).length<3:!chosen)&&styles.disabled]}
        onPress={check}><Text style={styles.checkText}>こたえあわせ</Text></Pressable>
      {result!==undefined&&<Text accessibilityLiveRegion="polite" style={[styles.feedback,result?styles.good:styles.bad]}>
        {result?'せいかい！':'もういちど かんがえてみよう'}</Text>}
      <Pressable accessibilityRole="button" onPress={()=>setShow(x=>!x)} style={styles.hintButton}>
        <Text style={styles.hintText}>{show?'こたえ・ヒントを とじる':'こたえ・ヒント・かいせつを みる'}</Text>
      </Pressable>
      {show&&<View style={styles.solution}>
        <Text style={styles.label}>こたえ</Text>
        <Text style={styles.answer}>{typeof q.answer==='string'?q.answer:Object.entries(q.answer).map(([a,b])=>a+' → '+b).join('　')}</Text>
        <Text style={styles.label}>3つの ヒント</Text>
        {q.hints.map((hint,i)=><Text key={i} style={styles.prose}>{i+1}. {hint}</Text>)}
        <Text style={styles.label}>きほんの かいせつ</Text>
        <Text style={styles.prose}>{q.explanation}</Text>
        {!!q.detailedExplanation&&<><Text style={styles.label}>くわしい かいせつ</Text>
        <Text style={styles.prose}>{q.detailedExplanation}</Text></>}
      </View>}
    </View>
    <Text style={styles.notice}>注：これは原稿内容を確かめる画面です。音声・アニメーション・対象だけのタップなど、本番操作の再現は未完了です。{stage.uiGap??''}</Text>
    <View style={styles.nav}>
      <Pressable accessibilityRole="button" disabled={index===0} onPress={()=>move(-1)}
        style={[styles.navButton,index===0&&styles.disabled]}><Text style={styles.navText}>‹ まえの もんだい</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={index===stage.questions.length-1} onPress={()=>move(1)}
        style={[styles.navButton,index===stage.questions.length-1&&styles.disabled]}><Text style={styles.navText}>つぎの もんだい ›</Text></Pressable>
    </View>
  </View>;
}

const styles=StyleSheet.create({
  panel:{gap:13,padding:15,backgroundColor:'#f9f8ff',borderRadius:20},
  back:{minHeight:44,justifyContent:'center'},backText:{fontSize:16,color:'#39549b',fontWeight:'800'},
  heading:{fontSize:23,color:'#26365b',fontWeight:'900'},
  notice:{fontSize:13,color:'#5b6581',lineHeight:21},
  progress:{fontSize:18,color:'#54418c',fontWeight:'800'},
  questionCard:{padding:15,borderRadius:17,backgroundColor:'#fff',gap:12,borderWidth:1,borderColor:'#d7dbef'},
  question:{fontSize:23,lineHeight:33,fontWeight:'900',color:'#243656'},
  prompt:{fontSize:17,lineHeight:26,color:'#384f70'},
  figure:{backgroundColor:'#ecf3ff',borderRadius:13,padding:14,gap:12,alignItems:'center'},
  caption:{fontSize:14,color:'#3d4c6a',fontWeight:'700'},
  tokens:{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:8,minHeight:30},
  token:{fontSize:35,lineHeight:51},
  bigKana:{fontSize:36,fontWeight:'900',color:'#233c74'},
  bigNumeral:{fontSize:85,fontWeight:'900',color:'#233c74'},
  empty:{minWidth:170,minHeight:98,borderRadius:20,borderWidth:3,borderColor:'#7c9aa8',padding:9,alignItems:'center',justifyContent:'center'},
  containerRow:{width:'100%',flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:8},
  container:{flexGrow:1,minWidth:78,borderWidth:2,borderColor:'#b9cae0',borderRadius:14,padding:8,alignItems:'center',justifyContent:'center',gap:3},
  choices:{flexDirection:'row',gap:8,justifyContent:'center',flexWrap:'wrap'},
  choice:{borderRadius:13,minWidth:74,minHeight:60,paddingHorizontal:12,justifyContent:'center',alignItems:'center',backgroundColor:'#e5e9fa',borderWidth:2,borderColor:'#bdc8e8'},
  chosen:{backgroundColor:'#d9c8ff',borderColor:'#7053b5'},
  choiceText:{fontSize:30,fontWeight:'900',color:'#243756'},chosenText:{color:'#352069'},
  checkButton:{padding:14,minHeight:55,alignItems:'center',backgroundColor:'#6650a8',borderRadius:12},
  checkText:{fontSize:18,color:'#fff',fontWeight:'900'},
  disabled:{opacity:.4},
  feedback:{fontSize:19,fontWeight:'900',textAlign:'center',padding:7},
  good:{color:'#247751'},bad:{color:'#a44946'},
  hintButton:{borderRadius:10,borderWidth:1,borderColor:'#8d94b8',padding:12,alignItems:'center'},
  hintText:{fontSize:15,fontWeight:'800',color:'#354c83'},
  solution:{padding:12,backgroundColor:'#f0f5ff',borderRadius:12,gap:8},
  label:{color:'#344a78',fontWeight:'900',fontSize:16},
  answer:{fontSize:22,fontWeight:'900',color:'#14765c'},
  prose:{fontSize:16,lineHeight:26,color:'#304464'},
  nav:{flexDirection:'row',flexWrap:'wrap',gap:8,justifyContent:'space-between'},
  navButton:{minHeight:50,borderRadius:10,backgroundColor:'#dae4f3',padding:13,justifyContent:'center'},
  navText:{fontSize:14,fontWeight:'800',color:'#334b70'},
  smallButton:{alignSelf:'center',padding:9,borderRadius:9,borderWidth:1,borderColor:'#b0bad6'},
  smallText:{fontSize:13,fontWeight:'800',color:'#394d70'},
});
