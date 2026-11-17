/**
 * 数える対象の絵と幼児向けの呼び名。
 * 文字でなく絵文字を使う場合も、問題文は読めるようにひらがなにする。
 * ここの公開試作版用図柄は教材としての承認済み問題とは別。
 */
export const countingTokenArt = {
  dot: ['●','まる'],
  triangle: ['▲','さんかく'],
  square: ['■','しかく'],
  bear: ['🧸','くま'],
  star: ['⭐','ほし'],
  heart: ['❤️','はーと'],
  cat: ['🐱','ねこ'],
  dog: ['🐶','いぬ'],
  rabbit: ['🐰','うさぎ'],
  chick: ['🐤','ひよこ'],
  frog: ['🐸','かえる'],
  fish: ['🐟','さかな'],
  turtle: ['🐢','かめ'],
  butterfly: ['🦋','ちょうちょ'],
  ladybug: ['🐞','てんとうむし'],
  bird: ['🐦','とり'],
  flower: ['🌸','はな'],
  clover: ['🍀','くろーばー'],
  apple: ['🍎','りんご'],
  strawberry: ['🍓','いちご'],
  banana: ['🍌','ばなな'],
  grape: ['🍇','ぶどう'],
  cherry: ['🍒','さくらんぼ'],
  orange: ['🍊','みかん'],
  cookie: ['🍪','くっきー'],
  donut: ['🍩','どーなつ'],
  candy: ['🍬','あめ'],
  car: ['🚗','くるま'],
  train: ['🚂','きしゃ'],
  plane: ['✈️','ひこうき'],
  rocket: ['🚀','ろけっと'],
  balloon: ['🎈','ふうせん'],
  gift: ['🎁','おくりもの'],
  moon: ['🌙','つき'],
  marked: ['✓','しるしのついた まる'],
  empty: ['◯','からの おさら'],
} as const;

export type CountingToken = keyof typeof countingTokenArt;

/** 第1ステージで使う34種類の具体物・記号。 */
export const preschoolCountingTokens = [
  'bear','dot','triangle','square','star','heart',
  'cat','dog','rabbit','chick','frog','fish','turtle','butterfly','ladybug','bird',
  'flower','clover','apple','strawberry','banana','grape','cherry','orange',
  'cookie','donut','candy','car','train','plane','rocket','balloon','gift','moon',
] as const satisfies readonly CountingToken[];
