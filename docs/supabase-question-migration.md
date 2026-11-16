# 数のトビラ専用Supabaseへの問題移行

対象は東京リージョンの `kazu-no-tobira`（`jxitjcfgavemddlbygzx`）です。再現用スキーマは `supabase/migrations/20261116102259_question_catalog.sql` にあります。

## 確認した状態

- JSON 43ファイル（4,300問）、非公開原稿5ファイル（23問）、SQLiteを `.question-backups/before-supabase-2026-11-16/` にバックアップしました。SQLite Online Backup APIでWALを含めてコピーし、復元先で整合性をチェックしました。問題ID・原本ファイル・本文のSHA-256は同じディレクトリの `manifest.json` にあります。ここには非公開原稿が含まれるので、共有先を選んでください。
- 専用Supabaseへ島16件、ステージ1,040件、バンク48件、問題、問題の版、履歴を各4,323件インポートしました。問題本文は元のJSONテキストを保持し、JSONBでも使えます。問題ID、正答、採点・別解の元データ、ヒント、解説、途中式、図、審査状態、履歴を行単位で照合しました。2回目のインポートは全テーブル追加0件でした。
- RLSは全テーブルで有効です。匿名・一般ログインのDBロールに本文や履歴への権限を付与していません。サーバー側は用途別のDBロールとSupabase公式CAでTLSを検証します。インポート用ログインは全件照合後に無効にしました。
- 問題行の照合ダイジェストは `ce5a7ef23bbfeac83e21c2fc7e5ad257ed76350be996975b389a9be208d266d7`、本文の版は `7a33cb838d41764b2e987dd95869b3e343858543b6c230c38585b0c790f0bcc0`、履歴は `16c4de63c5a4524cf74935e90694690c86532acfcb86a9e68c29cdcf7e4854df` です。全件の詳細は非公開バックアップ内の `supabase-verify.json` にあります。
- 元データの審査状態は4,323問すべて未確認で、公開準備完了0問です。登録履歴4,323件を引き継ぎました。実DBの審査更新・履歴・公開からの取り下げはロールバックするトランザクションで検証しました。

## 確認用Webの再起動

バックアップやDBパスワードはブラウザーに渡さず、Nodeサーバーにだけ設定します。同じPCで動かす場合は下記の起動方法を使います。出力先には未使用のディレクトリを指定します。

```powershell
$env:KAZU_QUESTION_DB_HOST = 'aws-1-ap-northeast-1.pooler.supabase.com'
$env:KAZU_QUESTION_DB_CA_FILE = '.question-backups/supabase-db-ca.pem'
$env:KAZU_QUESTION_DB_PASSWORD_FILE = '.question-backups/svc_kazu_review.password'
node scripts/export-db-preview.mjs web .expo/db-review-8125
node scripts/start-question-review.mjs .expo/db-review-8125 8125
```

- [ゲームのDBプレビュー](http://127.0.0.1:8125/game-preview)は、既存のバンクから出題する際にIDのリストを取得し、必要な10問の本文だけ読み込みます。ボツ・要修正は次の取得から出題候補に入りません。通信失敗は一度再試行します。端末へ永続保存するのは出題順と既存の学習記録です。
- [管理者のDBプレビュー](http://127.0.0.1:8125/admin)は、これまでのローカル管理者キー（`.expo/question-review-private/admin-key.txt`）でログインし、Supabaseの実データを開きます。検索、旧版、CSV/JSON、審査状態・理由・メモの保存をDBへ接続しています。
- 管理者本人のAuth用コードでは `KAZU_QUESTION_AUTH_PUBLISHABLE_KEY` の設定時にSupabase Authを使用します。本人のAuthユーザーを作成し、確認したUUIDを `question_catalog.administrators` に登録してから使います。専用プロジェクトにAuthユーザーが0人だったため、本人の実ログインと共有HTTPS運用はまだ検証していません。

## 容量と互換性

同じExpo Web開発エクスポート同士で、11,746,767バイトから3,397,709バイトへ、**8,349,058バイト（8.35 MB、71.1%）削減**しました。問題JSONは43ファイルから0ファイル。小1 `e1.n06` の例では、100問ファイル182,603バイトから、ID一覧5,023バイトと10問13,591バイトの計18,614バイトになりました。このPCからの2リクエストの実測は123ms（1回）です。

DB専用プレビューはWeb・Android・iOSのExpoエクスポートを確認しました。スマートフォン実機の画面・通信は未検証です。一般向けの全出題経路、特に復習・毎日15分・苦手克服と購入権限・公開判定をつなぐ作業が残っています。確認用出力の切替後も、既存の配信経路の互換性に必要なソースJSONと旧ローダーを保持しています。GitHub Pagesの公開条件は従来どおりです。

最新の認証、出題、公開の進捗は [Issue #51 の作業記録](issue-51-status.md) を参照してください。

## 移行時点の再開項目

1. 専用Supabase Authに本人のユーザーを登録し、UUIDを確認して管理者として登録する。一般アカウントと区別し、実ブラウザーで確認する。
2. 一般用の出題をHTTPSサーバーへ接続する。購入権限はサーバーで照合し、全出題経路で公開準備完了だけを選ぶ。正答は一般向けの出題レスポンスに含めず、採点時に扱う。
3. WebとAndroid・iOSの実機で出題・保存・復習を検証する。全照合が通った時点で、通常のアプリ出力から固定バンクを除外する。
4. 104,000問の制作は別途継続する。最新の [制作チェックポイント](question-production-checkpoint.json) と [再開地点](question-production-resume.md) を使う。
