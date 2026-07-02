import { FreshContext } from "$fresh/server.ts";

// 💡 サーバー側でCookie（文字列）を扱いやすいように分解する便利関数
function getCookies(headers: Headers) {
  const cookieHeader = headers.get("cookie") || "";
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [key, value] = cookie.trim().split("=");
    if (key && value) {
      cookies[key] = decodeURIComponent(value);
    }
  });
  return cookies;
}

// 🔒 管理画面共通の「関所（ミドルウェア）」
export async function handler(req: Request, ctx: FreshContext) {
  const url = new URL(req.url);

  // 1. リクエストのヘッダーからCookieを取り出す
  const cookies = getCookies(req.headers);
  const token = cookies["admin_token"];

  // ✨ 【追加】もしログイン画面（/admin/login）へのアクセスだった場合
  if (url.pathname === "/admin/login") {
    if (token) {
      // 💡 すでに通行証（Cookie）を持っていれば、ログイン画面を見せずに管理トップへリダイレクト！
      return new Response("", {
        status: 302,
        headers: { Location: "/admin" },
      });
    }
    // 通行証を持っていなければ、予定通りログイン画面を表示する
    return await ctx.next();
  }

  // 🛑 2. 通常の管理画面で、通行証（トークン）がCookieに無ければログイン画面へ即座にリダイレクト！
  if (!token) {
    return new Response("", {
      status: 302,
      headers: { Location: "/admin/login" },
    });
  }

  // 🔑 3. 通行証があれば合格！本来表示したい画面の処理へ進める
  return await ctx.next();
}
