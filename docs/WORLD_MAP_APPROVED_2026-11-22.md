# 2026-11-22｜世界地図の正式承認画像

原本：ユーザーがチャットで確定した **2048×1522 PNG、7,804,072 bytes**。画像の色・書体・エリア配置・点線経路・海竜・余白などは変更しない。

SHA-256: `5e91554bc4de79192d5a1b04994149e866c7c8e1b0f17963dc21f9cc88cddc2c`

- 本番表示画像：`public/world-map-approved-20261122.png`（ビルド時に原本と同一のバイト列で復元）
- 原本のロスレス保管：`assets/world-map-base64/part00.txt` 〜 `part13.txt`
- 復元コマンド：`node scripts/materialize-approved-world-map.mjs`（SHA-256・PNG形式・幅・高さを検証）
- タップ位置：`src/domain/approvedWorldMap.ts` の16地点を実画像のラベル中心に合わせて指定
- 古い `public/world-map-approved.png` と旧8-bit生成スクリプトは履歴互換のため保管し、新本番画面では使用しない
- ステージID、問題バンク、学習記録、各学年マップには影響させない

**画像の再生成は禁止。** 修正依頼時は、この原本を保持して承認済み箇所だけ局所変更する。
