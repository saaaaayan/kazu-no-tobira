/**
 * ブラウザー標準の読み上げ音声から、日本語に適したものを選ぶ。
 * ローカル限定にすると、より自然なGoogle日本語/オンラインNatural音声を
 * 候補から除外してしまうため、品質を優先して選択する。
 */
export function preferredJapaneseVoice<T extends { lang:string; name:string; localService:boolean }>(
  voices: readonly T[],
): T | undefined {
  const japanese=voices.filter(voice=>/^ja(?:[-_]|$)/i.test(voice.lang));
  function score(voice:T) {
    const name=voice.name.toLowerCase();
    let quality=0;
    if(/natural|neural|premium|enhanced/.test(name)) quality+=100;
    if(/google/.test(name)) quality+=65;
    if(/nanami|mizuki|keita|ayumi|kyoko|haruka/.test(name)) quality+=28;
    if(/^ja[-_]jp$/i.test(voice.lang)) quality+=10;
    if(voice.localService) quality+=1;
    return quality;
  }
  return [...japanese].sort((a,b)=>score(b)-score(a))[0];
}

/**
 * TTS向けの読みやすい文章に整える。教材画面の文面や正答は変更しない。
 * 画面上の「いくつ？。」「3 こ。」などを自然に読み上げられる形にする。
 */
export function naturalJapaneseSpeechText(text:string):string {
  return text
    .replace(/([？?！!])\s*。/gu,'$1')
    .replace(/([ぁ-ゖァ-ヿ一-龥0-9])[\s　]+(?=[ぁ-ゖァ-ヿ一-龥0-9])/gu,'$1')
    .replace(/([123])こ(?![ぁ-ゖァ-ヿ一-龥0-9])/gu,(_,number:string)=>({ '1':'ひとつ', '2':'ふたつ', '3':'みっつ' }[number] ?? number+'こ'))
    .replace(/([ぁ-ゖァ-ヿ一-龥])は(いくつ[？?]|ひとつ|ふたつ|みっつ)/gu,'$1は、$2')
    .replace(/([ぁ-ゖァ-ヿ一-龥])を(さわって)/gu,'$1を、$2')
    .replace(/([。？！])(?=[^\s　])/gu,'$1　')
    .trim();
}
