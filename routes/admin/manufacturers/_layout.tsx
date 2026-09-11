import { Head } from "$fresh/runtime.ts";
import type { ComponentType } from "preact";

export default function ManufacturerLayout(
  { Component }: { Component: ComponentType },
) {
  return (
    <>
      <Head>
        <title>メーカー管理 - 管理</title>
      </Head>
      <Component />
    </>
  );
}
