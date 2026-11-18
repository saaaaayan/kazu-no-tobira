import {hasStageBank,type BankQuestion} from './questionBank';
import type {WorldStage} from './worldCatalog';
import {loadStageBank} from '../stageBankLoader';
import {drawStageRound,type StageDeck} from './stageDeck';

/**
 * The public prototype plays 43 existing 100-question banks and new 10-question starter banks.
 * Ten questions are selected from the corresponding stage; questions are never
 * repeated within that round. A session deck cycles through the entire bank.
 * This preview does not write learning history, progress, or approval status.
 */
const decks=new Map<string,StageDeck>();

export async function publicBankStageRound(stage:WorldStage):Promise<BankQuestion[]> {
  if(!hasStageBank(stage.id))throw new Error('このステージの問題は じゅんびちゅうだよ。');
  const bank=await loadStageBank(stage.id);
  if(bank.stageId!==stage.id||bank.gradeId!==stage.gradeId||bank.islandId!==stage.gradeId||
     !Number.isSafeInteger(bank.version)||bank.version<1||
     !Array.isArray(bank.questions)|| ![10,100].includes(bank.questions.length)) {
    throw new Error('問題データの内容を確認できませんでした。');
  }
  const byId=new Map(bank.questions.map(item=>[item.id,item]));
  if(byId.size!==bank.questions.length||bank.questions.some(item=>!item.id||!item.question||
       !item.answer||!item.hints||item.hints.length!==3||!item.explanation)) {
    throw new Error('問題データに不足があります。');
  }
  const previous=decks.get(stage.id);
  const deck=drawStageRound([...byId.keys()],stage.questions,bank.version,previous);
  decks.set(stage.id,deck);
  return deck.lastRound.map(id=>byId.get(id)!).sort((a,b)=>a.difficulty-b.difficulty);
}
