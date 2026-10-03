import Link from "next/link";
import { CheckSquare, ArrowRight, ShieldCheck, Zap, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col selection:bg-blue-500/30 selection:text-white overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,130,246,0.18),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_120%,rgba(99,102,241,0.1),rgba(255,255,255,0))]" />

      {/* Navigation Header */}
      <header className="relative z-10 w-full border-b border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <CheckSquare className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              TaskFlow
            </span>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-medium text-blue-400 mb-6 backdrop-blur-sm">
            <Zap className="h-3.5 w-3.5" />
            <span>Modern Task & Workflow Management</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.1]">
            Organize tasks. <br />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Accelerate your workflow.
            </span>
          </h1>

          <p className="mt-6 text-base text-zinc-400 sm:text-lg max-w-2xl mx-auto leading-relaxed">
            TaskFlow helps teams and individuals track priorities, collaborate effortlessly, and ship projects faster with intuitive task orchestration.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Highlights */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left border-t border-zinc-800/60 pt-10">
            <div className="flex flex-col gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <CheckSquare className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Smart Prioritization</h3>
              <p className="text-xs text-zinc-400">Keep high-impact tasks visible and never miss project deadlines.</p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Team Delegation</h3>
              <p className="text-xs text-zinc-400">Assign work seamlessly with clear ownership and status tracking.</p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Secure Google OAuth</h3>
              <p className="text-xs text-zinc-400">Fast and secure authentication powered by NextAuth & Prisma.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        <p>© {new Date().getFullYear()} TaskFlow. All rights reserved.</p>
      </footer>
    </div>
  );
}
