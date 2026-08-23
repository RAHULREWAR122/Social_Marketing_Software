export type MediaRequirement =
  | { kind: "none" }
  | { kind: "single"; type: "image" | "video" }
  | { kind: "carousel"; min: number; max: number; type: "image" | "any" }
  | { kind: "before-after" };

export type OverlayPosition = "top" | "bottom" | "center";

export type SocialTemplate = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  media: MediaRequirement;
  overlayPosition?: OverlayPosition;
  isQuoteCard?: boolean;
};

export const SOCIAL_TEMPLATES: SocialTemplate[] = [
  {
    id: "single-image",
    name: "Single Image",
    description: "One image, clean and simple.",
    emoji: "🖼️",
    media: { kind: "single", type: "image" },
  },
  {
    id: "single-video",
    name: "Single Video",
    description: "One video post.",
    emoji: "🎬",
    media: { kind: "single", type: "video" },
  },
  {
    id: "video-caption",
    name: "Video with Caption",
    description: "A video paired with an attention-grabbing caption.",
    emoji: "📝",
    media: { kind: "single", type: "video" },
  },
  {
    id: "carousel-images",
    name: "Carousel",
    description: "Swipeable set of 2–10 images.",
    emoji: "🎞️",
    media: { kind: "carousel", min: 2, max: 10, type: "image" },
  },
  {
    id: "carousel-mixed",
    name: "Mixed Carousel",
    description: "Images and video together in one swipeable post (Instagram only).",
    emoji: "🧩",
    media: { kind: "carousel", min: 2, max: 10, type: "any" },
  },
  {
    id: "overlay-bottom",
    name: "Text Overlay — Bottom",
    description: "Bold headline banner across the bottom of your image.",
    emoji: "⬇️",
    media: { kind: "single", type: "image" },
    overlayPosition: "bottom",
  },
  {
    id: "overlay-top",
    name: "Text Overlay — Top",
    description: "Bold headline banner across the top of your image.",
    emoji: "⬆️",
    media: { kind: "single", type: "image" },
    overlayPosition: "top",
  },
  {
    id: "overlay-center",
    name: "Text Overlay — Center",
    description: "Centered statement text over your image — great for quotes.",
    emoji: "🎯",
    media: { kind: "single", type: "image" },
    overlayPosition: "center",
  },
  {
    id: "before-after",
    name: "Before / After",
    description: "Two images merged side-by-side to show a transformation.",
    emoji: "↔️",
    media: { kind: "before-after" },
  },
  {
    id: "quote-card",
    name: "Quote Card",
    description: "A styled text-only card — no photo needed.",
    emoji: "💬",
    media: { kind: "none" },
    isQuoteCard: true,
  },
];

export const TEXT_OVERLAY_COLORS: string[] = ["#ffffff", "#000000", "#facc15", "#ef4444", "#22c55e", "#38bdf8"];

export const QUOTE_GRADIENTS: { from: string; to: string }[] = [
  { from: "#1d1d1f", to: "#434346" },
  { from: "#4f46e5", to: "#9333ea" },
  { from: "#0ea5e9", to: "#22c55e" },
  { from: "#f97316", to: "#ef4444" },
  { from: "#ec4899", to: "#8b5cf6" },
  { from: "#0f172a", to: "#1e3a8a" },
];
