import { assertEquals } from "$std/assert/mod.ts";
import { getCookieValue } from "./publicEvent.ts";

Deno.test("Cookie文字列から指定値を復号して取得する", () => {
  assertEquals(
    getCookieValue(
      "theme=dark; visitor_id=user%20123; mode=compact",
      "visitor_id",
    ),
    "user 123",
  );
});

Deno.test("存在しないCookieと不正なエンコードを安全に扱う", () => {
  assertEquals(getCookieValue("theme=dark", "visitor_id"), "");
  assertEquals(getCookieValue("visitor_id=%E0%A4%A", "visitor_id"), "");
});
