"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest, apiUpload, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { PLATFORM_LABELS, type Media, type SocialAccount, type SocialPlatform } from "@/lib/social-types";
import type { BillingInfo } from "@/lib/billing-types";
import { QUOTE_GRADIENTS, SOCIAL_TEMPLATES, TEXT_OVERLAY_COLORS, type SocialTemplate } from "@/lib/social-templates";
import { blobToFile, composeBeforeAfter, composeQuoteCard, composeTextOverlay } from "@/lib/image-compose";
import { PlatformPreview } from "./platform-preview";

const MAX_MEDIA_ITEMS = 10;
const PREVIEW_PLATFORMS: SocialPlatform[] = ["INSTAGRAM", "FACEBOOK", "LINKEDIN_PERSONAL"];

export default function ComposeSocialPostPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const beforeFileRef = useRef<HTMLInputElement>(null);
  const afterFileRef = useRef<HTMLInputElement>(null);

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [billingLoaded, setBillingLoaded] = useState(false);

  const [template, setTemplate] = useState<SocialTemplate | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [caption, setCaption] = useState("");
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [previewPlatform, setPreviewPlatform] = useState<SocialPlatform>("INSTAGRAM");

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Working state for templates that composite an image client-side (overlay / before-after /
  // quote card) before it's ever uploaded — nothing here touches the server until "Add to post".
  const [overlayFile, setOverlayFile] = useState<File | null>(null);
  const [overlayText, setOverlayText] = useState("");
  const [overlayColor, setOverlayColor] = useState(TEXT_OVERLAY_COLORS[0]);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforeLabel, setBeforeLabel] = useState("Before");
  const [afterLabel, setAfterLabel] = useState("After");
  const [quoteText, setQuoteText] = useState("");
  const [gradientIndex, setGradientIndex] = useState(0);
  const [composedPreviewUrl, setComposedPreviewUrl] = useState<string | null>(null);
  const [composedBlob, setComposedBlob] = useState<Blob | null>(null);
  const [composing, setComposing] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [accountsRes, billingRes] = await Promise.all([
        apiRequest<{ accounts: SocialAccount[] }>("/integrations/social-accounts", { accessToken }),
        apiRequest<BillingInfo>("/billing", { accessToken }),
      ]);
      setAccounts(accountsRes.accounts);
      setBilling(billingRes);
      setBillingLoaded(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load Social");
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  // Recompute the client-side composite whenever its inputs change (debounced) — this never hits
  // the network, it's pure canvas rendering purely for the live preview until "Add to post".
  useEffect(() => {
    if (!template) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        let blob: Blob | null = null;
        if (template.overlayPosition && overlayFile && overlayText.trim()) {
          setComposing(true);
          blob = await composeTextOverlay(overlayFile, overlayText.trim(), template.overlayPosition, overlayColor);
        } else if (template.media.kind === "before-after" && beforeFile && afterFile) {
          setComposing(true);
          blob = await composeBeforeAfter(beforeFile, afterFile, beforeLabel, afterLabel);
        } else if (template.isQuoteCard && quoteText.trim()) {
          setComposing(true);
          const g = QUOTE_GRADIENTS[gradientIndex];
          blob = await composeQuoteCard(quoteText.trim(), g.from, g.to);
        }
        if (!cancelled && blob) {
          setComposedBlob(blob);
          setComposedPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(blob!);
          });
        }
      } catch {
        if (!cancelled) setError("Couldn't render that preview — try a different image.");
      } finally {
        if (!cancelled) setComposing(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [template, overlayFile, overlayText, overlayColor, beforeFile, afterFile, beforeLabel, afterLabel, quoteText, gradientIndex]);

  const resetTemplateWorkingState = () => {
    setOverlayFile(null);
    setOverlayText("");
    setOverlayColor(TEXT_OVERLAY_COLORS[0]);
    setBeforeFile(null);
    setAfterFile(null);
    setBeforeLabel("Before");
    setAfterLabel("After");
    setQuoteText("");
    setGradientIndex(0);
    if (composedPreviewUrl) URL.revokeObjectURL(composedPreviewUrl);
    setComposedPreviewUrl(null);
    setComposedBlob(null);
  };

  const chooseTemplate = (t: SocialTemplate) => {
    setTemplate(t);
    setMedia([]);
    resetTemplateWorkingState();
    setError(null);
  };

  const changeTemplate = () => {
    setTemplate(null);
    setMedia([]);
    resetTemplateWorkingState();
  };

  const uploadFiles = async (files: File[]) => {
    setError(null);
    setUploading(true);
    try {
      const uploaded: Media[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const result = await apiUpload<{ media: Media }>("/media/upload", formData, accessToken);
        uploaded.push(result.media);
      }
      return uploaded;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload file");
      return [];
    } finally {
      setUploading(false);
    }
  };

  const handleSingleUpload = async (file: File) => {
    const uploaded = await uploadFiles([file]);
    if (uploaded.length) setMedia(uploaded);
  };

  const handleCarouselUpload = async (files: FileList) => {
    if (media.length + files.length > MAX_MEDIA_ITEMS) {
      setError(`At most ${MAX_MEDIA_ITEMS} media items are allowed in one post`);
      return;
    }
    const uploaded = await uploadFiles(Array.from(files));
    if (uploaded.length) setMedia((m) => [...m, ...uploaded]);
  };

  const addComposedToPost = async () => {
    if (!composedBlob) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", blobToFile(composedBlob, `${template?.id ?? "composed"}.jpg`));
      const result = await apiUpload<{ media: Media }>("/media/upload", formData, accessToken);
      setMedia([result.media]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save this image");
    } finally {
      setUploading(false);
    }
  };

  const moveMedia = (index: number, direction: -1 | 1) => {
    setMedia((m) => {
      const next = [...m];
      const target = index + direction;
      if (target < 0 || target >= next.length) return m;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeMedia = (id: string) => {
    setMedia((m) => m.filter((item) => item.id !== id));
  };

  const toggleAccount = (id: string) => {
    setSelectedAccountIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  const selectedAccounts = accounts.filter((a) => selectedAccountIds.includes(a.id));
  const videoCount = media.filter((m) => m.mediaType === "VIDEO").length;
  const hasUnsupportedMix =
    videoCount > 0 && media.length > 1 && selectedAccounts.some((a) => a.platform !== "INSTAGRAM");

  const needsComposedMedia = !!(template?.overlayPosition || template?.media.kind === "before-after" || template?.isQuoteCard);

  const canSubmit =
    !!template &&
    caption.trim().length > 0 &&
    media.length > 0 &&
    selectedAccountIds.length > 0 &&
    !hasUnsupportedMix &&
    (scheduleMode === "now" || scheduledAt.length > 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest("/social-posts", {
        method: "POST",
        accessToken,
        body: {
          caption,
          mediaIds: media.map((m) => m.id),
          socialAccountIds: selectedAccountIds,
          ...(scheduleMode === "later" ? { scheduledAt: new Date(scheduledAt).toISOString() } : {}),
        },
      });
      router.push("/app/social");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  if (billingLoaded && billing && !billing.plan.socialEnabled) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Link href="/app/social" className="text-sm text-zinc-500 hover:underline">
            ← Back to Social
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">New post</h1>
        </div>
        <section className="rounded-xl border border-black/[.08] bg-white p-8 text-center dark:border-white/[.145] dark:bg-zinc-950">
          <h2 className="text-sm font-semibold">Upgrade to unlock Social</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            Instagram, Facebook and LinkedIn publishing isn&apos;t included on the {billing.plan.name} plan. Upgrade to
            Starter or above to compose and publish posts.
          </p>
          <Link href="/app/billing" className="btn-primary mx-auto mt-4 w-auto px-6">
            Upgrade plan
          </Link>
        </section>
      </div>
    );
  }

  // Step 1: template gallery.
  if (!template) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Link href="/app/social" className="text-sm text-zinc-500 hover:underline">
            ← Back to Social
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Choose a template</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Pick a layout to start from — you&apos;ll see a live preview as you build your post.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {SOCIAL_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => chooseTemplate(t)}
              className="flex flex-col items-start gap-2 rounded-xl border border-black/[.08] bg-white p-4 text-left transition hover:border-zinc-950 dark:border-white/[.145] dark:bg-zinc-950 dark:hover:border-white"
            >
              <span className="text-3xl">{t.emoji}</span>
              <span className="text-sm font-semibold">{t.name}</span>
              <span className="text-xs text-zinc-500">{t.description}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const previewMedia = (composedPreviewUrl && media.length === 0
    ? [{ url: composedPreviewUrl, mediaType: "IMAGE" as const }]
    : media.map((m) => ({ url: m.publicUrl, mediaType: m.mediaType }))
  );
  const previewAccountLabel =
    selectedAccounts.find((a) => a.platform === previewPlatform)?.displayName ?? "your_account";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button onClick={changeTemplate} className="text-sm text-zinc-500 hover:underline">
          ← Change template
        </button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {template.emoji} {template.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{template.description}</p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
            <h2 className="text-sm font-semibold">Media</h2>

            {template.media.kind === "single" ? (
              !template.overlayPosition ? (
                <>
                  <p className="mt-1 text-xs text-zinc-500">
                    {template.media.type === "video" ? "Upload one video." : "Upload one image."}
                  </p>
                  {media[0] ? (
                    <div className="mt-4 flex items-center gap-3">
                      {media[0].mediaType === "VIDEO" ? (
                        <video src={media[0].publicUrl} className="h-24 w-24 rounded-lg object-cover" muted />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={media[0].publicUrl} alt="" className="h-24 w-24 rounded-lg object-cover" />
                      )}
                      <button onClick={() => setMedia([])} className="text-xs text-red-600 hover:underline">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        ref={fileRef}
                        type="file"
                        accept={template.media.type === "video" ? "video/mp4,video/quicktime" : "image/jpeg,image/png,image/webp"}
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleSingleUpload(e.target.files[0])}
                      />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="btn-secondary mt-4 w-auto px-4"
                      >
                        {uploading ? "Uploading..." : `Add ${template.media.type}`}
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <p className="mt-1 text-xs text-zinc-500">Upload an image, then write the text to overlay on it.</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && setOverlayFile(e.target.files[0])}
                  />
                  <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary mt-4 w-auto px-4">
                    {overlayFile ? "Change image" : "Choose image"}
                  </button>
                  {overlayFile ? (
                    <>
                      <textarea
                        rows={2}
                        value={overlayText}
                        onChange={(e) => setOverlayText(e.target.value)}
                        placeholder="e.g. BIG SALE — 50% OFF"
                        className="input mt-3"
                      />
                      <div className="mt-3">
                        <span className="text-xs font-medium text-zinc-500">Text color</span>
                        <div className="mt-1.5 flex items-center gap-2">
                          {TEXT_OVERLAY_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setOverlayColor(color)}
                              title={color}
                              className={`h-7 w-7 rounded-full border-2 ${
                                overlayColor === color ? "border-zinc-950 dark:border-white" : "border-black/[.15] dark:border-white/[.2]"
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                          <input
                            type="color"
                            value={overlayColor}
                            onChange={(e) => setOverlayColor(e.target.value)}
                            title="Custom color"
                            className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-400">
                          The banner behind the text automatically switches dark/light so it stays readable.
                        </p>
                      </div>
                    </>
                  ) : null}
                  {media[0] ? (
                    <p className="mt-3 text-xs text-green-600 dark:text-green-500">✓ Added to post — pick a different image to redo it.</p>
                  ) : overlayFile && overlayText.trim() ? (
                    <button
                      type="button"
                      onClick={addComposedToPost}
                      disabled={uploading || composing || !composedBlob}
                      className="btn-primary mt-3 w-auto px-4"
                    >
                      {composing ? "Rendering..." : uploading ? "Adding..." : "Add to post"}
                    </button>
                  ) : null}
                </>
              )
            ) : null}

            {template.media.kind === "carousel" ? (
              <>
                <p className="mt-1 text-xs text-zinc-500">
                  {template.media.min}–{template.media.max} {template.media.type === "image" ? "images" : "images or videos"}. Use the
                  arrows to set the order.
                </p>
                {media.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-3">
                    {media.map((item, index) => (
                      <li key={item.id} className="flex w-28 flex-col items-center gap-1 rounded-lg border border-black/[.08] p-2 dark:border-white/[.145]">
                        {item.mediaType === "VIDEO" ? (
                          <video src={item.publicUrl} className="h-20 w-full rounded object-cover" muted />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.publicUrl} alt="" className="h-20 w-full rounded object-cover" />
                        )}
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => moveMedia(index, -1)} disabled={index === 0} className="text-xs disabled:opacity-30">↑</button>
                          <button type="button" onClick={() => moveMedia(index, 1)} disabled={index === media.length - 1} className="text-xs disabled:opacity-30">↓</button>
                          <button type="button" onClick={() => removeMedia(item.id)} className="text-xs text-red-600 hover:underline">✕</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <input
                  ref={fileRef}
                  type="file"
                  accept={template.media.type === "image" ? "image/jpeg,image/png,image/webp" : "image/jpeg,image/png,image/webp,video/mp4,video/quicktime"}
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleCarouselUpload(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || media.length >= template.media.max}
                  className="btn-secondary mt-4 w-auto px-4"
                >
                  {uploading ? "Uploading..." : "Add media"}
                </button>
              </>
            ) : null}

            {template.media.kind === "before-after" ? (
              <>
                <p className="mt-1 text-xs text-zinc-500">Upload a "before" and an "after" image — they'll be merged into one.</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <input ref={beforeFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && setBeforeFile(e.target.files[0])} />
                    <button type="button" onClick={() => beforeFileRef.current?.click()} className="btn-secondary w-full">
                      {beforeFile ? "Change" : "Choose"} before image
                    </button>
                    <input value={beforeLabel} onChange={(e) => setBeforeLabel(e.target.value)} className="input mt-2" placeholder="Label" />
                  </div>
                  <div>
                    <input ref={afterFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && setAfterFile(e.target.files[0])} />
                    <button type="button" onClick={() => afterFileRef.current?.click()} className="btn-secondary w-full">
                      {afterFile ? "Change" : "Choose"} after image
                    </button>
                    <input value={afterLabel} onChange={(e) => setAfterLabel(e.target.value)} className="input mt-2" placeholder="Label" />
                  </div>
                </div>
                {media[0] ? (
                  <p className="mt-3 text-xs text-green-600 dark:text-green-500">✓ Added to post.</p>
                ) : beforeFile && afterFile ? (
                  <button type="button" onClick={addComposedToPost} disabled={uploading || composing || !composedBlob} className="btn-primary mt-3 w-auto px-4">
                    {composing ? "Rendering..." : uploading ? "Adding..." : "Add to post"}
                  </button>
                ) : null}
              </>
            ) : null}

            {template.media.kind === "none" && template.isQuoteCard ? (
              <>
                <p className="mt-1 text-xs text-zinc-500">Write your quote and pick a background.</p>
                <textarea
                  rows={3}
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  placeholder="Type your quote..."
                  className="input mt-3"
                />
                <div className="mt-3 flex gap-2">
                  {QUOTE_GRADIENTS.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => setGradientIndex(i)}
                      className={`h-8 w-8 rounded-full border-2 ${gradientIndex === i ? "border-zinc-950 dark:border-white" : "border-transparent"}`}
                      style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                    />
                  ))}
                </div>
                {media[0] ? (
                  <p className="mt-3 text-xs text-green-600 dark:text-green-500">✓ Added to post — edit the text above to redo it.</p>
                ) : quoteText.trim() ? (
                  <button type="button" onClick={addComposedToPost} disabled={uploading || composing || !composedBlob} className="btn-primary mt-3 w-auto px-4">
                    {composing ? "Rendering..." : uploading ? "Adding..." : "Add to post"}
                  </button>
                ) : null}
              </>
            ) : null}
          </section>

          <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
            <h2 className="text-sm font-semibold">Caption</h2>
            <textarea
              required
              rows={4}
              placeholder="Write your caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="input mt-3"
            />
          </section>

          <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
            <h2 className="text-sm font-semibold">Post to</h2>
            {accounts.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">
                No accounts connected yet.{" "}
                <Link href="/app/social" className="font-medium text-zinc-900 underline dark:text-white">
                  Connect one first
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-2">
                {accounts.map((account) => (
                  <li key={account.id} className="flex items-center gap-3 rounded-lg border border-black/[.08] px-4 py-3 text-sm dark:border-white/[.145]">
                    <input
                      type="checkbox"
                      checked={selectedAccountIds.includes(account.id)}
                      disabled={account.status !== "CONNECTED"}
                      onChange={() => toggleAccount(account.id)}
                    />
                    <div>
                      <p className="font-medium">
                        {PLATFORM_LABELS[account.platform]} — {account.displayName ?? account.externalAccountId}
                      </p>
                      {account.status !== "CONNECTED" ? <p className="text-xs text-red-600">{account.status} — reconnect to post</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {hasUnsupportedMix ? (
              <p className="mt-3 text-sm text-red-600">
                A video combined with multiple items only works for Instagram — deselect the other platforms or reduce to a single item.
              </p>
            ) : null}
          </section>

          <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
            <h2 className="text-sm font-semibold">When</h2>
            <div className="mt-3 flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={scheduleMode === "now"} onChange={() => setScheduleMode("now")} />
                Publish now
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={scheduleMode === "later"} onChange={() => setScheduleMode("later")} />
                Schedule for later
              </label>
              {scheduleMode === "later" ? (
                <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="input w-auto" />
              ) : null}
            </div>
          </section>

          <div className="flex gap-2">
            <Link href="/app/social" className="btn-secondary w-auto px-4">
              Cancel
            </Link>
            <button onClick={handleSubmit} disabled={!canSubmit || submitting} className="btn-primary w-auto px-4">
              {submitting ? "Saving..." : scheduleMode === "now" ? "Publish now" : "Schedule post"}
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="mb-3 flex gap-2">
            {PREVIEW_PLATFORMS.map((p) => (
              <button
                key={p}
                onClick={() => setPreviewPlatform(p)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  previewPlatform === p
                    ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                }`}
              >
                {p === "LINKEDIN_PERSONAL" ? "LinkedIn" : PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
          <PlatformPreview platform={previewPlatform} accountLabel={previewAccountLabel} caption={caption} media={previewMedia} />
          {needsComposedMedia ? (
            <p className="mt-2 text-center text-xs text-zinc-400">Live preview — updates as you type</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
