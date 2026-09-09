import { type Handlers, type PageProps } from "$fresh/server.ts";
import AccessLogList from "../../islands/admin/analytics/AccessLogList.tsx";
import {
  type LogKind,
  type LogLevel,
  type LogScope,
  type LogSource,
} from "../../utils/adminAccessLog.ts";

interface PageData {
  mode: "top" | "detail";
  source?: LogSource;
  scope?: LogScope;
  kind?: LogKind;
  initialLevel?: LogLevel;
  initialDate?: string;
}

function todayAsInputDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildDetailHref(
  scope: LogScope,
  source: LogSource,
  level: LogLevel,
): string {
  const query = new URLSearchParams({
    scope,
    source,
    kind: "error",
    level,
  });
  return `/admin/logs?${query.toString()}`;
}

function levelLabel(level: LogLevel): string {
  switch (level) {
    case "debug":
      return "DEBUGログ";
    case "info":
      return "INFOログ";
    case "warn":
      return "WARNINGログ";
    case "error":
    default:
      return "ERRORログ";
  }
}

const logMenuSections: Array<{
  title: string;
  scope: LogScope;
  description: string;
  borderClass: string;
  titleClass: string;
}> = [
  {
    title: "APPログ",
    scope: "app",
    description: "公開サイト側のログを確認します。",
    borderClass: "border-sky-100",
    titleClass: "text-sky-700",
  },
  {
    title: "Adminログ",
    scope: "admin",
    description: "管理画面側のログを確認します。",
    borderClass: "border-emerald-100",
    titleClass: "text-emerald-700",
  },
];

const logSources: Array<{
  source: LogSource;
  title: string;
  description: string;
}> = [
  {
    source: "frontend",
    title: "Frontend",
    description: "画面表示やSSRのログ",
  },
  {
    source: "backend",
    title: "Backend",
    description: "APIやサーバー処理のログ",
  },
];

const logLevels: LogLevel[] = ["debug", "info", "warn", "error"];

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope");
    const source = url.searchParams.get("source");
    const date = url.searchParams.get("date") || todayAsInputDate();
    const level = url.searchParams.get("level") || "info";

    if (
      (scope === "app" || scope === "admin") &&
      (source === "frontend" || source === "backend")
    ) {
      return ctx.render({
        mode: "detail",
        source,
        scope,
        kind: "error",
        initialLevel:
          level === "debug" || level === "info" || level === "warn" ||
            level === "error"
            ? level as LogLevel
            : "info",
        initialDate: date,
      });
    }

    return ctx.render({ mode: "top" });
  },
};

export default function AdminLogPage({ data }: PageProps<PageData>) {
  if (data.mode === "detail" && data.scope && data.source) {
    return (
      <div class="space-y-6">
        <h2 class="text-2xl font-bold text-slate-900">
          {data.scope === "app" ? "APP" : "Admin"} -{" "}
          {data.source === "frontend" ? "FE" : "BE"} -{" "}
          {levelLabel(data.initialLevel || "info")}
        </h2>

        <AccessLogList
          initialSource={data.source}
          initialScope={data.scope}
          initialKind={data.kind}
          initialLevel={data.initialLevel}
          initialDate={data.initialDate}
          backHref="/admin/logs"
        />
      </div>
    );
  }

  return (
    <div class="space-y-6">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {logMenuSections.map((section) => (
          <section
            key={section.scope}
            class={`rounded-2xl border bg-white p-5 shadow-sm ${section.borderClass}`}
          >
            <div class="border-b border-slate-100 pb-4">
              <h3 class={`text-xl font-bold ${section.titleClass}`}>
                {section.title}
              </h3>
              <p class="mt-2 text-sm text-slate-600">{section.description}</p>
            </div>

            <div class="mt-4 space-y-4">
              {logSources.map((source) => (
                <div
                  key={`${section.scope}-${source.source}`}
                  class="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div class="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <h4 class="text-base font-bold text-slate-900">
                        {source.title}
                      </h4>
                      <p class="mt-1 text-xs text-slate-600">
                        {source.description}
                      </p>
                    </div>
                  </div>

                  <div class="mt-3 space-y-2">
                    {logLevels.map((level) => (
                      <a
                        key={`${section.scope}-${source.source}-${level}`}
                        href={buildDetailHref(
                          section.scope,
                          source.source,
                          level,
                        )}
                        class="group flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                      >
                        <div class="min-w-0">
                          <h5 class="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-slate-700">
                            {levelLabel(level)}
                          </h5>
                        </div>
                        <span class="flex-shrink-0 text-sm font-semibold text-slate-400 transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
