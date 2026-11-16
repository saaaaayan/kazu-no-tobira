import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bankStageIds, type BankQuestion } from '../domain/questionBank';
import { worldIslands } from '../domain/worldCatalog';
import { loadStageBank } from '../stageBankLoader';
import { QuestionDiagram } from './QuestionSupport';
import { MathText } from './MathText';
import {
  REVIEW_STORAGE_KEY, makeReviewRecord, parseReviewRecords, rejectReasons,
  reviewStatus, reviewStatusLabels, type ReviewReason, type ReviewRecords, type ReviewStatus,
} from '../domain/reviewAdmin';

type Item = { question: BankQuestion; stageId: string; stageTitle: string; gradeId: string; gradeTitle: string };
const allStages = new Map(worldIslands.flatMap(island => island.stages.map(stage =>
  [stage.id, { title: stage.title, gradeId: island.id, gradeTitle: island.title }] as const)));
const filters = ['all', 'unreviewed', 'needs_work', 'verified', 'ready', 'rejected'] as const;
const pageSize = 20;

function exportOnWeb(name: string, data: string, mime: string): boolean {
  if (typeof document === 'undefined') return false;
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}

function csvText(value: unknown): string {
  return '"' + String(value ?? '').replaceAll('"', '""') + '"';
}

function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: Boolean(selected) }}
      onPress={onPress} style={[styles.chip, selected && styles.selectedChip]}>
      <Text style={[styles.chipText, selected && styles.selectedChipText]}>{label}</Text>
    </Pressable>
  );
}

export default function QuestionReviewAdmin({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<readonly Item[]>([]);
  const [loaded, setLoaded] = useState(0);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [records, setRecords] = useState<ReviewRecords>({});
  const recordsRef = useRef<ReviewRecords>({});
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const [storageReady, setStorageReady] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [grade, setGrade] = useState('all');
  const [status, setStatus] = useState<'all' | ReviewStatus>('all');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string>();
  const [note, setNote] = useState('');
  const [rejectReason, setRejectReason] = useState<ReviewReason>('問題不成立');

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(REVIEW_STORAGE_KEY)
      .then(value => {
        if (!active) return;
        const parsed = parseReviewRecords(value);
        recordsRef.current = parsed;
        setRecords(parsed);
        setStorageReady(true);
      })
      .catch(() => { if (active) setError('審査記録の読み込みに失敗しました。編集は無効です。'); });

    void (async () => {
      const accumulated: Item[] = [];
      const bad: string[] = [];
      for (let i = 0; i < bankStageIds.length; i++) {
        const stageId = bankStageIds[i];
        try {
          const bank = await loadStageBank(stageId);
          const stage = allStages.get(stageId);
          for (const question of bank.questions) {
            accumulated.push({
              question, stageId,
              stageTitle: stage?.title ?? stageId,
              gradeId: stage?.gradeId ?? bank.gradeId,
              gradeTitle: stage?.gradeTitle ?? bank.gradeId,
            });
          }
        } catch {
          bad.push(stageId);
        }
        if (!active) return;
        if ((i + 1) % 4 === 0 || i === bankStageIds.length - 1) {
          setItems([...accumulated]);
          setLoaded(i + 1);
          setLoadErrors([...bad]);
        }
      }
    })();
    return () => { active = false; };
  }, []);

  function changeFilter(next: 'all' | ReviewStatus) { setStatus(next); setPage(0); }
  function changeGrade(next: string) { setGrade(next); setPage(0); }
  function open(item: Item) {
    setSelectedId(item.question.id);
    setNote(recordsRef.current[item.question.id]?.note ?? '');
    setRejectReason(recordsRef.current[item.question.id]?.reason ?? '問題不成立');
  }

  function updateReview(id: string, nextStatus: ReviewStatus, reason?: ReviewReason, newNote?: string) {
    if (!storageReady) return;
    const next = {
      ...recordsRef.current,
      [id]: makeReviewRecord(nextStatus, recordsRef.current[id], reason, newNote),
    };
    recordsRef.current = next;
    setRecords(next);
    setError('');
    saveQueue.current = saveQueue.current.catch(() => undefined).then(() =>
      AsyncStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(next))
    ).catch(() => setError('審査記録の保存に失敗しました。エクスポートしてから再確認してください。'));
  }

  const matched = useMemo(() => {
    const normalized = query.normalize('NFKC').trim().toLowerCase();
    const stageText = stageFilter.trim().toLowerCase();
    return items.filter(({ question, stageId, stageTitle, gradeId, gradeTitle }) => {
      if (grade !== 'all' && grade !== gradeId) return false;
      if (status !== 'all' && reviewStatus(records[question.id]) !== status) return false;
      if (stageText && !(stageId + ' ' + stageTitle).toLowerCase().includes(stageText)) return false;
      if (!normalized) return true;
      const target = [
        question.id, question.question, question.answer, question.explanation,
        question.format, question.topic, stageId, stageTitle, gradeTitle,
      ].filter(Boolean).join(' ').normalize('NFKC').toLowerCase();
      return target.includes(normalized);
    });
  }, [items, query, stageFilter, grade, status, records]);
  const selected = items.find(item => item.question.id === selectedId);
  const totalPages = Math.max(1, Math.ceil(matched.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const shown = matched.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const counts = useMemo(() => {
    const result: Record<string, number> = { all: items.length };
    for (const item of items) {
      const key = reviewStatus(records[item.question.id]);
      result[key] = (result[key] ?? 0) + 1;
    }
    return result;
  }, [items, records]);

  function downloadReviews() {
    const exported = {
      schema: 'kazu-question-review-v1',
      exportedAt: new Date().toISOString(),
      reviewedQuestions: Object.keys(records).length,
      reviews: records,
    };
    if (!exportOnWeb('kazu-question-reviews.json', JSON.stringify(exported, null, 2), 'application/json;charset=utf-8')) {
      setError('JSON書き出しはWebブラウザーから行ってください。');
    }
  }

  function downloadIndex() {
    const rows = [['学年','ステージID','ステージ名','問題ID','出題形式','難易度','問題文','解答','基本解説','図解','審査状態','ボツ理由','メモ']];
    for (const item of items) {
      const q = item.question;
      const record = records[q.id];
      rows.push([
        item.gradeTitle,item.stageId,item.stageTitle,q.id,q.format,
        String(q.difficulty),q.question,q.answer,q.explanation,
        q.diagram ? 'あり' : 'なし',reviewStatusLabels[reviewStatus(record)],record?.reason ?? '',record?.note ?? '',
      ]);
    }
    const data = '\uFEFF' + rows.map(row => row.map(csvText).join(',')).join('\r\n');
    if (!exportOnWeb('kazu-questions-review.csv', data, 'text/csv;charset=utf-8')) {
      setError('CSV書き出しはWebブラウザーから行ってください。');
    }
  }

  return (
    <View style={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
        <Text style={styles.backText}>‹ 冒険トップに戻る</Text>
      </Pressable>
      <Text accessibilityRole="header" style={styles.heading}>問題管理・品質審査</Text>
      <Text style={styles.body}>開発用の審査画面です。専用問題バンクに登録された全問題を検索し、問題・解答・解説・図を確認できます。</Text>
      <View style={styles.notice}>
        <Text style={styles.noticeText}>ボツ・修正待ちなどの判定はこの端末に保存されます。公開版の出題除外には、審査データの取込と配信データ更新が別途必要です。認証済みの本番管理画面ではありません。</Text>
      </View>
      <View style={styles.summary}>
        <Text style={styles.metric}>登録問題　{items.length}問</Text>
        <Text style={styles.metric}>読込済ステージ　{loaded}/{bankStageIds.length}</Text>
        <Text style={styles.metric}>確認済み　{(counts.verified ?? 0) + (counts.ready ?? 0)}問</Text>
        <Text style={styles.metric}>ボツ　{counts.rejected ?? 0}問</Text>
      </View>
      {loaded < bankStageIds.length && <Text style={styles.body}>登録済み問題を読み込み中… {loaded}/{bankStageIds.length}</Text>}
      {loadErrors.length > 0 && <Text style={styles.error}>読み込み失敗：{loadErrors.join(', ')}</Text>}
      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.filters}>
        <Text style={styles.label}>問題文・答え・ID・単元を検索</Text>
        <TextInput accessibilityLabel="問題を検索" value={query} onChangeText={v => { setQuery(v); setPage(0); }}
          placeholder="例：分数、角度、e1.n04" style={styles.input}/>
        <Text style={styles.label}>ステージ名・IDで絞り込み</Text>
        <TextInput accessibilityLabel="ステージを検索" value={stageFilter}
          onChangeText={v => { setStageFilter(v); setPage(0); }}
          placeholder="例：ひみつ、sage.n01" style={styles.input}/>
        <Text style={styles.label}>学年・島</Text>
        <ScrollView horizontal contentContainerStyle={styles.chipRow}>
          <Chip label="すべて" selected={grade === 'all'} onPress={() => changeGrade('all')}/>
          {worldIslands.map(island =>
            <Chip key={island.id} label={island.title} selected={grade === island.id} onPress={() => changeGrade(island.id)}/>
          )}
        </ScrollView>
        <Text style={styles.label}>制作・審査状況</Text>
        <View style={styles.chipRow}>
          {filters.map(key => <Chip key={key}
            label={(key === 'all' ? 'すべて' : reviewStatusLabels[key]) + ' ' + (counts[key] ?? 0)}
            selected={status === key} onPress={() => changeFilter(key)}/>)}
        </View>
      </View>
      <View style={styles.tools}>
        <Text style={styles.body}>検索結果 {matched.length}問・{safePage+1}/{totalPages}ページ</Text>
        <View style={styles.actions}>
          <Chip label="審査結果JSONを書き出す" onPress={downloadReviews}/>
          <Chip label="全問題CSVを書き出す" onPress={downloadIndex}/>
        </View>
      </View>
      {selected && (
        <View style={styles.detail}>
          <View style={styles.detailHeader}>
            <Text accessibilityRole="header" style={styles.detailTitle}>問題の詳細と審査</Text>
            <Chip label="閉じる" onPress={() => setSelectedId(undefined)}/>
          </View>
          <Text style={styles.meta}>{selected.gradeTitle} ／ {selected.stageTitle}</Text>
          <Text selectable style={styles.meta}>ID：{selected.question.id}</Text>
          <Text style={styles.meta}>形式：{selected.question.format}　難易度：{selected.question.difficulty}</Text>
          <MathText style={styles.questionText} value={selected.question.question}/>
          {selected.question.diagram && <QuestionDiagram diagram={selected.question.diagram} phase="question"/>}
          <Text style={styles.label}>正答</Text>
          <MathText style={styles.answer} value={selected.question.answer}/>
          <Text style={styles.label}>基本解説</Text>
          <MathText style={styles.body} value={selected.question.explanation}/>
          <Text style={styles.label}>ヒント</Text>
          {selected.question.hints.map((hint,i) => <MathText key={i} prefix={String(i+1) + '：'} style={styles.body} value={hint}/>)}
          <Text style={styles.label}>詳しい解説</Text>
          {selected.question.steps.map((step,i) => (
            <View key={i} style={styles.solutionStep}>
              <Text style={styles.label}>{String(i+1)}. {step.title}</Text>
              <MathText style={styles.body} value={step.body}/>
            </View>
          ))}
          <Text style={styles.label}>ボツ理由</Text>
          <View style={styles.chipRow}>
            {rejectReasons.map(reason => <Chip key={reason} label={reason}
              selected={rejectReason === reason} onPress={() => setRejectReason(reason)}/>)}
          </View>
          <Text style={styles.label}>審査メモ・修正指示</Text>
          <TextInput multiline accessibilityLabel="審査メモ" value={note} onChangeText={setNote}
            placeholder="成立していない条件、改善案、図の不備など" style={[styles.input, styles.note]}/>
          <View style={styles.actions}>
            <Chip label="要修正" onPress={() => updateReview(selected.question.id, 'needs_work', undefined, note)}/>
            <Chip label="確認済み" onPress={() => updateReview(selected.question.id, 'verified', undefined, note)}/>
            <Chip label="公開準備完了" onPress={() => updateReview(selected.question.id, 'ready', undefined, note)}/>
            <Chip label="ボツにする" onPress={() => updateReview(selected.question.id, 'rejected', rejectReason, note)}/>
            <Chip label="未確認へ戻す" onPress={() => updateReview(selected.question.id, 'unreviewed', undefined, note)}/>
          </View>
          <Text style={styles.meta}>現在の判定：{reviewStatusLabels[reviewStatus(records[selected.question.id])]}</Text>
        </View>
      )}
      <View style={styles.list}>
        {shown.map(item => {
          const state = reviewStatus(records[item.question.id]);
          return <Pressable key={item.question.id} accessibilityRole="button" onPress={() => open(item)}
            style={[styles.item, selectedId === item.question.id && styles.itemSelected]}>
            <View style={styles.row}>
              <Text style={styles.itemTitle}>{item.gradeTitle} / {item.stageTitle}</Text>
              <Text style={[styles.state, state === 'rejected' && styles.rejected]}>{reviewStatusLabels[state]}</Text>
            </View>
            <MathText style={styles.itemQuestion} value={item.question.question}/>
            <Text numberOfLines={1} style={styles.itemAnswer}>正答：{item.question.answer}　|　形式：{item.question.format}　|　{item.question.diagram ? '図あり' : '図なし'}</Text>
          </Pressable>;
        })}
        {shown.length === 0 && <Text style={styles.body}>条件に合う登録済み問題はありません。</Text>}
      </View>
      <View style={styles.pageRow}>
        <Chip label="‹ 前へ" onPress={() => setPage(Math.max(0, safePage-1))}/>
        <Text style={styles.body}>{safePage+1} / {totalPages}</Text>
        <Chip label="次へ ›" onPress={() => setPage(Math.min(totalPages-1, safePage+1))}/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 13, borderRadius: 20, padding: 15, backgroundColor: '#f7f9ff' },
  back: { minHeight: 42, justifyContent: 'center' },
  backText: { color: '#385d81', fontSize: 15, fontWeight: '800' },
  heading: { color: '#182c4d', fontWeight: '900', fontSize: 27 },
  body: { color: '#43516a', fontSize: 14, lineHeight: 23 },
  notice: { borderRadius: 12, padding: 12, backgroundColor: '#fff0cc' },
  noticeText: { fontSize: 13, lineHeight: 21, color: '#624b21' },
  summary: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metric: { backgroundColor: '#e8edfc', color: '#253a62', padding: 10, borderRadius: 10, fontWeight: '800' },
  error: { color: '#a61f38', fontWeight: '800', lineHeight: 23 },
  filters: { gap: 8, padding: 13, backgroundColor: '#e9edfb', borderRadius: 13 },
  label: { color: '#263b5e', fontWeight: '900', fontSize: 14, marginTop: 3 },
  input: { minHeight: 44, borderRadius: 9, padding: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#b4bdd8', fontSize: 15, color: '#243758' },
  note: { minHeight: 78, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  chip: { borderWidth: 1, borderColor: '#c3cde1', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 9, minHeight: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  selectedChip: { backgroundColor: '#403d8a', borderColor: '#403d8a' },
  chipText: { color: '#354967', fontSize: 12, fontWeight: '800' },
  selectedChipText: { color: '#fff' },
  tools: { gap: 8 },
  actions: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  detail: { gap: 10, borderWidth: 2, borderColor: '#6b79bb', backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailTitle: { fontSize: 20, fontWeight: '900', color: '#29395a' },
  meta: { fontSize: 12, color: '#5c6782', lineHeight: 20 },
  questionText: { fontSize: 23, fontWeight: '800', lineHeight: 33, color: '#253458' },
  answer: { color: '#0d775c', fontSize: 19, fontWeight: '900' },
  solutionStep: { gap: 4, paddingVertical: 5, borderTopWidth: 1, borderTopColor: '#dce2ef' },
  list: { gap: 8 },
  item: { gap: 7, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#dde2ee', padding: 13 },
  itemSelected: { borderColor: '#5368bd', borderWidth: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 7 },
  itemTitle: { flex: 1, fontWeight: '900', color: '#35496b', fontSize: 13 },
  itemQuestion: { fontSize: 16, color: '#243753', lineHeight: 25, fontWeight: '700' },
  itemAnswer: { color: '#697490', fontSize: 12 },
  state: { fontSize: 12, color: '#27574c', fontWeight: '900' },
  rejected: { color: '#ac3148' },
  pageRow: { flexDirection: 'row', justifyContent: 'center', gap: 18, alignItems: 'center' },
});
