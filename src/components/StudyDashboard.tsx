import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Progress } from '../domain/progress';
import type { UserPlan } from '../domain/access';
import { PREMIUM_FEATURES } from '../domain/access';
import { analyzeWeakness, growthSnapshot } from '../domain/studyIntelligence';
import { worldGrades, type WorldStage } from '../domain/worldCatalog';
import { guidesForGrade } from '../domain/learningLibrary';

export type StudyPurpose = 'daily' | 'review' | 'weak';
export function PlanSwitcher({ plan, onChange, testEnabled }: {
  plan: UserPlan; onChange: (p: UserPlan) => void; testEnabled: boolean;
}) {
  if (!testEnabled) return null;
  return <View style={styles.switchbox}>
    <Text style={styles.testLabel}>🛠 開発用・課金テスト（本当の決済は行いません）</Text>
    <View style={styles.switches}>{(['free','premium'] as const).map(p =>
      <Pressable key={p} onPress={() => onChange(p)} accessibilityRole="button"
        accessibilityState={{selected:p===plan}}
        style={[styles.switch,plan===p&&styles.switchOn]}>
        <Text style={[styles.switchText,plan===p&&styles.switchTextOn]}>{p==='free'?'無料ユーザー':'有料ユーザー'}</Text>
      </Pressable>)}</View>
  </View>;
}

export default function StudyDashboard({ progress, plan, onBack, onPlan, onPractice, onStage, showSwitch }: {
  progress: Progress; plan: UserPlan; onBack: () => void; onPlan: (p: UserPlan) => void;
  onPractice: (purpose: StudyPurpose) => void; onStage:(s:WorldStage)=>void; showSwitch:boolean;
}) {
  const insight = analyzeWeakness(progress);
  const growth = growthSnapshot(progress);
  const isPremium = plan === 'premium';
  return <View style={styles.wrap}>
    <Pressable onPress={onBack} accessibilityRole="button"><Text style={styles.back}>‹ 世界地図へ もどる</Text></Pressable>
    <View style={styles.head}>
      <Text style={styles.eyebrow}>数のトビラ・まなびの本</Text>
      <Text accessibilityRole="header" style={styles.title}>📚 まなびの広場</Text>
      <Text style={styles.sub}>教科書に沿った単元別学習は、いつでも無料です。</Text>
    </View>
    <PlanSwitcher plan={plan} onChange={onPlan} testEnabled={showSwitch}/>
    <View style={styles.card}>
      <Text style={styles.heading}>単元別学習（無料）</Text>
      {worldGrades.map(grade=><View key={grade.id} style={styles.grade}>
        <Text style={styles.gradeTitle}>{grade.title} — {grade.island}</Text>
        <Text style={styles.caption}>{guidesForGrade(grade).length}単元の学習ガイド</Text>
        <View style={styles.unitGrid}>{guidesForGrade(grade).map(guide=>{
          const stage = grade.stages.find(s=>s.kind==='normal' && guide.linkedStageIds.includes(s.id));
          if(!stage)return null;
          return <Pressable key={guide.id} style={styles.unit} accessibilityRole="button" onPress={()=>onStage(stage)}>
            <Text style={styles.unitText}>{guide.title}</Text><Text style={styles.caption}>{progress.lessons?.[guide.id]?'✓ 学習ずみ':'説明・例題・理解確認'}</Text>
          </Pressable>;
        })}</View>
      </View>)}
    </View>
    <View style={styles.premium}>
      <Text style={styles.premiumTitle}>✦ プレミアム学習</Text>
      <Text style={styles.premiumSub}>{isPremium?'あなたの学習履歴をもとに、学習内容を調整します。':'有料機能はテスト用の「有料ユーザー」に切り替えると利用できます。'}</Text>
      {PREMIUM_FEATURES.map(x=><Text key={x} style={styles.feature}>✓ {x}</Text>)}
      {isPremium && <View style={styles.actions}>
        <Button text="⏱ 毎日15分の個別学習" onPress={()=>onPractice('daily')}/>
        <Button text="🔎 苦手克服問題にチャレンジ" onPress={()=>onPractice('weak')}/>
        <Button text={'🔁 定期復習（対象 '+growth.reviewDue+'）'} onPress={()=>onPractice('review')}/>
      </View>}
    </View>
    {isPremium && <View style={styles.card}>
      <Text style={styles.heading}>📈 成長レポート（直近14日）</Text>
      <View style={styles.stats}>
        <Statistic label="正答率" value={growth.accuracy+'%'} />
        <Statistic label="前の14日" value={growth.previousAccuracy+'%'} />
        <Statistic label="解いた問題" value={String(growth.attempted)} />
        <Statistic label="学習した日" value={growth.activeDays+'日'} />
        <Statistic label="ステージ攻略" value={String(growth.stagesCleared)} />
        <Statistic label="学習完了" value={String(growth.lessonsCompleted)} />
      </View>
      <Text style={styles.heading}>🔍 苦手分析と原因の手がかり</Text>
      {insight.length===0 ? <Text style={styles.caption}>まだ解答履歴がありません。ステージを解くと分析が始まります。</Text>
        : insight.slice(0,12).map(x=><View key={x.skillId} style={styles.skill}>
          <Text style={styles.skillTitle}>{x.title}　{Math.round(x.accuracy*100)}%（{x.correct}/{x.total}問）</Text>
          <Text style={styles.explain}>{x.cause}</Text>
          <Text style={styles.caption}>{x.reviewDue?'復習の時期です':'次回の復習時期を計算中'}</Text>
        </View>)}
      <Text style={styles.disclaimer}>分析は解答履歴に基づく推定です。誤答の原因を確定するものではありません。</Text>
    </View>}
  </View>;
}
function Button({text,onPress}:{text:string;onPress:()=>void}) {
  return <Pressable accessibilityRole="button" style={styles.button} onPress={onPress}><Text style={styles.buttonText}>{text}</Text></Pressable>;
}
function Statistic({label,value}:{label:string;value:string}) {return <View style={styles.stat}><Text style={styles.caption}>{label}</Text><Text style={styles.statValue}>{value}</Text></View>;}
const styles = StyleSheet.create({
 wrap:{gap:14},back:{color:'#385d83',fontWeight:'800',fontSize:15,padding:9},
 head:{backgroundColor:'#26345c',padding:21,borderRadius:20,gap:8},
 eyebrow:{color:'#eed49d',fontSize:13,fontWeight:'900'},title:{fontSize:27,color:'#fff5dc',fontWeight:'900'},sub:{color:'#d3e6fa',fontSize:14,lineHeight:22},
 switchbox:{backgroundColor:'#e7edf6',padding:12,borderRadius:13,gap:8},testLabel:{fontSize:12,color:'#53617b',fontWeight:'800'},
 switches:{flexDirection:'row',gap:8,flexWrap:'wrap'},switch:{padding:11,borderWidth:2,borderColor:'#9ca9c2',borderRadius:10,backgroundColor:'#fff'},
 switchOn:{borderColor:'#5d55a2',backgroundColor:'#51478b'},switchText:{fontSize:14,fontWeight:'800',color:'#324362'},
 switchTextOn:{color:'#fff'},card:{borderRadius:18,backgroundColor:'#fffaf0',padding:17,gap:12},
 heading:{fontSize:21,fontWeight:'900',color:'#2b3d64'},grade:{gap:5,borderTopWidth:1,borderColor:'#e3deca',paddingTop:12},
 gradeTitle:{fontWeight:'900',color:'#33456d',fontSize:17},caption:{fontSize:12,lineHeight:18,color:'#6c7891'},
 unitGrid:{flexDirection:'row',flexWrap:'wrap',gap:7},unit:{backgroundColor:'#eaf2f0',padding:10,borderRadius:11,minWidth:130,flexGrow:1,flexBasis:'30%'},
 unitText:{fontSize:14,fontWeight:'800',color:'#315e6c'},premium:{backgroundColor:'#eae5f6',padding:18,borderRadius:18,gap:8},
 premiumTitle:{fontSize:24,fontWeight:'900',color:'#423575'},premiumSub:{fontSize:14,lineHeight:22,color:'#594c78'},
 feature:{fontSize:14,color:'#413964',lineHeight:23},actions:{gap:9,marginTop:9},
 button:{backgroundColor:'#544696',borderRadius:12,padding:13,minHeight:48,alignItems:'center',justifyContent:'center'},
 buttonText:{color:'white',fontSize:15,fontWeight:'900'},stats:{flexDirection:'row',flexWrap:'wrap',gap:9},
 stat:{backgroundColor:'#f0edf8',padding:13,borderRadius:11,minWidth:105,flexGrow:1},statValue:{fontSize:23,color:'#455081',fontWeight:'900'},
 skill:{backgroundColor:'#f1f4f9',padding:12,borderRadius:10,gap:3},skillTitle:{fontWeight:'900',fontSize:15,color:'#32456b'},
 explain:{color:'#47546d',fontSize:13,lineHeight:20},disclaimer:{fontSize:12,color:'#7b8193',lineHeight:18}
});
