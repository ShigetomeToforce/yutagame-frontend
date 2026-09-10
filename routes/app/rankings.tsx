import { type Handlers, type PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import PublicHeader from "../_public_header.tsx";
import BackendUnavailablePage from "../_backend_unavailable_page.tsx";
import PublicRankingExplorer from "../../islands/app/PublicRankingExplorer.tsx";
import { appFetch, AppHttpError, SearchResponse } from "../../utils/appApi.ts";

interface PageData {
  initialResponse: SearchResponse;
  backendUnavailable?: boolean;
}

export const handler: Handlers<PageData> = {
  async GET(_req, ctx) {
    try {
      const initialResponse = await appFetch<SearchResponse>(
        "/app/rankings/page?type=curated&page=1&limit=20",
      );
      return ctx.render({ initialResponse });
    } catch (error) {
      if (error instanceof AppHttpError && error.status === 503) {
        return ctx.render({
          initialResponse: {
            data: [],
            totalCount: 0,
            totalPages: 1,
            page: 1,
            limit: 20,
          },
          backendUnavailable: true,
        }, { status: 503 });
      }
      throw error;
    }
  },
};

export default function RankingsPage({ data }: PageProps<PageData>) {
  if (data.backendUnavailable) {
    return <BackendUnavailablePage retryHref="/app/rankings" />;
  }
  return (
    <div class="public-bg flex min-h-screen flex-col">
      <Head>
        <title>ゲームランキング - PACKAGE FROESST</title>
      </Head>
      <PublicHeader />
      <main class="w-full px-4 py-6 sm:px-8 sm:py-8 lg:px-12">
        <PublicRankingExplorer initialResponse={data.initialResponse} />
      </main>
    </div>
  );
}
