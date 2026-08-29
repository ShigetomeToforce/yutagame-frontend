import { ADMIN_BASE_URL } from "./api.ts";

const BACKEND_BASE_URL = ADMIN_BASE_URL.endsWith("/api")
  ? ADMIN_BASE_URL.slice(0, -4)
  : ADMIN_BASE_URL;

export const NO_IMAGE_DATA_URI =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360' viewBox='0 0 640 360'><rect width='640' height='360' fill='%23f3f4f6'/><rect x='16' y='16' width='608' height='328' fill='none' stroke='%23d1d5db' stroke-width='2' stroke-dasharray='8 8'/><text x='320' y='188' text-anchor='middle' font-size='36' font-family='sans-serif' fill='%239ca3af'>NO IMAGE</text></svg>";

export function buildImageUrl(
  imageKey: string | null | undefined,
  resourceDir?: string,
): string {
  if (!imageKey) {
    return NO_IMAGE_DATA_URI;
  }

  const hasDir = imageKey.includes("/");
  const normalizedKey = hasDir || !resourceDir
    ? imageKey
    : `${resourceDir}/${imageKey}`;

  const normalized = normalizedKey.split("/").map(encodeURIComponent).join("/");
  return `${BACKEND_BASE_URL}/images/${normalized}`;
}
