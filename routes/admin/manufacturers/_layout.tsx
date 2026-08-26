import { Head } from "$fresh/runtime.ts";

export default function ManufacturerLayout({ Component }: { Component: any }) {
  return (
    <>
      <Head>
        <title>メーカー管理 - 管理</title>
      </Head>
      <Component />
    </>
  );
}
