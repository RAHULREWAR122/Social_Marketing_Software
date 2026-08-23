import type { OverlayPosition } from "./social-templates";

function loadImage(source: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => reject(new Error("Couldn't load that image"));
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't render the image"))),
      "image/jpeg",
      0.92,
    );
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

function hexLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Burns bold text directly onto the image at the given position — the composed image, not the
 *  original, is what gets uploaded and posted. The scrim behind the text automatically flips
 *  dark/light based on the chosen text color (e.g. white text gets a dark scrim, black text gets a
 *  light one) so the text stays legible regardless of what's underneath or which color is picked —
 *  a fixed white-on-dark-scrim would go invisible against a light image with light text chosen. */
export async function composeTextOverlay(
  source: File,
  text: string,
  position: OverlayPosition,
  textColor: string = "#ffffff",
): Promise<Blob> {
  const img = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const fontSize = Math.max(24, Math.round(canvas.width * 0.065));
  ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const lines = wrapLines(ctx, text, canvas.width * 0.86);
  const lineHeight = fontSize * 1.3;
  const padding = fontSize * 0.9;
  const blockHeight = lines.length * lineHeight + padding * 2;

  const bandY =
    position === "top" ? 0 : position === "bottom" ? canvas.height - blockHeight : (canvas.height - blockHeight) / 2;

  // A light text color needs a dark scrim to sit on, a dark text color needs a light one.
  const isLightText = hexLuminance(textColor) > 0.6;
  const scrimRgb = isLightText ? "0,0,0" : "255,255,255";

  if (position === "center") {
    ctx.fillStyle = `rgba(${scrimRgb},0.5)`;
    ctx.fillRect(0, Math.max(0, bandY), canvas.width, blockHeight);
  } else {
    const gradient = ctx.createLinearGradient(0, bandY, 0, bandY + blockHeight);
    if (position === "bottom") {
      gradient.addColorStop(0, `rgba(${scrimRgb},0)`);
      gradient.addColorStop(1, `rgba(${scrimRgb},0.75)`);
    } else {
      gradient.addColorStop(0, `rgba(${scrimRgb},0.75)`);
      gradient.addColorStop(1, `rgba(${scrimRgb},0)`);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, bandY, canvas.width, blockHeight);
  }

  ctx.fillStyle = textColor;
  ctx.shadowColor = isLightText ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)";
  ctx.shadowBlur = 8;
  const textStartY = bandY + padding + fontSize * 0.85;
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, textStartY + i * lineHeight);
  });

  return canvasToBlob(canvas);
}

/** Merges two images side by side into one, with a thin divider and small labels. */
export async function composeBeforeAfter(
  fileA: File,
  fileB: File,
  labelA: string,
  labelB: string,
): Promise<Blob> {
  const [imgA, imgB] = await Promise.all([loadImage(fileA), loadImage(fileB)]);
  const height = Math.min(imgA.naturalHeight, imgB.naturalHeight, 1600);
  const widthA = imgA.naturalWidth * (height / imgA.naturalHeight);
  const widthB = imgB.naturalWidth * (height / imgB.naturalHeight);
  const dividerWidth = Math.max(4, Math.round(height * 0.006));

  const canvas = document.createElement("canvas");
  canvas.width = widthA + widthB + dividerWidth;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(imgA, 0, 0, widthA, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(widthA, 0, dividerWidth, height);
  ctx.drawImage(imgB, widthA + dividerWidth, 0, widthB, height);

  const fontSize = Math.max(18, Math.round(height * 0.055));
  ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = "top";
  const pad = fontSize * 0.5;

  const drawLabel = (text: string, x: number) => {
    if (!text) return;
    const textWidth = ctx.measureText(text).width;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(x, pad * 0.6, textWidth + pad * 2, fontSize + pad);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, x + pad, pad);
  };
  drawLabel(labelA, pad);
  drawLabel(labelB, widthA + dividerWidth + pad);

  return canvasToBlob(canvas);
}

/** Renders a text-only square "quote card" — no user photo required. */
export async function composeQuoteCard(text: string, gradientFrom: string, gradientTo: string): Promise<Blob> {
  const size = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, gradientFrom);
  gradient.addColorStop(1, gradientTo);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const fontSize = Math.round(size * 0.068);
  ctx.font = `700 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const lines = wrapLines(ctx, text || "Your quote here", size * 0.8);
  const lineHeight = fontSize * 1.35;
  const startY = size / 2 - ((lines.length - 1) * lineHeight) / 2 + fontSize * 0.3;
  lines.forEach((line, i) => ctx.fillText(line, size / 2, startY + i * lineHeight));

  return canvasToBlob(canvas);
}
