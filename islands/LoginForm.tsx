import { useSignal } from "@preact/signals";
import { adminFetch } from "../utils/api.ts";

export default function LoginForm() {
  const email = useSignal("");
  const password = useSignal("");
  const error = useSignal("");

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    error.value = "";

    try {
      // 🔮 魔法のようにスッキリ！
      // URLのベタ書きも、面倒なJSON.stringifyも、ヘッダー設定も、res.json()の解析もすべて自動化！
      interface LoginResponse {
        token: string;
      }

      const data = await adminFetch<LoginResponse>("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email: email.value, password: password.value }),
      });

      // 🔑 2. 成功したらCookieに保存（ここはブラウザのお掃除タイマー用に残します）
      globalThis.document.cookie = `admin_token=${data.token}; max-age=259200; path=/; SameSite=Lax`;

      // 🚀 3. 管理トップページへジャンプ
      globalThis.location.href = "/admin";
    } catch (err) {
      if (err instanceof Error) {
        // パスワード間違い時は、Goが返してくれた「メールアドレスかパスワードが違います」が自動でここに入ります！
        error.value = err.message;
      } else {
        error.value = "予期せぬエラーが発生しました。";
      }
    }
  };

  return (
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 class="text-2xl font-bold text-gray-700 text-center mb-6">
          管理画面 ログイン
        </h2>

        {error.value && (
          <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 text-sm">
            {error.value}
          </div>
        )}

        <form onSubmit={handleLogin} class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              value={email.value}
              onInput={(e) =>
                (email.value = (e.target as HTMLInputElement).value)
              }
              required
              class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={password.value}
              onInput={(e) =>
                (password.value = (e.target as HTMLInputElement).value)
              }
              required
              class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition-colors shadow"
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
