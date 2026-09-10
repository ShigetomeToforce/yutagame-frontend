import { type Handlers, type PageProps } from "$fresh/server.ts";
import PurchaseCandidateForm from "../../../islands/admin/purchase-candidates/PurchaseCandidateForm.tsx";

interface PageData {
  id: number;
}

export const handler: Handlers<PageData> = {
  GET(_req, ctx) {
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id <= 0) return ctx.renderNotFound();
    return ctx.render({ id });
  },
};

export default function PurchaseCandidateEditPage(
  { data }: PageProps<PageData>,
) {
  return <PurchaseCandidateForm mode="edit" candidateId={data.id} />;
}
