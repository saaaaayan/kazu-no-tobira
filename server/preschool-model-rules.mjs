export const preschoolModelStage='preschool.n01';
export const preschoolModelSize=10;
const labels={dot:'まる',triangle:'さんかく',square:'しかく',bear:'くま'};

export function validatePreschoolModelQuestion(question) {
  const {id,skillId,type,format,difficulty,choices,answer,diagram,mistakes}=question;
  const reject=()=>{ throw Object.assign(new Error('1〜3個の横一列の図、正答、選択肢、説明を確認してください。'),{status:400}); };
  const row=diagram?.rows?.[0];
  const tokens=row?.tokens;
  const count=tokens?.length;
  const token=tokens?.[0];
  if (!id?.startsWith(preschoolModelStage+':') || skillId!=='preschool.objects' || type!=='choice' ||
      format!=='counting' || difficulty!==1 || diagram?.kind!=='countingBoard' || diagram.guide!==true ||
      ![undefined,'wide'].includes(diagram.spacing) || !Array.isArray(diagram.rows) || diagram.rows.length!==1 ||
      row.label!==undefined || !Array.isArray(tokens) || ![1,2,3].includes(count) ||
      !Object.hasOwn(labels,token) || tokens.some(item=>item!==token) ||
      !Array.isArray(choices) || choices.length!==3 || choices.some(choice=>!['1','2','3'].includes(choice)) ||
      new Set(choices).size!==3 || answer!==String(count)) reject();
  const label=labels[token];
  const hints=question.hints;
  const steps=question.steps;
  const wrong=choices.filter(choice=>choice!==answer).sort();
  if (typeof question.question!=='string' || !question.question.includes(label) ||
      typeof question.prompt!=='string' || !question.prompt.includes(label) ||
      typeof question.explanation!=='string' || !question.explanation.trim() ||
      !Array.isArray(hints) || hints.length!==3 || !hints.every(hint=>typeof hint==='string' && hint.trim()) ||
      new Set(hints.map(hint=>hint.trim())).size!==3 || !Array.isArray(steps) || steps.length<2 ||
      !steps.every(step=>typeof step?.title==='string' && step.title.trim() && typeof step.body==='string' && step.body.trim() && !step.equations?.length) ||
      !Array.isArray(mistakes) || mistakes.length!==2 ||
      !mistakes.every(item=>wrong.includes(item?.answer) && typeof item.explanation==='string' && item.explanation.trim()) ||
      mistakes.map(item=>item.answer).sort().join('')!==wrong.join('')) reject();
  const childText=[question.question,question.prompt,...hints,question.explanation,
    ...steps.flatMap(step=>[step.title,step.body]),...mistakes.map(item=>item.explanation)];
  if (childText.some(text=>/[\p{Script=Han}+＋=＝÷×]/u.test(text)) || hints.some(hint=>/[0-9０-９]/u.test(hint))) reject();
  return {count, visualKey:token+':'+count+':'+(diagram.spacing??'regular')};
}

export function checkPreschoolModelSet(questions) {
  const cells=questions.map(validatePreschoolModelQuestion);
  if (cells.length!==preschoolModelSize || new Set(questions.map(question=>question.id)).size!==preschoolModelSize ||
      new Set(cells.map(cell=>cell.visualKey)).size!==preschoolModelSize ||
      [1,2,3].some(count=>cells.filter(cell=>cell.count===count).length<3)) {
    throw Object.assign(new Error('異なる図の10問と、1・2・3個それぞれの練習が必要です。'),{status:400});
  }
}
