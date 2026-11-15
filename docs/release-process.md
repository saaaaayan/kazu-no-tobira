# 数のトビラの公開・検証フロー

正式なソースは GitHub `saaaaayan/kazu-no-tobira` の `main`。本番は [GitHub Pages](https://saaaaayan.github.io/kazu-no-tobira/)。開発時のルールは [AGENTS.md](../AGENTS.md) に定める。

1. 作業ツリーを確認し、`git fetch origin` で更新した `origin/main` から作業ブランチを作る。既存の変更がある場合は別の作業ツリーを使うなどして保持する。
2. `pnpm install --frozen-lockfile` で依存関係を揃え、`pnpm test`、`pnpm typecheck`、`pnpm build:web` を実行する。必要に応じてブラウザーでも操作を確認する。
3. 作業ブランチをプッシュして `main` 宛ての PR を作る。必須チェックは **Verify web release** ワークフローの GitHub Actions ジョブ `verify`。PR の最新コミットを確認し、失敗や競合は作業ブランチで解消する。チェックの完了待ちには GitHub の自動マージを利用する。
4. `main` への統合後、**Publish 数のトビラ to GitHub Pages** ワークフローを確認する。ビルドは `/kazu-no-tobira` を配信パスとし、対象コミット SHA をアプリと `version.json` に埋め込む。公開後の検証ジョブが本番ページへの到達と SHA の一致を照合する。
5. 完了報告前に最新の `origin/main` を再取得し、対象の公開ジョブが成功したこと、[公開マニフェスト](https://saaaaayan.github.io/kazu-no-tobira/version.json) の `version` が最新の完全な SHA と一致することを確認する。キャッシュを避けるため確認時のクエリを付ける。別の変更が先に公開された場合は、その最新版が公開され、今回の変更を含んでいることまで確認する。

GitHub の管理設定を変更できない場合は、管理者に **Settings → General → Allow auto-merge** と、`main` を対象とした **Rulesets** の PR 必須・`verify` 必須・マージ前の最新化を確認してもらう。**Settings → Pages** の公開元は GitHub Actions を使う。手動で再公開する場合も、`main` の Pages ワークフローを使う。

開発用のローカル URL は確認作業のみに使用する。GitHub Pages の成果物はブラウザーから取得できるため、認証情報や秘密鍵を含めない。
