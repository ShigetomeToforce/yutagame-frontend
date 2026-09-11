# YUTAGAME Frontend Development Concept

## 1. 目的

YUTAGAMEフロントエンドは、次の2つを同時に満たすことを目的とする。

- 管理画面の運用効率を高めること
- 公開画面の表示を軽く安定させること

そのために、FreshのSSRとIslandsの部分的クライアント実行を使い分ける。

## 2. 全体構造

### 2.1 どこでルーティングしているか

ページルーティングは Fresh の routes
配下でファイルベースルーティングとして定義する。

- 全体レイアウト: [yutagame-frontend/routes/_app.tsx](routes/_app.tsx)
- 管理画面トップ:
  [yutagame-frontend/routes/admin/index.tsx](routes/admin/index.tsx)
- 管理画面一覧: 例
  [yutagame-frontend/routes/admin/games/index.tsx](routes/admin/games/index.tsx)
- 編集画面: 例
  [yutagame-frontend/routes/admin/games/[code].tsx](routes/admin/games/[code].tsx)

### 2.2 認証ガードはどこでやるか

管理画面の認証判定は
[yutagame-frontend/routes/admin/_middleware.ts](routes/admin/_middleware.ts)
で一括適用する。

この設計により、各ページで個別に認証分岐を書かずに済む。

### 2.3 管理画面のSEO制御

管理領域のメタ制御は
[yutagame-frontend/routes/admin/_layout.tsx](routes/admin/_layout.tsx)
で一括管理する。

## 3. Deno + Fresh の責務分離

### 3.1 routes と islands の分離

- routes
  - SSR中心のページエントリ
  - データ取得の起点
- islands
  - ボタン操作、モーダル、フォーム、絞り込みなどの動的UI

代表例。

- ゲーム一覧UI:
  [yutagame-frontend/islands/admin/games/GameList.tsx](islands/admin/games/GameList.tsx)
- 共通テーブル:
  [yutagame-frontend/islands/admin/common/PaginatedResourceTable.tsx](islands/admin/common/PaginatedResourceTable.tsx)

### 3.2 共通処理をどこでまとめるか

API通信共通は utils 配下で管理する。

- 管理APIクライアント: [yutagame-frontend/utils/api.ts](utils/api.ts)
- 公開APIクライアント: [yutagame-frontend/utils/appApi.ts](utils/appApi.ts)

共通化の意図。

- ベースURL解決の一元化
- 認証ヘッダー付与の一元化
- 401時の挙動統一
- エラーメッセージ抽出の統一

## 4. API呼び出し戦略の詳細

### 4.1 管理API

管理API呼び出しは adminFetch または adminFetchRaw を使う。

- adminFetch
  - JSONレスポンスを扱う通常API用
- adminFetchRaw
  - CSVダウンロードなど Response を直接扱う用途

機能要点。

- Cookieから admin_token を取得して Authorization 付与
- Base URL候補を順に試行
- 404時は次候補へフォールバック
- 401時は /admin/login に遷移

### 4.2 公開API

公開APIは appFetch を利用する。

- SSR時に候補URLを広めに持つ
- コンテナ内外の差異を吸収する
- 接続失敗時は候補一覧と理由を含めたエラーで調査しやすくする
- 204 No Contentも正常レスポンスとして扱う

### 4.3 公開画面のデータ取得

- 初期表示に必要なデータは `routes` のhandlerで取得し、propsとしてIslandへ渡す
- 独立したAPIは `Promise.all` で並列取得する
- Islandの初期化時に同じAPIを再取得しない
- 検索操作や「さらに表示」など、ユーザー操作後の通信だけIslandから実行する

## 5. CSV UIはどこで、どう実装しているか

### 5.1 実装場所

CSV操作UIは共通コンポーネント化し、各一覧に差し込む。

- 共通部品:
  [yutagame-frontend/islands/admin/common/CsvImportExportActions.tsx](islands/admin/common/CsvImportExportActions.tsx)
- 利用側
  - [yutagame-frontend/islands/admin/games/GameList.tsx](islands/admin/games/GameList.tsx)
  - [yutagame-frontend/islands/admin/machines/MachineList.tsx](islands/admin/machines/MachineList.tsx)
  - [yutagame-frontend/islands/admin/manufacturers/ManufacturerList.tsx](islands/admin/manufacturers/ManufacturerList.tsx)
  - [yutagame-frontend/islands/admin/keywords/KeywordList.tsx](islands/admin/keywords/KeywordList.tsx)
  - [yutagame-frontend/islands/admin/genres/GenreList.tsx](islands/admin/genres/GenreList.tsx)

### 5.2 画面フロー

- エクスポート
  - 列選択
  - 文字コード選択
  - ダウンロード
- インポート
  - upload
  - preview
  - confirm
  - apply

### 5.3 ダウンロード処理

adminFetchRaw で Response を取得し、Blob化して一時URLを生成して保存する。

- Content-Disposition からファイル名を取得
- 取得できない場合はプレフィックス付きの時刻名を生成

## 6. 状態管理の考え方

状態管理は useSignal を基本とし、画面単位で局所化する。

- モーダル開閉
- 絞り込み条件
- CSVステップ
- 選択行管理

この方針により、不要な再レンダリングや状態伝播を減らす。

## 7. Deno運用ルール

### 7.1 主要タスク

タスク定義は [yutagame-frontend/deno.json](deno.json) に置く。

- start
- check
- build
- preview

### 7.2 日常コマンド

- deno fmt
- deno task test
- deno check main.ts
- deno task check
- deno task start
- docker compose up -d --build

## 8. テスト方針

Deno標準の `Deno.test` を使い、テストしやすい判断処理は `utils`
の純粋関数へ分離する。

現在の主な単体テスト:

- Cookieの取得、URLデコード、不正Cookieの安全な処理
- 公開ページ・管理画面・API・静的ファイルの判定
- ファイルログのscope・kind・level判定
- PV対象となるHTTP methodとstatus

今後の優先順位:

1. APIクライアントの成功・HTTPエラー・接続先フォールバック
2. 検索条件とURL同期、ページング状態
3. PlaywrightによるTOP・検索・管理CRUDの主要導線

## 9. 品質チェック観点

- 管理API呼び出しで独自fetchが混ざっていないか
- モーダル遷移が中断しないか
- previewレスポンスのnull安全が担保されているか
- 404と401のUI上挙動が意図通りか
- モバイル表示でも主要操作が欠けないか
- SSRとIslandで同じ初期データを二重取得していないか
- 配列レスポンスが `null` の場合にも画面が落ちないか
- コメントは処理の逐語訳ではなく、SSR境界や失敗時継続など判断理由を説明しているか

## 10. PV・UU記録

共通 [routes/_middleware.ts](routes/_middleware.ts)
が公開ページのレスポンス後に記録する。

- 対象: 正常終了したGETのHTMLページ
- 対象外: 管理画面、API、静的ファイル、HEAD、エラーページ、メンテナンス画面
- ページキー: クエリ文字列を除いたpathname
- 訪問者: `visitor_id` Cookie。初回アクセス時にUUIDを発行する
- 障害時: 計測APIの失敗で公開ページを失敗させず、errorログへ残す

## 11. 拡張方針

- CSV列定義を型で厳密化
- 一覧フィルタのURL同期
- APIエラー文言のリソース別最適化
