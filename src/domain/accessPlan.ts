import type { WorldStage } from './worldCatalog.ts';

export type PlannedAccess = 'free' | 'premium';
export const featureAccess = {
  unitLessons: 'free',
  workedSolutions: 'premium',
  weakPointAnalysis: 'premium',
  remediation: 'premium',
  personalizedPractice: 'premium',
  spacedReview: 'premium',
  progressReports: 'premium',
} as const satisfies Record<string, PlannedAccess>;

// Describes future entitlements; it does not enforce billing or hide existing features.
export function stageAccessPlan(stage: Pick<WorldStage, 'gradeId' | 'kind'>): PlannedAccess {
  return stage.kind === 'normal' && stage.gradeId !== 'sage' ? 'free' : 'premium';
}
