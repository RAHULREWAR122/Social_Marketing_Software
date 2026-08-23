"use client";

import { useEffect, useRef, useState } from "react";
import type { SocialPlatform } from "@/lib/social-types";

type PreviewMedia = { url: string; mediaType: "IMAGE" | "VIDEO" };

type Props = {
  platform: SocialPlatform;
  accountLabel: string;
  caption: string;
  media: PreviewMedia[];
};

function Avatar({ label }: { label: string }) {
  const initial = label.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 via-orange-400 to-yellow-400 text-sm font-semibold text-white">
      {initial}
    </div>
  );
}

const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
    <path d="m15 18-6-6 6-6" />
  </svg>
);
const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

// A real swipeable carousel — drag/swipe with the pointer, arrow buttons on hover, and dots you
// can click to jump directly, mirroring how Instagram/Facebook actually let you browse a carousel.
function MediaFrame({ media, aspect }: { media: PreviewMedia[]; aspect: "square" | "wide" }) {
  const [index, setIndex] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef(0);

  useEffect(() => {
    setIndex(0);
  }, [media]);

  const clampedIndex = Math.min(index, Math.max(0, media.length - 1));
  const current = media[clampedIndex];

  const goTo = (next: number) => setIndex(Math.max(0, Math.min(media.length - 1, next)));

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    dragDeltaX.current = 0;
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    dragDeltaX.current = e.clientX - dragStartX.current;
  };
  const handlePointerUp = () => {
    if (dragStartX.current === null) return;
    const delta = dragDeltaX.current;
    const SWIPE_THRESHOLD = 40;
    if (delta > SWIPE_THRESHOLD) goTo(clampedIndex - 1);
    else if (delta < -SWIPE_THRESHOLD) goTo(clampedIndex + 1);
    dragStartX.current = null;
    dragDeltaX.current = 0;
  };

  return (
    <div
      className={`group relative w-full touch-pan-y select-none overflow-hidden bg-zinc-100 dark:bg-zinc-900 ${aspect === "square" ? "aspect-square" : "aspect-[4/3]"}`}
      onPointerDown={media.length > 1 ? handlePointerDown : undefined}
      onPointerMove={media.length > 1 ? handlePointerMove : undefined}
      onPointerUp={media.length > 1 ? handlePointerUp : undefined}
      onPointerLeave={media.length > 1 ? handlePointerUp : undefined}
    >
      {current ? (
        current.mediaType === "VIDEO" ? (
          <video src={current.url} className="h-full w-full object-cover" muted />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.url} alt="" draggable={false} className="h-full w-full object-cover" />
        )
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-zinc-400">No media yet</div>
      )}

      {media.length > 1 ? (
        <>
          <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
            {clampedIndex + 1}/{media.length}
          </div>

          {clampedIndex > 0 ? (
            <button
              type="button"
              onClick={() => goTo(clampedIndex - 1)}
              className="absolute left-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-800 opacity-0 shadow transition-opacity group-hover:opacity-100"
            >
              <ChevronLeft />
            </button>
          ) : null}
          {clampedIndex < media.length - 1 ? (
            <button
              type="button"
              onClick={() => goTo(clampedIndex + 1)}
              className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-800 opacity-0 shadow transition-opacity group-hover:opacity-100"
            >
              <ChevronRight />
            </button>
          ) : null}

          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {media.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={`h-1.5 w-1.5 rounded-full transition-all ${i === clampedIndex ? "w-3 bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
  </svg>
);
const CommentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H12l-5 3 .8-4.2A8.5 8.5 0 1 1 21 11.5Z" />
  </svg>
);
const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
    <path d="m22 2-7 20-4-9-9-4Z" />
  </svg>
);
const ThumbIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
    <path d="M7 22V11l5-9 1 1v6h6l-2 13H9a2 2 0 0 1-2-2Z" />
  </svg>
);

function InstagramPreview({ accountLabel, caption, media }: Omit<Props, "platform">) {
  return (
    <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-black">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Avatar label={accountLabel} />
        <span className="text-sm font-semibold">{accountLabel}</span>
        <span className="ml-auto text-zinc-400">•••</span>
      </div>
      <MediaFrame media={media} aspect="square" />
      <div className="flex items-center gap-3 px-3 pt-2.5 text-zinc-900 dark:text-zinc-100">
        <HeartIcon />
        <CommentIcon />
        <ShareIcon />
      </div>
      <div className="px-3 pb-3 pt-2 text-sm">
        <p className="font-semibold">1,204 likes</p>
        <p className="mt-1 whitespace-pre-wrap break-words">
          <span className="font-semibold">{accountLabel}</span> {caption || <span className="text-zinc-400">Your caption will appear here…</span>}
        </p>
      </div>
    </div>
  );
}

function FacebookPreview({ accountLabel, caption, media }: Omit<Props, "platform">) {
  return (
    <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Avatar label={accountLabel} />
        <div>
          <p className="text-sm font-semibold">{accountLabel}</p>
          <p className="text-xs text-zinc-500">Just now · 🌐</p>
        </div>
      </div>
      <div className="px-3 pb-2 text-sm whitespace-pre-wrap break-words">
        {caption || <span className="text-zinc-400">Your caption will appear here…</span>}
      </div>
      <MediaFrame media={media} aspect="wide" />
      <div className="flex items-center justify-between border-t border-black/[.06] px-3 py-2 text-xs text-zinc-500 dark:border-white/[.08]">
        <span>👍 ❤️ 128</span>
        <span>24 comments</span>
      </div>
      <div className="flex items-center justify-around border-t border-black/[.06] py-1.5 text-xs font-medium text-zinc-600 dark:border-white/[.08] dark:text-zinc-400">
        <span>Like</span>
        <span>Comment</span>
        <span>Share</span>
      </div>
    </div>
  );
}

function LinkedInPreview({ accountLabel, caption, media }: Omit<Props, "platform">) {
  return (
    <div className="mx-auto w-full max-w-[380px] overflow-hidden rounded-xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Avatar label={accountLabel} />
        <div>
          <p className="text-sm font-semibold">{accountLabel}</p>
          <p className="text-xs text-zinc-500">Marketing · 1st</p>
          <p className="text-xs text-zinc-500">Just now</p>
        </div>
      </div>
      <div className="px-3 pb-2 text-sm whitespace-pre-wrap break-words">
        {caption || <span className="text-zinc-400">Your caption will appear here…</span>}
      </div>
      <MediaFrame media={media} aspect="wide" />
      <div className="flex items-center gap-1 border-t border-black/[.06] px-3 py-2 text-xs text-zinc-500 dark:border-white/[.08]">
        <ThumbIcon /> <span>89</span>
      </div>
      <div className="flex items-center justify-around border-t border-black/[.06] py-1.5 text-xs font-medium text-zinc-600 dark:border-white/[.08] dark:text-zinc-400">
        <span>Like</span>
        <span>Comment</span>
        <span>Repost</span>
        <span>Send</span>
      </div>
    </div>
  );
}

export function PlatformPreview({ platform, accountLabel, caption, media }: Props) {
  if (platform === "INSTAGRAM") return <InstagramPreview accountLabel={accountLabel} caption={caption} media={media} />;
  if (platform === "FACEBOOK") return <FacebookPreview accountLabel={accountLabel} caption={caption} media={media} />;
  return <LinkedInPreview accountLabel={accountLabel} caption={caption} media={media} />;
}
