import { worldGrades } from './worldCatalog.ts';

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

const sageIds = Array.from({ length: 65 }, (_, index) => {
  const [prefix, offset] = index < 50 ? ['n', 0] : index < 60 ? ['x', 50] : ['s', 60];
  return 'sage.' + prefix + String(index + 1 - Number(offset)).padStart(2, '0');
});

export const assessmentIslands = [
  ...worldGrades.map(grade => ({
    id: grade.id, name: grade.island, stages: assessmentStages(grade.stages.map(stage => stage.id)),
  })),
  { id: 'sage', name: '賢者の島', stages: assessmentStages(sageIds), topics: sageTopics },
] as const;
