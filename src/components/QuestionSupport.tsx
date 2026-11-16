import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { type BankDiagram, type BankQuestion, mistakenReason } from '../domain/questionBank';
import type { SolutionStep } from '../domain/writtenSolution';
import { MathDisplay, MathText } from './MathText';

const tokenArt = {
  dot: ['●','まる'], triangle: ['▲','さんかく'], square: ['■','しかく'],
  marked: ['✓','しるしのついた まる'], empty: ['◯','からの おさら'],
} as const;

function CountingBoard({ diagram, interactive }: {
  diagram: Extract<BankDiagram,{ kind:'countingBoard' }>; interactive: boolean;
}) {
  const [taps,setTaps] = useState<{ forDiagram:BankDiagram; ids:Set<string> }>();
  const selected = taps?.forDiagram===diagram ? taps.ids : new Set<string>();
  const toggle = (id: string) => setTaps(previous => {
    const ids = new Set(previous?.forDiagram===diagram ? previous.ids : []);
    if (ids.has(id)) ids.delete(id); else ids.add(id);
    return { forDiagram:diagram, ids };
  });
  return <View style={{ padding:10, backgroundColor:'#edf4ff', borderRadius:12, gap:8 }}>
    {diagram.rows.map(({label,tokens},row) => <View key={row} style={{ gap:5 }}>
      {label && <Text style={{ color:'#293f61', fontSize:18, fontWeight:'700' }}>{label}</Text>}
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
        {tokens.map((token,column) => {
          const id = row+':'+column;
          const lit = selected.has(id);
          const shape = tokenArt[token];
          const card = { width:48, height:48, alignItems:'center', justifyContent:'center',
            borderRadius:10, borderWidth:2, borderColor:lit ? '#3f765b' : '#ccd8ef',
            backgroundColor:lit ? '#cce8db' : '#fff' } as const;
          const icon = <Text style={{ fontSize:30, color:token==='marked' ? '#3f765b' : '#253e70' }}>{shape[0]}</Text>;
          return interactive && token!=='empty' ? <Pressable key={id} style={card} onPress={() => toggle(id)}
            accessibilityRole="button" accessibilityLabel={shape[1]} accessibilityState={{ selected:lit }}>{icon}</Pressable>
            : <View key={id} accessible accessibilityLabel={shape[1]} style={card}>{icon}</View>;
        })}
      </View>
    </View>)}
  </View>;
}

export function QuestionDiagram({ diagram, phase }: { diagram: BankDiagram; phase: 'question' | 'hint' | 'solution' }) {
  if (diagram.kind === 'countingBoard') return <CountingBoard diagram={diagram} interactive={phase==='question'}/>;
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
      {question.diagram && <QuestionDiagram diagram={question.diagram} phase="solution" />}
      <WrittenSolution steps={question.steps} />
    </View>
  );
}

const styles = StyleSheet.create({
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
