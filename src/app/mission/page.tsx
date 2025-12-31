"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, User, Settings, Moon, Sun, LogOut, HelpCircle, Map, Heart, Route } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useThemeContext } from "@/state/context/ThemeContext";
import { useTheme } from "@/features/workspace/hooks/useTheme";
import PartsStudioLogo from "@/components/PartsStudioLogo";

export default function MissionPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { darkMode, themeName, setThemeName } = useThemeContext();
  const theme = useTheme();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileDropdownPosition, setProfileDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Calculate dropdown position
  useEffect(() => {
    if (profileDropdownOpen && profileDropdownRef.current) {
      const rect = profileDropdownRef.current.getBoundingClientRect();
      setProfileDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    } else {
      setProfileDropdownPosition(null);
    }
  }, [profileDropdownOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownOpen && profileDropdownRef.current) {
        const dropdownMenu = (profileDropdownRef.current as { dropdownMenu?: HTMLElement }).dropdownMenu;
        const clickedInsideButton = profileDropdownRef.current.contains(event.target as Node);
        const clickedInsideMenu = dropdownMenu && dropdownMenu.contains(event.target as Node);
        if (!clickedInsideButton && !clickedInsideMenu) {
          setProfileDropdownOpen(false);
        }
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileDropdownOpen]);

  return (
    <div 
      className="relative min-h-screen overflow-hidden"
      style={{
        backgroundColor: darkMode ? theme.workspace : "#f8fafc",
        color: darkMode ? theme.textPrimary : "#1e293b",
      }}
    >
      {/* Background gradient and glow accents */}
      <div className="absolute inset-0">
        {darkMode ? (
          <>
            <div 
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${theme.card}, ${theme.workspace}, ${theme.sidebar})`,
              }}
            />
            <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-purple-500/30 blur-3xl" />
            <div className="absolute -left-10 bottom-10 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30" />
            <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-purple-200/40 blur-3xl" />
            <div className="absolute -left-10 bottom-10 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
          </>
        )}
      </div>

      {/* Subtle grid */}
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#1e293b_1px,transparent_0)] [background-size:36px_36px] ${
        darkMode ? "opacity-20" : "opacity-10"
      }`} />

      {/* Header */}
      <header
        className="sticky top-0 z-[65] border-b backdrop-blur-sm"
        style={
          darkMode
            ? {
                backgroundColor: `${theme.elevated}cc`,
                borderColor: theme.border,
              }
            : {
                backgroundColor: `${theme.elevated}cc`,
                borderColor: theme.border,
              }
        }
      >
        <div className="relative max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center" style={{ columnGap: '4px', marginLeft: '6px' }}>
              <PartsStudioLogo size="lg" showText={false} />
              <div className="flex flex-col gap-0.5">
                <span
                  className="text-lg font-semibold leading-tight"
                  style={{
                    color: darkMode ? theme.textPrimary : "#0f172a",
                  }}
                >
                  Parts Studio
                </span>
                <span
                  className="text-xs uppercase tracking-[0.28em]"
                  style={{
                    color: darkMode ? theme.textSecondary : "#64748b",
                  }}
                >
                  Mission + Roadmap
                </span>
              </div>
            </div>
          </div>

          {/* Account Dropdown or Back Arrow */}
          <div className="flex items-center">
            {session ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200 overflow-hidden ${
                    darkMode
                      ? 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                      : 'border-slate-200 bg-white hover:border-slate-400'
                  }`}
                >
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <User className={`w-5 h-5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`} />
                  )}
                </button>

                {profileDropdownOpen && profileDropdownPosition && (
                  <div
                    ref={(el) => {
                      if (el && profileDropdownRef.current) {
                        (profileDropdownRef.current as { dropdownMenu?: HTMLElement }).dropdownMenu = el;
                      }
                    }}
                    className="fixed rounded-lg shadow-lg z-[100]"
                    style={{
                      minWidth: "160px",
                      top: `${profileDropdownPosition.top}px`,
                      right: `${profileDropdownPosition.right}px`,
                      background: darkMode
                        ? `linear-gradient(152deg, rgb(42, 46, 50), rgb(28, 31, 35))`
                        : `linear-gradient(152deg, rgb(255, 255, 255), rgb(248, 250, 252))`,
                      borderColor: theme.border,
                      borderWidth: 1,
                      borderStyle: "solid",
                    }}
                  >
                    <button
                      onClick={() => {
                        router.push('/dashboard');
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 first:rounded-t-lg ${
                        darkMode
                          ? 'hover:bg-gray-700 text-white'
                          : 'hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      <Map className="w-4 h-4" />
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        router.push('/account');
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                        darkMode
                          ? 'hover:bg-gray-700 text-white'
                          : 'hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      Account
                    </button>
                    <button
                      onClick={() => {
                        const nextTheme =
                          themeName === "dark"
                            ? "light"
                            : "dark";
                        setThemeName(nextTheme, true);
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                        darkMode
                          ? "hover:bg-gray-700 text-white"
                          : "hover:bg-gray-100 text-gray-900"
                      }`}
                    >
                      {darkMode ? (
                        <>
                          <Sun className="w-4 h-4" />
                          Light Mode
                        </>
                      ) : (
                        <>
                          <Moon className="w-4 h-4" />
                          Dark Mode
                        </>
                      )}
                    </button>
                    <button
                      onClick={async () => {
                        await signOut({ callbackUrl: '/login' });
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 last:rounded-b-lg ${
                        darkMode
                          ? 'hover:bg-gray-700 text-white'
                          : 'hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/"
                className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200 ${
                  darkMode
                    ? 'border-slate-700 bg-slate-900/80 hover:border-slate-500 text-slate-300 hover:text-white'
                    : 'border-slate-200 bg-white hover:border-slate-400 text-slate-700 hover:text-slate-900'
                }`}
                title="Return to landing page"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-14 lg:py-20">

        {/* Page Headline */}
        <section className="text-center mb-20 space-y-4">
          <div 
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold border"
            style={darkMode ? {
              backgroundColor: `${theme.surface}80`,
              borderColor: theme.border,
              color: theme.textSecondary,
            } : {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.textSecondary,
            }}
          >
            ✦ Mission & Vision
          </div>
          <h1 
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight"
            style={{
              background: 'linear-gradient(90deg, #be54fe, #6366f1, #0ea5e9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Our mission to heal inner teams
          </h1>
          <p 
            className="text-lg max-w-2xl mx-auto"
            style={{
              color: darkMode ? theme.textSecondary : theme.textSecondary,
            }}
          >
            Learn about the story behind Parts Studio and the roadmap ahead 
            as we build tools to support your parts work journey.
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
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
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
          <div 
            className="flex items-center gap-2"
            style={{ color: darkMode ? theme.textSecondary : theme.textSecondary }}
          >
            <Heart 
              className="w-4 h-4"
              style={{ color: darkMode ? "#a855f7" : "#9333ea" }}
            />
            <p 
              className="text-sm uppercase tracking-[0.3em]"
              style={{ color: darkMode ? theme.textMuted : theme.textMuted }}
            >
              Mission
            </p>
          </div>

          {/* About Me */}
          <div id="about-me" className="space-y-6 scroll-mt-24">
            <h2 
              className="text-3xl font-semibold"
              style={{ color: darkMode ? theme.textPrimary : theme.textPrimary }}
            >
              About Me
            </h2>
            
            <div className="space-y-6">
              {/* Photo - floats inline */}
              <div className="float-left mr-6 mb-4 w-[250px] sm:w-[300px]">
                {/* Photo */}
                <div className="relative">
                  <div className={`absolute -inset-4 blur-2xl ${
                    darkMode 
                      ? "bg-gradient-to-br from-purple-500/20 to-sky-500/15" 
                      : "bg-gradient-to-br from-purple-200/30 to-sky-200/30"
                  }`} />
                  <div className={`relative rounded-3xl shadow-2xl overflow-hidden aspect-square ${
                    darkMode 
                      ? "border border-white/10 bg-white/5" 
                      : "border border-slate-200 bg-white/80"
                  }`}>
                    <div className={`w-full h-full flex items-center justify-center ${
                      darkMode 
                        ? "bg-gradient-to-br from-purple-500/20 to-sky-500/20 text-slate-400" 
                        : "bg-gradient-to-br from-purple-100/40 to-sky-100/40 text-slate-500"
                    }`}>
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
              
              <div 
                className={`prose max-w-none space-y-4 leading-relaxed ${darkMode ? "prose-invert" : ""}`}
                style={{ color: darkMode ? theme.textSecondary : theme.textPrimary }}
              >
                <p>
                  I live the vanlife. I'm a Software Engineer who got into Internal Family Systems at a time in my life when I didn't know how to find compassion for myself and didn't realize that I was full of Self like parts. I dedicated over 100 hours in IFS therapy in the past 2 years, have 100s of hours of journal entries and have integrated parts work deeply into my Buddhist and ceremonial practices. I am involved with IFS communities and practitioners and have explored creative IFS expressions and experimentation. I am proud to say that I am almost never without Self available anymore where it was a constant struggle to taste Self's presence.
                </p>
                
                <p>
                  I was sitting in Peru last year on my last dollars going through interviews trying to recoup from a lifetime of suffering and spending in search of peace and answers. At this point I have Self, I have my Kashmir Shaivism heart focused meditation practice and I am alternating between hours of meditation and interviewing for a new job in the US (from Peru). I really wanted to think of a way to help give my practice to others and I had wracked my brain forever trying to think of a way to invent something useful -- especially now that AI was available I was certain there was some way, however challenging, to use it to wake people up and unlock self therapy.
                </p>
              </div>
            </div>
          </div>

          {/* The Vision */}
          <div id="vision" className="space-y-6 clear-both scroll-mt-24">
            <h2 
              className="text-3xl font-semibold"
              style={{ color: darkMode ? theme.textPrimary : theme.textPrimary }}
            >
              The Vision
            </h2>
            
            <div 
              className={`prose max-w-none space-y-4 leading-relaxed ${darkMode ? "prose-invert" : ""}`}
              style={{ color: darkMode ? theme.textSecondary : theme.textPrimary }}
            >
              <p>
                One day I sat in meditation and thought, what would it look like if I had a virtual world around me to do what im doing in my practice. I sat and watched as I noticed thoughts, sensations, behaviors and emotions arise and fall. I noted them. I watched my mind place those in a pile. Then I watched as I categorized and noticed their differences. This emotion seems to pair with this behavior and these thoughts, but these feelings within me seem to pair with these others. And so, I developed parts out of what I saw and spoke to these custom projections within me that contained these things I had noticed within my meditation.
              </p>
              
              <p>
                And so, with Parts Studio, its just that. Its a meditation noting practice that holds what you've noticed and allows you to return to it, customize and organize those groups into parts, into projections. And then from there you can start to notice how these parts feel towards eachother and how you feel towards them. You can speak to them, and grow a relationship with them. Changing your relationship to yourself and no longer seeing these aspects as You, as Self, but as parts of you that have rationale for what they do, why they feel the way they do and they have a story to tell. I want to be able to capture and love on these stories and I want you to be able to as well.
              </p>
            </div>
          </div>

          {/* Where It's Headed */}
          <div id="where-its-headed" className="space-y-6 scroll-mt-24">
            <h2 
              className="text-3xl font-semibold"
              style={{ color: darkMode ? theme.textPrimary : theme.textPrimary }}
            >
              Where It's Headed
            </h2>
            
            <div 
              className={`prose max-w-none space-y-4 leading-relaxed ${darkMode ? "prose-invert" : ""}`}
              style={{ color: darkMode ? theme.textSecondary : theme.textPrimary }}
            >
              <p>
                So, Parts Studio. I hope that life allows me the time and finances to spend all of my time creating this into the grander vision I have with AI, more tools and therapist involvement. Lets heal our inner teams, together.
              </p>
              
              <p>
                I did eventually get a job here in the States and made a small amount back but am not financially sound. I left my job to focus on this app while I work locally as a wellness facility as a manager and live in my van. Any donations would be greatly appreciated and would allow me to continue pouring my capacity in this work. Thank you. Im also happy to put donations towards future membership costs, features, etc.
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
          <div 
            className="flex items-center gap-2"
            style={{ color: darkMode ? theme.textSecondary : theme.textSecondary }}
          >
            <Route 
              className="w-4 h-4"
              style={{ color: darkMode ? "#38bdf8" : "#0ea5e9" }}
            />
            <p 
              className="text-sm uppercase tracking-[0.3em]"
              style={{ color: darkMode ? theme.textMuted : theme.textMuted }}
            >
              Roadmap
            </p>
          </div>
          
          <h2 
            className="text-3xl sm:text-4xl font-semibold"
            style={{ color: darkMode ? theme.textPrimary : theme.textPrimary }}
          >
            The journey ahead
          </h2>
          
          <p 
            className="text-lg max-w-3xl"
            style={{ color: darkMode ? theme.textSecondary : theme.textSecondary }}
          >
            Here's a glimpse into the phases of features we're planning to roll out. 
            Each phase builds on the last, creating a more comprehensive and supportive 
            experience for your parts work.
          </p>

          {/* Roadmap Phases */}
          <div className="space-y-12 mt-12">
            {/* Phase 1: AI Features */}
            <div className={`rounded-3xl backdrop-blur-sm p-8 shadow-lg ${
              darkMode 
                ? "border border-white/10 bg-white/[0.04]" 
                : "border border-slate-200 bg-white/60"
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-sky-500 flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 
                    className="text-2xl font-semibold"
                    style={{ color: darkMode ? theme.textPrimary : theme.textPrimary }}
                  >AI-Powered Guidance</h3>
                  <p 
                    className="text-sm"
                    style={{ color: darkMode ? theme.textMuted : theme.textMuted }}
                  >Intelligent support for your parts work</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div 
                  className="rounded-2xl p-5 border"
                  style={darkMode ? {
                    borderColor: theme.borderSubtle,
                    backgroundColor: `${theme.surface}40`,
                  } : {
                    borderColor: theme.border,
                    backgroundColor: `${theme.surface}66`,
                  }}
                >
                  <p 
                    className="font-semibold mb-2"
                    style={{ color: darkMode ? theme.textPrimary : theme.textPrimary }}
                  >Resolve Tensions</p>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ color: darkMode ? theme.textSecondary : theme.textSecondary }}
                  >
                    AI will help identify and work through tensions between parts, 
                    offering insights and suggestions for resolution.
                  </p>
                </div>
                <div 
                  className="rounded-2xl p-5 border"
                  style={darkMode ? {
                    borderColor: theme.borderSubtle,
                    backgroundColor: `${theme.surface}40`,
                  } : {
                    borderColor: theme.border,
                    backgroundColor: `${theme.surface}66`,
                  }}
                >
                  <p 
                    className="font-semibold mb-2"
                    style={{ color: darkMode ? theme.textPrimary : theme.textPrimary }}
                  >Deepen Relationships</p>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ color: darkMode ? theme.textSecondary : theme.textSecondary }}
                  >
                    Build stronger connections with each part through AI-guided 
                    conversations and relationship mapping.
                  </p>
                </div>
                <div 
                  className="rounded-2xl p-5 border"
                  style={darkMode ? {
                    borderColor: theme.borderSubtle,
                    backgroundColor: `${theme.surface}40`,
                  } : {
                    borderColor: theme.border,
                    backgroundColor: `${theme.surface}66`,
                  }}
                >
                  <p 
                    className="font-semibold mb-2"
                    style={{ color: darkMode ? theme.textPrimary : theme.textPrimary }}
                  >Session Guidance</p>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ color: darkMode ? theme.textSecondary : theme.textSecondary }}
                  >
                    Get real-time support and guidance as you work through your 
                    parts during sessions.
                  </p>
                </div>
                <div 
                  className="rounded-2xl p-5 border"
                  style={darkMode ? {
                    borderColor: theme.borderSubtle,
                    backgroundColor: `${theme.surface}40`,
                  } : {
                    borderColor: theme.border,
                    backgroundColor: `${theme.surface}66`,
                  }}
                >
                  <p 
                    className="font-semibold mb-2"
                    style={{ color: darkMode ? theme.textPrimary : theme.textPrimary }}
                  >Journal Analysis</p>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ color: darkMode ? theme.textSecondary : theme.textSecondary }}
                  >
                    AI will extract impressions and insights from your journal entries, 
                    helping you discover patterns and connections.
                  </p>
                </div>
                <div 
                  className="rounded-2xl p-5 md:col-span-2 border"
                  style={darkMode ? {
                    borderColor: theme.borderSubtle,
                    backgroundColor: `${theme.surface}40`,
                  } : {
                    borderColor: theme.border,
                    backgroundColor: `${theme.surface}66`,
                  }}
                >
                  <p 
                    className="font-semibold mb-2"
                    style={{ color: darkMode ? theme.textPrimary : theme.textPrimary }}
                  >Map Understanding & Generation</p>
                  <p 
                    className="text-sm leading-relaxed"
                    style={{ color: darkMode ? theme.textSecondary : theme.textSecondary }}
                  >
                    AI will understand your existing map structure and help generate 
                    new maps, suggest connections, and identify relationships you might 
                    not have noticed.
                  </p>
                </div>
              </div>
            </div>

            {/* Phase 2: New Tools */}
            <div className={`rounded-3xl backdrop-blur-sm p-8 shadow-lg ${
              darkMode 
                ? "border border-white/10 bg-white/[0.04]" 
                : "border border-slate-200 bg-white/60"
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className={`text-2xl font-semibold ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}>Enhanced Mapping Tools</h3>
                  <p className={`text-sm ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}>New ways to visualize and connect with your parts</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className={`rounded-2xl p-5 ${
                  darkMode 
                    ? "border border-white/5 bg-white/[0.02]" 
                    : "border border-slate-200 bg-white/40"
                }`}>
                  <p className={`font-semibold mb-2 ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}>3D Avatar Mapping</p>
                  <p className={`text-sm leading-relaxed ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}>
                    Relate your body to parts by drawing on a 3D character model, 
                    replacing traditional body mapping with an interactive avatar experience.
                  </p>
                </div>
                <div className={`rounded-2xl p-5 ${
                  darkMode 
                    ? "border border-white/5 bg-white/[0.02]" 
                    : "border border-slate-200 bg-white/40"
                }`}>
                  <p className={`font-semibold mb-2 ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}>AI Image Generation</p>
                  <p className={`text-sm leading-relaxed ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}>
                    Generate AI-powered images for your parts, creating visual 
                    representations that capture their essence and character.
                  </p>
                </div>
              </div>
            </div>

            {/* Phase 3: Resources & Support */}
            <div className={`rounded-3xl backdrop-blur-sm p-8 shadow-lg ${
              darkMode 
                ? "border border-white/10 bg-white/[0.04]" 
                : "border border-slate-200 bg-white/60"
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className={`text-2xl font-semibold ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}>Resources & Support</h3>
                  <p className={`text-sm ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}>Comprehensive support for your healing journey</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className={`rounded-2xl p-5 ${
                  darkMode 
                    ? "border border-white/5 bg-white/[0.02]" 
                    : "border border-slate-200 bg-white/40"
                }`}>
                  <p className={`font-semibold mb-2 ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}>Guided Meditations</p>
                  <p className={`text-sm leading-relaxed ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}>
                    Access curated guided meditations designed specifically for 
                    parts work and Self-connection.
                  </p>
                </div>
                <div className={`rounded-2xl p-5 ${
                  darkMode 
                    ? "border border-white/5 bg-white/[0.02]" 
                    : "border border-slate-200 bg-white/40"
                }`}>
                  <p className={`font-semibold mb-2 ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}>Tips & Techniques</p>
                  <p className={`text-sm leading-relaxed ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}>
                    Learn practical tips and techniques for working with parts, 
                    managing tensions, and deepening your practice.
                  </p>
                </div>
                <div className={`rounded-2xl p-5 md:col-span-2 ${
                  darkMode 
                    ? "border border-white/5 bg-white/[0.02]" 
                    : "border border-slate-200 bg-white/40"
                }`}>
                  <p className={`font-semibold mb-2 ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}>Therapist Network</p>
                  <p className={`text-sm leading-relaxed ${
                    darkMode ? "text-slate-300" : "text-slate-600"
                  }`}>
                    Eventually, we'll connect you with qualified IFS therapists 
                    who can provide professional support for your map and parts work.
                  </p>
                </div>
              </div>
            </div>

            {/* Phase 4: Affirmations */}
            <div className={`rounded-3xl backdrop-blur-sm p-8 shadow-lg ${
              darkMode 
                ? "border border-white/10 bg-white/[0.04]" 
                : "border border-slate-200 bg-white/60"
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                  4
                </div>
                <div>
                  <h3 className={`text-2xl font-semibold ${
                    darkMode ? "text-white" : "text-slate-900"
                  }`}>Affirmation Prompts</h3>
                  <p className={`text-sm ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}>Provoke opposing parts and discover new trailheads</p>
                </div>
              </div>
              <div className={`rounded-2xl p-5 ${
                darkMode 
                  ? "border border-white/5 bg-white/[0.02]" 
                  : "border border-slate-200 bg-white/40"
              }`}>
                <p className={`font-semibold mb-2 ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}>Trailhead Discovery</p>
                <p className={`text-sm leading-relaxed ${
                  darkMode ? "text-slate-300" : "text-slate-600"
                }`}>
                  Use carefully crafted affirmation prompts to help provoke opposing 
                  parts and start new trailheads to work with for your best self. 
                  These prompts are designed to surface parts that may be hidden or 
                  protecting, creating opportunities for deeper work and integration.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Donation Section */}
        <section id="donate" className={`relative overflow-hidden rounded-3xl p-8 shadow-2xl ${
          darkMode 
            ? "border border-white/10 bg-gradient-to-r from-purple-600/80 via-indigo-600/70 to-sky-500/70" 
            : "border border-purple-200/50 bg-gradient-to-r from-purple-500/90 via-indigo-500/80 to-sky-500/90"
        }`}>
          <div className="relative z-10 space-y-4">
            <p className={`text-sm uppercase tracking-[0.3em] ${
              darkMode ? "text-white/80" : "text-white/90"
            }`}>
              Support the Mission
            </p>
            <h3 className="text-3xl sm:text-4xl font-semibold text-white">
              Help Parts Studio grow
            </h3>
            <p className={`max-w-2xl ${
              darkMode ? "text-slate-100/80" : "text-white/90"
            }`}>
              Your donations directly support the development of Parts Studio, allowing 
              me to dedicate more time to building features that help people heal their 
              inner teams. Donations can also be applied towards future membership costs 
              and premium features.
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
                className={`inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white transition-colors ${
                  darkMode 
                    ? "border border-white/30 hover:bg-white/10" 
                    : "border border-white/40 hover:bg-white/20"
                }`}
              >
                Other ways to support
              </a>
            </div>
            <p className={`text-xs pt-2 ${
              darkMode ? "text-white/70" : "text-white/80"
            }`}>
              Thank you for being part of this journey. Together, we can heal our inner teams.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className={`mt-20 pt-8 border-t text-center text-sm ${
          darkMode 
            ? "border-white/10 text-slate-400" 
            : "border-slate-200 text-slate-500"
        }`}>
          <p>Parts Studio — Healing inner teams, together</p>
        </footer>
      </div>
    </div>
  );
}

