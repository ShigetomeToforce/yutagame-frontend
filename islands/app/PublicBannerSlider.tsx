import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { APP_BASE_URL } from "../../utils/api.ts";
import { type BannerItem } from "../../utils/appApi.ts";
import { buildImageUrl } from "../../utils/image.ts";

interface Props {
  banners: BannerItem[];
}

function trackBannerClick(id: number) {
  void fetch(`${APP_BASE_URL}/app/banners/${id}/click`, {
    method: "POST",
    keepalive: true,
  }).catch(() => undefined);
}

function BannerLink({ banner }: { banner: BannerItem }) {
  const image = (
    <img
      src={buildImageUrl(banner.imageKey, "banners")}
      alt={banner.title}
      class="h-full w-full object-cover"
    />
  );
  const className =
    "block h-full w-full overflow-hidden rounded-lg ring-1 ring-cyan-200/30";

  if (!banner.linkUrl) {
    return (
      <button
        type="button"
        class={className}
        onClick={() => trackBannerClick(banner.id)}
      >
        {image}
      </button>
    );
  }

  return (
    <a
      href={banner.linkUrl}
      target={banner.openInNewTab ? "_blank" : undefined}
      rel={banner.openInNewTab ? "noreferrer" : undefined}
      class={className}
      onClick={() => trackBannerClick(banner.id)}
    >
      {image}
    </a>
  );
}

export default function PublicBannerSlider({ banners }: Props) {
  const activeIndex = useSignal(0);
  const slideDirection = useSignal<-1 | 0 | 1>(0);
  const total = banners.length;

  const move = (direction: -1 | 1) => {
    if (slideDirection.value !== 0 || total < 2) return;
    slideDirection.value = direction;
    globalThis.setTimeout(() => {
      activeIndex.value = (activeIndex.value + direction + total) % total;
      slideDirection.value = 0;
    }, 520);
  };

  useEffect(() => {
    activeIndex.value = 0;
    if (total < 2) return;
    const timer = globalThis.setInterval(() => move(1), 6000);
    return () => globalThis.clearInterval(timer);
  }, [total]);

  if (total === 0) return null;
  const previousPrevious = banners[
    (activeIndex.value - 2 + total) % total
  ];
  const current = banners[activeIndex.value];
  const previous = banners[(activeIndex.value - 1 + total) % total];
  const next = banners[(activeIndex.value + 1) % total];
  const nextNext = banners[(activeIndex.value + 2) % total];
  const transform = slideDirection.value === 0
    ? "transition: none;"
    : `transform: translateX(${
      slideDirection.value * -72
    }%); transition: transform 520ms cubic-bezier(0.22, 0.61, 0.36, 1);`;

  return (
    <section
      class="banner-slider relative overflow-hidden py-2"
      aria-label="おすすめバナー"
    >
      {total === 1
        ? (
          <div class="mx-auto h-[132px] w-[86%] max-w-5xl sm:h-[210px] sm:w-[72%]">
            <BannerLink banner={current} />
          </div>
        )
        : (
          <div
            class="relative mx-auto h-[132px] max-w-5xl sm:h-[210px]"
            style={transform}
          >
            <div class="absolute left-[-128%] h-full w-[68%] opacity-60">
              <BannerLink banner={previousPrevious} />
            </div>
            <div class="absolute left-[-56%] h-full w-[68%] opacity-60">
              <BannerLink banner={previous} />
            </div>
            <div class="absolute left-[16%] h-full w-[68%]">
              <BannerLink banner={current} />
            </div>
            <div class="absolute left-[88%] h-full w-[68%] opacity-60">
              <BannerLink banner={next} />
            </div>
            <div class="absolute left-[160%] h-full w-[68%] opacity-60">
              <BannerLink banner={nextNext} />
            </div>
          </div>
        )}
      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="前のバナー"
            onClick={() => move(-1)}
            class="absolute left-2 top-[74px] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-100/60 bg-slate-950/80 text-2xl leading-none text-white shadow-lg hover:bg-cyan-700 sm:left-5 sm:top-[113px]"
          >
            <span class="-translate-y-px">‹</span>
          </button>
          <button
            type="button"
            aria-label="次のバナー"
            onClick={() => move(1)}
            class="absolute right-2 top-[74px] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-100/60 bg-slate-950/80 text-2xl leading-none text-white shadow-lg hover:bg-cyan-700 sm:right-5 sm:top-[113px]"
          >
            <span class="-translate-y-px">›</span>
          </button>
          <div class="mt-2 flex justify-center gap-1.5">
            {banners.map((banner, index) => (
              <button
                type="button"
                aria-label={`${index + 1}枚目のバナー`}
                onClick={() => activeIndex.value = index}
                class={`h-1.5 w-5 rounded-full ${
                  index === activeIndex.value ? "bg-cyan-300" : "bg-slate-500"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
