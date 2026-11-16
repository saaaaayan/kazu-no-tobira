import assert from 'node:assert/strict';
import test from 'node:test';
import {
  makeReviewRecord, parseReviewRecords, rejectReasons, reviewStatus, reviewStatusLabels,
} from '../src/domain/reviewAdmin.ts';

test('新しい問題は未確認。ボツの理由とコメントが永続化できる', () => {
  assert.equal(reviewStatus(undefined), 'unreviewed');
  const rejected = makeReviewRecord('rejected', undefined, '問題不成立', '条件不足で一意解にならない', '2026-11-16T10:00:00.000Z');
  const parsed = parseReviewRecords(JSON.stringify({ 'e5.s01:example': rejected }));
  assert.deepEqual(parsed['e5.s01:example'], rejected);
  assert.equal(reviewStatus(parsed['e5.s01:example']), 'rejected');
  assert.equal(rejectReasons.includes('重複'), true);
  assert.equal(reviewStatusLabels.ready, '公開準備完了');
});

test('再審査してもメモは失われず、古いボツ理由は持ち越さない', () => {
  const old = makeReviewRecord('rejected', undefined, '図が不足', '要作図', '2026-11-16T10:00:00.000Z');
  const next = makeReviewRecord('needs_work', old, undefined, undefined, '2026-11-16T10:01:00.000Z');
  assert.equal(next.note, '要作図');
  assert.equal(next.reason, undefined);
  assert.equal(next.status, 'needs_work');
});

test('不正な状態と壊れた審査レコードを復元しない', () => {
  assert.deepEqual(parseReviewRecords(null), {});
  assert.deepEqual(parseReviewRecords('{}'), {});
  assert.deepEqual(parseReviewRecords(JSON.stringify({
    good: { status: 'verified', updatedAt: '2026-11-16T10:00:00Z' },
    invalid: { status: 'premium', updatedAt: '2026-11-16T10:00:00Z' },
    noDate: { status: 'ready' },
  })), { good: { status: 'verified', updatedAt: '2026-11-16T10:00:00Z' } });
  assert.throws(() => parseReviewRecords('[]'));
});
