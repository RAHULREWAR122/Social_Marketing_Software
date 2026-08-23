"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useAuth, ApiError } from "@/lib/auth-context";

const registerFormSchema = z.object({
  organizationName: z.string().min(1, "Business/organization name is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerFormSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerUser(values);
      router.push("/app/dashboard");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="w-full max-w-md rounded-xl border border-black/[.08] bg-white p-8 shadow-sm dark:border-white/[.145] dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Start engaging your customers over email and WhatsApp.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <Field label="Business / organization name" error={errors.organizationName?.message}>
            <input
              {...register("organizationName")}
              className="input"
              placeholder="Acme Retail Pvt Ltd"
            />
          </Field>

          <div className="flex gap-3">
            <Field label="First name" error={errors.firstName?.message} className="flex-1">
              <input {...register("firstName")} className="input" placeholder="Rahul" />
            </Field>
            <Field label="Last name (optional)" error={errors.lastName?.message} className="flex-1">
              <input {...register("lastName")} className="input" placeholder="Sharma" />
            </Field>
          </div>

          <Field label="Email" error={errors.email?.message}>
            <input {...register("email")} type="email" className="input" placeholder="you@company.com" />
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <input {...register("password")} type="password" className="input" placeholder="At least 8 characters" />
          </Field>

          {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}

          <button type="submit" disabled={isSubmitting} className="btn-primary mt-2">
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-950 dark:text-zinc-50">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
