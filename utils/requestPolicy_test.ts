import { assertEquals } from "$std/assert/mod.ts";
import {
  isLikelyBotUserAgent,
  resolveLogKind,
  resolveLogLevel,
  resolveLogScope,
  shouldBypassPublicPage,
  shouldRecordPageView,
  shouldWriteRequestLog,
} from "./requestPolicy.ts";

Deno.test("公開ページの除外対象をパス境界込みで判定する", () => {
  assertEquals(shouldBypassPublicPage("/admin"), true);
  assertEquals(shouldBypassPublicPage("/admin/games"), true);
  assertEquals(shouldBypassPublicPage("/administrator"), false);
  assertEquals(shouldBypassPublicPage("/_fresh/app.js"), true);
  assertEquals(shouldBypassPublicPage("/games/logo.png"), true);
  assertEquals(shouldBypassPublicPage("/app/games"), false);
});

Deno.test("ファイルログは画面とAPIを残し静的ファイルを除外する", () => {
  assertEquals(shouldWriteRequestLog("/admin/games"), true);
  assertEquals(shouldWriteRequestLog("/api/app/games"), true);
  assertEquals(shouldWriteRequestLog("/_fresh/app.js"), false);
  assertEquals(shouldWriteRequestLog("/images/game.webp"), false);
});

Deno.test("ログ分類とレベルを判定する", () => {
  assertEquals(resolveLogScope("/admin/games"), "admin");
  assertEquals(resolveLogScope("/administrator"), "app");
  assertEquals(resolveLogKind("/api/app/games"), "api");
  assertEquals(resolveLogKind("/app/games"), "access");
  assertEquals(resolveLogLevel(200), "info");
  assertEquals(resolveLogLevel(404), "warn");
  assertEquals(resolveLogLevel(500), "error");
});

Deno.test("PVは成功したGETだけを対象にする", () => {
  assertEquals(shouldRecordPageView("GET", 200), true);
  assertEquals(shouldRecordPageView("GET", 299), true);
  assertEquals(shouldRecordPageView("HEAD", 200), false);
  assertEquals(shouldRecordPageView("POST", 204), false);
  assertEquals(shouldRecordPageView("GET", 302), false);
  assertEquals(shouldRecordPageView("GET", 404), false);
});

Deno.test("PVはBotやクローラーのUser-Agentを対象外にする", () => {
  assertEquals(isLikelyBotUserAgent("Googlebot/2.1"), true);
  assertEquals(isLikelyBotUserAgent("Mozilla/5.0 AppleWebKit Safari"), false);
  assertEquals(shouldRecordPageView("GET", 200, "Googlebot/2.1"), false);
  assertEquals(shouldRecordPageView("GET", 200, "curl/8.7.1"), false);
});
