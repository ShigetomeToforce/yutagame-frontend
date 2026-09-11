# YUTAGAME Frontend

YUTAGAMEの公開画面と管理画面を提供するフロントエンドです。

## 技術スタック

- Deno 2.x: TypeScriptを直接実行し、format・lint・型検査も内蔵する実行環境
- Fresh 1.7: ファイルベースルーティングとSSRを提供するWebフレームワーク
- Preact: UIコンポーネント
- Signals: Island内の局所的な状態管理
- Tailwind CSS: 画面スタイル

Node.jsのプロジェクトと異なり、基本コマンドは `npm` ではなく `deno task`
を使います。依存関係とタスクは [deno.json](deno.json) にあります。

## ディレクトリ

- `routes`: URLに対応するページ。サーバーでデータを取得してHTMLを生成する
- `islands`: 検索、フォーム、モーダルなどブラウザで動く部分
- `utils`: API通信、SEO、ログなどの共通処理
- `static`: CSS、画像などそのまま配信するファイル

Freshは通常のページをサーバーでHTML化し、操作が必要なIslandだけJavaScriptをブラウザへ送ります。画面全体をIslandにしないことが、初期表示を軽く保つ基本です。

詳細は [DEVELOPMENT_CONCEPT.md](DEVELOPMENT_CONCEPT.md) を参照してください。

## 起動

Docker Desktopを起動してから実行します。

```bash
docker compose up -d --build
docker compose logs -f
docker compose down
```

ローカルのDenoで直接起動する場合:

```bash
deno task start
```

公開画面は `http://localhost:8000/`、管理ログインは
`http://localhost:8000/admin/login` です。

## 環境変数

```ini
SERVICE_NAME=YUTAGAME
ADMIN_BASE_URL=http://localhost:8080/api
APP_BASE_URL=http://localhost:8080/api
```

コンテナ内のSSRからは `localhost`
がフロントコンテナ自身を指すため、APIクライアントがDocker向け候補へフォールバックします。

## 開発コマンド

```bash
deno fmt
deno task test
deno task check
deno task build
```

`deno task test` は単体テスト、`deno task check`
はformat、lint、TypeScript型検査を実行します。

## 認証とCookie

- `admin_token`: 管理APIへ送るJWT。`routes/admin/_middleware.ts`
  が管理ページを保護する
- `visitor_id`: 個人情報を持たない匿名ID。PV/UUと「推し」の日次重複防止に使う

共通 [routes/_middleware.ts](routes/_middleware.ts)
は公開HTMLページの正常なGETを1回だけバックエンドへ通知します。検索条件のクエリ文字列はPVのページ識別に含めません。

## API通信

- 公開API: `utils/appApi.ts` の `appFetch`
- 管理API: `utils/api.ts` の `adminFetch`
- CSVなどResponseを直接使う管理API: `adminFetchRaw`

ページやIslandからベースURL・認証・エラー処理を個別実装せず、共通クライアントを使ってください。
