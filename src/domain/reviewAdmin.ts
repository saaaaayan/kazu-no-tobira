export const REVIEW_STORAGE_KEY = 'kazu-no-tobira:admin-review:v1';

export const reviewStatusLabels = {
  unreviewed: '未確認',
  needs_work: '要修正',
  verified: '確認済み',
  ready: '公開準備完了',
  rejected: 'ボツ',
} as const;

export type ReviewStatus = keyof typeof reviewStatusLabels;
export type ReviewReason = '問題不成立' | 'わかりにくい' | '正解に誤り' | '解説に誤り' | '図が不足' | '重複' | 'その他';

export type ReviewRecord = {
  status: ReviewStatus;
  updatedAt: string;
  reason?: ReviewReason;
  note?: string;
};
export type ReviewRecords = Record<string, ReviewRecord>;

const statuses = new Set(Object.keys(reviewStatusLabels));
export const rejectReasons: readonly ReviewReason[] = [
  '問題不成立', 'わかりにくい', '正解に誤り', '解説に誤り', '図が不足', '重複', 'その他',
];

export function parseReviewRecords(raw: string | null): ReviewRecords {
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid review storage');
  const result: ReviewRecords = {};
  for (const [id, value] of Object.entries(parsed)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const item = value as Record<string, unknown>;
    if (typeof item.status !== 'string' || !statuses.has(item.status) || typeof item.updatedAt !== 'string') continue;
    if (typeof item.note === 'string' && item.note.length > 10000) continue;
    result[id] = {
      status: item.status as ReviewStatus,
      updatedAt: item.updatedAt,
      ...(rejectReasons.includes(item.reason as ReviewReason) ? { reason: item.reason as ReviewReason } : {}),
      ...(typeof item.note === 'string' ? { note: item.note } : {}),
    };
  }
  return result;
}

export function makeReviewRecord(
  status: ReviewStatus,
  previous: ReviewRecord | undefined,
  reason?: ReviewReason,
  note?: string,
  now = new Date().toISOString(),
): ReviewRecord {
  return {
    status, updatedAt: now,
    ...(status === 'rejected' && reason ? { reason } : {}),
    ...(note !== undefined ? { note } : previous?.note !== undefined ? { note: previous.note } : {}),
  };
}

export function reviewStatus(record: ReviewRecord | undefined): ReviewStatus {
  return record?.status ?? 'unreviewed';
}
