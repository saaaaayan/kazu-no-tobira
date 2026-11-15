# 数のトビラ

小学1年生から高校3年生まで、算数・数学を冒険しながら学べるアプリ。

## コンセプト
ひとつ解くたび、世界がひらく。

## 開発方針
- Web・Android・iOS対応
- 問題の品質を最優先
- 苦手克服・個別最適化学習
- Codexによる開発

## 開発環境

- Node.js 24.11 以降
- pnpm 11.25.0
- Expo SDK 58 / React Native / TypeScript

```sh
pnpm install --frozen-lockfile
pnpm web
```

Expo が表示したローカル URL（既定では http://localhost:8081）を開きます。
同じコードを端末で開くには `pnpm start` を使います。ローカルの Android
エミュレーターは `pnpm android`、macOS の iOS シミュレーターは `pnpm ios` で起動できます。

```sh
pnpm test
pnpm typecheck
pnpm build:web
```

## 最初の冒険

小学1年生のたしざんを、9までのたしざん、10をつくるたしざん、10をこえるたしざんの順に学びます。
各ステージは5問です。全問正解でクリアし、次のステージが開きます。
解答ごとに答えと考え方が表示され、解答履歴・技能ごとの正答数と解答数・ステージのクリア日時が端末に保存されます。

- `src/domain/curriculum.ts` は小学1年生から高校3年生までの学年と、技能・ステージの定義を持ちます。
- `src/domain/addition.ts` は技能別に出題を生成し、`src/domain/grading.ts` が入力を採点します。
- `src/domain/progress.ts` はステージ進行と技能別の成績を管理し、`src/storage.ts` が AsyncStorage へ保存します。

まずは小学1年生の単元を増やし、問題文と解説を教育面からレビューします。苦手診断・復習・毎日15分の学習計画では、技能別の解答履歴を利用する想定です。
