import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";
import { buildImageUrl } from "../../../utils/image.ts";

const placementOptions = [
  ["top_above", "TOP画面上"],
  ["top_below", "TOP画面下"],
  ["search_above", "ゲーム検索画面上"],
  ["search_below", "ゲーム検索画面下"],
  ["ranking_above", "ランキング画面上"],
  ["ranking_below", "ランキング画面下"],
  ["game_detail_below", "ゲーム詳細画面下"],
];
const empty = {
  title: "",
  placement: "top_above",
  linkUrl: "",
  openInNewTab: false,
  startsAt: "",
  endsAt: "",
  imageKey: "",
  clickCount: 0,
};
type FormData = typeof empty;

export default function BannerForm({ id }: { id?: number }) {
  const form = useSignal<FormData>({ ...empty });
  const image = useSignal<File | null>(null);
  const selectedImageUrl = useSignal("");
  const loading = useSignal(Boolean(id));
  const submitting = useSignal(false);
  const error = useSignal("");
  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const banner = await adminFetch<any>(`/admin/banners/${id}`);
        form.value = {
          title: banner.title,
          placement: banner.placement,
          linkUrl: banner.linkUrl || "",
          openInNewTab: banner.openInNewTab,
          startsAt: banner.startsAt?.slice(0, 16) || "",
          endsAt: banner.endsAt?.slice(0, 16) || "",
          imageKey: banner.imageKey || "",
          clickCount: banner.clickCount || 0,
        };
      } catch (reason) {
        error.value = reason instanceof Error
          ? reason.message
          : "読み込みに失敗しました。";
      } finally {
        loading.value = false;
      }
    })();
  }, [id]);
  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    form.value = { ...form.value, [key]: value };
  const selectImage = (event: Event) => {
    const nextImage = (event.target as HTMLInputElement).files?.[0] || null;
    if (selectedImageUrl.value) {
      URL.revokeObjectURL(selectedImageUrl.value);
    }
    image.value = nextImage;
    selectedImageUrl.value = nextImage ? URL.createObjectURL(nextImage) : "";
  };
  useEffect(() => () => {
    if (selectedImageUrl.value) {
      URL.revokeObjectURL(selectedImageUrl.value);
    }
  }, []);
  const submit = async (event: Event) => {
    event.preventDefault();
    submitting.value = true;
    error.value = "";
    try {
      const payload = {
        ...form.value,
        startsAt: form.value.startsAt
          ? new Date(form.value.startsAt).toISOString()
          : null,
        endsAt: form.value.endsAt
          ? new Date(form.value.endsAt).toISOString()
          : null,
      };
      const banner = id
        ? await adminFetch<any>(`/admin/banners/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        : await adminFetch<any>("/admin/banners", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      if (image.value) {
        const data = new FormData();
        data.append("image", image.value);
        await adminFetch(`/admin/banners/${banner.id}/image`, {
          method: "POST",
          body: data,
        });
      }
      globalThis.location.href = "/admin/banners";
    } catch (reason) {
      error.value = reason instanceof Error
        ? reason.message
        : "保存に失敗しました。";
    } finally {
      submitting.value = false;
    }
  };
  const remove = async () => {
    if (!id || !globalThis.confirm("このバナーを削除しますか？")) return;
    try {
      await adminFetch(`/admin/banners/${id}`, { method: "DELETE" });
      globalThis.location.href = "/admin/banners";
    } catch (reason) {
      error.value = reason instanceof Error
        ? reason.message
        : "削除に失敗しました。";
    }
  };
  if (loading.value) return <p class="text-sm text-slate-500">読み込み中...</p>;
  return (
    <form
      onSubmit={submit}
      class="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div class="flex items-center justify-between">
        <a
          href="/admin/banners"
          class="text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          一覧へ戻る
        </a>
        {id && (
          <span class="text-sm text-slate-500">
            クリック数: {form.value.clickCount}
          </span>
        )}
      </div>
      <div class="grid gap-4">
        <label class="text-sm font-semibold text-slate-700">
          タイトル<input
            required
            value={form.value.title}
            onInput={(e) => set("title", (e.target as HTMLInputElement).value)}
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
          />
        </label>
        <label class="text-sm font-semibold text-slate-700">
          設置箇所<select
            value={form.value.placement}
            onChange={(e) =>
              set("placement", (e.target as HTMLSelectElement).value)}
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
          >
            {placementOptions.map(([value, label]) => (
              <option value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label class="text-sm font-semibold text-slate-700">
          リンク先URL<input
            type="url"
            value={form.value.linkUrl}
            onInput={(e) =>
              set("linkUrl", (e.target as HTMLInputElement).value)}
            class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
          />
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.value.openInNewTab}
            onChange={(e) =>
              set("openInNewTab", (e.target as HTMLInputElement).checked)}
          />別タブで開く
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="text-sm font-semibold text-slate-700">
            公開開始<input
              type="datetime-local"
              value={form.value.startsAt}
              onInput={(e) =>
                set("startsAt", (e.target as HTMLInputElement).value)}
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            />
          </label>
          <label class="text-sm font-semibold text-slate-700">
            公開終了<input
              type="datetime-local"
              value={form.value.endsAt}
              onInput={(e) =>
                set("endsAt", (e.target as HTMLInputElement).value)}
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            />
          </label>
        </div>
        <label class="text-sm font-semibold text-slate-700">
          バナー画像<input
            required={!id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={selectImage}
            class="mt-1 block w-full text-sm font-normal"
          />
        </label>
        {(form.value.imageKey || selectedImageUrl.value) && (
          <div class="grid gap-4 sm:grid-cols-2">
            {form.value.imageKey && (
              <section>
                <p class="mb-2 text-sm font-semibold text-slate-700">
                  現在のバナー
                </p>
                <img
                  src={buildImageUrl(form.value.imageKey, "banners")}
                  alt="現在のバナー"
                  class="max-h-64 w-full rounded-lg object-contain ring-1 ring-slate-200"
                />
              </section>
            )}
            {selectedImageUrl.value && (
              <section>
                <p class="mb-2 text-sm font-semibold text-slate-700">
                  アップロード予定の画像
                </p>
                <img
                  src={selectedImageUrl.value}
                  alt="アップロード予定のバナー"
                  class="max-h-64 w-full rounded-lg object-contain ring-2 ring-emerald-400"
                />
              </section>
            )}
          </div>
        )}
      </div>
      {error.value && (
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.value}
        </p>
      )}
      <div class="flex flex-wrap justify-between gap-3">
        <button
          type="submit"
          disabled={submitting.value}
          class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {submitting.value ? "保存中..." : "保存する"}
        </button>
        {id && (
          <button
            type="button"
            onClick={remove}
            class="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            削除する
          </button>
        )}
      </div>
    </form>
  );
}
