import { useEffect, useRef, useState } from "preact/hooks";
import {
  fetchGameFavoriteStatus,
  type GameFavoriteStatus,
  pushGameFavorite,
} from "../../utils/appApi.ts";

function getCookieValue(name: string): string {
  if (typeof document === "undefined") return "";
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!cookie) return "";
  return decodeURIComponent(cookie.split("=")[1] || "");
}

interface Props {
  code: string;
  variant?: "detail" | "card";
}

export default function GameFavoriteButton(
  { code, variant = "detail" }: Props,
) {
  const [status, setStatus] = useState<GameFavoriteStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [votedVisual, setVotedVisual] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const playFlipAnimation = async () => {
    const button = buttonRef.current;
    if (!button) return;

    const animation = button.animate(
      [
        { transform: "perspective(800px) rotateY(0deg)" },
        { transform: "perspective(800px) rotateY(180deg)" },
        { transform: "perspective(800px) rotateY(360deg)" },
      ],
      {
        duration: 520,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "none",
      },
    );

    try {
      await animation.finished;
    } catch {
      // Ignore cancellation when component unmounts during animation.
    }
  };

  useEffect(() => {
    let cancelled = false;
    const visitorId = getCookieValue("visitor_id");

    setLoading(true);
    fetchGameFavoriteStatus(code, visitorId)
      .then((result) => {
        if (!cancelled) {
          setStatus(result);
          setVotedVisual(result.alreadyVoted);
          if (result.alreadyVoted) {
            setMessage("このゲームは本日分を推し済みです。");
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMessage("推し情報の取得に失敗しました。");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  const handleClick = async () => {
    const visitorId = getCookieValue("visitor_id");
    if (!visitorId || sending || status?.alreadyVoted) return;

    setSending(true);
    setMessage("");
    try {
      const result = await pushGameFavorite(code, visitorId);
      setStatus({ ...result, alreadyVoted: true });
      await playFlipAnimation();
      setVotedVisual(true);
      setMessage(
        result.alreadyVoted
          ? "このゲームは本日分を推し済みです。"
          : "推しを送信しました。ありがとうございます。",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "送信に失敗しました。",
      );
    } finally {
      setSending(false);
    }
  };

  const disabled = sending || Boolean(status?.alreadyVoted);

  if (variant === "card") {
    return (
      <div
        class="inline-flex flex-col items-end gap-1"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={buttonRef}
          type="button"
          onClick={handleClick}
          disabled={disabled}
          class={`inline-flex min-h-9 items-center justify-center rounded-full border px-3 py-1.5 text-[11px] font-bold backdrop-blur-sm transition duration-300 ${
            votedVisual
              ? "border-slate-400/80 bg-slate-700/75 text-slate-200 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.25)]"
              : "border-cyan-100/85 bg-cyan-400/45 text-cyan-50 shadow-[0_6px_18px_rgba(34,211,238,0.28)] hover:-translate-y-0.5 hover:bg-cyan-300/55"
          } disabled:cursor-not-allowed`}
        >
          {sending ? "送信中" : votedVisual ? "押し完了" : "このゲームを推す"}
        </button>
      </div>
    );
  }

  return (
    <div
      class="rounded-2xl border border-fuchsia-300/30 bg-fuchsia-500/10 p-3 shadow-lg shadow-fuchsia-950/20"
      onClick={(event) => event.stopPropagation()}
    >
      <div class="flex items-center justify-between gap-3">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleClick}
          disabled={disabled}
          class={`inline-flex min-h-10 flex-1 items-center justify-center rounded-full border px-3.5 py-2 text-sm font-bold transition duration-300 ${
            votedVisual
              ? "border-slate-400/75 bg-slate-600/65 text-slate-100 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.22)]"
              : "border-cyan-200/80 bg-cyan-400/40 text-cyan-50 shadow-[0_8px_22px_rgba(34,211,238,0.22)] hover:-translate-y-0.5 hover:bg-cyan-300/55"
          } disabled:cursor-not-allowed`}
        >
          {sending ? "送信中" : votedVisual ? "押し完了" : "このゲームを推す"}
        </button>
        <p class="whitespace-nowrap text-[11px] font-semibold text-fuchsia-100/80">
          推し {status ? status.count.toLocaleString() : "-"}
        </p>
      </div>
      {message && <p class="mt-3 text-sm text-fuchsia-100">{message}</p>}
    </div>
  );
}
