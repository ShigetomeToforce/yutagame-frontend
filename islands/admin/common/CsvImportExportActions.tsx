import { useSignal } from "@preact/signals";
import { adminFetch, adminFetchRaw } from "../../../utils/api.ts";
import type { ComponentChildren } from "preact";

interface CSVFieldDiff {
  field: string;
  from: string;
  to: string;
}

interface CSVRowInput {
  rowNumber: number;
}

interface CSVOperation {
  rowNumber: number;
  action: "create" | "update" | "skip";
  id?: number;
  selectable: boolean;
  diffs?: CSVFieldDiff[];
  payload: CSVRowInput;
}

interface CSVPreviewResponse {
  operations: CSVOperation[];
  creatable: number;
  updatable: number;
  skipped: number;
  selectableAll: number;
}

interface ExportColumn {
  key: string;
  label: string;
}

interface Props {
  resourceLabel: string;
  fileNamePrefix: string;
  exportEndpoint: string;
  previewEndpoint: string;
  applyEndpoint: string;
  exportColumns: ExportColumn[];
  defaultSelectedColumns: string[];
  trailingAction?: ComponentChildren;
}

const ENCODING_OPTIONS = [
  { value: "utf8", label: "UTF-8" },
  { value: "utf8bom", label: "BOM付きUTF-8" },
  { value: "shift_jis", label: "SHIFT-JIS" },
] as const;

export default function CsvImportExportActions(props: Props) {
  const exportModalOpen = useSignal(false);
  const importModalOpen = useSignal(false);
  const exportEncoding = useSignal("utf8");
  const importEncoding = useSignal("utf8");
  const selectedColumns = useSignal<string[]>([
    ...props.defaultSelectedColumns,
  ]);
  const isExporting = useSignal(false);

  const importFile = useSignal<File | null>(null);
  const importStep = useSignal<"upload" | "preview" | "confirm">("upload");
  const preview = useSignal<CSVPreviewResponse | null>(null);
  const selectedRows = useSignal<number[]>([]);
  const isPreviewLoading = useSignal(false);
  const isApplying = useSignal(false);

  const parseFileName = (contentDisposition: string | null) => {
    if (!contentDisposition) return null;
    const match = contentDisposition.match(/filename="?([^\";]+)"?/i);
    return match?.[1] ?? null;
  };

  const toggleColumn = (column: string) => {
    if (selectedColumns.value.includes(column)) {
      selectedColumns.value = selectedColumns.value.filter((c) => c !== column);
      return;
    }
    selectedColumns.value = [...selectedColumns.value, column];
  };

  const handleExport = async () => {
    isExporting.value = true;
    try {
      const response = await adminFetchRaw(props.exportEndpoint, {
        method: "POST",
        body: JSON.stringify({
          columns: selectedColumns.value,
          encoding: exportEncoding.value,
        }),
      });

      if (!response.ok) {
        let message = "CSVエクスポートに失敗しました。";
        try {
          const data = await response.json();
          if (data?.message) message = data.message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const fileName =
        parseFileName(response.headers.get("content-disposition")) ??
          `${props.fileNamePrefix}_${
            new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)
          }.csv`;

      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(downloadUrl);

      exportModalOpen.value = false;
    } catch (error) {
      globalThis.alert(
        error instanceof Error
          ? error.message
          : "CSVエクスポートに失敗しました。",
      );
    } finally {
      isExporting.value = false;
    }
  };

  const openImportModal = () => {
    importModalOpen.value = true;
    importStep.value = "upload";
    preview.value = null;
    selectedRows.value = [];
    importFile.value = null;
  };

  const handlePreviewImport = async () => {
    if (!importFile.value) {
      globalThis.alert("CSVファイルを選択してください。");
      return;
    }

    isPreviewLoading.value = true;
    try {
      const formData = new FormData();
      formData.append("file", importFile.value);
      formData.append("encoding", importEncoding.value);

      const response = await adminFetch<CSVPreviewResponse>(
        props.previewEndpoint,
        {
          method: "POST",
          body: formData,
        },
      );

      preview.value = response;
      selectedRows.value = response.operations
        .filter((op) => op.selectable)
        .map((op) => op.rowNumber);
      importStep.value = "preview";
    } catch (error) {
      globalThis.alert(
        error instanceof Error
          ? error.message
          : "インポートプレビューの取得に失敗しました。",
      );
    } finally {
      isPreviewLoading.value = false;
    }
  };

  const toggleRow = (rowNumber: number) => {
    if (selectedRows.value.includes(rowNumber)) {
      selectedRows.value = selectedRows.value.filter((row) =>
        row !== rowNumber
      );
      return;
    }
    selectedRows.value = [...selectedRows.value, rowNumber];
  };

  const selectedOperations = () => {
    const base = preview.value?.operations ?? [];
    return base.filter((op) =>
      selectedRows.value.includes(op.rowNumber) && op.selectable
    );
  };

  const visiblePreviewOperations = () => {
    const base = preview.value?.operations ?? [];
    return base.filter((op) => op.selectable);
  };

  const handleApplyImport = async () => {
    const operations = selectedOperations();
    if (operations.length === 0) {
      globalThis.alert("更新対象が選択されていません。");
      return;
    }

    isApplying.value = true;
    try {
      const result = await adminFetch<
        { message: string; createdCount: number; updatedCount: number }
      >(
        props.applyEndpoint,
        {
          method: "POST",
          body: JSON.stringify({ operations }),
        },
      );

      globalThis.alert(
        `${result.message}\n新規: ${result.createdCount}件 / 更新: ${result.updatedCount}件`,
      );
      importModalOpen.value = false;
      globalThis.location.reload();
    } catch (error) {
      globalThis.alert(
        error instanceof Error
          ? error.message
          : "インポート適用に失敗しました。",
      );
    } finally {
      isApplying.value = false;
    }
  };

  return (
    <>
      <div class="flex items-center gap-2">
        <button
          type="button"
          onClick={openImportModal}
          class="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded text-sm transition-colors shadow"
        >
          インポート
        </button>
        <button
          type="button"
          onClick={() => (exportModalOpen.value = true)}
          class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded text-sm transition-colors shadow"
        >
          エクスポート
        </button>
        {props.trailingAction}
      </div>

      {exportModalOpen.value && (
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => (exportModalOpen.value = false)}
        >
          <div
            class="w-full max-w-xl rounded-lg border border-gray-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex items-center justify-between border-b px-4 py-3">
              <h3 class="text-base font-semibold text-gray-900">
                {props.resourceLabel}CSVエクスポート
              </h3>
              <button
                type="button"
                onClick={() => (exportModalOpen.value = false)}
              >
                ✕
              </button>
            </div>

            <div class="space-y-4 p-4">
              <div>
                <p class="mb-2 text-sm font-medium text-gray-700">出力カラム</p>
                <p class="mb-2 text-xs text-gray-500">
                  IDは必須で常に出力されます。
                </p>
                <div class="grid gap-2 sm:grid-cols-2">
                  {props.exportColumns.map((col) => (
                    <label class="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedColumns.value.includes(col.key)}
                        onChange={() => toggleColumn(col.key)}
                      />
                      <span>{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p class="mb-2 text-sm font-medium text-gray-700">文字コード</p>
                <select
                  value={exportEncoding.value}
                  onChange={(e) => {
                    exportEncoding.value =
                      (e.target as HTMLSelectElement).value;
                  }}
                  class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                >
                  {ENCODING_OPTIONS.map((opt) => (
                    <option value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div class="flex justify-end gap-2 border-t px-4 py-3">
              <button
                type="button"
                onClick={() => (exportModalOpen.value = false)}
                class="rounded border border-gray-300 px-4 py-2 text-sm"
              >
                閉じる
              </button>
              <button
                type="button"
                onClick={() => void handleExport()}
                disabled={isExporting.value}
                class="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {isExporting.value ? "出力中..." : "ダウンロード"}
              </button>
            </div>
          </div>
        </div>
      )}

      {importModalOpen.value && (
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => (importModalOpen.value = false)}
        >
          <div
            class="w-full max-w-5xl rounded-lg border border-gray-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex items-center justify-between border-b px-4 py-3">
              <h3 class="text-base font-semibold text-gray-900">
                {props.resourceLabel}CSVインポート
              </h3>
              <button
                type="button"
                onClick={() => (importModalOpen.value = false)}
              >
                ✕
              </button>
            </div>

            <div class="max-h-[70vh] overflow-auto p-4">
              {importStep.value === "upload" && (
                <div class="space-y-4">
                  <p class="text-sm text-gray-600">
                    CSVファイルを選択し、差分プレビューを作成します。
                  </p>
                  <div>
                    <p class="mb-2 text-sm font-medium text-gray-700">
                      文字コード
                    </p>
                    <select
                      value={importEncoding.value}
                      onChange={(e) => {
                        importEncoding.value =
                          (e.target as HTMLSelectElement).value;
                      }}
                      class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    >
                      {ENCODING_OPTIONS.map((opt) => (
                        <option value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                      importFile.value =
                        (e.target as HTMLInputElement).files?.[0] ?? null;
                    }}
                    class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              )}

              {importStep.value === "preview" && preview.value && (
                <div class="space-y-4">
                  <div class="rounded bg-gray-50 p-3 text-sm text-gray-700">
                    新規候補: {preview.value.creatable}件 / 更新候補:{" "}
                    {preview.value.updatable}件 / スキップ:{" "}
                    {preview.value.skipped}件
                  </div>

                  <p class="text-xs text-gray-500">
                    差分または新規作成対象のみ表示しています。
                  </p>

                  <div class="overflow-x-auto">
                    <table class="w-full min-w-[880px] border-collapse text-sm">
                      <thead>
                        <tr class="bg-gray-100 text-left">
                          <th class="border px-2 py-1">対象</th>
                          <th class="border px-2 py-1">ID</th>
                          <th class="border px-2 py-1">処理</th>
                          <th class="border px-2 py-1">差分</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visiblePreviewOperations().map((op) => (
                          <tr>
                            <td class="border px-2 py-1 text-center">
                              <input
                                type="checkbox"
                                checked={selectedRows.value.includes(
                                  op.rowNumber,
                                )}
                                onChange={() => toggleRow(op.rowNumber)}
                              />
                            </td>
                            <td class="border px-2 py-1">{op.id ?? "-"}</td>
                            <td class="border px-2 py-1">
                              <span
                                class={op.action === "create"
                                  ? "rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700"
                                  : op.action === "update"
                                  ? "rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                                  : "rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"}
                              >
                                {op.action}
                              </span>
                            </td>
                            <td class="border px-2 py-1">
                              {(op.diffs?.length ?? 0) > 0
                                ? (op.diffs ?? []).map((diff) => (
                                  <div class="text-xs">
                                    <span class="font-semibold">
                                      {diff.field}
                                    </span>: {diff.from} → {diff.to}
                                  </div>
                                ))
                                : (
                                  <span class="text-xs text-gray-500">
                                    新規作成（CSVの入力値を登録）
                                  </span>
                                )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {importStep.value === "confirm" && preview.value && (
                <div class="space-y-4">
                  <div class="rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    選択した {selectedOperations().length}{" "}
                    件を更新します。実行後は元に戻せません。
                  </div>
                  <div class="rounded bg-gray-50 p-3 text-sm text-gray-700">
                    新規登録: {selectedOperations().filter((op) =>
                      op.action === "create"
                    ).length}件 / 更新: {selectedOperations().filter((op) =>
                      op.action === "update"
                    ).length}件
                  </div>
                </div>
              )}
            </div>

            <div class="flex justify-end gap-2 border-t px-4 py-3">
              {importStep.value === "upload" && (
                <button
                  type="button"
                  onClick={() => void handlePreviewImport()}
                  disabled={isPreviewLoading.value}
                  class="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isPreviewLoading.value ? "解析中..." : "差分を表示"}
                </button>
              )}

              {importStep.value === "preview" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      importStep.value = "upload";
                    }}
                    class="rounded border border-gray-300 px-4 py-2 text-sm"
                  >
                    戻る
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      importStep.value = "confirm";
                    }}
                    class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    確認へ
                  </button>
                </>
              )}

              {importStep.value === "confirm" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      importStep.value = "preview";
                    }}
                    class="rounded border border-gray-300 px-4 py-2 text-sm"
                  >
                    差分へ戻る
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleApplyImport()}
                    disabled={isApplying.value}
                    class="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {isApplying.value ? "更新中..." : "更新を実行"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
