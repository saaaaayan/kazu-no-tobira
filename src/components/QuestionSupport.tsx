import { StyleSheet, Text, View } from 'react-native';
import { type BankDiagram, type BankQuestion, mistakenReason } from '../domain/questionBank';
import { MathText } from './MathText';

export function QuestionDiagram({ diagram, phase }: { diagram: BankDiagram; phase: 'question' | 'hint' | 'solution' }) {
  if (diagram.kind === 'tenFrame') return <TenFrame first={diagram.first} second={diagram.second ?? 0} third={diagram.third}/>;

  const solved = phase === 'solution';
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

export function WorkedSolution({ question, wrongAnswer }: { question: BankQuestion; wrongAnswer?: string }) {
  const reason = wrongAnswer === undefined ? undefined : mistakenReason(question, wrongAnswer);
  return (
    <View style={styles.details}>
      {reason && <MathText value={reason} style={styles.reason} />}
      {question.diagram && <QuestionDiagram diagram={question.diagram} phase="solution" />}
      {question.steps.map((step, index) => (
        <View key={step.title} style={styles.step}>
          <Text accessibilityRole="header" style={styles.title}>{index + 1}．{step.title}</Text>
          <MathText value={step.body} style={styles.body} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  transfer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  group: { minWidth: 108, padding: 6, gap: 5, backgroundColor: '#eef3ff', borderRadius: 8 },
  groupLabel: { color: '#243458', fontWeight: '700', fontSize: 13 },
  looseBalls: { flexDirection: 'row', gap: 3, flexWrap: 'wrap', maxWidth: 98 },
  frames: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  frame: { backgroundColor: '#fff', gap: 3, borderWidth: 1, borderColor: '#b7c2df', borderRadius: 8, padding: 5 },
  frameRow: { flexDirection: 'row', gap: 3 },
  cell: { width: 17, height: 17, borderWidth: 1, borderColor: '#8e9abc', borderRadius: 9 },
  blue: { backgroundColor: '#244b97', borderColor: '#244b97' },
  red: { backgroundColor: '#c54a40', borderColor: '#78261e' },
  gold: { backgroundColor: '#efb857', borderColor: '#885517' },
  details: { gap: 12, paddingTop: 8 },
  step: { gap: 4, borderTopWidth: 1, borderColor: '#c5cbd8', paddingTop: 8 },
  title: { color: '#243458', fontSize: 16, fontWeight: '800' },
  body: { color: '#263659', fontSize: 17, lineHeight: 25 },
  reason: { color: '#823b36', fontSize: 17, lineHeight: 25, fontWeight: '700' },
});
