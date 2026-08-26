export default function LogoutButton() {
  const handleLogout = () => {
    // 💡 Cookieの有効期限を過去（max-age=0）にすることで、ブラウザにCookieを即座に消去させます
    globalThis.document.cookie = "admin_token=; max-age=0; path=/;";
    // ログイン画面へ戻す
    globalThis.location.href = "/admin/login";
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      class="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded text-sm transition-colors"
    >
      ログアウト
    </button>
  );
}
