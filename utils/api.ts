// 💡 ブラウザ側（Denoがいない世界）でも落ちないように安全に環境変数を取得する
const isServer = typeof Deno !== "undefined";

// 💡 環境変数から管理画面用・アプリ用のURLをそれぞれ取得（なければローカルをフォールバック）
const ADMIN_BASE_URL = isServer
  ? Deno.env.get("ADMIN_BASE_URL") || "http://localhost:8080/api"
  : "http://localhost:8080/api";

const APP_BASE_URL = isServer
  ? Deno.env.get("APP_BASE_URL") || "http://localhost:8080/api"
  : "http://localhost:8080/api";

export function getAdminToken(): string | null {
  if (typeof globalThis.document === "undefined") return null;
  return (
    globalThis.document.cookie
      .split("; ")
      .find((row) => row.startsWith("admin_token="))
      ?.split("=")[1] || null
  );
}

/**
 * 🚀 【超進化版】管理画面専用のAPIクライアント
 *
 * 効果:
 * 1. ベースURLと認証トークンを自動付与
 * 2. 401（ログイン切れ）を検知したら、その場でログイン画面へ強制リダイレクト
 * 3. エラー時、バックエンドが返したエラーメッセージ（あれば）を自動抽出して例外を投げる
 * 4. 成功時、JSONの解析まで終わらせた「生データ」をそのまま返す
 */
export async function adminFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const formattedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  const url = `${ADMIN_BASE_URL}${formattedEndpoint}`;
  const token = getAdminToken();

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // ① 通信を実行
  const res = await fetch(url, { ...options, headers });

  // 🛑 ② 【共通処理】ログイン切れ（401）なら、画面側を煩わせずここで即座にリダイレクト！
  // ✨ ただし、ログインAPI自体（/admin/login）を叩いている時は、画面にエラーを出したいのでリダイレクトをスルーします。
  if (res.status === 401 && !endpoint.includes("/admin/login")) {
    globalThis.location.href = "/admin/login";
    // 画面が切り替わるまでの間、以降の処理が進まないように未解決のPromiseを返してストップさせる
    return new Promise(() => {});
  }

  // 💥 ③ 【共通処理】エラー（400や500など）の場合
  if (!res.ok) {
    let errorMessage = "データの処理に失敗しました。";
    try {
      // Go側が { "message": "エラーの理由" } のように親切なJSONを返してくれていれば、それを採用する
      const errorData = await res.json();
      if (errorData && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (_) {
      // JSONの解析に失敗した場合は、デフォルトの文字のまま進む
    }
    // 画面側の catch ブロックへエラーをぶん投げる
    throw new Error(errorMessage);
  }

  // 🎉 ④ 【共通処理】成功時は、ここでJSONのパースまで終わらせて中身（データ）を直接返す！
  // 戻り値がない（削除APIなど）場合は、空のオブジェクトなどを考慮
  if (res.status === 204) return {} as T;
  return (await res.json()) as T;
}
