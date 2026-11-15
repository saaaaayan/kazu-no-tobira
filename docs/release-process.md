# 数のトビラ — 公開・検証フロー

- ソースコードは GitHub `saaaaayan/kazu-no-tobira` のみで管理。
- `main` は本番に公開するコード、`codex/*` は作業用ブランチ。
- 公開先は GitHub Pages。GitHub Actions `.github/workflows/pages.yml` でテスト・ビルドしてから公開する。
- 予定する固定URLは `https://saaaaayan.github.io/kazu-no-tobira/` だが、GitHub Pagesが有効化され、公開成功を確認するまでは利用可能と案内しない。
- `localhost` はCodex内の開発用であり、ユーザーの通常の確認先にはしない。
- GitHub Pages公開には、リポジトリの可視性とGitHubアカウントの利用条件が対応している必要がある。
- 現状のGitHub Pages自動公開は初回設定が未完了の場合失敗する。公開URLが実際に表示されるまで「本番公開完了」と報告しない。
- 有料化に際しては、GitHub Pages配信のJSやアセットが閲覧者に取得可能なことを前提に、課金処理・認証・秘密情報をブラウザへ埋め込まない設計が必要。

今回のVercel試用で作成した連携は解除済み。今後のVercel採用を禁止するものではない。なお、試用時に作成したVercel上の未デプロイプロジェクトは、所有者による削除確認が必要なため、まだ残っている。
