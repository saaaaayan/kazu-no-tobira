import type { WorldStage } from './worldCatalog.ts';

/**
 * Choice-only preschool stages from number 16 onward need just one tap to
 * grade. Existing hands-on interactions (finger tracing and picture-number
 * connections) remain in control of their own submission.
 *
 * Stage order is zero-based: normal stage 16 is order 15; premium stages
 * follow normal stage 50. Checkpoint rounds use the last stage of their group,
 * so checks for 16–20 and later inherit this behaviour.
 *
 * Do not alter review/editing views or older stages that have already been
 * checked by the curriculum author.
 */
export function shouldAutoGradePreschoolChoice(
  stage:Pick<WorldStage,'gradeId'|'order'>|undefined,
  questionType:string|undefined,
  reviewing:boolean,
  specializedInteraction:boolean,
):boolean {
  return stage?.gradeId==='preschool' &&
    stage.order>=15 &&
    questionType==='choice' &&
    !reviewing && !specializedInteraction;
}
