// 💡 ブラウザ側（Denoがいない世界）でも落ちないように安全に環境変数を取得する
const isServer = typeof Deno !== "undefined";

function normalizeApiBaseUrl(rawUrl: string, fallbackUrl: string): string {
  const source = (rawUrl || fallbackUrl).trim();

  try {
    const url = new URL(source);
    const path = url.pathname.replace(/\/+$/, "");

    // 末尾に /api がなければ付与する（例: http://localhost:8080 -> http://localhost:8080/api）
    if (path === "" || path === "/") {
      url.pathname = "/api";
    } else if (!path.endsWith("/api")) {
      url.pathname = `${path}/api`;
    } else {
      url.pathname = path;
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return fallbackUrl;
  }
}

// 💡 環境変数から管理画面用・アプリ用のURLをそれぞれ取得（なければローカルをフォールバック）
export const ADMIN_BASE_URL = isServer
  ? normalizeApiBaseUrl(
    Deno.env.get("ADMIN_BASE_URL") || "",
    "http://localhost:8080/api",
  )
  : "http://localhost:8080/api";

export const APP_BASE_URL = isServer
  ? normalizeApiBaseUrl(
    Deno.env.get("APP_BASE_URL") || "",
    "http://localhost:8080/api",
  )
  : "http://localhost:8080/api";

function formatAdminUrl(endpoint: string): string {
  const formattedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  return `${ADMIN_BASE_URL}${formattedEndpoint}`;
}

function buildAdminBaseCandidates(): string[] {
  const candidates: string[] = [];
  const add = (base: string) => {
    const normalized = normalizeApiBaseUrl(base, "http://localhost:8080/api");
    if (!candidates.includes(normalized)) {
      candidates.push(normalized);
    }
  };

  add(ADMIN_BASE_URL);

  // 何らかの理由で 8000 に向いてしまった場合の救済
  add(ADMIN_BASE_URL.replace(":8000", ":8080"));

  // 最終フォールバック
  add("http://localhost:8080/api");
  add("http://127.0.0.1:8080/api");

  return candidates;
}

// 管理画面APIへ生のResponseを返すダウンロード用途ヘルパー
export async function adminFetchRaw(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getAdminToken();
  const isFormDataBody = options.body instanceof FormData;

  const headers = new Headers(options.headers || {});
  if (!isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const formattedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const baseCandidates = buildAdminBaseCandidates();
  let lastResponse: Response | null = null;

  for (const base of baseCandidates) {
    const res = await fetch(`${base}${formattedEndpoint}`, {
      ...options,
      headers,
    });
    lastResponse = res;

    if (res.status === 401 && !endpoint.includes("/admin/login")) {
      globalThis.location.href = "/admin/login";
      return new Promise(() => {});
    }

    // 404のときは次の候補を試す
    if (res.status === 404) {
      continue;
    }

    return res;
  }

  // すべて404だった場合は最後のレスポンスを返す
  return lastResponse ??
    await fetch(formatAdminUrl(endpoint), { ...options, headers });
}

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
  const res = await adminFetchRaw(endpoint, options);

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
