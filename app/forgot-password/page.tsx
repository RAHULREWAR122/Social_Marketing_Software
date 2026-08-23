"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { apiRequest, ApiError } from "@/lib/api-client";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type EmailValues = z.infer<typeof emailSchema>;

const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});
type OtpValues = z.infer<typeof otpSchema>;

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
type PasswordValues = z.infer<typeof passwordSchema>;

type Step = "email" | "otp" | "password" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const emailForm = useForm<EmailValues>({ resolver: zodResolver(emailSchema) });
  const otpForm = useForm<OtpValues>({ resolver: zodResolver(otpSchema) });
  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  const submitEmail = async (values: EmailValues) => {
    setServerError(null);
    try {
      await apiRequest<{ message: string }>("/auth/forgot-password", { method: "POST", body: values });
      setEmail(values.email);
      setStep("otp");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  };

  const resendCode = async () => {
    setServerError(null);
    setResending(true);
    try {
      await apiRequest<{ message: string }>("/auth/forgot-password", { method: "POST", body: { email } });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const submitOtp = async (values: OtpValues) => {
    setServerError(null);
    try {
      const result = await apiRequest<{ resetToken: string }>("/auth/verify-reset-otp", {
        method: "POST",
        body: { email, otp: values.otp },
      });
      setResetToken(result.resetToken);
      setStep("password");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  };

  const submitPassword = async (values: PasswordValues) => {
    setServerError(null);
    try {
      await apiRequest<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: { token: resetToken, newPassword: values.newPassword },
      });
      setStep("done");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="w-full max-w-md rounded-xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-950">
        {step === "email" ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              We&apos;ll email you a 6-digit code to verify it&apos;s you.
            </p>

            <form onSubmit={emailForm.handleSubmit(submitEmail)} className="mt-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Email</span>
                <input {...emailForm.register("email")} type="email" className="input" placeholder="you@company.com" />
                {emailForm.formState.errors.email ? (
                  <span className="text-xs text-red-600">{emailForm.formState.errors.email.message}</span>
                ) : null}
              </label>

              {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}

              <button type="submit" disabled={emailForm.formState.isSubmitting} className="btn-primary mt-2">
                {emailForm.formState.isSubmitting ? "Sending..." : "Send code"}
              </button>
            </form>
          </>
        ) : null}

        {step === "otp" ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Enter your code</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              If an account exists for <span className="font-medium">{email}</span>, we sent it a 6-digit code. It
              expires in 10 minutes.
            </p>

            <form onSubmit={otpForm.handleSubmit(submitOtp)} className="mt-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">6-digit code</span>
                <input
                  {...otpForm.register("otp")}
                  inputMode="numeric"
                  maxLength={6}
                  className="input tracking-[0.5em]"
                  placeholder="000000"
                />
                {otpForm.formState.errors.otp ? (
                  <span className="text-xs text-red-600">{otpForm.formState.errors.otp.message}</span>
                ) : null}
              </label>

              {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}

              <button type="submit" disabled={otpForm.formState.isSubmitting} className="btn-primary mt-2">
                {otpForm.formState.isSubmitting ? "Verifying..." : "Verify code"}
              </button>
              <button
                type="button"
                onClick={resendCode}
                disabled={resending}
                className="text-xs font-medium text-zinc-600 hover:underline dark:text-zinc-400"
              >
                {resending ? "Sending..." : "Didn't get a code? Send again"}
              </button>
            </form>
          </>
        ) : null}

        {step === "password" ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Code verified — choose a new password.</p>

            <form onSubmit={passwordForm.handleSubmit(submitPassword)} className="mt-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">New password</span>
                <input {...passwordForm.register("newPassword")} type="password" className="input" />
                {passwordForm.formState.errors.newPassword ? (
                  <span className="text-xs text-red-600">{passwordForm.formState.errors.newPassword.message}</span>
                ) : null}
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Confirm new password</span>
                <input {...passwordForm.register("confirmPassword")} type="password" className="input" />
                {passwordForm.formState.errors.confirmPassword ? (
                  <span className="text-xs text-red-600">{passwordForm.formState.errors.confirmPassword.message}</span>
                ) : null}
              </label>

              {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}

              <button type="submit" disabled={passwordForm.formState.isSubmitting} className="btn-primary mt-2">
                {passwordForm.formState.isSubmitting ? "Updating..." : "Update password"}
              </button>
            </form>
          </>
        ) : null}

        {step === "done" ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Password updated</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Your password has been changed. Please log in again — you&apos;ve been signed out everywhere else.
            </p>
            <Link href="/login" className="btn-primary mt-6 block text-center">
              Back to login
            </Link>
          </>
        ) : null}

        {step !== "done" ? (
          <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            <Link href="/login" className="font-medium text-zinc-950 dark:text-zinc-50">
              Back to login
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
