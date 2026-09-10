import { type Handlers, type PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import GameSearchExplorer from "../../../islands/app/GameSearchExplorer.tsx";
import BackendUnavailablePage from "../../_backend_unavailable_page.tsx";
import PublicHeader from "../../_public_header.tsx";
import {
  appFetch,
  AppHttpError,
  CatalogItem,
  KeywordItem,
  SearchResponse,
} from "../../../utils/appApi.ts";
import { getCookieValue } from "../../../utils/publicEvent.ts";

interface SearchFilters {
  q: string;
  machineCode: string;
  genreCode: string;
  manufacturerCode: string;
  keywordCode: string;
}

interface PageData {
  machines: CatalogItem[];
  genres: CatalogItem[];
  manufacturers: CatalogItem[];
  keywords: KeywordItem[];
  initialFilters: SearchFilters;
  initialResponse: SearchResponse;
  backendUnavailable?: boolean;
  retryHref?: string;
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const initialFilters: SearchFilters = {
      q: url.searchParams.get("q") || "",
      machineCode: url.searchParams.get("machineCode") || "",
      genreCode: url.searchParams.get("genreCode") || "",
      manufacturerCode: url.searchParams.get("manufacturerCode") || "",
      keywordCode: url.searchParams.get("keywordCode") || "",
    };

    const query = new URLSearchParams({
      page: "1",
      limit: "20",
      q: initialFilters.q,
      machineCode: initialFilters.machineCode,
      genreCode: initialFilters.genreCode,
      manufacturerCode: initialFilters.manufacturerCode,
      keywordCode: initialFilters.keywordCode,
    });
    const visitorId = getCookieValue(
      req.headers.get("cookie") || "",
      "visitor_id",
    );
    if (visitorId) {
      query.set("visitorId", visitorId);
    }

    try {
      const [machines, genres, manufacturers, keywords, initialResponse] =
        await Promise
          .all([
            appFetch<CatalogItem[]>("/app/catalog/machines"),
            appFetch<CatalogItem[]>("/app/catalog/genres"),
            appFetch<CatalogItem[]>("/app/catalog/manufacturers"),
            appFetch<KeywordItem[]>("/app/keywords"),
            appFetch<SearchResponse>(`/app/games?${query.toString()}`),
          ]);

      return ctx.render({
        machines,
        genres,
        manufacturers,
        keywords,
        initialFilters,
        initialResponse,
      });
    } catch (error) {
      if (error instanceof AppHttpError && error.status === 503) {
        return ctx.render(
          {
            machines: [],
            genres: [],
            manufacturers: [],
            keywords: [],
            initialFilters,
            initialResponse: {
              data: [],
              totalCount: 0,
              totalPages: 0,
              page: 1,
              limit: 20,
            },
            backendUnavailable: true,
            retryHref: `${url.pathname}${url.search}`,
          },
          { status: 503 },
        );
      }
      throw error;
    }
  },
};

export default function SearchPage({ data }: PageProps<PageData>) {
  if (data.backendUnavailable) {
    return (
      <BackendUnavailablePage retryHref={data.retryHref || "/app/games"} />
    );
  }

  return (
    <div class="public-bg flex h-full flex-col">
      <Head>
        <title>ゲーム検索 - PACKAGE FROESST</title>
        <meta
          name="description"
          content="メーカー、機種、ジャンル、キーワードでゲームを検索できます。"
        />
      </Head>
      <PublicHeader />

      <main class="w-full space-y-6 px-4 py-6 sm:space-y-8 sm:px-8 sm:py-8 lg:px-12">
        <section class="rounded-3xl border border-cyan-300/20 bg-slate-950/60 px-5 py-5 text-cyan-50 shadow-2xl backdrop-blur-md sm:px-6">
          <h1 class="text-2xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            ゲーム検索
          </h1>
          <p class="mt-2 max-w-3xl text-sm text-cyan-50/80 sm:text-base">
            メーカー、機種、ジャンル、キーワードで絞り込んでゲームを探せます。
          </p>
        </section>
        <GameSearchExplorer
          machines={data.machines}
          genres={data.genres}
          manufacturers={data.manufacturers}
          keywords={data.keywords}
          initialFilters={data.initialFilters}
          initialResponse={data.initialResponse}
        />
      </main>
    </div>
  );
}
