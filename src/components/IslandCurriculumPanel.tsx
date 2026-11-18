import {useState} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {islandCurriculum,stageCategoryName} from '../domain/islandCurriculumView';
import {stageDisplayTitle,stageLabels} from '../domain/stageStructure';
import type {WorldGrade,WorldStage} from '../domain/worldCatalog';

type Availability={enabled:boolean;label:string};
type Props={
  grade:WorldGrade;
  onStart:(stage:WorldStage)=>void;
  availability:(stage:WorldStage)=>Availability;
};

function stageNumber(stage:WorldStage):string {
  return stage.kind==='normal'?String(stage.order+1).padStart(2,'0')
    :stage.kind==='extra'?String(stage.order-49).padStart(2,'0')
      :String(stage.order-59).padStart(2,'0');
}

function StageCurriculumRow({grade,stage,onStart,availability}:Props&{stage:WorldStage}){
  const state=availability(stage);
  const prefix=stageLabels[stage.kind];
  return <Pressable testID={'curriculum-stage-'+stage.id} accessibilityRole="button"
      accessibilityState={{disabled:!state.enabled}}
      accessibilityLabel={prefix+' '+stageNumber(stage)+'、単元 '+stageCategoryName(grade,stage)+'、'+stageDisplayTitle(stage)+'、'+state.label}
      onPress={()=>onStart(stage)} disabled={!state.enabled}
      style={({pressed})=>[styles.stageRow,!state.enabled&&styles.stageDisabled,pressed&&styles.pressed]}>
    <View style={styles.stageCopy}>
      <Text style={styles.stageTitle}>{prefix} {stageNumber(stage)}　{stageDisplayTitle(stage)}</Text>
      <Text style={styles.stageSubject}>{stage.kind==='secret'?'探究テーマ':'単元・カテゴリ'}：{stageCategoryName(grade,stage)}</Text>
    </View>
    <Text style={[styles.stageAction,!state.enabled&&styles.stageActionDisabled]}>{state.label}</Text>
  </Pressable>;
}

export function IslandCurriculumPanel({grade,onStart,availability}:Props){
  const [open,setOpen]=useState(false);
  const [section,setSection]=useState<string|null>(null);
  const data=islandCurriculum(grade);
  const expand=(key:string)=>setSection(old=>old===key?null:key);
  return <View style={styles.panel}>
    <Pressable testID="kazu-island-curriculum-toggle" accessibilityRole="button"
      accessibilityState={{expanded:open}} onPress={()=>setOpen(value=>!value)}
      style={({pressed})=>[styles.headingButton,pressed&&styles.pressed]}>
      <View style={styles.headingText}>
        <Text accessibilityRole="header" style={styles.heading}>📚 この島のカリキュラム</Text>
        <Text style={styles.description}>全10単元・{grade.stages.length}ステージ（冒険50／試練10／伝説5）</Text>
      </View>
      <Text style={styles.toggle}>{open?'とじる ▲':'くわしく ▼'}</Text>
    </Pressable>
    <Text style={styles.overviewLabel}>この島で まなぶ10の単元</Text>
    <View style={styles.overview}>
      {data.units.map(({number,unit})=>
        <Pressable key={unit.code} accessibilityRole="button"
          accessibilityLabel={number+'番目の単元 '+unit.title+' のステージを表示'}
          onPress={()=>{setOpen(true);setSection('unit-'+(number-1));}}
          style={({pressed})=>[styles.overviewChip,pressed&&styles.pressed]}>
          <Text style={styles.overviewChipText}>{String(number).padStart(2,'0')}　{unit.title}</Text>
        </Pressable>
      )}
    </View>
    <Text style={styles.overviewFootnote}>単元をタップすると、学ぶステージと問題の状況を確認できるよ。</Text>
    {open&&<View testID="kazu-curriculum-sections" style={styles.sections}>
      <Text style={styles.sectionGroupTitle}>冒険の道：50ステージ</Text>
      {data.units.map(({number,unit,stages,trial})=>{
        const key='unit-'+(number-1),expanded=section===key;
        return <View key={unit.code} style={styles.unitBlock}>
          <Pressable testID={'curriculum-unit-'+number} accessibilityRole="button"
            accessibilityState={{expanded}} onPress={()=>expand(key)}
            style={({pressed})=>[styles.sectionButton,pressed&&styles.pressed]}>
            <Text style={styles.sectionTitle}>{String(number).padStart(2,'0')}　{unit.title}</Text>
            <Text style={styles.sectionMeta}>冒険 {stages.length}地点　{expanded?'▲':'▼'}</Text>
          </Pressable>
          {expanded&&<View style={styles.sectionDetails}>
            {stages.map(stage=><StageCurriculumRow key={stage.id} grade={grade} stage={stage}
                onStart={onStart} availability={availability}/>)}
            {trial&&<Text style={styles.trialNote}>この単元の試練：{stageDisplayTitle(trial)}</Text>}
          </View>}
        </View>;
      })}
      <View style={styles.unitBlock}>
        <Pressable testID="curriculum-extras-toggle" accessibilityRole="button"
          accessibilityState={{expanded:section==='trials'}} onPress={()=>expand('trials')}
          style={styles.sectionButton}>
          <Text style={styles.sectionTitle}>⚔ 試練の道：10ステージ</Text>
          <Text style={styles.sectionMeta}>{section==='trials'?'▲':'▼'}</Text>
        </Pressable>
        {section==='trials'&&<View style={styles.sectionDetails}>
          {data.trials.map(stage=><StageCurriculumRow key={stage.id} grade={grade} stage={stage}
            onStart={onStart} availability={availability}/>)}
        </View>}
      </View>
      <View style={styles.unitBlock}>
        <Pressable testID="curriculum-secrets-toggle" accessibilityRole="button"
          accessibilityState={{expanded:section==='legends'}} onPress={()=>expand('legends')}
          style={styles.sectionButton}>
          <Text style={styles.sectionTitle}>✨ 伝説のトビラ：5ステージ</Text>
          <Text style={styles.sectionMeta}>{section==='legends'?'▲':'▼'}</Text>
        </Pressable>
        {section==='legends'&&<View style={styles.sectionDetails}>
          {data.legends.map(stage=><StageCurriculumRow key={stage.id} grade={grade} stage={stage}
            onStart={onStart} availability={availability}/>)}
        </View>}
      </View>
      <View style={styles.checkpoints}>
        <Text style={styles.sectionGroupTitle}>📝 確認テスト：10回</Text>
        <Text style={styles.description}>冒険の道5ステージごとに、直前の5ステージから10問を出題するよ。</Text>
        {data.checkpoints.map(item=><Text key={item.id} style={styles.checkpointEntry}>
          確認テスト{item.number}　冒険{String(item.after.order-3).padStart(2,'0')}〜{String(item.after.order+1).padStart(2,'0')}のあと
        </Text>)}
      </View>
    </View>}
  </View>;
}

const styles=StyleSheet.create({
  panel:{backgroundColor:'#fff9e8',borderRadius:18,borderWidth:1,borderColor:'#d8c7a1',padding:13,gap:11},
  headingButton:{minHeight:54,flexDirection:'row',gap:8,alignItems:'center',justifyContent:'space-between'},
  headingText:{flex:1,gap:4},
  heading:{fontSize:19,fontWeight:'900',color:'#334b75'},
  description:{fontSize:12,color:'#5c6179',lineHeight:20},
  toggle:{fontSize:12,fontWeight:'900',color:'#285d84'},
  overviewLabel:{fontSize:14,fontWeight:'900',color:'#4f4b72'},
  overview:{flexDirection:'row',flexWrap:'wrap',gap:7},
  overviewChip:{backgroundColor:'#edf2fb',borderColor:'#c7d5e6',borderWidth:1,borderRadius:9,paddingHorizontal:9,
    paddingVertical:10,minHeight:42,width:'48%',justifyContent:'center',flexGrow:1},
  overviewChipText:{fontSize:12,fontWeight:'800',color:'#314865',lineHeight:19},
  overviewFootnote:{fontSize:11,color:'#646882',lineHeight:18},
  sections:{gap:9,paddingTop:8},
  sectionGroupTitle:{fontSize:16,fontWeight:'900',color:'#344b72'},
  unitBlock:{borderWidth:1,borderColor:'#d4d9e7',borderRadius:11,overflow:'hidden'},
  sectionButton:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,padding:12,minHeight:50,backgroundColor:'#e6edf8'},
  sectionTitle:{fontSize:14,fontWeight:'900',color:'#324d73',flex:1},
  sectionMeta:{fontSize:11,fontWeight:'800',color:'#566585'},
  sectionDetails:{backgroundColor:'#fffdf8',padding:8,gap:6},
  stageRow:{flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'#fff',padding:9,minHeight:62,
    borderRadius:8,borderWidth:1,borderColor:'#e1e4ea'},
  stageDisabled:{backgroundColor:'#f1f1ef'},
  stageCopy:{flex:1,gap:4},
  stageTitle:{color:'#34435f',fontSize:12,fontWeight:'800',lineHeight:19},
  stageSubject:{fontSize:12,fontWeight:'800',color:'#47647f',lineHeight:18},
  stageAction:{color:'#24604e',fontSize:11,fontWeight:'900',textAlign:'right',maxWidth:74},
  stageActionDisabled:{color:'#858897'},
  trialNote:{fontSize:12,color:'#675485',padding:6},
  checkpoints:{backgroundColor:'#f3f0fa',padding:11,gap:5,borderRadius:10},
  checkpointEntry:{fontSize:12,color:'#42496b',lineHeight:19},
  pressed:{opacity:0.74},
});
