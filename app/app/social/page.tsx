"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { PLATFORM_LABELS, type SocialAccount, type SocialPost } from "@/lib/social-types";
import type { BillingInfo } from "@/lib/billing-types";

function statusBadgeClass(status: string) {
  if (status === "PUBLISHED" || status === "CONNECTED") return "text-green-600 dark:text-green-500";
  if (status === "FAILED" || status === "ERROR") return "text-red-600 dark:text-red-500";
  if (status === "PARTIALLY_PUBLISHED") return "text-amber-600 dark:text-amber-500";
  return "text-zinc-500";
}

function SocialContent() {
  const { accessToken, isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [accountsRes, postsRes, billingRes] = await Promise.all([
        apiRequest<{ accounts: SocialAccount[] }>("/integrations/social-accounts", { accessToken }),
        apiRequest<{ posts: SocialPost[] }>("/social-posts", { accessToken }),
        apiRequest<BillingInfo>("/billing", { accessToken }),
      ]);
      setAccounts(accountsRes.accounts);
      setPosts(postsRes.posts);
      setBilling(billingRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load Social");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  if (!loading && billing && !billing.plan.socialEnabled) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Social</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Connect Instagram, Facebook and LinkedIn, then publish image, video or carousel posts.
          </p>
        </div>
        <section className="rounded-xl border border-black/[.08] bg-white p-8 text-center dark:border-white/[.145] dark:bg-zinc-950">
          <h2 className="text-sm font-semibold">Upgrade to unlock Social</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            Instagram, Facebook and LinkedIn publishing isn&apos;t included on the {billing.plan.name} plan. Upgrade to
            Starter or above to connect accounts and start posting.
          </p>
          <Link href="/app/billing" className="btn-primary mx-auto mt-4 w-auto px-6">
            Upgrade plan
          </Link>
        </section>
      </div>
    );
  }

  const metaStatus = searchParams.get("meta");
  const linkedinStatus = searchParams.get("linkedin");

  const handleConnect = async (kind: "meta" | "linkedin-personal" | "linkedin-organization") => {
    setConnecting(kind);
    setError(null);
    try {
      const path =
        kind === "meta"
          ? "/integrations/meta/connect"
          : `/integrations/linkedin/connect?variant=${kind === "linkedin-organization" ? "organization" : "personal"}`;
      const { url } = await apiRequest<{ url: string }>(path, { method: "POST", accessToken });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start connection");
      setConnecting(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm("Disconnect this account?")) return;
    await apiRequest(`/integrations/social-accounts/${accountId}`, { method: "DELETE", accessToken });
    load();
  };

  const handleCancelPost = async (postId: string) => {
    if (!confirm("Cancel this scheduled post?")) return;
    await apiRequest(`/social-posts/${postId}/cancel`, { method: "POST", accessToken });
    load();
  };

  const accountsByPlatform = {
    FACEBOOK: accounts.filter((a) => a.platform === "FACEBOOK"),
    INSTAGRAM: accounts.filter((a) => a.platform === "INSTAGRAM"),
    LINKEDIN_PERSONAL: accounts.filter((a) => a.platform === "LINKEDIN_PERSONAL"),
    LINKEDIN_ORGANIZATION: accounts.filter((a) => a.platform === "LINKEDIN_ORGANIZATION"),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Social</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Connect Instagram, Facebook and LinkedIn, then publish image, video or carousel posts.
          </p>
        </div>
        <Link href="/app/social/compose" className="btn-primary w-auto px-4">
          New post
        </Link>
      </div>

      {metaStatus === "connected" ? (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
          Facebook/Instagram connected successfully.
        </p>
      ) : null}
      {metaStatus === "error" ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          Couldn&apos;t connect Facebook/Instagram. Please try again.
        </p>
      ) : null}
      {linkedinStatus === "connected" ? (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
          LinkedIn connected successfully.
        </p>
      ) : null}
      {linkedinStatus === "error" ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          Couldn&apos;t connect LinkedIn. Please try again.
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!isAdmin ? (
        <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          Connecting or disconnecting an account requires owner or admin permission. Ask an admin to do this.
        </p>
      ) : null}

      <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Facebook &amp; Instagram</h2>
            <p className="mt-1 text-sm text-zinc-500">One Meta connection covers both — any Pages you manage, plus their linked Instagram Business accounts.</p>
          </div>
          {isAdmin ? (
            <button onClick={() => handleConnect("meta")} disabled={connecting === "meta"} className="btn-primary w-auto px-4">
              {connecting === "meta" ? "Redirecting..." : "Connect Facebook & Instagram"}
            </button>
          ) : null}
        </div>

        <AccountList
          accounts={[...accountsByPlatform.FACEBOOK, ...accountsByPlatform.INSTAGRAM]}
          loading={loading}
          isAdmin={isAdmin}
          onDisconnect={handleDisconnect}
        />
      </section>

      <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">LinkedIn — Personal profile</h2>
            <p className="mt-1 text-sm text-zinc-500">Post as your own LinkedIn profile.</p>
          </div>
          {isAdmin ? (
            <button
              onClick={() => handleConnect("linkedin-personal")}
              disabled={connecting === "linkedin-personal"}
              className="btn-primary w-auto px-4"
            >
              {connecting === "linkedin-personal" ? "Redirecting..." : "Connect LinkedIn"}
            </button>
          ) : null}
        </div>
        <AccountList accounts={accountsByPlatform.LINKEDIN_PERSONAL} loading={loading} isAdmin={isAdmin} onDisconnect={handleDisconnect} />
      </section>

      <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">LinkedIn — Company Page</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Requires LinkedIn to approve this app for their Marketing Developer Platform partner program — publishing
              won&apos;t work until that approval is granted, even after connecting.
            </p>
          </div>
          {isAdmin ? (
            <button
              onClick={() => handleConnect("linkedin-organization")}
              disabled={connecting === "linkedin-organization"}
              className="btn-secondary w-auto px-4"
            >
              {connecting === "linkedin-organization" ? "Redirecting..." : "Connect Company Page"}
            </button>
          ) : null}
        </div>
        <AccountList accounts={accountsByPlatform.LINKEDIN_ORGANIZATION} loading={loading} isAdmin={isAdmin} onDisconnect={handleDisconnect} />
      </section>

      <section className="rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-sm font-semibold">Posts</h2>

        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No posts yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {posts.map((post) => (
              <li key={post.id} className="rounded-lg border border-black/[.08] px-4 py-3 text-sm dark:border-white/[.145]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{post.caption}</p>
                    <p className={`mt-1 text-xs font-medium ${statusBadgeClass(post.status)}`}>{post.status}</p>
                  </div>
                  {(post.status === "SCHEDULED" || post.status === "QUEUED") ? (
                    <button onClick={() => handleCancelPost(post.id)} className="shrink-0 text-xs font-medium text-red-600 hover:underline">
                      Cancel
                    </button>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {post.targets.map((target) => (
                    <span
                      key={target.id}
                      title={target.errorMessage ?? undefined}
                      className={`rounded-full border border-black/[.08] px-2 py-0.5 text-xs dark:border-white/[.145] ${statusBadgeClass(target.status)}`}
                    >
                      {PLATFORM_LABELS[target.socialAccount.platform]}: {target.status}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function AccountList({
  accounts,
  loading,
  isAdmin,
  onDisconnect,
}: {
  accounts: SocialAccount[];
  loading: boolean;
  isAdmin: boolean;
  onDisconnect: (id: string) => void;
}) {
  if (loading) return <p className="mt-4 text-sm text-zinc-500">Loading...</p>;
  if (accounts.length === 0) return <p className="mt-4 text-sm text-zinc-500">Not connected yet.</p>;

  return (
    <ul className="mt-4 flex flex-col gap-2">
      {accounts.map((account) => (
        <li key={account.id} className="flex items-center justify-between rounded-lg border border-black/[.08] px-4 py-3 text-sm dark:border-white/[.145]">
          <div>
            <p className="font-medium">{account.displayName ?? account.externalAccountId}</p>
            <p className={`text-xs ${statusBadgeClass(account.status)}`}>{account.status}</p>
          </div>
          {isAdmin ? (
            <button onClick={() => onDisconnect(account.id)} className="text-xs font-medium text-red-600 hover:underline">
              Disconnect
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default function SocialPage() {
  return (
    <Suspense>
      <SocialContent />
    </Suspense>
  );
}
