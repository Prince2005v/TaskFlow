"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckSquare, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.13z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
      />
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn("google", {
        callbackUrl: "/dashboard",
      });
    } catch {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode?: string | null) => {
    if (!errorCode) return null;
    switch (errorCode) {
      case "OAuthSignin":
      case "OAuthCallback":
        return "Could not connect to Google. Please check your credentials and try again.";
      case "OAuthCreateAccount":
        return "Could not create user account. Please try again.";
      case "EmailCreateAccount":
        return "Could not create user account with this email.";
      case "Callback":
        return "Authentication callback failed. Please try again.";
      case "AccessDenied":
        return "Access denied. You do not have permission to sign in.";
      default:
        return "An unexpected authentication error occurred. Please try again.";
    }
  };

  const errorMessage = getErrorMessage(error);

  return (
    <div className="w-full max-w-md">
      <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl backdrop-blur-xl">
        {/* Glow accent */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-24 w-48 bg-blue-500/20 blur-3xl pointer-events-none rounded-full" />

        {/* Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-4 shadow-inner">
            <CheckSquare className="h-6 w-6 text-blue-400" />
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase text-blue-400 mb-1">
            TaskFlow
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Welcome to TaskFlow
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to manage your tasks
          </p>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Google sign-in button */}
        <div className="mt-8">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-750 hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer active:scale-[0.99]"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            ) : (
              <GoogleIcon />
            )}
            <span>{isLoading ? "Signing in..." : "Continue with Google"}</span>
          </button>
        </div>

        {/* Security & Terms notice */}
        <div className="mt-8 border-t border-zinc-800/80 pt-6 text-center">
          <p className="text-xs text-zinc-500">
            By signing in, you agree to TaskFlow&apos;s terms of service and privacy policy.
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-blue-500/30 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.15),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />

      <Suspense
        fallback={
          <div className="flex items-center justify-center text-zinc-400 text-sm">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
