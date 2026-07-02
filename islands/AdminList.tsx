import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { adminFetch } from "../utils/api.ts";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

export default function AdminList() {
  const admins = useSignal<AdminUser[]>([]);
  const error = useSignal("");
  const loading = useSignal(true);

  // 💡 async / await を使って、まるで上から下に普通に流れるかのように書く
  useEffect(() => {
    async function fetchData() {
      try {
        // 🔮 魔法のようにスッキリ！ 戻り値を直接シグナルに代入！
        // <AdminUser[]> をつけることで、「この通信からは管理者の配列が返ってくるよ」とTypeScriptに教えてあげます
        admins.value = await adminFetch<AdminUser[]>("/admin/admins");
      } catch (err) {
        if (err instanceof Error) {
          error.value = err.message; // Goが返した具体的なエラー、または共通エラーが入る
        }
      } finally {
        loading.value = false; // 成功しても失敗しても、読み込み中フラグはOFFにする
      }
    }

    fetchData();
  }, []);

  return (
    <div class="bg-white rounded-lg shadow overflow-hidden">
      {error.value && (
        <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded m-4 text-sm">
          {error.value}
        </div>
      )}

      {loading.value ? (
        <div class="p-6 text-center text-gray-500">データを読み込み中...</div>
      ) : admins.value.length === 0 ? (
        <div class="p-6 text-center text-gray-500">
          登録されている管理スタッフはいません。
        </div>
      ) : (
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 text-gray-600 text-sm font-semibold border-b border-gray-200">
              <th class="p-4 w-16">ID</th>
              <th class="p-4">名前</th>
              <th class="p-4">メールアドレス</th>
              <th class="p-4 w-40">登録日</th>
              <th class="p-4 w-32 text-center">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-sm text-gray-700">
            {admins.value.map((admin) => (
              <tr key={admin.id} class="hover:bg-gray-50 transition-colors">
                <td class="p-4 font-mono text-gray-400">{admin.id}</td>
                <td class="p-4 font-bold text-gray-900">{admin.name}</td>
                <td class="p-4 text-gray-500">{admin.email}</td>
                <td class="p-4 text-gray-400">
                  {new Date(admin.createdAt).toLocaleDateString("ja-JP")}
                </td>
                <td class="p-4 text-center space-x-2">
                  <button
                    type="button"
                    class="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    class="text-red-600 hover:text-red-800 font-medium"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
