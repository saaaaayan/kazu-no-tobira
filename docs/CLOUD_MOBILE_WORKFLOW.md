# 数のトビラ｜スマホからのCodex Cloud開発（PC不要）

> ユーザー最優先要件（2026-11-17）：**外出中のスマホでも開発できること**。自宅WindowsのローカルCodexランタイムやローカル開発サーバーを作業環境として必要としない。**唯一の利用者向けゲーム・管理者入口は https://saaaaayan.github.io/kazu-no-tobira/**。GitHub `saaaaayan/kazu-no-tobira` の `main` が正本。

## 技術構成

1. スマホの**ChatGPTアプリ → Codex → Cloud**（ローカルの `Remote` / `This PC` は選ばない）でタスクを開始・継続する。
2. 公開済みの**再利用可能なCodex Cloud環境**から、このGitHubリポジトリをチェックアウトする。クラウド内の使い捨て作業環境で編集・テストし、PRを作る。
3. 既存の必須CIを通して `main` に統合し、既存のGitHub ActionsでGitHub Pagesへ公開する。**公開済みの完全SHAと実画面での結果を確認するまでは完成と報告しない**。
4. レビュー担当者はスマホでCodexの変更・テスト結果・PRを確認し、**唯一のPages URL**で動作確認する。別のローカルURLは利用者に案内しない。
5. 将来の管理者画面は同一サイト内へ統合し、サーバー側の認証・権限チェックを備えたバックエンドAPIに接続する。管理者機能が未実装なら完了を装わない（Issue #81）。

## 一度だけ必要なアカウント設定（本人操作）

Codex Cloudの環境作成・接続は、利用者のChatGPTアカウントで**Webまたはデスクトップ**から行う。クラウド環境が作成・公開されていれば、以後はスマホだけでタスクを開始・継続でき、自宅PCは停止していてもよい。

1. ブラウザ版ChatGPTかデスクトップのCodex Cloud画面を開き、**Work in → Cloud** を選ぶ。
2. **Create environment** から使い回し環境を作成し、GitHub連携とリポジトリ **`saaaaayan/kazu-no-tobira`** を指定して**Publish**（環境の公開/再利用有効化）。必要ならGitHub認可を本人が完了する。GitHubコネクタとCodex Cloudが同じ接続状態とは限らない。
3. 実行環境に **Node.js 24.11以上**、**pnpm 11.25.0**（packageManager定義）を準備。コアパック/パッケージマネージャーを利用し、**`pnpm install --frozen-lockfile`** を依存セットアップで実行する。インターネット接続や依存の取得が必要な場合はCloud環境のネットワーク設定を承認された範囲で調整する。秘密鍵・DBパスワードをリポジトリや出力へ埋め込まない。
4. 環境を公開して、ChatGPTモバイルアプリの **Codex → Cloud → 作成した環境** から選べるか確認。表示されない場合はアプリを更新、同じアカウント/ワークスペース、クラウド機能の利用権限、GitHubのリポジトリ権限を点検する。
5. スマホで最初のタスクとして「`saaaaayan/kazu-no-tobira`を読み、`pnpm test`・`pnpm typecheck`・`pnpm build:web` をクラウドで実行し、mainとの差異なしで結果を報告。自宅PCは使わない」を指示し、環境が機能することを確認する。

**注意**：アプリでの `Remote` やWindowsの `C:\Users\...\.cache\codex-runtimes\` はPC接続型の動作に関係する。**これを経由した作業をしない**のが今回の条件。Codex Cloud自体はサーバー上でコードをチェックアウト・編集・ビルドするため、**クラウド内部の一時ファイルまでゼロにすることは不可能**。無関係なローカルファイルの削除指示はしない。

## 各開発タスクの完了条件

- 作業はCodex Cloud上で実行され、自宅PCのパス/localhostを必須としない。
- `main`の最新版から開始し、PR経由で統合する。PRと必要な承認がないまま `main`を直接破壊的に更新しない。
- `pnpm test`、`pnpm typecheck`、`pnpm build:web` および必須CIの成功。
- `https://saaaaayan.github.io/kazu-no-tobira/` への公開と `/version.json` でのコミット一致、実画面確認。
- 管理者機能・未審査教材・正答・セキュリティ設定を公開用静的バンドルへ漏出させない。
- **本番の更新に失敗したときは、未公開を明示し原因修正を続ける**。自宅PCや別のプレビューへの切替で代用しない。

## スマホからのCodex指示例

> 数のトビラ（GitHub: saaaaayan/kazu-no-tobira）を**Codex Cloud**で開き、Issue #81 の管理者画面のオンライン統合を進めてください。自宅Windowsのローカル実行・ローカルプレビューは禁止。Node 24.11+・pnpm 11.25でテスト、PR→main統合→GitHub Pagesへの配信と公開SHA照合まで進めてください。安全な管理者認証が実装できない場合はその状態を報告し、教材を無防備に公開しないこと。確認先は https://saaaaayan.github.io/kazu-no-tobira/ のみです。

## 参照

- Codex Cloud: https://learn.chatgpt.com/docs/cloud
- Cloud environments: https://learn.chatgpt.com/docs/environments/cloud-environments
- 本番公開手順: [release-process.md](release-process.md)
- 開発の最上位ルール: [AGENTS.md](../AGENTS.md)
- 単一公開URLへの移行: Issue #81
