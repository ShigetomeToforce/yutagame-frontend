import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { adminFetch } from "../../../utils/api.ts";

interface ManufacturerOption {
  id: number;
  name: string;
}

interface MachineRecord {
  id: number;
  name: string;
  kana: string;
  overview: string;
  code: string;
  abbreviation: string;
  manufacturerId: number;
  machineType: string;
  releaseDate: string;
  sortOrder: number;
}

interface MachineFormState {
  name: string;
  kana: string;
  overview: string;
  code: string;
  abbreviation: string;
  manufacturerId: number | null;
  machineType: string;
  releaseDate: string;
  sortOrder: string;
}

const DEFAULT_FORM: MachineFormState = {
  name: "",
  kana: "",
  overview: "",
  code: "",
  abbreviation: "",
  manufacturerId: null,
  machineType: "CONSOLE",
  releaseDate: "",
  sortOrder: "0",
};

const CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

interface Props {
  mode: "create" | "edit";
  machineCode?: string;
}

export default function MachineForm({ mode, machineCode }: Props) {
  const form = useSignal<MachineFormState>({ ...DEFAULT_FORM });
  const manufacturers = useSignal<ManufacturerOption[]>([]);
  const machineId = useSignal<number | null>(null);

  const isLoading = useSignal(true);
  const isSubmitting = useSignal(false);
  const submitError = useSignal("");

  useEffect(() => {
    void (async () => {
      isLoading.value = true;
      submitError.value = "";

      try {
        const manufacturerResponse = await adminFetch<ManufacturerOption[]>(
          "/admin/manufacturers",
        );
        manufacturers.value = manufacturerResponse ?? [];

        if (mode === "edit") {
          if (!machineCode) {
            throw new Error("機種コードが指定されていません。");
          }

          const machine = await adminFetch<MachineRecord>(
            `/admin/machines/code/${encodeURIComponent(machineCode)}`,
          );

          machineId.value = machine.id;
          form.value = {
            name: machine.name ?? "",
            kana: machine.kana ?? "",
            overview: machine.overview ?? "",
            code: machine.code ?? "",
            abbreviation: machine.abbreviation ?? "",
            manufacturerId: machine.manufacturerId ?? null,
            machineType: machine.machineType ?? "CONSOLE",
            releaseDate: (machine.releaseDate ?? "").split("T")[0] ?? "",
            sortOrder: String(machine.sortOrder ?? 0),
          };
        }
      } catch (error) {
        submitError.value = error instanceof Error
          ? error.message
          : "機種データの取得に失敗しました。";
      } finally {
        isLoading.value = false;
      }
    })();
  }, [mode, machineCode]);

  const updateField = <K extends keyof MachineFormState>(
    key: K,
    value: MachineFormState[K],
  ) => {
    form.value = { ...form.value, [key]: value };
  };

  const validateForm = () => {
    if (!form.value.name.trim()) {
      return "名前は必須です。";
    }
    if (!form.value.kana.trim()) {
      return "カナは必須です。";
    }
    if (!form.value.overview.trim()) {
      return "概要は必須です。";
    }
    if (!form.value.code.trim()) {
      return "コードは必須です。";
    }
    if (!CODE_PATTERN.test(form.value.code.trim())) {
      return "コードは半角英数字・ハイフン・アンダーバーのみで入力してください。";
    }
    if (!form.value.abbreviation.trim()) {
      return "略称は必須です。";
    }
    if (form.value.manufacturerId === null) {
      return "メーカーは必須です。";
    }
    if (!form.value.machineType.trim()) {
      return "種別は必須です。";
    }
    if (!form.value.releaseDate) {
      return "発売日は必須です。";
    }
    if (
      form.value.sortOrder.trim() && !/^\d+$/.test(form.value.sortOrder.trim())
    ) {
      return "並び順は数値で入力してください。";
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

    if (mode === "edit" && !machineId.value) {
      submitError.value = "更新対象の機種IDが取得できません。";
      return;
    }

    isSubmitting.value = true;
    submitError.value = "";

    try {
      const payload = {
        name: form.value.name.trim(),
        kana: form.value.kana.trim(),
        overview: form.value.overview.trim(),
        code: form.value.code.trim(),
        abbreviation: form.value.abbreviation.trim(),
        manufacturerId: Number(form.value.manufacturerId),
        machineType: form.value.machineType.trim(),
        releaseDate: form.value.releaseDate,
        sortOrder: Number(form.value.sortOrder || 0),
      };

      if (mode === "edit") {
        await adminFetch(`/admin/machines/${machineId.value}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await adminFetch("/admin/machines", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      globalThis.location.href = "/admin/machines";
    } catch (error) {
      submitError.value = error instanceof Error
        ? error.message
        : "保存に失敗しました。";
    } finally {
      isSubmitting.value = false;
    }
  };

  const handleDelete = async () => {
    if (!machineId.value) {
      return;
    }

    const confirmed = globalThis.confirm(
      "この機種を削除してもよろしいですか？",
    );
    if (!confirmed) {
      return;
    }

    try {
      await adminFetch(`/admin/machines/${machineId.value}`, {
        method: "DELETE",
      });
      globalThis.location.href = "/admin/machines";
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
            <h1 class="text-xl font-bold text-gray-900 sm:text-2xl">
              {mode === "edit" ? "機種編集" : "機種新規登録"}
            </h1>
          </div>

          <div class="flex items-center gap-3">
            <a
              href="/admin/machines"
              class="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              一覧へ戻る
            </a>
            <button
              type="submit"
              form="machine-form"
              disabled={isSubmitting.value || isLoading.value}
              class="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSubmitting.value
                ? "保存中..."
                : (mode === "edit" ? "更新する" : "登録する")}
            </button>
          </div>
        </div>
      </div>

      <form
        id="machine-form"
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
          {mode === "edit" && machineId.value !== null && (
            <div class="space-y-2 md:col-span-2">
              <div class="flex items-center gap-3">
                <label class="text-sm font-medium text-gray-700">ID</label>
                <input
                  type="text"
                  value={String(machineId.value)}
                  readOnly
                  class="w-24 rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700 sm:w-32"
                />
              </div>
            </div>
          )}

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              名前
              <span class="ml-1 text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.value.name}
              maxLength={100}
              onInput={(event) =>
                updateField("name", (event.target as HTMLInputElement).value)}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              カナ
              <span class="ml-1 text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.value.kana}
              maxLength={100}
              onInput={(event) =>
                updateField("kana", (event.target as HTMLInputElement).value)}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div class="space-y-2 md:col-span-2">
            <label class="block text-sm font-medium text-gray-700">
              概要
              <span class="ml-1 text-red-500">*</span>
            </label>
            <textarea
              value={form.value.overview}
              rows={6}
              maxLength={1000}
              onInput={(event) =>
                updateField(
                  "overview",
                  (event.target as HTMLTextAreaElement).value,
                )}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              コード
              <span class="ml-1 text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.value.code}
              onInput={(event) =>
                updateField("code", (event.target as HTMLInputElement).value)}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              略称
              <span class="ml-1 text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.value.abbreviation}
              maxLength={50}
              onInput={(event) =>
                updateField(
                  "abbreviation",
                  (event.target as HTMLInputElement).value,
                )}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              メーカー
              <span class="ml-1 text-red-500">*</span>
            </label>
            <select
              value={form.value.manufacturerId ?? ""}
              onChange={(event) =>
                updateField(
                  "manufacturerId",
                  Number((event.target as HTMLSelectElement).value) || null,
                )}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">選択してください</option>
              {manufacturers.value.map((manufacturer) => (
                <option key={manufacturer.id} value={manufacturer.id}>
                  {manufacturer.name}
                </option>
              ))}
            </select>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              種別
              <span class="ml-1 text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.value.machineType}
              maxLength={50}
              onInput={(event) =>
                updateField(
                  "machineType",
                  (event.target as HTMLInputElement).value,
                )}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              発売日
              <span class="ml-1 text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.value.releaseDate}
              onInput={(event) =>
                updateField(
                  "releaseDate",
                  (event.target as HTMLInputElement).value,
                )}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              並び順
            </label>
            <input
              type="number"
              min={0}
              value={form.value.sortOrder}
              onInput={(event) =>
                updateField(
                  "sortOrder",
                  (event.target as HTMLInputElement).value,
                )}
              class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {mode === "edit" && (
          <div class="flex justify-end border-t border-gray-200 pt-12">
            <button
              type="button"
              onClick={() => void handleDelete()}
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
