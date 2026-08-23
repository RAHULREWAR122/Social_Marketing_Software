"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

const NAV_SECTIONS: { label: string; href: string }[] = [
  { label: "Dashboard", href: "/app/dashboard" },
  { label: "Contacts", href: "/app/contacts" },
  { label: "Campaigns", href: "/app/campaigns" },
  { label: "Templates", href: "/app/templates" },
  { label: "Email", href: "/app/email" },
  { label: "WhatsApp", href: "/app/whatsapp" },
  { label: "Social", href: "/app/social" },
  { label: "Analytics", href: "/app/analytics" },
  { label: "Automations", href: "/app/automations" },
  { label: "Integrations", href: "/app/integrations" },
  { label: "Billing", href: "/app/billing" },
  { label: "Team", href: "/app/team" },
  { label: "Settings", href: "/app/settings" },
];

export default function AppLayout({ children }: LayoutProps<"/app">) {
  const { status, user, organization, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status !== "authenticated") {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-500">Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 bg-zinc-50 dark:bg-black">
      <aside className="flex w-60 shrink-0 flex-col border-r border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
        <div className="border-b border-black/[.08] px-5 py-4 dark:border-white/[.145]">
          <p className="truncate text-sm font-semibold">{organization?.name ?? "Your workspace"}</p>
          <p className="truncate text-xs text-zinc-500">{user?.email}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          {NAV_SECTIONS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                    : "text-zinc-700 hover:bg-black/[.04] dark:text-zinc-300 dark:hover:bg-white/[.08]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-black/[.08] p-3 dark:border-white/[.145]">
          <button onClick={() => logout()} className="btn-secondary">
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
