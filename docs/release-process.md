# 数のトビラの公開・検証フロー

正式なソースは GitHub `saaaaayan/kazu-no-tobira` の `main`。本番は [GitHub Pages](https://saaaaayan.github.io/kazu-no-tobira/)。開発時のルールは [AGENTS.md](../AGENTS.md) に定める。

1. 作業ツリーを確認し、`git fetch origin` で更新した `origin/main` から作業ブランチを作る。既存の変更がある場合は別の作業ツリーを使うなどして保持する。
2. `pnpm install --frozen-lockfile` で依存関係を揃え、`pnpm test`、`pnpm typecheck`、`pnpm build:web` を実行する。必要に応じてブラウザーでも操作を確認する。
3. 作業ブランチをプッシュして `main` 宛ての PR を作る。必須チェックは **Verify web release** ワークフローの GitHub Actions ジョブ `verify`。PR の最新コミットを確認し、失敗や競合は作業ブランチで解消する。チェックの完了待ちには GitHub の自動マージを利用する。
4. `main` への統合後、**Publish 数のトビラ to GitHub Pages** が試作版をビルドする。型・テスト・データ混入検査と `/kazu-no-tobira/` での配信前検査を全て通過した成果物だけを既存URLへ公開する。正式版はリポジトリの Actions 変数に `PAGES_RELEASE_PROFILE=production` を設定した場合に選ばれ、従来の購入認可・教材審査条件も必要。
5. 本番に公開したときは、最新の `origin/main` を再取得し、対象の公開ジョブが成功したこと、[公開マニフェスト](https://saaaaayan.github.io/kazu-no-tobira/version.json) の `version` が最新の完全な SHA と一致することを確認する。キャッシュを避けるため確認時のクエリを付ける。別の変更が先に公開された場合は、その最新版が公開され、今回の変更を含んでいることまで確認する。

GitHub の管理設定を変更できない場合は、管理者に **Settings → General → Allow auto-merge** と、`main` を対象とした **Rulesets** の PR 必須・`verify` 必須・マージ前の最新化を確認してもらう。**Settings → Pages** の公開元は GitHub Actions を使う。手動で再公開する場合も、`main` の Pages ワークフローを使う。

開発用のプラン切替を確認するときは、統合済み `main` から `pnpm exec expo export --platform web --dev --output-dir .expo/review-<SHA>` で専用フォルダーへ出力し、`node scripts/serve-review.mjs .expo/review-<SHA> 8115` で起動する。確認URLは `http://127.0.0.1:8115/`。このサーバーは同じPCからだけ接続可能で、出力を Pages にアップロードしない。Pages の成果物に認証情報や秘密鍵を含めない。

限定βの教材判定、招待制環境の設計、公開失敗からの復旧は [限定β版の準備と運用](beta-operations.md) を参照する。

## 配信先ごとの確認条件

| 対象 | 確認条件 |
| --- | --- |
| 開発用UIプレビュー | 型チェック、自動テスト、サンプル専用成果物の検査、HTTPのSHA照合。全16島を閲覧でき、ゲーム画面で合成のサンプルを採点できる。DB、教材バンク、学習記録、権限情報を使わない。 |
| 招待制β | `pnpm beta:readiness --require-ready`。全1,040ステージで各10問の公開準備完了教材が必要。加えて招待制HTTPS、操作検証と公開承認が必要。 |
| 正式本番 | `pnpm production:readiness --require-ready` で各ステージ100問の公開準備完了教材を実DBで照合する。既存のPagesワークフローでは `PRODUCTION_ENTITLEMENTS_READY` と `pnpm bank:quality-gate` を引き続き必須とする。正式版のDB検査をCIに移す場合は、専用の読取り権限を用意してから行う。 |

### 開発用UIプレビューの更新

同じ [Pages URL](https://saaaaayan.github.io/kazu-no-tobira/) に、サンプル専用の試作版を公開する。GitHub Actionsの **Build sample-only UI preview** は、ローカル確認用の `ui-preview-<SHA>` 成果物も生成する。同じPCでビルド・確認するときは、mainを更新し、未使用の出力フォルダーを指定する。

```sh
node scripts/export-ui-preview.mjs .expo/ui-preview-web
node scripts/serve-review.mjs .expo/ui-preview-web 8130
```

確認先は [開発用UIプレビュー](http://127.0.0.1:8130/)。別シェルから `node scripts/verify-web-release.mjs http://127.0.0.1:8130/ <完全なコミットSHA> ui-preview` を実行すると、マニフェストとHTMLが参照するJSの両方を検証する。GitHub Pagesでも同じスクリプトで本番のマニフェストとJSを確認する。

試作版は端末の既存セーブを読み書きしない。招待制βは専用の認可と出題APIを備えるまでは開始しない。

### 試作版の失敗時

- テスト・ビルド・事前照合・直前の試作版の保全に失敗したときは、配信ステップに進まず、現在のサイトを維持する。
- 配信後にSHAまたは配信ファイルの照合に失敗したときは、直前に配信されていたサンプル専用版を同じワークフロー内で復元し、そのSHAを公開URLで確認する。復元した場合も、新版の実行結果は失敗として表示する。
- 旧版から初めてサンプル専用版へ移行する際は、配信前までは旧版を維持する。公開後の復元に使用できる試作版が存在しないため、旧教材を含む可能性のある旧成果物の再配信は行わない。この場合の公開後障害は、原因の修正と安全な試作版の再配信で復旧する。
