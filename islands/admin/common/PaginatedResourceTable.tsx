import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import type { ComponentChildren } from "preact";

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
}

interface PaginatedResourceTableProps<T> {
  fetchPage: (
    page: number,
    limit: number,
    query: string,
  ) => Promise<PaginatedResponse<T>>;
  searchPlaceholder: string;
  emptyMessage: string;
  emptySearchMessage: string;
  getKey: (item: T) => string | number;
  renderMobileRow: (item: T) => ComponentChildren;
  renderDesktopHeader: () => ComponentChildren;
  renderDesktopRow: (item: T) => ComponentChildren;
  initialLimit?: number;
  rightActions?: ComponentChildren;
  searchExtras?: ComponentChildren;
}

const PAGE_OPTIONS = [10, 30, 50];

const clamp = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

export default function PaginatedResourceTable<T>({
  fetchPage,
  searchPlaceholder,
  emptyMessage,
  emptySearchMessage,
  getKey,
  renderMobileRow,
  renderDesktopHeader,
  renderDesktopRow,
  initialLimit = 10,
  rightActions,
  searchExtras,
}: PaginatedResourceTableProps<T>) {
  const items = useSignal<T[]>([]);
  const error = useSignal("");
  const loading = useSignal(true);
  const page = useSignal(1);
  const limit = useSignal(initialLimit);
  const searchInput = useSignal("");
  const searchTerm = useSignal("");
  const totalCount = useSignal(0);
  const totalPages = useSignal(0);
  const pageInput = useSignal("1");
  const showAdvancedSearch = useSignal(false);

  const loadPage = async (
    nextPage: number,
    nextLimit: number,
    query: string,
  ) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetchPage(nextPage, nextLimit, query);
      items.value = response.data ?? [];
      totalCount.value = response.totalCount ?? 0;
      totalPages.value = response.totalPages ?? 0;

      const safePage = totalPages.value > 0
        ? clamp(nextPage, 1, totalPages.value)
        : 1;

      page.value = safePage;
      pageInput.value = String(safePage);
      limit.value = nextLimit;
    } catch (err) {
      if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = "データの取得に失敗しました。";
      }
      items.value = [];
      totalCount.value = 0;
      totalPages.value = 0;
      page.value = 1;
      pageInput.value = "1";
    } finally {
      loading.value = false;
    }
  };

  useEffect(() => {
    void loadPage(1, initialLimit, "");
  }, []);

  const handleSearchSubmit = (e: Event) => {
    e.preventDefault();
    const trimmed = searchInput.value.trim();
    searchTerm.value = trimmed;
    page.value = 1;
    pageInput.value = "1";
    void loadPage(1, limit.value, trimmed);
  };

  const handlePageSizeChange = (e: Event) => {
    const nextLimit = Number((e.target as HTMLSelectElement).value);
    page.value = 1;
    pageInput.value = "1";
    void loadPage(1, nextLimit, searchTerm.value);
  };

  const goToPage = (targetPage: number) => {
    const maxPage = totalPages.value > 0 ? totalPages.value : 1;
    const safePage = clamp(targetPage, 1, maxPage);

    if (safePage === page.value) {
      pageInput.value = String(safePage);
      return;
    }

    page.value = safePage;
    pageInput.value = String(safePage);
    void loadPage(safePage, limit.value, searchTerm.value);
  };

  const handlePageInput = (e: Event) => {
    pageInput.value = (e.target as HTMLInputElement).value;
  };

  const submitPageInput = () => {
    const nextPage = Number(pageInput.value) || 1;
    goToPage(nextPage);
  };

  return (
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="py-4 border-b border-gray-200 bg-gray-50">
        <div class="flex flex-col gap-3">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <form
              class="flex w-full flex-1 gap-3 items-center"
              onSubmit={handleSearchSubmit}
            >
              <input
                type="text"
                value={searchInput.value}
                onInput={(
                  e,
                ) => (searchInput.value = (e.target as HTMLInputElement).value)}
                placeholder={searchPlaceholder}
                class="w-full flex-1 md:max-w-2xl border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
              >
                検索
              </button>
            </form>

            {rightActions && (
              <div class="flex-shrink-0 flex items-center justify-end">
                {rightActions}
              </div>
            )}
          </div>

          {searchExtras && (
            <div class="w-full">
              <button
                type="button"
                onClick={() => (showAdvancedSearch.value = !showAdvancedSearch.value)}
                class="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <span
                  class={showAdvancedSearch.value ? "inline-block transition-transform rotate-90" : "inline-block transition-transform"}
                >
                  ▶
                </span>
                <span>詳細検索</span>
              </button>

              {showAdvancedSearch.value && (
                <div class="mt-3 rounded-md border border-gray-200 bg-white p-3 shadow-sm">
                  {searchExtras}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {error.value && (
        <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded m-4 text-sm">
          {error.value}
        </div>
      )}

      {loading.value
        ? <div class="p-6 text-center text-gray-500">データを読み込み中...</div>
        : items.value.length === 0
        ? (
          <div class="p-6 text-center text-gray-500">
            {searchTerm.value ? emptySearchMessage : emptyMessage}
          </div>
        )
        : (
          <>
            <div class="block md:hidden divide-y divide-gray-100">
              {items.value.map((item) => (
                <div
                  key={String(getKey(item))}
                  class="p-4 space-y-3 hover:bg-gray-50 transition-colors"
                >
                  {renderMobileRow(item)}
                </div>
              ))}
            </div>

            <div class="hidden md:block overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-gray-100 text-gray-600 text-sm font-semibold border-b border-gray-200">
                    {renderDesktopHeader()}
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 text-sm text-gray-700">
                  {items.value.map((item) => (
                    <tr
                      key={String(getKey(item))}
                      class="hover:bg-gray-50 transition-colors"
                    >
                      {renderDesktopRow(item)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      {totalPages.value > 0 && (
        <div class="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-2 text-sm text-gray-600">
            <span>表示件数</span>
            <select
              value={String(limit.value)}
              onChange={handlePageSizeChange}
              class="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>{option}件</option>
              ))}
            </select>
          </div>

          <div class="flex items-center gap-2 text-sm text-gray-600">
            <button
              type="button"
              onClick={() => goToPage(page.value - 1)}
              disabled={page.value <= 1}
              class="px-3 py-1.5 border rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              前へ
            </button>

            <input
              type="number"
              min={1}
              max={totalPages.value || 1}
              value={pageInput.value}
              onInput={handlePageInput}
              onBlur={submitPageInput}
              onKeyDown={(e) => {
                if ((e as KeyboardEvent).key === "Enter") {
                  submitPageInput();
                }
              }}
              class="w-20 border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <span>/ {totalPages.value} ページ</span>

            <button
              type="button"
              onClick={() => goToPage(page.value + 1)}
              disabled={page.value >= (totalPages.value || 1)}
              class="px-3 py-1.5 border rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              次へ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
