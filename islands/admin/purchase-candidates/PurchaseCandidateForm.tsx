import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";
import { buildImageUrl } from "../../../utils/image.ts";

interface OptionItem {
  id: number;
  name: string;
}

interface PurchaseCandidateRecord {
  id: number;
  name: string;
  kana: string;
  imageKey?: string | null;
  code: string;
  listPrice?: number | null;
  officialSiteUrl: string;
  youtubeUrl: string;
  releaseDateText: string;
  manufacturerId: number;
  machineId: number;
  genreId?: number | null;
  isPurchased: boolean;
}

interface FormState {
  name: string;
  kana: string;
  code: string;
  listPrice: string;
  officialSiteUrl: string;
  youtubeUrl: string;
  releaseDateText: string;
  manufacturerId: string;
  machineId: string;
  genreId: string;
  isPurchased: boolean;
  imageKey: string;
}

interface Props {
  mode?: "create" | "edit";
  candidateId?: number;
}

const EMPTY_FORM: FormState = {
  name: "",
  kana: "",
  code: "",
  listPrice: "",
  officialSiteUrl: "",
  youtubeUrl: "",
  releaseDateText: "",
  manufacturerId: "",
  machineId: "",
  genreId: "",
  isPurchased: false,
  imageKey: "",
};

const CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

export default function PurchaseCandidateForm(
  { mode = "create", candidateId }: Props,
) {
  const manufacturers = useSignal<OptionItem[]>([]);
  const machines = useSignal<OptionItem[]>([]);
  const genres = useSignal<OptionItem[]>([]);
  const form = useSignal<FormState>({ ...EMPTY_FORM });
  const loading = useSignal(mode === "edit");
  const submitting = useSignal(false);
  const deleting = useSignal(false);
  const error = useSignal("");
  const selectedImageFile = useSignal<File | null>(null);
  const selectedImageUrl = useSignal("");

  useEffect(() => {
    void (async () => {
      try {
        const [manufacturerItems, machineItems, genreItems] = await Promise.all(
          [
            adminFetch<OptionItem[]>("/admin/manufacturers"),
            adminFetch<OptionItem[]>("/admin/machines"),
            adminFetch<OptionItem[]>("/admin/genres"),
          ],
        );
        manufacturers.value = manufacturerItems ?? [];
        machines.value = machineItems ?? [];
        genres.value = genreItems ?? [];

        if (mode === "edit" && candidateId) {
          const item = await adminFetch<PurchaseCandidateRecord>(
            `/admin/purchase-candidates/${candidateId}`,
          );
          form.value = {
            name: item.name ?? "",
            kana: item.kana ?? "",
            code: item.code ?? "",
            listPrice: item.listPrice ? String(item.listPrice) : "",
            officialSiteUrl: item.officialSiteUrl ?? "",
            youtubeUrl: item.youtubeUrl ?? "",
            releaseDateText: item.releaseDateText ?? "",
            manufacturerId: item.manufacturerId
              ? String(item.manufacturerId)
              : "",
            machineId: item.machineId ? String(item.machineId) : "",
            genreId: item.genreId ? String(item.genreId) : "",
            isPurchased: Boolean(item.isPurchased),
            imageKey: item.imageKey ?? "",
          };
        }
      } catch (reason) {
        error.value = reason instanceof Error
          ? reason.message
          : "データの読み込みに失敗しました。";
      } finally {
        loading.value = false;
      }
    })();
  }, [candidateId, mode]);

  useEffect(() => () => {
    if (selectedImageUrl.value) URL.revokeObjectURL(selectedImageUrl.value);
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    form.value = { ...form.value, [key]: value };
  };

  const selectImage = (event: Event) => {
    const nextImage = (event.target as HTMLInputElement).files?.[0] || null;
    if (selectedImageUrl.value) URL.revokeObjectURL(selectedImageUrl.value);
    selectedImageFile.value = nextImage;
    selectedImageUrl.value = nextImage ? URL.createObjectURL(nextImage) : "";
  };

  const buildPayload = () => {
    const price = form.value.listPrice.trim();
    const genreId = form.value.genreId.trim();
    return {
      name: form.value.name,
      kana: form.value.kana,
      code: form.value.code,
      listPrice: price ? Number(price) : null,
      officialSiteUrl: form.value.officialSiteUrl,
      youtubeUrl: form.value.youtubeUrl,
      releaseDateText: form.value.releaseDateText,
      manufacturerId: Number(form.value.manufacturerId) || 0,
      machineId: Number(form.value.machineId) || 0,
      genreId: genreId ? Number(genreId) : null,
      isPurchased: mode === "edit" ? form.value.isPurchased : false,
    };
  };

  const uploadImage = async (id: number) => {
    if (!selectedImageFile.value) return;
    const body = new FormData();
    body.append("image", selectedImageFile.value);
    await adminFetch(`/admin/purchase-candidates/${id}/image`, {
      method: "POST",
      body,
    });
  };

  const submit = async (event: Event) => {
    event.preventDefault();
    error.value = "";
    if (!CODE_PATTERN.test(form.value.code)) {
      error.value =
        "コードは半角英数字、ハイフン、アンダースコアのみ使用できます。";
      return;
    }
    submitting.value = true;
    try {
      const saved = mode === "edit" && candidateId
        ? await adminFetch<PurchaseCandidateRecord>(
          `/admin/purchase-candidates/${candidateId}`,
          { method: "PUT", body: JSON.stringify(buildPayload()) },
        )
        : await adminFetch<PurchaseCandidateRecord>(
          "/admin/purchase-candidates",
          {
            method: "POST",
            body: JSON.stringify(buildPayload()),
          },
        );
      await uploadImage(saved.id);
      globalThis.location.href = "/admin/purchase-candidates";
    } catch (reason) {
      error.value = reason instanceof Error
        ? reason.message
        : "保存に失敗しました。";
    } finally {
      submitting.value = false;
    }
  };

  const remove = async () => {
    if (!candidateId || !globalThis.confirm("この購入候補を削除しますか？")) {
      return;
    }
    deleting.value = true;
    try {
      await adminFetch(`/admin/purchase-candidates/${candidateId}`, {
        method: "DELETE",
      });
      globalThis.location.href = "/admin/purchase-candidates";
    } catch (reason) {
      error.value = reason instanceof Error
        ? reason.message
        : "削除に失敗しました。";
    } finally {
      deleting.value = false;
    }
  };

  if (loading.value) return <p class="text-sm text-slate-500">読み込み中...</p>;

  return (
    <div class="mx-auto max-w-5xl">
      <div class="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div class="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <h1 class="text-xl font-bold text-gray-900 sm:text-2xl">
            購入候補管理
          </h1>
          <div class="flex items-center gap-3">
            <a
              href="/admin/purchase-candidates"
              class="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              一覧へ戻る
            </a>
            <button
              type="submit"
              form="purchase-candidate-form"
              disabled={submitting.value}
              class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting.value ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      </div>

      <form
        id="purchase-candidate-form"
        onSubmit={submit}
        class="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="text-sm font-semibold text-slate-700">
            名前<span class="text-red-500">*</span>
            <input
              required
              value={form.value.name}
              onInput={(e) => set("name", (e.target as HTMLInputElement).value)}
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            />
          </label>
          <label class="text-sm font-semibold text-slate-700">
            カナ<span class="text-red-500">*</span>
            <input
              required
              value={form.value.kana}
              onInput={(e) => set("kana", (e.target as HTMLInputElement).value)}
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            />
          </label>
          <label class="text-sm font-semibold text-slate-700">
            コード<span class="text-red-500">*</span>
            <input
              required
              value={form.value.code}
              onInput={(e) => set("code", (e.target as HTMLInputElement).value)}
              placeholder="例: switch2-001"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            />
          </label>
          <label class="text-sm font-semibold text-slate-700">
            価格
            <input
              type="number"
              min="0"
              value={form.value.listPrice}
              onInput={(e) =>
                set("listPrice", (e.target as HTMLInputElement).value)}
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            />
          </label>
          <label class="text-sm font-semibold text-slate-700">
            メーカー<span class="text-red-500">*</span>
            <select
              required
              value={form.value.manufacturerId}
              onInput={(e) =>
                set("manufacturerId", (e.target as HTMLSelectElement).value)}
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            >
              <option value="">選択してください</option>
              {manufacturers.value.map((item) => (
                <option value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label class="text-sm font-semibold text-slate-700">
            機種<span class="text-red-500">*</span>
            <select
              required
              value={form.value.machineId}
              onInput={(e) =>
                set("machineId", (e.target as HTMLSelectElement).value)}
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            >
              <option value="">選択してください</option>
              {machines.value.map((item) => (
                <option value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label class="text-sm font-semibold text-slate-700">
            ジャンル
            <select
              value={form.value.genreId}
              onInput={(e) =>
                set("genreId", (e.target as HTMLSelectElement).value)}
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            >
              <option value="">未設定</option>
              {genres.value.map((item) => (
                <option value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label class="text-sm font-semibold text-slate-700">
            リリース日
            <input
              value={form.value.releaseDateText}
              onInput={(e) =>
                set("releaseDateText", (e.target as HTMLInputElement).value)}
              placeholder="未定 / 2027年頃 など"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            />
          </label>
          <label class="text-sm font-semibold text-slate-700">
            公式URL
            <input
              type="url"
              value={form.value.officialSiteUrl}
              onInput={(e) =>
                set("officialSiteUrl", (e.target as HTMLInputElement).value)}
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            />
          </label>
          <label class="text-sm font-semibold text-slate-700">
            YouTube URL
            <input
              type="url"
              value={form.value.youtubeUrl}
              onInput={(e) =>
                set("youtubeUrl", (e.target as HTMLInputElement).value)}
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"
            />
          </label>
          {mode === "edit" && (
            <label class="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.value.isPurchased}
                onChange={(e) =>
                  set("isPurchased", (e.target as HTMLInputElement).checked)}
              />
              購入済み
            </label>
          )}
        </div>

        <section class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label class="text-sm font-semibold text-slate-700">
            画像
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={selectImage}
              class="mt-1 block w-full text-sm font-normal"
            />
          </label>
          {(form.value.imageKey || selectedImageUrl.value) && (
            <div class="mt-4 grid gap-4 sm:grid-cols-2">
              {form.value.imageKey && (
                <section>
                  <p class="mb-2 text-sm font-semibold text-slate-700">
                    現在の画像
                  </p>
                  <img
                    src={buildImageUrl(
                      form.value.imageKey,
                      "purchase-candidates",
                    )}
                    alt="現在の画像"
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
                    alt="アップロード予定の画像"
                    class="max-h-64 w-full rounded-lg object-contain ring-2 ring-emerald-400"
                  />
                </section>
              )}
            </div>
          )}
        </section>

        {error.value && (
          <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error.value}
          </p>
        )}

        {mode === "edit" && (
          <div class="border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={remove}
              disabled={deleting.value}
              class="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {deleting.value ? "削除中..." : "削除する"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
