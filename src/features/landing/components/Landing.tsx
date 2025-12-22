import Image from "next/image";
import SignInButton from "@/features/landing/components/SignInButton";
import ClientRedirect from "@/components/ClientRedirect";

const Landing = () => {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-50 overflow-hidden">
      <ClientRedirect />

      {/* Background gradient and glow accents */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black" />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-purple-500/30 blur-3xl" />
        <div className="absolute -left-10 bottom-10 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl" />
      </div>

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#1e293b_1px,transparent_0)] [background-size:36px_36px] opacity-20" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-14 lg:py-20">
        {/* Nav */}
        <header className="flex items-center justify-between gap-4 mb-12">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-500 to-sky-500 flex items-center justify-center text-white font-black">
              PS
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Parts Studio
              </p>
              <p className="text-sm text-slate-300">
                Map your inner team with clarity
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#features"
              className="hidden sm:inline-flex text-sm text-slate-300 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hidden sm:inline-flex text-sm text-slate-300 hover:text-white transition-colors"
            >
              How it works
            </a>
            <a
              href="#cta"
              className="hidden sm:inline-flex text-sm text-slate-300 hover:text-white transition-colors"
            >
              Get started
            </a>
            <SignInButton />
          </div>
        </header>

        {/* Hero */}
        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center mb-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-white/5 border border-white/10 text-slate-100">
              ✦ Build self-awareness, visually
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white">
              A modern workspace for mapping your parts, tensions, and insights.
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              Capture impressions, connect relationships, and journal directly on
              an infinite canvas. Designed to feel calming, fast, and intentional.
            </p>
            <div className="flex flex-col sm:flex-row gap-3" id="cta">
              <SignInButton />
              <a
                href="#features"
                className="inline-flex items-center justify-center px-4 py-3 rounded-xl border border-white/10 text-sm font-semibold text-slate-100 hover:border-white/30 transition-colors"
              >
                Explore features
              </a>
            </div>
            <div className="flex items-center gap-6 pt-2">
              <div>
                <p className="text-2xl font-semibold text-white">12k+</p>
                <p className="text-sm text-slate-400">Parts mapped</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div>
                <p className="text-2xl font-semibold text-white">4.8/5</p>
                <p className="text-sm text-slate-400">Session satisfaction</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/20 to-sky-500/15 blur-2xl" />
            <div className="relative rounded-3xl border border-white/10 bg-white/5 shadow-2xl overflow-hidden">
              <Image
                src="/parts-hero.jpg"
                alt="Parts Studio preview"
                width={1200}
                height={800}
                className="w-full object-cover"
                priority
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5">
                <p className="text-slate-100 text-sm font-medium">
                  Visualize parts, tensions, and impressions on a calm canvas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="space-y-6 mb-16">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Features
            </p>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-white">
            Built for clarity, speed, and gentle focus.
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                title: "Canvas mapping",
                desc: "Drag, connect, and color-code parts with relationship edges.",
              },
              {
                title: "Impression library",
                desc: "Capture emotions, thoughts, sensations, behaviors in one place.",
              },
              {
                title: "Journaling in context",
                desc: "Open the journal inline while you map, without losing flow.",
              },
              {
                title: "Themes & gradients",
                desc: "Light, dark, and calming palettes that keep focus on your work.",
              },
              {
                title: "Auto-save & recovery",
                desc: "Every change is saved, so you can pause and return anytime.",
              },
              {
                title: "Future-ready",
                desc: "Planned AI prompts, analysis, and guided reflections.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5 shadow-lg"
              >
                <p className="text-lg font-semibold text-white mb-2">
                  {card.title}
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="space-y-6 mb-16">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              How it works
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                step: "01",
                title: "Start a session",
                desc: "Open a fresh map and set your intent for the work ahead.",
              },
              {
                step: "02",
                title: "Map parts & tensions",
                desc: "Drop parts, connect relationships, and log impressions quickly.",
              },
              {
                step: "03",
                title: "Reflect & revisit",
                desc: "Journal directly on the canvas, then return with full context.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-lg"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400 mb-2">
                  {item.step}
                </p>
                <p className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-purple-600/80 via-indigo-600/70 to-sky-500/70 p-8 shadow-2xl">
          <div className="relative z-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-center">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-white/80">
                Ready to begin?
              </p>
              <h3 className="text-3xl sm:text-4xl font-semibold text-white">
                Start mapping your inner landscape today.
              </h3>
              <p className="text-slate-100/80">
                Create a map, add impressions, and capture insights—all in one calm
                workspace.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <SignInButton />
                <a
                  href="#features"
                  className="inline-flex items-center justify-center px-4 py-3 rounded-xl border border-white/30 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  See what’s inside
                </a>
              </div>
            </div>
            <div className="relative h-full">
              <div className="absolute -inset-6 bg-white/10 blur-3xl" />
              <div className="relative rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl">
                <p className="text-sm text-white/90 leading-relaxed">
                  “Parts Studio makes it effortless to capture what I’m feeling,
                  why it matters, and how my parts connect. It’s the calmest
                  place to do deep work.”
                </p>
                <p className="text-xs text-white/70 mt-3 uppercase tracking-[0.25em]">
                  — Early user, pilot cohort
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Landing;
