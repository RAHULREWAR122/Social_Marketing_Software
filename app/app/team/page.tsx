"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

type Member = {
  id: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "ANALYST";
  user: { id: string; email: string; firstName?: string | null; lastName?: string | null };
};

const ROLES = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "ANALYST"] as const;

export default function TeamPage() {
  const { accessToken, user, isAdmin } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ email: "", firstName: "", lastName: "", role: "MEMBER", password: "" });
  const [setCustomPassword, setSetCustomPassword] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await apiRequest<{ members: Member[] }>("/team/members", { accessToken });
      setMembers(result.members);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load team");
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInviteResult(null);
    try {
      const result = await apiRequest<{ temporaryPassword?: string }>("/team/members", {
        method: "POST",
        body: {
          email: invite.email,
          firstName: invite.firstName,
          lastName: invite.lastName,
          role: invite.role,
          ...(setCustomPassword && invite.password ? { password: invite.password } : {}),
        },
        accessToken,
      });
      if (result.temporaryPassword) {
        setInviteResult(
          `New account created for ${invite.email}. Temporary password (share securely, shown only once): ${result.temporaryPassword}`,
        );
      } else if (setCustomPassword && invite.password) {
        setInviteResult(`${invite.email} added to your team with the password you set.`);
      } else {
        setInviteResult(`${invite.email} added to your team.`);
      }
      setInvite({ email: "", firstName: "", lastName: "", role: "MEMBER", password: "" });
      setSetCustomPassword(false);
      setShowInvite(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add team member");
    } finally {
      setBusy(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: string) => {
    try {
      await apiRequest(`/team/members/${memberId}`, { method: "PATCH", body: { role }, accessToken });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update role");
    }
  };

  const handleRemove = async (member: Member) => {
    if (!confirm(`Remove ${member.user.email} from your team?`)) return;
    try {
      await apiRequest(`/team/members/${member.id}`, { method: "DELETE", accessToken });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove member");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{members.length} members</p>
        </div>
        {isAdmin ? (
          <button onClick={() => setShowInvite((v) => !v)} className="btn-primary w-auto px-4">
            {showInvite ? "Cancel" : "Add team member"}
          </button>
        ) : null}
      </div>

      {!isAdmin ? (
        <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          Only an owner or admin can add, change the role of, or remove team members. Ask an admin if you need changes here.
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {inviteResult ? (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
          {inviteResult}
        </p>
      ) : null}

      {showInvite && isAdmin ? (
        <form onSubmit={handleInvite} className="flex flex-col gap-3 rounded-xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input required type="email" placeholder="Email" value={invite.email} onChange={(e) => setInvite((f) => ({ ...f, email: e.target.value }))} className="input" />
            <select value={invite.role} onChange={(e) => setInvite((f) => ({ ...f, role: e.target.value }))} className="input">
              {ROLES.filter((r) => r !== "OWNER").map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <input placeholder="First name" value={invite.firstName} onChange={(e) => setInvite((f) => ({ ...f, firstName: e.target.value }))} className="input" />
            <input placeholder="Last name" value={invite.lastName} onChange={(e) => setInvite((f) => ({ ...f, lastName: e.target.value }))} className="input" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={setCustomPassword}
              onChange={(e) => setSetCustomPassword(e.target.checked)}
            />
            Set a password myself (otherwise one is generated and shown to you once)
          </label>

          {setCustomPassword ? (
            <input
              required
              type="password"
              minLength={8}
              placeholder="Password (min. 8 characters)"
              value={invite.password}
              onChange={(e) => setInvite((f) => ({ ...f, password: e.target.value }))}
              className="input"
            />
          ) : (
            <p className="text-xs text-zinc-500">
              If this email doesn&apos;t have an account yet, one is created with a temporary password shown to you once — share it with them securely.
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-auto px-4">
            {busy ? "Adding..." : "Add to team"}
          </button>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/[.08] text-xs uppercase text-zinc-500 dark:border-white/[.145]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-black/[.04] last:border-0 dark:border-white/[.08]">
                <td className="px-4 py-3 font-medium">
                  {member.user.firstName || member.user.lastName
                    ? `${member.user.firstName ?? ""} ${member.user.lastName ?? ""}`.trim()
                    : "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{member.user.email}</td>
                <td className="px-4 py-3">
                  {isAdmin ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      disabled={member.user.email === user?.email}
                      className="input max-w-[140px] py-1"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  ) : (
                    <span>{member.role}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {isAdmin ? (
                    <button
                      onClick={() => handleRemove(member)}
                      disabled={member.user.email === user?.email}
                      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-40"
                    >
                      Remove
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
