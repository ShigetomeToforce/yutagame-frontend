import { useSignal } from "@preact/signals";

export default function LoginForm() {
  const email = useSignal("");
  const password = useSignal("");
  const error = useSignal("");

  const handleLogin = async (e: Event) => {
    e.preventDefault();
    error.value = "";

    try {
      // 1. いつも通りGoにログインをリクエスト
      const res = await fetch("http://localhost:8080/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.value, password: password.value }),
      });

      if (!res.ok) {
        throw new Error(
          "ログインに失敗しました。メールアドレスかパスワードが違います。",
        );
      }

      const data = await res.json();

      // 🔑 2. 【変更点】LocalStorageではなく「Cookie」に保存する
      // max-age=259200 は 72時間（秒換算）という意味です。path=/ でサイト全体で有効にします。
      globalThis.document.cookie = `admin_token=${data.token}; max-age=259200; path=/; SameSite=Lax`;

      // 🚀 3. 管理トップページへジャンプ
      globalThis.location.href = "/admin";
    } catch (err) {
      if (err instanceof Error) {
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
