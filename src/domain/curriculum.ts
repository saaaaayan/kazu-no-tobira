export const gradeIds = [
  'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'j1', 'j2', 'j3', 'h1', 'h2', 'h3',
] as const;

export type GradeId = typeof gradeIds[number];
export const plannedIslandIds = ['preschool', 'champion', 'cosmos'] as const;
export type IslandId = GradeId | 'sage' | typeof plannedIslandIds[number];
export type StageId = `${IslandId}.${string}`;
export type SkillId = `${IslandId}.${string}`;

export interface Skill {
  id: SkillId;
  title: string;
}

export interface Stage {
  id: StageId;
  title: string;
  skillId: SkillId;
}

export interface Grade {
  id: GradeId;
  title: string;
  skills: readonly Skill[];
  stages: readonly Stage[];
}

export const additionSkills = [
  { id: 'e1.add.within-9', title: '9までの たしざん' },
  { id: 'e1.add.make-10', title: '10を つくる たしざん' },
  { id: 'e1.add.cross-10', title: '10を こえる たしざん' },
] as const satisfies readonly Skill[];

export type AdditionSkillId = typeof additionSkills[number]['id'];

export const firstGradeStages = [
  { id: 'e1.forest', title: 'はじまりの森', skillId: additionSkills[0].id },
  { id: 'e1.bridge', title: '月あかりの橋', skillId: additionSkills[1].id },
  { id: 'e1.tower', title: '星の塔', skillId: additionSkills[2].id },
] as const satisfies readonly Stage[];

export type AdditionStage = typeof firstGradeStages[number];

export const curriculum: readonly Grade[] = gradeIds.map(id => {
  const school = { e: '小学', j: '中学', h: '高校' }[id[0] as 'e' | 'j' | 'h'];
  return {
    id,
    title: `${school}${id.slice(1)}年生`,
    skills: id === 'e1' ? additionSkills : [],
    stages: id === 'e1' ? firstGradeStages : [],
  };
});
