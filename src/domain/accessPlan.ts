import { isPlannedIsland, type WorldStage } from './worldCatalog.ts';

export type PlannedAccess = 'free' | 'premium';
export type Entitlement = { plan: 'free' } | { plan: 'premium'; verifiedUntil: number };
export const freeAccess: Entitlement = { plan: 'free' };
export const featureAccess = {
  unitLessons: 'free',
  workedSolutions: 'premium',
  weakPointAnalysis: 'premium',
  remediation: 'premium',
  personalizedPractice: 'premium',
  spacedReview: 'premium',
  progressReports: 'premium',
} as const satisfies Record<string, PlannedAccess>;

export function stageAccessPlan(stage: Pick<WorldStage, 'gradeId' | 'kind'>): PlannedAccess | 'pending' {
  if (isPlannedIsland(stage.gradeId)) return 'pending';
  return stage.kind === 'normal' && stage.gradeId !== 'sage' ? 'free' : 'premium';
}

export function hasPremium(access: Entitlement, now = Date.now()): boolean {
  return access.plan === 'premium' && access.verifiedUntil > now;
}

export function canAccessFeature(access: Entitlement, feature: keyof typeof featureAccess): boolean {
  return featureAccess[feature] === 'free' || hasPremium(access);
}

export function canAccessStage(access: Entitlement, stage: Pick<WorldStage, 'gradeId' | 'kind'>): boolean {
  const plan = stageAccessPlan(stage);
  return plan === 'free' || (plan === 'premium' && hasPremium(access));
}
