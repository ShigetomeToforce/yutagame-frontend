import { type Handlers, type PageProps } from "$fresh/server.ts";
import FeatureForm from "../../../islands/admin/features/FeatureForm.tsx";

interface PageData {
  id: number;
}

export const handler: Handlers<PageData> = {
  GET(_req, ctx) {
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return ctx.renderNotFound();
    }
    return ctx.render({ id });
  },
};

export default function FeatureEditPage({ data }: PageProps<PageData>) {
  return <FeatureForm mode="edit" featureId={data.id} />;
}
