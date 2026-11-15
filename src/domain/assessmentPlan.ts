import { worldIslands } from './worldCatalog.ts';

export type Assessment = {
  kind: 'checkpoint' | 'final';
  sourceStageIds: readonly string[];
};

const sageTopics = [
  'algebra', 'numberTheory', 'probability', 'sequences', 'proof',
  'functions', 'calculus', 'geometry', 'vectors', 'complexLoci',
] as const;

function assessmentStages(ids: readonly string[]) {
  return ids.map((id, index) => {
    const number = index + 1;
    let assessment: Assessment | undefined;
    if (number === 50) {
      assessment = { kind: 'final', sourceStageIds: ids.slice(0, 50).filter((_, i) => (i + 1) % 5 !== 0) };
    } else if (number < 50 && number % 5 === 0) {
      assessment = { kind: 'checkpoint', sourceStageIds: ids.slice(index - 4, index) };
    }
    const track = number <= 50 ? 'normal' : number <= 60 ? 'extra' : 'secret';
    return { id, number, track, assessment, bankSize: 100, roundSize: 10 } as const;
  });
}

export const assessmentIslands = worldIslands.map(grade => ({
  id: grade.id,
  name: grade.island,
  stages: assessmentStages(grade.stages.map(stage => stage.id)),
  ...(grade.id === 'sage' ? { topics: sageTopics } : {}),
}));
