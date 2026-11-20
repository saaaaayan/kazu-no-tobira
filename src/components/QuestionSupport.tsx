import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { type BankDiagram, type BankQuestion, mistakenReason } from '../domain/questionBank';
import type { SolutionStep } from '../domain/writtenSolution';
import { MathDisplay, MathText } from './MathText';
import { fitCountingBoardSizes, countingTileAppearance } from '../domain/countingBoardSizes';
import { countingTapNumber, countingTapNumberInRow, toggleCountingTap } from '../domain/countingTapOrder';

import { countingTokenArt as tokenArt } from '../domain/countingTokens';

function CountingBoard({ diagram, phase }: {
  diagram: Extract<BankDiagram,{ kind:'countingBoard' }>; phase: 'question' | 'hint' | 'solution';
}) {
  const { width: viewportWidth } = useWindowDimensions();
  // 解説は画面そのものより狭いカード内に表示される。ウィンドウ幅ではなく
  // 図の実際の表示幅でサイズを決め、横並びのオブジェクトをはみ出させない。
  const [boardWidth,setBoardWidth] = useState<number>();
  const sideBySide=diagram.arrangement==='side-by-side' && diagram.rows.length===2;
  const positionRow=diagram.arrangement==='position-row';
  const verticalPosition=diagram.arrangement==='vertical-position' && diagram.rows.length===2;
  const maxColumns=Math.max(1,...diagram.rows.map(row=>row.tokens.length),
    ...(diagram.layoutComparison?.beforeRows ?? []));
  // A left/right question must stay left/right even on narrow phones. Each
  // half wraps its own toys internally rather than stacking the two groups.
  const availableWidth=Math.min(viewportWidth,boardWidth??320);
  const groupWidth=sideBySide ? Math.max(110,(availableWidth-34)/2) : availableWidth;
  const sizes=fitCountingBoardSizes(groupWidth,Boolean(diagram.guide)||verticalPosition,
    sideBySide?2:maxColumns);
  const interactive=!positionRow && !verticalPosition &&
    (phase==='question' || (diagram.guide && phase==='hint'));
  const numbered=diagram.guide && phase==='solution';
  const [taps,setTaps] = useState<{ forDiagram:BankDiagram; ids:Set<string> }>();
  const selected = taps?.forDiagram===diagram ? taps.ids : new Set<string>();
  const toggle = (id: string) => setTaps(previous => ({
    forDiagram:diagram,
    ids:toggleCountingTap(previous?.forDiagram===diagram ? previous.ids : new Set<string>(),id),
  }));
  const comparison=diagram.layoutComparison;
  const beforeTokens=diagram.rows.flatMap(row=>row.tokens);
  const beforeRowSizes=comparison?.beforeRows ?? [beforeTokens.length];
  return <View
    onLayout={event=>{
      const measured=Math.round(event.nativeEvent.layout.width);
      if(measured>0 && measured!==boardWidth) setBoardWidth(measured);
    }}
    style={{ width:'100%', maxWidth:'100%', minWidth:0, padding:10, backgroundColor:'#edf4ff', borderRadius:12, gap:8 }}>
    {comparison && <View style={{gap:7,marginBottom:7}}>
      <Text style={{color:'#263f6a',fontWeight:'900',fontSize:20}}>① さいしょ</Text>
      <View accessibilityLabel="ばしょを かえる まえの え。ここは さわらなくて いいよ"
        style={{padding:10,minHeight:70,borderRadius:13,backgroundColor:'#fff9e9',gap:4}}>
        {beforeRowSizes.map((count,row)=>{
          const start=beforeRowSizes.slice(0,row).reduce((sum,n)=>sum+n,0);
          return <View key={row} style={{flexDirection:'row',justifyContent:'center',gap:sizes.gap}}>
            {beforeTokens.slice(start,start+count).map((token,index)=>
              <View key={index} style={{width:sizes.tile,height:sizes.tile,
                alignItems:'center',justifyContent:'center'}}>
                {token==='dot'
                  ? <View style={{width:sizes.symbol,height:sizes.symbol,
                      borderRadius:sizes.symbol/2,backgroundColor:'#253e70'}}/>
                  : <Text style={{fontSize:sizes.symbol,color:'#253e70'}}>{tokenArt[token][0]}</Text>}
              </View>)}
          </View>;
        })}
      </View>
      <Text style={{color:'#5361a1',fontSize:18,fontWeight:'900',textAlign:'center'}}>
        ↓ ばしょを かえたよ ↓
      </Text>
      <Text style={{color:'#263f6a',fontWeight:'900',fontSize:20}}>② あと（こっちを さわってね）</Text>
    </View>}
    <View testID={sideBySide?'counting-left-right-layout':verticalPosition?'counting-up-down-layout':undefined}
      style={sideBySide ? styles.sideBySideCountingGroups :
        verticalPosition ? styles.verticalPositionCountingGroups : styles.stackedCountingGroups}>
    {diagram.rows.map(({label,tokens},row) => <View key={row}
      testID={verticalPosition ? (row===0?'counting-up-scene':'counting-down-scene') : undefined}
      style={sideBySide ? styles.sideBySideCountingGroup :
        verticalPosition ? styles.verticalPositionCountingGroup : styles.stackedCountingGroup}>
      {label && <Text style={{ color:'#293f61', fontSize:18, fontWeight:'700' }}>{label}</Text>}
      <View style={{ flexDirection:'row', flexWrap:(diagram.guide||positionRow||verticalPosition)?'nowrap':'wrap',
        width:'100%', minWidth:0,
        justifyContent:verticalPosition?'center':comparison?.after==='left-packed'?'flex-start':diagram.guide?'center':'flex-start',
        gap:comparison?.after==='wide-gaps'?Math.max(10,sizes.gap+7):comparison?.after==='small'?2:diagram.guide ? sizes.gap : diagram.spacing==='wide'?20:8 }}>
        {tokens.map((token,column) => {
          const id = row+':'+column;
          // 'empty' means an empty plate, not a mathematical circle or a
          // countable object. Show an actual plate with its empty surface.
          if(token==='empty')return <View key={id}
            testID="counting-empty-plate"
            accessible accessibilityLabel="なにも のっていない おさら。りんごは ないよ"
            style={styles.emptyPlateScene}>
            <View pointerEvents="none" style={styles.emptyPlateOuter}>
              <View style={styles.emptyPlateInner}/>
            </View>
            <Text style={styles.emptyPlateCaption}>なにも のっていない おさら</Text>
          </View>;
          const tapNumber = sideBySide ? countingTapNumberInRow(selected,id) : countingTapNumber(selected,id);
          const lit = tapNumber!==undefined;
          const shape = tokenArt[token];
          // くま・丸・図形のすべてで、見た目の白い枠を使わない。
          // タップ用の透明な幅と高さは残す（小さくても48px、幼児向けは62〜112px）。
          const card = { width:sizes.tile, height:sizes.tile, alignItems:'center', justifyContent:'center',
            position:'relative', ...countingTileAppearance() } as const;
          // 「●」の文字サイズはブラウザーやフォントによって小さく見える。
          // どの数え上げ図でも、丸はフォントに依存しない円形Viewを使う。
          const icon = token==='dot'
            ? <View style={{ width:sizes.symbol, height:sizes.symbol, borderRadius:sizes.symbol/2,
                backgroundColor:lit?'#28735b':'#253e70' }} />
            : <Text style={{ fontSize:sizes.symbol, color:token==='marked' ? '#3f765b' : '#253e70' }}>{shape[0]}</Text>;
          const ignored=Boolean(diagram.targetToken && token!==diagram.targetToken);
          return interactive ? <Pressable key={id} style={card} disabled={ignored}
            onPress={() => toggle(id)}
            accessibilityRole="button"
            accessibilityLabel={lit ? shape[1]+'、'+tapNumber+'ばんめ' : ignored ? shape[1]+'、かぞえない え' : shape[1]+'、まだ かぞえていない'}
            accessibilityHint="もういちど さわると かぞえなおせるよ"
            accessibilityState={{ selected:lit }}>
              {icon}
              {tapNumber!==undefined && <View pointerEvents="none" style={{
                position:'absolute',right:0,bottom:0,width:30,height:30,borderRadius:15,
                backgroundColor:'#28735b',alignItems:'center',justifyContent:'center',
              }}><Text style={{color:'#fff',fontSize:20,fontWeight:'900'}}>{tapNumber}</Text></View>}
            </Pressable>
            : <View key={id} style={{alignItems:'center'}}>
              <View accessible accessibilityLabel={shape[1]} style={card}>{icon}</View>
              {numbered && (!diagram.targetToken || token===diagram.targetToken) &&
                <Text style={{fontSize:20,color:'#162d48',fontWeight:'800'}}>
                  {diagram.rows.slice(0,row).reduce((sum,other)=>sum+other.tokens.filter(t=>!diagram.targetToken||t===diagram.targetToken).length,0)
                    +tokens.slice(0,column+1).filter(t=>!diagram.targetToken||t===diagram.targetToken).length}
                </Text>}
            </View>;
        })}
      </View>
    </View>)}
    </View>
  </View>;
}

export function QuestionDiagram({ diagram, phase }: { diagram: BankDiagram; phase: 'question' | 'hint' | 'solution' }) {
  if (diagram.kind === 'gradeOneNumberLine') {
    const values=Array.from({length:(diagram.end-diagram.start)/diagram.step+1},
      (_,i)=>diagram.start+i*diagram.step);
    return <View testID="grade-one-number-line" style={styles.gradeOneVisual}>
      <Text style={styles.gradeOneVisualTitle}>かずの ならび</Text>
      <View style={styles.gradeOneNumberLine}>
        {values.map(value=><View key={value} style={styles.gradeOneNumberCell}
          accessible accessibilityLabel={value===diagram.hidden?'はてなの ばしょ':value+'の ところ'}>
          <Text style={[styles.gradeOneNumberText,value===diagram.hidden&&styles.gradeOneUnknown]}>
            {value===diagram.hidden?'？':value}
          </Text>
        </View>)}
      </View>
    </View>;
  }
  if (diagram.kind === 'gradeOneShapes') {
    const house=diagram.arrangement==='house';
    return <View testID="grade-one-shapes" style={styles.gradeOneVisual}>
      <Text style={styles.gradeOneVisualTitle}>かたちを みてね</Text>
      <View style={[styles.gradeOneShapesRow,house&&styles.gradeOneShapesTower]}>
        {diagram.symbols.map((shape,index)=><Text key={index}
          style={styles.gradeOneShape} accessibilityLabel={shape==='●'?'まる':shape==='▲'?'さんかく':'しかく'}>
          {shape}
        </Text>)}
      </View>
    </View>;
  }
  if (diagram.kind === 'gradeOneCapacity') {
    return <View testID="grade-one-capacity" style={styles.gradeOneVisual}>
      <Text style={styles.gradeOneVisualTitle}>おなじ おおきさの コップ</Text>
      <View style={styles.gradeOneCapacityRow}>
        {([{name:'あか',value:diagram.first,color:'#dc7564'},
           {name:'あお',value:diagram.second,color:'#5796d0'}] as const).map(cup=>
          <View key={cup.name} testID={'grade-one-capacity-'+cup.name}
            style={styles.gradeOneCapacityItem}
            accessible accessibilityLabel={cup.name+'の コップ'}>
            <Text style={styles.gradeOneCupLabel}>{cup.name}</Text>
            <View style={styles.gradeOneCup}>
              <View style={{height:cup.value*18,backgroundColor:cup.color,
                borderBottomLeftRadius:7,borderBottomRightRadius:7,width:'100%'}}/>
            </View>
          </View>)}
      </View>
    </View>;
  }
  if (diagram.kind === 'gradeOnePictureGraph') {
    return <View testID="grade-one-picture-graph" style={styles.gradeOneVisual}>
      <Text style={styles.gradeOneVisualTitle}>えの かずを くらべよう</Text>
      {diagram.rows.map(row=><View key={row.label} style={styles.gradeOneGraphRow}
        accessible accessibilityLabel={row.label+'の え'}>
        <Text style={styles.gradeOneGraphLabel}>{row.label}</Text>
        <View style={styles.gradeOneGraphPictures}>
          {Array.from({length:row.count},(_,i)=>
            <Text key={i} style={styles.gradeOneGraphIcon}>{tokenArt[row.token][0]}</Text>)}
        </View>
      </View>)}
    </View>;
  }
  if (diagram.kind === 'preschoolSplit') {
    const toy=tokenArt[diagram.token][0];
    const remaining=diagram.total-diagram.placedLeft;
    const solved=phase==='solution';
    const toys=(count:number)=>Array.from({length:count},(_,i)=>(
      <Text key={i} style={styles.splitToy}>{toy}</Text>
    ));
    return <View testID="preschool-missing-part-scene"
      style={styles.splitScene}>
      <View style={styles.splitWhole} testID="preschool-split-whole"
        accessibilityLabel={'さいしょは '+diagram.total+'こ'}>
        <Text style={styles.splitHeading}>① さいしょ　ぜんぶで {diagram.total}こ</Text>
        <View style={styles.splitTokens}>{toys(diagram.total)}</View>
      </View>
      <Text style={styles.splitArrow}>↓ はこに わける ↓</Text>
      <Text style={styles.splitHeading}>② わけた あと</Text>
      <View style={styles.splitBoxes}>
        <View testID="preschool-split-left-box" style={styles.splitBox}
          accessible accessibilityLabel={'ひだりの はこに '+diagram.placedLeft+'こ'}>
          <Text style={styles.splitBoxLabel}>ひだりの はこ</Text>
          <View style={styles.splitTokens}>{toys(diagram.placedLeft)}</View>
        </View>
        <View testID="preschool-split-hidden-right-box" style={styles.splitBox}
          accessible accessibilityLabel={solved?'みぎの はこに '+remaining+'こ':'みぎの はこは いくつかな'}>
          <Text style={styles.splitBoxLabel}>みぎの はこ</Text>
          {solved
            ? <View style={styles.splitTokens}>{toys(remaining)}</View>
            : <Text style={styles.splitUnknown}>？</Text>}
        </View>
      </View>
    </View>;
  }
  if (diagram.kind === 'magnitudeCompare') {
    const length=diagram.metric==='length';
    return <View testID="preschool-magnitude-compare"
      accessibilityLabel={length?'あかと あおの ひもの ながさを くらべる え':'あかと あおの まるの おおきさを くらべる え'}
      style={styles.magnitudeScene}>
      {([
        {label:'あか',color:'#cc5149',amount:diagram.first},
        {label:'あお',color:'#3577bd',amount:diagram.second},
      ] as const).map(item=>{
        const extent=length?42+item.amount*38:24+item.amount*22;
        return <View key={item.label} testID={'preschool-magnitude-'+item.label}
          style={styles.magnitudeRow}>
          <Text style={styles.magnitudeLabel}>{item.label}</Text>
          <View style={[styles.magnitudeShape,{
            width:extent,height:length?18:extent,
            borderRadius:length?9:extent/2,
            backgroundColor:item.color,
          }]}/>
        </View>;
      })}
    </View>;
  }
  if (diagram.kind === 'plateCount') {
    const toy=tokenArt[diagram.token];
    const label=diagram.count===0 ? 'なにも のっていない おさら'
      : 'おさらに '+toy[1]+' が '+diagram.count+' こ';
    return <View testID="preschool-plate-count-scene"
      style={styles.plateCountScene} accessible accessibilityLabel={label}>
      <View style={styles.plateCountOuter}>
        <View style={styles.plateCountInner}>
          {Array.from({length:diagram.count},(_,i)=>(
            <Text key={i} style={styles.plateCountToy}>{toy[0]}</Text>
          ))}
        </View>
      </View>
    </View>;
  }
  if (diagram.kind === 'countingBoard') return <CountingBoard diagram={diagram} phase={phase}/>;
  if (diagram.kind === 'tenFrame') return <TenFrame first={diagram.first} second={diagram.second ?? 0} third={diagram.third}/>;

  const solved = phase === 'solution';
  if (diagram.kind === 'bundlesAndOnes') {
    return (
      <View style={styles.transfer}>
        <View style={styles.group} accessible accessibilityLabel={'10の まとまりが ' + diagram.tens + 'こ'}>
          <Text style={styles.groupLabel}>10の まとまり</Text>
          <View style={styles.bundles}>
            {Array.from({ length: diagram.tens }, (_, i) => (
              <View key={i} style={styles.bundle}><Text style={styles.bundleLabel}>10</Text></View>
            ))}
          </View>
        </View>
        <View style={styles.group}>
          <Text style={styles.groupLabel}>ばら</Text>
          <TenFrame first={diagram.ones} second={0}/>
        </View>
      </View>
    );
  }
  if (diagram.kind === 'borrowTen') {
    return (
      <View style={styles.transfer}>
        <View style={styles.group}>
          <Text style={styles.groupLabel}>{solved ? '10から とりだす（きいろ）' : '10の まとまり'}</Text>
          <TenFrame first={solved ? 10-diagram.used : 10} second={solved ? diagram.used : 0}/>
        </View>
        <View style={styles.group}>
          <Text style={styles.groupLabel}>はじめの ばら</Text>
          <TenFrame first={diagram.total-10} second={0}/>
        </View>
      </View>
    );
  }
  if (diagram.kind === 'takeAway') {
    return solved ? (
      <View style={styles.group}>
        <Text style={styles.groupLabel}>あおは のこり、きいろは とりだした ぶん</Text>
        <TenFrame first={diagram.total - diagram.used} second={diagram.used}/>
      </View>
    ) : <TenFrame first={diagram.total} second={0}/>;
  }
  const moved = solved ? 10 - diagram.inside : 0;
  const outside = diagram.outside - moved;
  return (
    <View style={styles.transfer}>
      <View style={styles.group}>
        <Text style={styles.groupLabel}>{solved ? 'うつした あとの はこ' : 'はこの なか'}</Text>
        <TenFrame first={diagram.inside} second={moved} />
        {phase === 'hint' && <Text style={styles.groupLabel}>あいて いる ところに いれよう</Text>}
      </View>
      <View style={styles.group} accessible accessibilityLabel={'はこの そとに たまが ' + outside + 'こ'}>
        <Text style={styles.groupLabel}>はこの そと</Text>
        <View style={styles.looseBalls}>
          {Array.from({ length: outside }, (_, i) => <View key={i} style={[styles.cell, styles.gold]} />)}
        </View>
      </View>
    </View>
  );
}

function TenFrame({ first, second, third = 0 }: { first: number; second: number; third?: number }) {
  const count = first + second + third;
  const label = third > 0 ? `あかの たま ${first}こ、あおの たま ${second}こ、きいろの たま ${third}こ。`
    : second > 0
    ? 'あおの まる ' + first + 'こ、きいろの まる ' + second + 'こ。1つの わくは 10こ。'
    : 'あおの まる ' + first + 'こ。1つの わくは 10こ。';
  return (
    <View accessible accessibilityLabel={label} style={styles.frames}>
      {Array.from({ length: count > 10 ? 2 : 1 }, (_, frame) => (
        <View key={frame} style={styles.frame}>
          {[0, 1].map(row => (
            <View key={row} style={styles.frameRow}>
              {Array.from({ length: 5 }, (_, col) => {
                const index = frame * 10 + row * 5 + col;
                return <View key={col} style={[
                  styles.cell,
                  index < first ? (third ? styles.red : styles.blue)
                    : index < first + second ? (third ? styles.blue : styles.gold)
                      : index < count ? styles.gold : undefined,
                ]}/>;
              })}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function WrittenSolution({ steps }: { steps: readonly SolutionStep[] }) {
  return <View style={styles.details}>
    {steps.some(step => step.equations?.length) && <Text accessibilityRole="header" style={styles.modelTitle}>記述式の模範解答</Text>}
    {steps.map((step, index) => (
    <View key={step.title} style={styles.step}>
      <Text accessibilityRole="header" style={styles.title}>{index + 1}．{step.title}</Text>
      <MathText value={step.body} style={styles.body} />
      {!!step.equations?.length && <View style={styles.equations}>
        {step.equations.map((latex, i) => <MathDisplay key={i} latex={latex} />)}
      </View>}
    </View>
  ))}</View>;
}

export function WorkedSolution({ question, wrongAnswer }: { question: BankQuestion; wrongAnswer?: string }) {
  const reason = wrongAnswer === undefined ? undefined : mistakenReason(question, wrongAnswer);
  return (
    <View style={styles.details}>
      {reason && <MathText value={reason} style={styles.reason} />}
      {question.diagram && !(question.diagram.kind==='countingBoard' && question.diagram.guide) &&
        <QuestionDiagram diagram={question.diagram} phase="solution" />}
      <WrittenSolution steps={question.steps} />
    </View>
  );
}

const styles = StyleSheet.create({
  gradeOneVisual:{width:'100%',backgroundColor:'#edf4ff',padding:14,borderRadius:14,gap:12},
  gradeOneVisualTitle:{fontSize:18,fontWeight:'900',color:'#233f68',textAlign:'center'},
  gradeOneNumberLine:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:3},
  gradeOneNumberCell:{flex:1,minWidth:0,alignItems:'center',justifyContent:'center',
    borderBottomColor:'#334568',borderBottomWidth:3,paddingVertical:10},
  gradeOneNumberText:{fontWeight:'900',fontSize:21,color:'#253b66'},
  gradeOneUnknown:{color:'#a34d1e',fontSize:28},
  gradeOneShapesRow:{flexDirection:'row',justifyContent:'center',alignItems:'center',gap:14},
  gradeOneShapesTower:{flexDirection:'column'},
  gradeOneShape:{fontSize:64,lineHeight:72,color:'#355a96',textAlign:'center'},
  gradeOneCapacityRow:{flexDirection:'row',gap:20,justifyContent:'center'},
  gradeOneCapacityItem:{alignItems:'center',gap:8,minWidth:90},
  gradeOneCupLabel:{fontSize:20,fontWeight:'900',color:'#243e66'},
  gradeOneCup:{width:76,height:116,borderColor:'#526d8c',borderWidth:4,
    borderTopWidth:0,borderBottomLeftRadius:13,borderBottomRightRadius:13,
    backgroundColor:'#fffefa',justifyContent:'flex-end',overflow:'hidden'},
  gradeOneGraphRow:{flexDirection:'row',alignItems:'center',gap:12},
  gradeOneGraphLabel:{width:70,fontSize:18,fontWeight:'900',color:'#233f68'},
  gradeOneGraphPictures:{flexDirection:'row',flexWrap:'wrap',gap:7,flex:1},
  gradeOneGraphIcon:{fontSize:30,lineHeight:39},
  splitScene:{width:'100%',padding:12,borderRadius:14,backgroundColor:'#edf4ff',gap:8},
  splitWhole:{gap:6,alignItems:'center',padding:10,borderRadius:11,backgroundColor:'#fff9e9'},
  splitHeading:{fontSize:18,fontWeight:'900',color:'#243f6b',textAlign:'center'},
  splitTokens:{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:5,minHeight:42},
  splitToy:{fontSize:31,lineHeight:43,textAlign:'center'},
  splitArrow:{fontSize:18,fontWeight:'900',textAlign:'center',color:'#324f85'},
  splitBoxes:{flexDirection:'row',gap:10,alignItems:'stretch'},
  splitBox:{flex:1,minWidth:0,minHeight:100,gap:5,alignItems:'center',padding:8,
    borderRadius:12,borderWidth:2,borderColor:'#b9cbe2',backgroundColor:'#fff9e9'},
  splitBoxLabel:{fontSize:17,fontWeight:'900',color:'#273f67',textAlign:'center'},
  splitUnknown:{fontSize:42,lineHeight:50,color:'#243f6b',fontWeight:'900',textAlign:'center'},
  magnitudeScene:{width:'100%',maxWidth:420,alignSelf:'center',padding:16,
    backgroundColor:'#edf4ff',borderRadius:14,gap:18},
  magnitudeRow:{flexDirection:'row',alignItems:'center',minHeight:80,gap:14},
  magnitudeLabel:{width:55,color:'#27335c',fontWeight:'900',fontSize:22},
  magnitudeShape:{borderWidth:1,borderColor:'#243d65'},
  stackedCountingGroups:{gap:8},
  stackedCountingGroup:{gap:5},
  sideBySideCountingGroups:{flexDirection:'row',alignItems:'stretch',gap:8},
  sideBySideCountingGroup:{flex:1,minWidth:0,gap:5,padding:5,borderRadius:9,
    backgroundColor:'#fff9e9',borderWidth:1,borderColor:'#c8d4e2'},
  verticalPositionCountingGroups:{gap:12,alignItems:'center',paddingVertical:5},
  verticalPositionCountingGroup:{width:'100%',maxWidth:340,alignItems:'center',
    padding:10,gap:5,borderRadius:12,borderWidth:1,borderColor:'#c8d4e2',
    backgroundColor:'#fff9e9'},
  // Same visual plate for 0, 1 and 2. Never print the answer on the plate.
  plateCountScene:{width:'100%',minHeight:170,alignItems:'center',justifyContent:'center',paddingVertical:12},
  plateCountOuter:{width:208,height:132,borderWidth:6,borderRadius:80,borderColor:'#8297b0',
    backgroundColor:'#e3edf7',justifyContent:'center',alignItems:'center'},
  plateCountInner:{width:165,height:94,borderWidth:3,borderRadius:65,
    borderColor:'#b2c5d9',backgroundColor:'#fff8e8',flexDirection:'row',
    justifyContent:'center',alignItems:'center',gap:8},
  plateCountToy:{fontSize:40,lineHeight:55,textAlign:'center'},
  emptyPlateScene:{width:'100%',minHeight:152,alignItems:'center',justifyContent:'center',gap:8,paddingVertical:10},
  emptyPlateOuter:{width:158,height:95,borderWidth:5,borderRadius:65,borderColor:'#8297b0',
    backgroundColor:'#e3edf7',justifyContent:'center',alignItems:'center'},
  emptyPlateInner:{width:114,height:60,borderWidth:3,borderRadius:50,
    borderColor:'#b2c5d9',backgroundColor:'#fff8e8'},
  emptyPlateCaption:{fontSize:17,lineHeight:23,color:'#293f61',fontWeight:'900',textAlign:'center'},
  transfer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  group: { minWidth: 108, padding: 6, gap: 5, backgroundColor: '#eef3ff', borderRadius: 8 },
  bundles: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, maxWidth: 160 },
  bundle: { backgroundColor: '#244b97', borderRadius: 4, alignItems: 'center', width: 28, paddingVertical: 4 },
  bundleLabel: { color: '#fff', fontWeight: '700' },
  groupLabel: { color: '#243458', fontWeight: '700', fontSize: 13 },
  looseBalls: { flexDirection: 'row', gap: 3, flexWrap: 'wrap', maxWidth: 98 },
  frames: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  frame: { backgroundColor: '#fff', gap: 3, borderWidth: 1, borderColor: '#b7c2df', borderRadius: 8, padding: 5 },
  frameRow: { flexDirection: 'row', gap: 3 },
  cell: { width: 17, height: 17, borderWidth: 1, borderColor: '#8e9abc', borderRadius: 9 },
  blue: { backgroundColor: '#244b97', borderColor: '#244b97' },
  red: { backgroundColor: '#c54a40', borderColor: '#78261e' },
  gold: { backgroundColor: '#efb857', borderColor: '#885517' },
  details: { gap: 12, paddingTop: 8, minWidth: 0 },
  equations: { alignSelf: 'stretch', minWidth: 0, gap: 6, padding: 9, backgroundColor: '#eef3ff', borderRadius: 8 },
  step: { gap: 4, borderTopWidth: 1, borderColor: '#c5cbd8', paddingTop: 8 },
  title: { color: '#243458', fontSize: 16, fontWeight: '800' },
  modelTitle: { color: '#243458', fontSize: 20, fontWeight: '900' },
  body: { color: '#263659', fontSize: 17, lineHeight: 25 },
  reason: { color: '#823b36', fontSize: 17, lineHeight: 25, fontWeight: '700' },
});
