import Link from "next/link";
import {
  CheckSquare,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  BellRing,
  BarChart3,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col selection:bg-blue-600/30 selection:text-white">
      {/* Subtle background ambient grid & light */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(37,99,235,0.14),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a15_1px,transparent_1px),linear-gradient(to_bottom,#27272a15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-blue-600/10 border border-violet-500/20 text-violet-400 group-hover:border-violet-500/40 transition-colors">
              <CheckSquare className="h-5 w-5 text-violet-400" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              TaskFlow <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">AI</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-zinc-200 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-zinc-200 transition-colors">
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 transition-all hover:bg-zinc-800 hover:text-white hover:border-zinc-700"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-500"
            >
              Get started
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1">
        <section className="px-6 pt-24 pb-20 text-center sm:pt-32 sm:pb-28">
          <div className="mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-medium text-violet-400 mb-6">
              <Zap className="h-3.5 w-3.5" />
              <span>AI-Powered Team Productivity &middot; Human-in-the-Loop Design</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl sm:leading-[1.12]">
              Your team&apos;s work,{" "}
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                organized.
              </span>
            </h1>

            <p className="mt-6 text-base text-zinc-400 sm:text-lg max-w-2xl mx-auto leading-relaxed">
              TaskFlow helps teams assign work, track progress and stay aligned without unnecessary complexity.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-[0.99]"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-3.5 text-sm font-semibold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white"
              >
                <span>See how it works</span>
              </a>
            </div>

            {/* Product Value Pills */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Zero complex setup</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                <span>Enterprise Google OAuth</span>
              </div>
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-amber-400" />
                <span>Automated Gmail notifications</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t border-zinc-800/80 bg-zinc-900/30 py-20 px-6">
          <div className="mx-auto max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Core Capabilities
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Everything your team needs to stay aligned
              </h2>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                A streamlined workflow platform focused on speed, accountability, and clarity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-sm hover:border-zinc-700 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Task Management</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Create, prioritize, schedule, and organize tasks with clear priorities, statuses, and due dates.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-sm hover:border-zinc-700 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Team Collaboration</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Assign work to teammates, view individual workloads, and prevent bottlenecks with shared visibility.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-sm hover:border-zinc-700 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <BellRing className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Smart Notifications</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Automated email alerts when tasks are assigned or completed so nobody misses an update.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-sm hover:border-zinc-700 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Progress Tracking</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Real-time KPI metrics, completion tracking, and overdue alerts keep deliverables on track.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-6">
          <div className="mx-auto max-w-5xl">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Simple Execution
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                How TaskFlow powers your daily workflow
              </h2>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                Four simple steps from project kickoff to verified completion.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <span className="text-xs font-mono font-bold text-blue-400">01</span>
                <h4 className="text-sm font-semibold text-white">Create</h4>
                <p className="text-xs text-zinc-400">
                  Define title, description, priority level, and target due date in seconds.
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <span className="text-xs font-mono font-bold text-emerald-400">02</span>
                <h4 className="text-sm font-semibold text-white">Assign</h4>
                <p className="text-xs text-zinc-400">
                  Select any registered teammate from the dropdown to designate clear ownership.
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <span className="text-xs font-mono font-bold text-amber-400">03</span>
                <h4 className="text-sm font-semibold text-white">Track</h4>
                <p className="text-xs text-zinc-400">
                  Move items through Pending, In Progress, and Completed with interactive status badges.
                </p>
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <span className="text-xs font-mono font-bold text-purple-400">04</span>
                <h4 className="text-sm font-semibold text-white">Complete</h4>
                <p className="text-xs text-zinc-400">
                  Verify deliverables and automatically notify teammates with real-time updates.
                </p>
              </div>
            </div>

            {/* Bottom CTA Banner */}
            <div className="mt-16 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-8 text-center sm:p-10">
              <h3 className="text-xl font-bold text-white sm:text-2xl">
                Ready to accelerate your team&apos;s productivity?
              </h3>
              <p className="mt-2 text-sm text-zinc-400 max-w-lg mx-auto">
                Sign in with Google today and experience frictionless task management.
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-500"
                >
                  <span>Launch TaskFlow</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 px-6 text-center text-xs text-zinc-500">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-zinc-300">TaskFlow</span>
            <span className="text-zinc-600">&bull;</span>
            <span>Task &amp; Workflow Management for Teams</span>
          </div>
          <p>© {new Date().getFullYear()} TaskFlow Technologies. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
