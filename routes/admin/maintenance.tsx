import { Handlers, PageProps } from "$fresh/server.ts";
import {
  disableMaintenanceMode,
  enableMaintenanceMode,
  getMaintenanceStatus,
} from "../../utils/maintenance.ts";

interface PageData {
  enabled: boolean;
  updatedAt?: string;
  flagPath: string;
  notice?: string;
}

function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ja-JP");
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    const status = await getMaintenanceStatus();
    const url = new URL(req.url);
    const notice = url.searchParams.get("notice") || undefined;
    return ctx.render({
      enabled: status.enabled,
      updatedAt: status.updatedAt,
      flagPath: status.flagPath,
      notice,
    });
  },

  async POST(req) {
    const form = await req.formData();
    const action = String(form.get("action") || "");
    const changedBy = String(form.get("changedBy") || "admin");

    if (action === "enable") {
      await enableMaintenanceMode(changedBy);
      return new Response("", {
        status: 303,
        headers: { Location: "/admin/maintenance?notice=on" },
      });
    }

    if (action === "disable") {
      await disableMaintenanceMode();
      return new Response("", {
        status: 303,
        headers: { Location: "/admin/maintenance?notice=off" },
      });
    }

    return new Response("invalid action", { status: 400 });
  },
};

export default function AdminMaintenancePage({ data }: PageProps<PageData>) {
  return (
    <div class="space-y-6">
      <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 class="text-lg font-bold text-gray-900">メンテナンスモード</h2>
        <p class="mt-2 text-sm text-gray-600">
          公開ページへのアクセスをメンテナンスページへリダイレクトします。管理画面には影響しません。
        </p>

        <div class="mt-4 grid gap-3 sm:grid-cols-3">
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p class="text-xs font-semibold tracking-wide text-gray-500">
              現在状態
            </p>
            <p
              class={`mt-1 text-sm font-bold ${
                data.enabled ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {data.enabled ? "ON（公開停止中）" : "OFF（通常公開）"}
            </p>
          </div>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:col-span-2">
            <p class="text-xs font-semibold tracking-wide text-gray-500">
              最終更新
            </p>
            <p class="mt-1 text-sm text-gray-700">
              {formatDate(data.updatedAt)}
            </p>
          </div>
        </div>

        <div class="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p class="text-xs font-semibold tracking-wide text-gray-500">
            フラグファイル
          </p>
          <p class="mt-1 break-all text-xs text-gray-700">{data.flagPath}</p>
        </div>

        {data.notice && (
          <p class="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            {data.notice === "on"
              ? "メンテナンスモードを ON にしました。"
              : "メンテナンスモードを OFF にしました。"}
          </p>
        )}

        <form method="post" class="mt-5 flex flex-wrap gap-3">
          <input type="hidden" name="changedBy" value="admin-panel" />
          {data.enabled
            ? (
              <button
                type="submit"
                name="action"
                value="disable"
                class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                OFF にする（公開再開）
              </button>
            )
            : (
              <button
                type="submit"
                name="action"
                value="enable"
                class="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
              >
                ON にする（公開停止）
              </button>
            )}
        </form>
      </section>
    </div>
  );
}
