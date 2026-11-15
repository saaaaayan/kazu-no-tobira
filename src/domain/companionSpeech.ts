export type CompanionMood = 'ready' | 'correct' | 'incorrect' | 'clear' | 'encourage';

// Short, child-friendly dialogue. Keep each pool longer than a five-question round
// so the same mood never repeats a line within one round.
const lines: Record<CompanionMood, readonly string[]> = {
  ready: [
    'いっしょに かんがえよう！',
    'つぎは どんな もんだいかな？',
    'あわてなくて いいよ！',
    'じっくり かんがえて みよう！',
    'すうじの ひみつを みつけよう！',
    'こたえが みえたかな？',
    'ルミも おうえんしてるよ！',
    'ひとつずつ やってみよう！',
    'さあ、ぼうけんの つづきだ！',
    'きょうも いっしょに がんばろう！',
  ],
  correct: [
    'やったね！ そのちょうし！',
    'せいかい！ キラキラだね！',
    'すごい！ ぴったり あってる！',
    'わあ！ トビラが ひらきそう！',
    'だいせいこう！ いいかんじ！',
    'ばっちり！ つぎも たのしみ！',
    'おみごと！ ひとつ すすんだね！',
    'せいかい！ ぼうけんが すすむよ！',
    'わくわく！ その こたえだよ！',
    'やったー！ ほしが かがやいた！',
  ],
  incorrect: [
    'おしい！ つぎは だいじょうぶ！',
    'まちがえても ぼうけんは つづくよ！',
    'そうか！ いっしょに たしかめよう！',
    'あせらず もういちど かんがえよう！',
    'ちがいに きづけたら だいせいこう！',
    'チャレンジしたのが すてきだよ！',
    'つぎの もんだいも おうえんするね！',
    'こたえを みて なるほど！ だね！',
    'だいじょうぶ！ つぎの トビラへ！',
    'わかったことを つぎに いかそう！',
  ],
  clear: [
    'ぜんもん せいかい！ やったー！',
    'たからばこが ひらいたよ！',
    'すごい！ ぼうけん だいせいこう！',
    'キラキラの たからもの みつけた！',
    'ステージ クリア！ おめでとう！',
    'ぜんぶ せいかい！ きみと ぼうけん できて うれしい！',
  ],
  encourage: [
    'また いっしょに ちょうせんしよう！',
    'つぎは もっと トビラが ひらくかも！',
    'ここまで すすんだね！ また やろう！',
    'だいじょうぶ！ ぼうけんは つづくよ！',
    'ひとやすみして また あそぼう！',
    'ルミは いつでも おうえんしてるよ！',
  ],
};

export function companionSpeech(mood: CompanionMood, variation = 0): string {
  const choices = lines[mood];
  // Stable across renders but rotates as the question number changes.
  const turn = Number.isFinite(variation) ? Math.trunc(variation) : 0;
  return choices[((turn % choices.length) + choices.length) % choices.length];
}
