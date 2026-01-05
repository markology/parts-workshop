"use client";

import { Heart, Route } from "lucide-react";
import Modal from "@/components/Modal";
import FeedbackForm from "@/components/FeedbackForm";
import PageHeader from "@/components/PageHeader";
import { useUIStore } from "@/features/workspace/state/stores/UI";

export default function MissionPage() {
  const showFeedbackModal = useUIStore((s) => s.showFeedbackModal);
  const setShowFeedbackModal = useUIStore((s) => s.setShowFeedbackModal);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--mission-bg)] text-[var(--mission-text-primary)]">
      {/* Background gradient and glow accents */}
      <div className="absolute inset-0">
        <div className="absolute inset-0  light:bg-gradient-to-br light:from-slate-50 light:via-blue-50/30 light:to-purple-50/30 dark:bg-[image:var(--mission-gradient-bg)]" />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-purple-200/40 dark:bg-purple-500/30 blur-3xl" />
        <div className="absolute -left-10 bottom-10 h-72 w-72 rounded-full bg-sky-200/40 dark:bg-sky-500/25 blur-3xl" />
      </div>

      {/* Subtle grid */}
      {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#1e293b_1px,transparent_0)] [background-size:36px_36px] opacity-[var(--mission-grid-opacity)]" /> */}

      <PageHeader pageName="Mission + Roadmap" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-14 lg:py-20">
        {/* Page Headline */}
        <section className="text-center mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold border bg-[var(--mission-phase-item-bg)] dark:bg-[rgba(39,43,47,0.5)] border-[var(--mission-border)] text-[var(--mission-text-secondary)]">
            ✦ Mission & Vision
          </div>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight"
            style={{
              background: "linear-gradient(90deg, #be54fe, #6366f1, #0ea5e9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Our mission to heal inner teams
          </h1>
          <p className="text-lg max-w-2xl mx-auto text-[var(--mission-text-secondary)]">
            Learn about the story behind Parts Studio and the roadmap ahead as
            we build tools to support your parts work journey.
          </p>

          {/* Table of Contents */}
          <nav className="flex items-center justify-center gap-2 flex-wrap pt-4">
            {[
              { label: "About Me", id: "about-me" },
              { label: "Vision", id: "vision" },
              { label: "Where It's Headed", id: "where-its-headed" },
              { label: "Roadmap", id: "roadmap" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  const element = document.getElementById(item.id);
                  if (element) {
                    element.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
                className="px-4 py-2 text-sm font-medium rounded-full transition-all cursor-pointer hover:scale-105 shadow-lg hover:shadow-xl border bg-slate-800 dark:bg-[#272b2f] text-white dark:text-white border-slate-700 dark:border-white/10 hover:bg-slate-700 dark:hover:bg-[#2a2e32]"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </section>

        {/* Mission Section */}
        <section className="space-y-12 mb-20">
          <div className="flex items-center gap-2 text-[var(--mission-text-secondary)]">
            <Heart className="w-4 h-4 text-[var(--mission-heart-icon)]" />
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--mission-text-muted)]">
              Mission
            </p>
          </div>

          {/* About Me */}
          <div id="about-me" className="space-y-6 scroll-mt-24">
            <h2 className="text-3xl font-semibold text-[var(--mission-text-primary)]">
              About Me
            </h2>

            <div className="space-y-6">
              {/* Photo - floats inline */}
              <div className="float-left mr-6 mb-4 w-[250px] sm:w-[300px]">
                {/* Photo */}
                <div className="relative">
                  <div className="absolute -inset-4 blur-2xl bg-[var(--mission-photo-glow)]" />
                  <div className="relative rounded-3xl shadow-2xl overflow-hidden aspect-square border border-[var(--mission-photo-border)] bg-[var(--mission-photo-bg)]">
                    <div className="w-full h-full flex items-center justify-center bg-[image:var(--mission-photo-inner-bg)] text-[var(--mission-photo-text)]">
                      <p className="text-sm">Your photo here</p>
                    </div>
                    {/* Replace the div above with Image component when you have your photo:
                    <Image
                      src="/mark-photo.jpg"
                      alt="Mark"
                      width={300}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    */}
                  </div>
                </div>
              </div>

              <div className="prose max-w-none space-y-4 leading-relaxed dark:prose-invert text-[var(--mission-text-primary)] dark:text-[var(--mission-text-secondary)]">
                <p>
                  I live the vanlife. I'm a Software Engineer who got into
                  Internal Family Systems at a time in my life when I didn't
                  know how to find compassion for myself and didn't realize that
                  I was full of Self like parts. I dedicated over 100 hours in
                  IFS therapy in the past 2 years, have 100s of hours of journal
                  entries and have integrated parts work deeply into my Buddhist
                  and ceremonial practices. I am involved with IFS communities
                  and practitioners and have explored creative IFS expressions
                  and experimentation. I am proud to say that I am almost never
                  without Self available anymore where it was a constant
                  struggle to taste Self's presence.
                </p>

                <p>
                  I was sitting in Peru last year on my last dollars going
                  through interviews trying to recoup from a lifetime of
                  suffering and spending in search of peace and answers. At this
                  point I have Self, I have my Kashmir Shaivism heart focused
                  meditation practice and I am alternating between hours of
                  meditation and interviewing for a new job in the US (from
                  Peru). I really wanted to think of a way to help give my
                  practice to others and I had wracked my brain forever trying
                  to think of a way to invent something useful -- especially now
                  that AI was available I was certain there was some way,
                  however challenging, to use it to wake people up and unlock
                  self therapy.
                </p>
              </div>
            </div>
          </div>

          {/* The Vision */}
          <div id="vision" className="space-y-6 clear-both scroll-mt-24">
            <h2 className="text-3xl font-semibold text-[var(--mission-text-primary)]">
              The Vision
            </h2>

            <div className="prose max-w-none space-y-4 leading-relaxed dark:prose-invert text-[var(--mission-text-primary)] dark:text-[var(--mission-text-secondary)]">
              <p>
                One day I sat in meditation and thought, what would it look like
                if I had a virtual world around me to do what im doing in my
                practice. I sat and watched as I noticed thoughts, sensations,
                behaviors and emotions arise and fall. I noted them. I watched
                my mind place those in a pile. Then I watched as I categorized
                and noticed their differences. This emotion seems to pair with
                this behavior and these thoughts, but these feelings within me
                seem to pair with these others. And so, I developed parts out of
                what I saw and spoke to these custom projections within me that
                contained these things I had noticed within my meditation.
              </p>

              <p>
                And so, with Parts Studio, its just that. Its a meditation
                noting practice that holds what you've noticed and allows you to
                return to it, customize and organize those groups into parts,
                into projections. And then from there you can start to notice
                how these parts feel towards eachother and how you feel towards
                them. You can speak to them, and grow a relationship with them.
                Changing your relationship to yourself and no longer seeing
                these aspects as You, as Self, but as parts of you that have
                rationale for what they do, why they feel the way they do and
                they have a story to tell. I want to be able to capture and love
                on these stories and I want you to be able to as well.
              </p>
            </div>
          </div>

          {/* Where It's Headed */}
          <div id="where-its-headed" className="space-y-6 scroll-mt-24">
            <h2 className="text-3xl font-semibold text-[var(--mission-text-primary)]">
              Where It's Headed
            </h2>

            <div className="prose max-w-none space-y-4 leading-relaxed dark:prose-invert text-[var(--mission-text-primary)] dark:text-[var(--mission-text-secondary)]">
              <p>
                So, Parts Studio. I hope that life allows me the time and
                finances to spend all of my time creating this into the grander
                vision I have with AI, more tools and therapist involvement.
                Lets heal our inner teams, together.
              </p>

              <p>
                I did eventually get a job here in the States and made a small
                amount back but am not financially sound. I left my job to focus
                on this app while I work locally as a wellness facility as a
                manager and live in my van. Any donations would be greatly
                appreciated and would allow me to continue pouring my capacity
                in this work. Thank you. Im also happy to put donations towards
                future membership costs, features, etc.
              </p>
            </div>

            {/* Donation Button */}
            <div className="pt-4">
              <a
                href="#donate"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-sky-500 text-white font-semibold hover:from-purple-700 hover:to-sky-600 transition-all shadow-lg hover:shadow-xl"
              >
                Support Parts Studio
              </a>
            </div>
          </div>
        </section>

        {/* Roadmap Section */}
        <section id="roadmap" className="space-y-8 mb-20 scroll-mt-24">
          <div className="flex items-center gap-2 text-[var(--mission-text-secondary)]">
            <Route className="w-4 h-4 text-[var(--mission-route-icon)]" />
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--mission-text-muted)]">
              Roadmap
            </p>
          </div>

          <h2 className="text-3xl sm:text-4xl font-semibold text-[var(--mission-text-primary)]">
            The journey ahead
          </h2>

          <p className="text-lg max-w-3xl text-[var(--mission-text-secondary)]">
            Here's a glimpse into the phases of features we're planning to roll
            out. Each phase builds on the last, creating a more comprehensive
            and supportive experience for your parts work.
          </p>

          {/* Roadmap Phases */}
          <div className="space-y-12 mt-12">
            {/* Phase 1: AI Features */}
            <div className="rounded-3xl backdrop-blur-sm p-8 shadow-lg border border-[var(--mission-phase-card-border)] bg-[var(--mission-phase-card-bg)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-sky-500 flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-[var(--mission-text-primary)]">
                    AI-Powered Guidance
                  </h3>
                  <p className="text-sm text-[var(--mission-text-muted)]">
                    Intelligent support for your parts work
                  </p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl p-5 border border-[var(--mission-phase-item-border)] bg-[var(--mission-phase-item-bg)]">
                  <p className="font-semibold mb-2 text-[var(--mission-text-primary)]">
                    Resolve Tensions
                  </p>
                  <p className="text-sm leading-relaxed text-[var(--mission-text-secondary)]">
                    AI will help identify and work through tensions between
                    parts, offering insights and suggestions for resolution.
                  </p>
                </div>
                <div className="rounded-2xl p-5 border border-[var(--mission-phase-item-border)] bg-[var(--mission-phase-item-bg)]">
                  <p className="font-semibold mb-2 text-[var(--mission-text-primary)]">
                    Deepen Relationships
                  </p>
                  <p className="text-sm leading-relaxed text-[var(--mission-text-secondary)]">
                    Build stronger connections with each part through AI-guided
                    conversations and relationship mapping.
                  </p>
                </div>
                <div className="rounded-2xl p-5 border border-[var(--mission-phase-item-border)] bg-[var(--mission-phase-item-bg)]">
                  <p className="font-semibold mb-2 text-[var(--mission-text-primary)]">
                    Session Guidance
                  </p>
                  <p className="text-sm leading-relaxed text-[var(--mission-text-secondary)]">
                    Get real-time support and guidance as you work through your
                    parts during sessions.
                  </p>
                </div>
                <div className="rounded-2xl p-5 border border-[var(--mission-phase-item-border)] bg-[var(--mission-phase-item-bg)]">
                  <p className="font-semibold mb-2 text-[var(--mission-text-primary)]">
                    Journal Analysis
                  </p>
                  <p className="text-sm leading-relaxed text-[var(--mission-text-secondary)]">
                    AI will extract impressions and insights from your journal
                    entries, helping you discover patterns and connections.
                  </p>
                </div>
                <div className="rounded-2xl p-5 md:col-span-2 border border-[var(--mission-phase-item-border)] bg-[var(--mission-phase-item-bg)]">
                  <p className="font-semibold mb-2 text-[var(--mission-text-primary)]">
                    Map Understanding & Generation
                  </p>
                  <p className="text-sm leading-relaxed text-[var(--mission-text-secondary)]">
                    AI will understand your existing map structure and help
                    generate new maps, suggest connections, and identify
                    relationships you might not have noticed.
                  </p>
                </div>
              </div>
            </div>

            {/* Phase 2: New Tools */}
            <div className="rounded-3xl backdrop-blur-sm p-8 shadow-lg border border-[var(--mission-phase-card-border)] bg-[var(--mission-phase-card-bg)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-[var(--mission-text-primary)]">
                    Enhanced Mapping Tools
                  </h3>
                  <p className="text-sm text-[var(--mission-text-muted)]">
                    New ways to visualize and connect with your parts
                  </p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl p-5 border border-[var(--mission-phase-item-border)] bg-[var(--mission-phase-item-bg)]">
                  <p className="font-semibold mb-2 text-[var(--mission-text-primary)]">
                    3D Avatar Mapping
                  </p>
                  <p className="text-sm leading-relaxed text-[var(--mission-text-secondary)]">
                    Relate your body to parts by drawing on a 3D character
                    model, replacing traditional body mapping with an
                    interactive avatar experience.
                  </p>
                </div>
                <div className="rounded-2xl p-5 border border-[var(--mission-phase-item-border)] bg-[var(--mission-phase-item-bg)]">
                  <p className="font-semibold mb-2 text-[var(--mission-text-primary)]">
                    AI Image Generation
                  </p>
                  <p className="text-sm leading-relaxed text-[var(--mission-text-secondary)]">
                    Generate AI-powered images for your parts, creating visual
                    representations that capture their essence and character.
                  </p>
                </div>
              </div>
            </div>

            {/* Phase 3: Resources & Support */}
            <div className="rounded-3xl backdrop-blur-sm p-8 shadow-lg border border-[var(--mission-phase-card-border)] bg-[var(--mission-phase-card-bg)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-[var(--mission-text-primary)]">
                    Resources & Support
                  </h3>
                  <p className="text-sm text-[var(--mission-text-muted)]">
                    Comprehensive support for your healing journey
                  </p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl p-5 border border-[var(--mission-phase-item-border)] bg-[var(--mission-phase-item-bg)]">
                  <p className="font-semibold mb-2 text-[var(--mission-text-primary)]">
                    Guided Meditations
                  </p>
                  <p className="text-sm leading-relaxed text-[var(--mission-text-secondary)]">
                    Access curated guided meditations designed specifically for
                    parts work and Self-connection.
                  </p>
                </div>
                <div className="rounded-2xl p-5 border border-[var(--mission-phase-item-border)] bg-[var(--mission-phase-item-bg)]">
                  <p className="font-semibold mb-2 text-[var(--mission-text-primary)]">
                    Tips & Techniques
                  </p>
                  <p className="text-sm leading-relaxed text-[var(--mission-text-secondary)]">
                    Learn practical tips and techniques for working with parts,
                    managing tensions, and deepening your practice.
                  </p>
                </div>
                <div className="rounded-2xl p-5 md:col-span-2 border border-[var(--mission-phase-item-border)] bg-[var(--mission-phase-item-bg)]">
                  <p className="font-semibold mb-2 text-[var(--mission-text-primary)]">
                    Therapist Network
                  </p>
                  <p className="text-sm leading-relaxed text-[var(--mission-text-secondary)]">
                    Eventually, we'll connect you with qualified IFS therapists
                    who can provide professional support for your map and parts
                    work.
                  </p>
                </div>
              </div>
            </div>

            {/* Phase 4: Affirmations */}
            <div className="rounded-3xl backdrop-blur-sm p-8 shadow-lg border border-[var(--mission-phase-card-border)] bg-[var(--mission-phase-card-bg)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                  4
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-[var(--mission-text-primary)]">
                    Affirmation Prompts
                  </h3>
                  <p className="text-sm text-[var(--mission-text-muted)]">
                    Provoke opposing parts and discover new trailheads
                  </p>
                </div>
              </div>
              <div className="rounded-2xl p-5 border border-[var(--mission-phase-item-border)] bg-[var(--mission-phase-item-bg)]">
                <p className="font-semibold mb-2 text-[var(--mission-text-primary)]">
                  Trailhead Discovery
                </p>
                <p className="text-sm leading-relaxed text-[var(--mission-text-secondary)]">
                  Use carefully crafted affirmation prompts to help provoke
                  opposing parts and start new trailheads to work with for your
                  best self. These prompts are designed to surface parts that
                  may be hidden or protecting, creating opportunities for deeper
                  work and integration.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Donation Section */}
        <section
          id="donate"
          className="relative overflow-hidden rounded-3xl p-8 shadow-2xl border border-[var(--mission-donation-border)] bg-[image:var(--mission-donation-bg)]"
        >
          <div className="relative z-10 space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--mission-donation-text)]">
              Support the Mission
            </p>
            <h3 className="text-3xl sm:text-4xl font-semibold text-white">
              Help Parts Studio grow
            </h3>
            <p className="max-w-2xl text-[var(--mission-donation-text)]">
              Your donations directly support the development of Parts Studio,
              allowing me to dedicate more time to building features that help
              people heal their inner teams. Donations can also be applied
              towards future membership costs and premium features.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <a
                href="https://paypal.me/partsstudio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-purple-600 font-semibold hover:bg-slate-100 transition-colors shadow-lg"
              >
                Donate via PayPal
              </a>
              <a
                href="mailto:mark@partsstudio.com?subject=Donation%20Inquiry"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white transition-colors border border-white/40 dark:border-white/30 hover:bg-white/20 dark:hover:bg-white/10"
              >
                Other ways to support
              </a>
            </div>
            <p className="text-xs pt-2 text-[var(--mission-donation-text-muted)]">
              Thank you for being part of this journey. Together, we can heal
              our inner teams.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t text-center text-sm border-[var(--mission-footer-border)] text-[var(--mission-footer-text)]">
          <p>Parts Studio — Healing inner teams, together</p>
        </footer>
      </div>

      {/* Feedback Modal */}
      <Modal
        show={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        width="auto"
      >
        <FeedbackForm />
      </Modal>
    </div>
  );
}
