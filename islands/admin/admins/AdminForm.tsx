import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";

interface AdminRecord {
  id: number;
  name: string;
  email: string;
  roleType: "ADMIN" | "USER";
}

interface AdminFormState {
  name: string;
  email: string;
  password: string;
  roleType: "ADMIN" | "USER";
}

const DEFAULT_FORM: AdminFormState = {
  name: "",
  email: "",
  password: "",
  roleType: "ADMIN",
};

interface Props {
  mode: "create" | "edit";
  adminId?: number;
}

export default function AdminForm({ mode, adminId }: Props) {
  const form = useSignal<AdminFormState>({ ...DEFAULT_FORM });
  const submitError = useSignal("");
  const isSubmitting = useSignal(false);
  const isLoading = useSignal(mode === "edit");

  useEffect(() => {
    if (mode !== "edit" || !adminId) {
      isLoading.value = false;
      return;
    }

    void (async () => {
      try {
        const admin = await adminFetch<AdminRecord>(`/admin/admins/${adminId}`);
        form.value = {
          name: admin.name ?? "",
          email: admin.email ?? "",
          password: "",
          roleType: admin.roleType ?? "ADMIN",
        };
      } catch (error) {
        submitError.value = error instanceof Error
          ? error.message
          : "Adminユーザーの取得に失敗しました。";
      } finally {
        isLoading.value = false;
      }
    })();
  }, [adminId, mode]);

  const validateForm = () => {
    if (!form.value.name.trim()) return "名前は必須です。";
    if (!form.value.email.trim()) return "メールアドレスは必須です。";
    if (mode === "create" && !form.value.password.trim()) {
      return "パスワードは必須です。";
    }
    if (!["ADMIN", "USER"].includes(form.value.roleType)) {
      return "権限が不正です。";
    }
    return "";
  };

  const handleSubmit = async (event: Event) => {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      submitError.value = validationMessage;
      return;
    }

    isSubmitting.value = true;
    submitError.value = "";

    try {
      const payload = {
        name: form.value.name.trim(),
        email: form.value.email.trim(),
        password: form.value.password,
        roleType: form.value.roleType,
      };

      const endpoint = mode === "edit" && adminId
        ? `/admin/admins/${adminId}`
        : "/admin/admins";
      const method = mode === "edit" ? "PUT" : "POST";

      await adminFetch(endpoint, { method, body: JSON.stringify(payload) });
      globalThis.location.href = "/admin/admins";
    } catch (error) {
      submitError.value = error instanceof Error
        ? error.message
        : "保存に失敗しました。";
    } finally {
      isSubmitting.value = false;
    }
  };

  const handleDelete = async () => {
    if (!adminId) return;

    const confirmed = globalThis.confirm(
      "このAdminユーザーを削除してもよろしいですか？",
    );
    if (!confirmed) return;

    try {
      await adminFetch(`/admin/admins/${adminId}`, { method: "DELETE" });
      globalThis.location.href = "/admin/admins";
    } catch (error) {
      submitError.value = error instanceof Error
        ? error.message
        : "削除に失敗しました。";
    }
  };

  return (
    <div class="mx-auto max-w-5xl">
      <div class="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div class="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div class="flex min-w-0 items-center gap-3">
            {mode === "edit" && typeof adminId === "number" && (
              <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5">
                <div class="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                  ID
                </div>
                <div class="font-mono text-sm font-bold text-gray-800">
                  {adminId}
                </div>
              </div>
            )}
            <h1 class="text-xl font-bold text-gray-900 sm:text-2xl">
              {mode === "edit" ? "Adminユーザー編集" : "Adminユーザー新規登録"}
            </h1>
          </div>

          <div class="flex items-center gap-3">
            <a
              href="/admin/admins"
              class="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              一覧へ戻る
            </a>
            <button
              type="submit"
              form="admin-form"
              disabled={isSubmitting.value || isLoading.value}
              class="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSubmitting.value
                ? "保存中..."
                : mode === "edit"
                ? "更新する"
                : "登録する"}
            </button>
          </div>
        </div>
      </div>

      <form
        id="admin-form"
        onSubmit={handleSubmit}
        class="space-y-8 p-4 sm:p-6"
      >
        {isLoading.value && (
          <div class="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            読み込み中です...
          </div>
        )}
        {submitError.value && (
          <div class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError.value}
          </div>
        )}

        <div class="grid gap-6 md:grid-cols-2">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              名前<span class="ml-1 text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.value.name}
              maxLength={32}
              onInput={(
                e,
              ) => (form.value = {
                ...form.value,
                name: (e.target as HTMLInputElement).value,
              })}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              メールアドレス<span class="ml-1 text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.value.email}
              onInput={(
                e,
              ) => (form.value = {
                ...form.value,
                email: (e.target as HTMLInputElement).value,
              })}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              パスワード{mode === "create" && (
                <span class="ml-1 text-red-500">*</span>
              )}
            </label>
            <input
              type="password"
              value={form.value.password}
              onInput={(
                e,
              ) => (form.value = {
                ...form.value,
                password: (e.target as HTMLInputElement).value,
              })}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={mode === "edit"
                ? "変更する場合のみ入力"
                : "8文字以上推奨"}
              required={mode === "create"}
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              権限<span class="ml-1 text-red-500">*</span>
            </label>
            <select
              value={form.value.roleType}
              onChange={(
                e,
              ) => (form.value = {
                ...form.value,
                roleType: (e.target as HTMLSelectElement).value as
                  | "ADMIN"
                  | "USER",
              })}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="ADMIN">ADMIN</option>
              <option value="USER">USER</option>
            </select>
          </div>
        </div>

        {mode === "edit" && (
          <div class="border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={handleDelete}
              class="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700"
            >
              削除
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
