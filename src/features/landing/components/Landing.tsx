"use client";

import ClientRedirect from "@/components/ClientRedirect";
import SignInButton from "@/features/landing/components/SignInButton";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Heart,
  Layers,
  Map,
  Play,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
// import GridMotion from "./GridMotion";
// import { InfiniteCarousel } from "./InfiniteCarousel";
import { InfiniteCarouselCSS } from "./InfiniteCarouselCSS";
import { useRef, useEffect, useState, useLayoutEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
} from "motion/react";

const partImages = [
  "binge_eating",
  "caretaker",
  "abandonment",

  "addict",
  "narcissistic",

  "body_dysmorphic",
  "rejected",
  "disassociated",
  "impulsive",
  "night_terrors",
  "inner_critic",
  "insecure",
  "limerence",
  "lonely",
  "melancholy",
  "ocd",
  "confused",
  "overachiever",
  "overthinking",
  "rage",
  "scared",
];

const currentFeatures = [
  {
    icon: Map,
    title: "Interactive Mapping",
    description:
      "Drag and drop parts onto an infinite canvas. Create relationships between them. See your inner landscape unfold visually.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "Impression Library",
    description:
      "Capture emotions, thoughts, sensations, and behaviors as they arise. Organize them by type, on the canvas or drag them directly into your parts.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Layers,
    title: "Part Relationships",
    description:
      "Create relationships between parts. Map, mediate and transform your part's tensions through contextual journaling.",
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: Zap,
    title: "Autosave & History",
    description:
      "Changes are saved every 15 seconds automatically. Pause anytime and return to exactly where you left off.",
    color: "from-yellow-500 to-amber-500",
  },
  {
    icon: Target,
    title: "Themes + Customization",
    description:
      "Choose from light, dark, and custom themes. Make your workspace your part's workspace.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Heart,
    title: "We're listening",
    description:
      "Feedback provided will be listened to. Constant and rapid improvement is important to us. We want Parts Studio to be what your parts need.",
    color: "from-rose-500 to-orange-500",
  },
];

const futureFeatures = [
  {
    icon: Sparkles,
    title: "AI Exploration",
    description:
      "Ask guided questions and explore parts with an AI companion. Get insights and prompts tailored to your work.",
    comingSoon: true,
  },
  {
    icon: Map,
    title: "3D Body Mapping",
    description:
      "Place sensations and parts onto an interactive 3D body map. See where emotions and tensions live in your body.",
    comingSoon: true,
  },
  {
    icon: Brain,
    title: "Journal Analysis",
    description:
      "Surface insights, patterns, and tags across your journal entries. Discover connections you didn't see before.",
    comingSoon: true,
  },
  {
    icon: Heart,
    title: "Affirmations Generator",
    description:
      "Generate supportive statements tailored to how your parts feel. Build compassion for your inner team.",
    comingSoon: true,
  },
];

// Create items array with part images, cycling through them to fill 28 slots
const gridItems = Array.from({ length: 28 }, (_, index) => {
  const partName = partImages[index % partImages.length];
  return `parts/${partName}.png`;
});

function FeaturesSection() {
  const [hasEntered, setHasEntered] = useState(false);
  const [flashTrigger, setFlashTrigger] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasEntered) {
            setHasEntered(true);
            // Trigger flash by incrementing trigger counter
            setFlashTrigger((prev) => prev + 1);
          } else if (!entry.isIntersecting) {
            // Reset when leaving viewport so it can trigger again
            setHasEntered(false);
          }
        });
      },
      { threshold: 0.1, rootMargin: "100px 0px" }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [hasEntered]);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative py-32 px-6 bg-gradient-to-b from-white to-slate-50"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-slate-900 leading-tight">
            Everything you need to
            <span className="block bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-300 bg-clip-text text-transparent pb-2 pt-1">
              map your inner world
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <FeatureCard
                key={feature.title}
                feature={feature}
                Icon={Icon}
                index={index}
                shouldFlash={flashTrigger > 0}
                flashKey={flashTrigger}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  Icon,
  index,
  shouldFlash,
  flashKey,
}: {
  feature: (typeof currentFeatures)[0];
  Icon: React.ComponentType<{ className?: string }>;
  index: number;
  shouldFlash: boolean;
  flashKey: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (shouldFlash && flashKey > 0) {
      // Reset flash state first
      setIsFlashing(false);

      // Each card flashes at its turn (total 1 second / 6 cards = ~167ms per card)
      const delay = (index * 1000) / 6;
      const timeoutId = setTimeout(() => {
        setIsFlashing(true);
        setTimeout(() => {
          setIsFlashing(false);
        }, 200); // Flash duration - longer to be more visible
      }, delay);

      return () => clearTimeout(timeoutId);
    }
  }, [shouldFlash, flashKey, index]);

  return (
    <div
      className="group relative p-8 rounded-3xl bg-gradient-to-br from-white to-slate-50/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient background - on hover or during flash */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${feature.color} ${
          isFlashing ? "opacity-20" : "opacity-0 group-hover:opacity-10"
        } rounded-3xl`}
        style={{
          transition: isFlashing ? "none" : "opacity 0.4s ease",
        }}
      />

      {/* Icon */}
      <div className="relative mb-6">
        <div
          className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} opacity-75 shadow-lg`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="relative">
        <h3 className="text-2xl font-bold mb-3 text-slate-900">
          {feature.title}
        </h3>
        <p className="text-slate-600 leading-relaxed">{feature.description}</p>
      </div>
    </div>
  );
}

function ParallaxFeature({
  children,
  direction = "left",
}: {
  children: React.ReactNode;
  direction?: "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center 0.5"],
  });

  const x = useTransform(
    scrollYProgress,
    [0, 0.7, 1],
    direction === "left"
      ? [-60, 0, 0] // Start from left, finish at 70% progress
      : [60, 0, 0] // Start from right, finish at 70% progress
  );
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.5, 1],
    [0, 0.3, 1, 1]
  );

  return (
    <motion.div
      ref={ref}
      style={{
        x,
        opacity,
      }}
    >
      {children}
    </motion.div>
  );
}

function TiltedBrowserFrame() {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [initialAnimationDone, setInitialAnimationDone] = useState(false);

  // Initialize with tilt as if cursor is on middle left
  // Simulate: offsetX = -width/2 (far left), offsetY = 0 (middle)
  const initialRotationY = -8; // Tilt left (negative offsetX)
  const initialRotationX = 0; // No vertical tilt (offsetY = 0)

  // Use motion values directly initialized with initial tilt to prevent flash
  const rotateXValue = useMotionValue(initialRotationX);
  const rotateYValue = useMotionValue(initialRotationY);

  const rotateX = useSpring(rotateXValue, {
    damping: 30,
    stiffness: 100,
    mass: 2,
  });
  const rotateY = useSpring(rotateYValue, {
    damping: 30,
    stiffness: 100,
    mass: 2,
  });
  const scale = useSpring(1.05, {
    damping: 30,
    stiffness: 100,
    mass: 2,
  });

  // Release after 0.75 seconds, or immediately if hovered
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isHovered) {
        rotateXValue.set(0);
        rotateYValue.set(0);
        scale.set(1);
        setInitialAnimationDone(true);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isHovered, rotateXValue, rotateYValue, scale]);

  // If hovered, immediately release and let mouse control
  useEffect(() => {
    if (isHovered && !initialAnimationDone) {
      rotateXValue.set(0);
      rotateYValue.set(0);
      // Keep scale at 1.05 on hover (it's already there)
      setInitialAnimationDone(true);
    }
  }, [isHovered, initialAnimationDone, rotateXValue, rotateYValue]);

  function handleMouse(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current || !initialAnimationDone) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    const rotationX = (offsetY / (rect.height / 2)) * -8;
    const rotationY = (offsetX / (rect.width / 2)) * 8;

    rotateXValue.set(rotationX);
    rotateYValue.set(rotationY);
  }

  function handleMouseEnter() {
    setIsHovered(true);
    scale.set(1.05);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <div className="w-[50vw] m-[-75px] [perspective:800px]">
      <motion.div
        ref={ref}
        className="rounded-lg overflow-hidden shadow-2xl bg-white [transform-style:preserve-3d]"
        style={{
          rotateX,
          rotateY,
          scale,
          willChange: "transform",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          WebkitFontSmoothing: "antialiased",
        }}
        onMouseMove={handleMouse}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Browser Frame */}
        <div className="flex flex-col">
          {/* Browser Controls Bar */}
          <div
            className="flex items-center gap-1.5 px-2 h-4 bg-slate-100 border-b border-slate-200"
            style={{ height: "16px" }}
          >
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
            </div>
          </div>
          {/* Image Content */}
          <div
            className="overflow-hidden"
            style={{
              outline: "none",
              border: "none",
              boxShadow: "none",
            }}
          >
            <Image
              src="/assets/workspace_square.png"
              alt="Workspace"
              width={1200}
              height={900}
              className="h-auto"
              quality={100}
              unoptimized
              style={{
                outline: "none",
                border: "none",
                boxShadow: "none",
                display: "block",
                width: "100%",
                maxWidth: "1400px",
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CyclingImage({
  baseName,
  alt,
  ...props
}: {
  baseName: string;
  alt: string;
  [key: string]: any;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= 4 ? 0 : prev + 1));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <Image
      src={`/assets/${baseName}_${currentIndex}.png`}
      alt={alt}
      {...props}
    />
  );
}

const Landing = () => {
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) {
      return;
    }

    setIsSubmittingContact(true);

    try {
      // Collect browser and device info
      const getBrowserInfo = () => {
        const ua = navigator.userAgent;
        let browserName = "Unknown";
        let browserVersion = "Unknown";

        if (ua.indexOf("Chrome") > -1 && ua.indexOf("Edg") === -1) {
          browserName = "Chrome";
          const match = ua.match(/Chrome\/(\d+)/);
          browserVersion = match ? match[1] : "Unknown";
        } else if (ua.indexOf("Firefox") > -1) {
          browserName = "Firefox";
          const match = ua.match(/Firefox\/(\d+)/);
          browserVersion = match ? match[1] : "Unknown";
        } else if (ua.indexOf("Safari") > -1 && ua.indexOf("Chrome") === -1) {
          browserName = "Safari";
          const match = ua.match(/Version\/(\d+)/);
          browserVersion = match ? match[1] : "Unknown";
        } else if (ua.indexOf("Edg") > -1) {
          browserName = "Edge";
          const match = ua.match(/Edg\/(\d+)/);
          browserVersion = match ? match[1] : "Unknown";
        }

        return { browserName, browserVersion, userAgent: ua };
      };

      const getDeviceType = () => {
        const ua = navigator.userAgent;
        if (/tablet|ipad|playbook|silk/i.test(ua)) {
          return "Tablet";
        }
        if (
          /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(
            ua
          )
        ) {
          return "Mobile";
        }
        return "Desktop";
      };

      const { browserName, browserVersion, userAgent } = getBrowserInfo();
      const deviceType = getDeviceType();
      const screenResolution = `${window.screen.width}x${window.screen.height}`;

      const sourceInfo = `\n\n--- Message Source ---\nSent from: Landing Page\nPage URL: ${window.location.href}`;
      const debugInfo = [
        `Browser: ${browserName || "Unknown"} ${browserVersion || ""}`,
        `Device: ${deviceType || "Unknown"}`,
        `Screen: ${screenResolution || "Unknown"}`,
        `User Agent: ${userAgent || "Unknown"}`,
      ].join("\n");

      const fullMessage = `${contactMessage}${sourceInfo}\n\n--- Debug Info ---\n${debugInfo}`;

      // Import emailjs dynamically
      const emailjs = (await import("emailjs-com")).default;

      const templateParams = {
        name: contactName || "Anonymous",
        message: fullMessage,
        userEmail: contactEmail || "not-provided@landing-page.com",
        userId: "landing-page-visitor",
      };

      await emailjs.send(
        "service_p1w1eiy",
        "template_sz9orwb",
        templateParams,
        "hWD-jVch6P8v3kTEk"
      );

      // Reset form
      setContactMessage("");
      setContactEmail("");
      setContactName("");
      setShowContactForm(false);
      alert("Thank you for your message! We'll get back to you soon.");
    } catch (error) {
      console.error("Failed to send contact message:", error);
      alert("Failed to send message. Please try again later.");
    } finally {
      setIsSubmittingContact(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 overflow-hidden">
      <ClientRedirect />

      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-pink-200/40 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Hero Section - Full Width */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-2 bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
        <div className="max-w-7xl mx-auto mt-0 w-full pb-[60px]">
          {/* Header integrated into first section */}
          <div className="relative z-50 w-full mb-16">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Image
                  src="/official_logo_complete.png"
                  alt="Parts Studio"
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                  style={{ filter: "none" }}
                />
                <span
                  className="font-semibold text-slate-900 self-end"
                  style={{ fontSize: "22px" }}
                >
                  Parts Studio
                </span>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <a
                  href="#features"
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById("features");
                    if (element) {
                      element.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }}
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById("how-it-works");
                    if (element) {
                      element.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }}
                >
                  How it works
                </a>
                <a
                  href="/mission"
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Mission
                </a>
                <SignInButton />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-8 w-[calc(50vw-75px)]">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight text-slate-900">
                Map your inner landscape
                <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  with clarity
                </span>
              </h1>
              <p className="text-xl text-slate-600 leading-relaxed max-w-2xl pr-[100px]">
                A modern workspace for mapping your parts, tensions, and
                insights. Capture impressions, connect relationships, and
                journal directly on an infinite canvas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/login"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-base font-semibold text-white hover:from-purple-700 hover:to-blue-700 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Sign up
                  <ArrowRight className="ml-2 w-5 h-5" />
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-base font-semibold text-slate-700 hover:bg-slate-50 transition-all hover:scale-105"
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById("how-it-works");
                    if (element) {
                      element.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }}
                >
                  <Play className="mr-2 w-5 h-5" />
                  Watch introduction
                </a>
              </div>
            </div>

            {/* Workspace Image */}
            {/* <div className="w-[calc(50vw+75px)]"> */}
            <TiltedBrowserFrame />
            {/* </div> */}
          </div>
        </div>
      </section>

      {/* Part Gallery - Full Width Slider */}
      <section className="relative py-32 px-0 bg-gradient-to-br from-[#0b1026] via-[#7c3aed] to-[#ff4fd8] overflow-hidden">
        <div className="w-full">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Explore your parts
            </h2>
            <p className="text-xl text-white/85 max-w-3xl mx-auto">
              Each part has its own story, its own needs, and its own place in
              your inner landscape
            </p>
          </div>

          {/* Scrolling Part Images */}
          <div className="relative">
            <InfiniteCarouselCSS
              images={partImages.map((part) => ({
                src: `/parts/${part}.png`,
                alt: part,
              }))}
              gap={16}
              height={300}
              // pauseOnHover={true}
              direction="left"
              radius={18}
              speed={60}
            />
          </div>
        </div>
      </section>

      {/* Visual Features Showcase */}
      <section className="relative py-32 px-6 bg-gradient-to-b from-purple-100 via-pink-100 to-blue-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-slate-900 leading-tight">
              Powerful features,
              <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent pb-2 pt-1">
                beautifully designed
              </span>
            </h2>
          </div>

          <div className="space-y-24">
            {/* Part Details */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <ParallaxFeature direction="left">
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold text-slate-900">
                    Deep part exploration
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    Dive into each part's unique characteristics. View needs,
                    fears, impressions, and relationships all in one place.
                    Understand how your parts interact and what they need to
                    feel safe and heard.
                  </p>
                </div>
              </ParallaxFeature>
              <ParallaxFeature direction="right">
                <div>
                  <Image
                    src="/assets/part_details.png"
                    alt="Part Details"
                    width={1200}
                    height={900}
                    className="w-full h-auto shadow-2xl"
                    quality={100}
                    unoptimized
                    style={{
                      maxHeight: "600px",
                      objectFit: "contain",
                      borderRadius: "18px",
                    }}
                  />
                </div>
              </ParallaxFeature>
            </div>

            {/* Text Thread */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <ParallaxFeature direction="left">
                  <Image
                    src="/assets/text_thread.png"
                    alt="Text Thread"
                    width={1200}
                    height={900}
                    className="w-full h-auto shadow-2xl"
                    quality={100}
                    unoptimized
                    style={{
                      maxHeight: "600px",
                      objectFit: "contain",
                      borderRadius: "18px",
                    }}
                  />
                </ParallaxFeature>
              </div>
              <div className="order-1 lg:order-2">
                <ParallaxFeature direction="right">
                  <div className="space-y-6">
                    <h3 className="text-3xl font-bold text-slate-900">
                      Conversational journaling
                    </h3>
                    <p className="text-lg text-slate-600 leading-relaxed">
                      Capture dialogues between parts in a natural, thread-based
                      format. See conversations unfold as they happen, with each
                      part's voice clearly represented. Perfect for IFS sessions
                      and inner work.
                    </p>
                  </div>
                </ParallaxFeature>
              </div>
            </div>

            {/* Normal Journal */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <ParallaxFeature direction="left">
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold text-slate-900">
                    Rich text journaling
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    Write freely with a powerful rich text editor. Format your
                    thoughts, add structure, and create detailed entries that
                    capture the full depth of your inner work. Link entries to
                    specific parts or keep them global.
                  </p>
                </div>
              </ParallaxFeature>
              <ParallaxFeature direction="right">
                <div>
                  <Image
                    src="/assets/journal_lonely.png"
                    alt="Journal Lonely"
                    width={1200}
                    height={900}
                    className="w-full h-auto shadow-2xl"
                    quality={100}
                    unoptimized
                    style={{
                      maxHeight: "600px",
                      objectFit: "contain",
                      borderRadius: "18px",
                    }}
                  />
                </div>
              </ParallaxFeature>
            </div>

            {/* Studio Assistant */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 flex justify-center">
                <ParallaxFeature direction="left">
                  <Image
                    src="/assets/studio_assistant.png"
                    alt="Studio Assistant"
                    width={1200}
                    height={900}
                    className="h-auto shadow-2xl"
                    quality={100}
                    unoptimized
                    style={{
                      height: "500px",
                      objectFit: "contain",
                      width: "auto",
                      borderRadius: "26px",
                    }}
                  />
                </ParallaxFeature>
              </div>
              <div className="order-1 lg:order-2">
                <ParallaxFeature direction="right">
                  <div className="space-y-6">
                    <h3 className="text-3xl font-bold text-slate-900">
                      AI-powered insights
                    </h3>
                    <p className="text-lg text-slate-600 leading-relaxed">
                      Get guided support from Studio Assistant. Ask questions,
                      explore parts, and receive thoughtful prompts tailored to
                      your work. Let AI help you deepen your understanding and
                      navigate your inner landscape.
                    </p>
                  </div>
                </ParallaxFeature>
              </div>
            </div>

            {/* Impression Input */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <ParallaxFeature direction="left">
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold text-slate-900">
                    Capture impressions instantly
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    Quickly log emotions, thoughts, sensations, and behaviors as
                    they arise. Organize by type and connect directly to parts.
                    Build a comprehensive library of your inner experiences over
                    time.
                  </p>
                </div>
              </ParallaxFeature>
              <ParallaxFeature direction="right">
                <div>
                  <CyclingImage
                    baseName="impression_input"
                    alt="Impression Input"
                    width={1200}
                    height={900}
                    className="w-full h-auto shadow-2xl"
                    quality={100}
                    unoptimized
                    style={{
                      maxHeight: "600px",
                      objectFit: "contain",
                      borderRadius: "26px",
                    }}
                  />
                </div>
              </ParallaxFeature>
            </div>
          </div>
        </div>
      </section>

      {/* Current Features - Full Width */}
      <FeaturesSection />

      {/* GridMotion Section */}
      {/* <section className="relative w-full">
        <GridMotion
          items={gridItems}
          gradientColor="rgba(248, 250, 252, 0.8)"
        />
      </section> */}

      {/* How It Works - Full Width with GIF Placeholder */}
      <section
        id="how-it-works"
        className="relative py-32 px-6 bg-gradient-to-b from-slate-50 to-white"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-slate-900">
              See it in action
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Watch how Parts Studio helps you visualize and understand your
              inner landscape
            </p>
          </div>

          {/* Video/GIF Placeholder */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-lg">
            <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="inline-flex p-6 rounded-full bg-white border border-slate-200 shadow-md">
                  <Play className="w-12 h-12 text-purple-600" />
                </div>
                <p className="text-lg text-slate-700">Demo video coming soon</p>
                <p className="text-sm text-slate-500">
                  Replace this with your GIF or video
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Future Features - Full Width */}
      <section className="relative py-32 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-purple-50 border border-purple-200 text-purple-700 mb-6">
              <Sparkles className="w-4 h-4" />
              Coming Soon
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-slate-900">
              What's next
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Exciting features we're building to deepen your practice
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {futureFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="relative p-8 rounded-3xl border border-slate-200 bg-white shadow-sm opacity-75"
                >
                  <div className="absolute top-4 right-4">
                    <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                      Soon
                    </span>
                  </div>
                  <div className="inline-flex p-4 rounded-2xl bg-slate-100 mb-6">
                    <Icon className="w-6 h-6 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section - Full Width */}
      <section className="relative py-24 px-6 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-slate-900">
            Ready to begin?
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Start mapping your inner landscape today. Create a map, add
            impressions, and capture insights—all in one calm workspace.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-base font-semibold text-white hover:from-purple-700 hover:to-blue-700 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Sign up
            <ArrowRight className="ml-2 w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-200 py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/official_logo_complete.png"
              alt="Parts Studio"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <p className="text-sm text-slate-600">Parts Studio</p>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <a
              href="/mission"
              className="hover:text-slate-900 transition-colors"
            >
              Mission
            </a>
            <a
              href="#features"
              className="hover:text-slate-900 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-slate-900 transition-colors"
            >
              How it works
            </a>
            <button
              onClick={() => setShowContactForm(true)}
              className="hover:text-slate-900 transition-colors"
            >
              Contact
            </button>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        @keyframes jiggle {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(3px);
          }
          75% {
            transform: translateX(-3px);
          }
        }
        .animate-jiggle {
          animation: jiggle 0.5s ease-in-out;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
            <button
              onClick={() => setShowContactForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-2 text-slate-900">
              Contact Us
            </h2>
            <p className="text-slate-600 mb-6">
              Have a question or feedback? We'd love to hear from you.
            </p>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Name (optional)
                </label>
                <input
                  type="text"
                  id="contact-name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Email (optional)
                </label>
                <input
                  type="email"
                  id="contact-email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Message *
                </label>
                <textarea
                  id="contact-message"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  required
                  rows={5}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Your message..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmittingContact || !contactMessage.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingContact ? "Sending..." : "Send Message"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
