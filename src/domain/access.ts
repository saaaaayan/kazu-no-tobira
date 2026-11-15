import type { WorldStage } from './worldCatalog.ts';

export type UserPlan = 'free' | 'premium';

/** Test-only entitlement model. Production billing MUST verify a server-side receipt. */
export function hasPremium(plan: UserPlan): boolean { return plan === 'premium'; }

export function canAccessStage(plan: UserPlan, stage: WorldStage): boolean {
  return hasPremium(plan) || (stage.gradeId !== 'sage' && stage.kind === 'normal');
}

export function stageAccessLabel(stage: WorldStage): string {
  return stage.gradeId === 'sage' ? '賢者の島はプレミアム限定'
    : stage.kind === 'extra' ? 'エクストラはプレミアム限定'
    : stage.kind === 'secret' ? '隠しステージはプレミアム限定' : '無料でプレイできます';
}

export const PREMIUM_FEATURES = [
  'エクストラ・隠しステージと賢者の島',
  '途中式・図解・誤答原因を含む詳しい解説',
  '苦手分野の分析と原因の推定',
  '苦手克服に合わせた問題の作成',
  '毎日15分の個別学習',
  '学習履歴に応じた定期復習',
  '保護者向け成長レポート',
] as const;
