import { checkMathAnswer,isValidMathAnswer } from '../src/domain/mathAnswer.ts';
import { inspectQuestion } from '../scripts/question-audit-rules.mjs';

const invalid=message=>Object.assign(new Error(message),{status:400});
const text=(value,limit)=>typeof value==='string' && value.trim() && value.length<=limit && !value.includes('\0');
const object=value=>value && typeof value==='object' && !Array.isArray(value);

export function validateRevisionRequest(request) {
  const {id,version,note,content}=request??{};
  if (!text(id,250) || !Number.isSafeInteger(version) || version<0 || !text(note,1000) || !object(content)) {
    throw invalid('問題ID・版と修正理由を確認してください。');
  }
  const {question,prompt,answer,hints,explanation,steps}=content;
  if (!text(question,3000) || !text(prompt,500) || !text(answer,250) || !text(explanation,6000) ||
    !Array.isArray(hints) || hints.length!==3 || !hints.every(item=>text(item,1500)) ||
    new Set(hints.map(item=>item.trim())).size!==3 ||
    !Array.isArray(steps) || !steps.length || steps.length>12 ||
    !steps.every(step=>object(step) && text(step.title,150) && text(step.body,2500) &&
      Array.isArray(step.equations) && step.equations.length<=8 && step.equations.every(equation=>text(equation,500)))) {
    throw invalid('問題文・操作案内・正答・異なる3段階ヒント・基本解説・詳しい解説を確認してください。');
  }
  return {id,version,note:note.trim(),content:{question:question.trim(),prompt:prompt.trim(),answer:answer.trim(),
    hints:hints.map(item=>item.trim()),explanation:explanation.trim(),
    steps:steps.map(step=>({title:step.title.trim(),body:step.body.trim(),
      ...(step.equations.length?{equations:step.equations.map(equation=>equation.trim())}:{})}))}};
}

export function reviseQuestion(before,content) {
  const next={...before,...content,hint:content.hints[0],
    ...(Object.hasOwn(before,'guidedHints')?{guidedHints:content.hints}:{})};
  if (!['number','choice'].includes(next.type) || !isValidMathAnswer(next,next.answer) || !checkMathAnswer(next,next.answer)) {
    throw invalid('正答を現在の入力方式・選択肢で採点できません。');
  }
  const {issues}=inspectQuestion(next);
  if (issues.length) throw invalid('問題文・正答・図または選択肢の自動検査に通りません。修正してください。');
  return next;
}
