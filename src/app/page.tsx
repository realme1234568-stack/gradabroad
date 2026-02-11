"use client";


import Image from "next/image";
import Link from "next/link";
import { FaDiscord, FaInstagram, FaCheckCircle, FaGlobeEurope, FaUserGraduate, FaChartLine } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";

const benefits = [
  {
    icon: <FaCheckCircle className="text-emerald-400 text-xl" />,
    text: "Tuition-free or low-cost public universities",
  },
  {
    icon: <FaGlobeEurope className="text-cyan-400 text-xl" />,
    text: "English-taught programs with global recognition",
  },
  {
    icon: <FaChartLine className="text-fuchsia-400 text-xl" />,
    text: "Strong industry ties and post-study work options",
  },
  {
    icon: <FaUserGraduate className="text-amber-400 text-xl" />,
    text: "High quality of life and student-friendly cities",
  },
];

const steps = [
  {
    title: "Browse programs",
    description:
      "Explore bachelor’s and master’s programs across Germany and compare requirements.",
  },
  {
    title: "Shortlist universities",
    description:
      "Save your top choices and organize intake, deadlines, and document checklists.",
  },
  {
    title: "Track applications",
    description:
      "Monitor status from document collection to final decision in one dashboard.",
  },
];

const testimonials = [
  {
    name: "Aarav S.",
    avatar: "/avatar1.png",
    quote: "Gradabroad made my Germany application journey so much easier! The tracker is a game changer.",
  },
  {
    name: "Maya R.",
    avatar: "/avatar2.png",
    quote: "Loved the clean UI and the reminders. I never missed a deadline!",
  },
  {
    name: "Lukas F.",
    avatar: "/avatar3.png",
    quote: "The shortlist feature helped me stay organized and focused. Highly recommend!",
  },
];

export default function Home() {
  // Scroll-based scaling for hero image
  const [scale, setScale] = useState(1);
  const heroImgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleScroll = () => {
      if (!heroImgRef.current) return;
      const rect = heroImgRef.current.getBoundingClientRect();
      // When top of image is at top of viewport, scale = 1.2; when 400px down, scale = 1
      const y = Math.max(0, Math.min(400, rect.top));
      setScale(1.2 - 0.2 * (y / 400));
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative overflow-hidden bg-white text-zinc-900 transition-colors duration-200 dark:bg-black dark:text-white">
      {/* Animated background gradients */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/30 blur-3xl dark:bg-emerald-400/20 animate-pulse" />
      <div className="pointer-events-none absolute -right-32 top-20 h-64 w-64 rounded-full bg-cyan-400/30 blur-3xl dark:bg-cyan-400/20 animate-pulse" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-400/10 animate-pulse" />

      {/* Hero Section */}
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 pb-20 pt-16 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="space-y-7">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500 animate-fade-in">
            Study Abroad Planner
          </p>
          <h1 className="text-5xl font-extrabold leading-tight md:text-6xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-400 bg-clip-text text-transparent animate-gradient-x">
            Your Germany Study Journey, Upgraded.
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-300 md:text-xl animate-fade-in">
            Plan, shortlist, and track your applications with a modern, Gen Z-inspired dashboard.
          </p>
          <div className="flex flex-wrap gap-4 animate-fade-in">
            <Link
              href="/browse-programs"
              className="rounded-full bg-[radial-gradient(circle_at_top,_#34d399,_#22d3ee,_#0ea5e9)] px-6 py-3 text-base font-bold text-zinc-900 shadow-lg shadow-emerald-400/30 transition hover:scale-105 hover:brightness-110"
            >
              Browse Programs
            </Link>
            <Link
              href="/application-tracker"
              className="rounded-full bg-[radial-gradient(circle_at_top,_#fbbf24,_#f59e0b,_#d97706)] px-6 py-3 text-base font-bold text-zinc-900 shadow-md shadow-amber-300/40 transition hover:scale-105 hover:brightness-110"
            >
              Application Tracker
            </Link>
          </div>
          <div className="grid gap-3 text-base text-zinc-600 dark:text-zinc-300 animate-fade-in">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                {benefit.icon}
                {benefit.text}
              </div>
            ))}
          </div>
        </div>
        <div ref={heroImgRef} className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-8 shadow-xl shadow-emerald-200/30 dark:border-white/10 dark:from-zinc-900 dark:via-zinc-950 dark:to-black dark:shadow-none animate-fade-in flex flex-col items-center">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="space-y-6 w-full">
            <div className="rounded-2xl border border-black/10 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-none">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">
                Featured
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Make your abroad study dream come true
              </h2>
            </div>
            <div
              style={{ transform: `scale(${scale})`, transition: 'transform 0.2s cubic-bezier(.4,2,.6,1)' }}
              className="w-full flex justify-center"
            >
              <Image
                src="/hero-animated.jpg"
                alt="Students cycling in front of a German university"
                width={420}
                height={300}
                className="rounded-2xl border border-black/10 bg-white/80 shadow-lg shadow-cyan-200/30 dark:border-white/10 dark:bg-black/50 dark:shadow-none object-cover max-h-[320px] w-auto"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Germany Section */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20 animate-fade-in">
        <div className="rounded-3xl border border-black/10 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 p-10 shadow-xl shadow-cyan-200/30 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-none grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-emerald-500">Why Study in Germany?</h2>
            <div className="grid gap-6">
              <div className="flex items-center gap-4">
                <FaCheckCircle className="text-3xl text-emerald-400" />
                <div>
                  <span className="font-semibold">Affordable Education</span>
                  <div className="text-sm text-zinc-500">Most public universities have no tuition fees.</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <FaGlobeEurope className="text-3xl text-cyan-400" />
                <div>
                  <span className="font-semibold">Global Recognition</span>
                  <div className="text-sm text-zinc-500">Degrees are valued by employers worldwide.</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <FaUserGraduate className="text-3xl text-amber-400" />
                <div>
                  <span className="font-semibold">Student Life</span>
                  <div className="text-sm text-zinc-500">Vibrant cities, diverse culture, and travel opportunities.</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <FaChartLine className="text-3xl text-fuchsia-400" />
                <div>
                  <span className="font-semibold">Career Prospects</span>
                  <div className="text-sm text-zinc-500">Strong industry links and post-study work options.</div>
                </div>
              </div>
            </div>
            <div className="mt-8 text-base text-zinc-700 dark:text-zinc-200 font-semibold italic">
              Built by study abroad students for students
            </div>
          </div>
          <div className="flex justify-center">
            <Image
              src="/why-germany.jpg"
              alt="Beautiful German street with historic buildings"
              width={420}
              height={560}
              className="rounded-2xl border border-black/10 shadow-lg shadow-cyan-200/30 dark:border-white/10 dark:shadow-none object-cover max-h-[420px] w-auto"
              priority
            />
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20 animate-fade-in">
        <h2 className="text-2xl font-bold mb-8 text-center">What Students Say</h2>
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
          {testimonials.map((t, i) => (
            <div key={i} className="min-w-[320px] max-w-xs flex-shrink-0 snap-center rounded-2xl border border-black/10 bg-white/90 p-6 shadow-md shadow-emerald-200/30 dark:border-white/10 dark:bg-zinc-900/80 dark:shadow-none">
              <div className="flex items-center gap-3 mb-3">
                <Image src={t.avatar} alt={t.name} width={48} height={48} className="rounded-full border border-emerald-200" />
                <span className="font-semibold text-lg">{t.name}</span>
              </div>
              <p className="text-zinc-700 dark:text-zinc-200 italic">“{t.quote}”</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Timeline */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20 animate-fade-in">
        <div className="rounded-3xl border border-black/10 bg-white/80 p-10 shadow-xl shadow-cyan-200/30 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-none">
          <h2 className="text-2xl font-bold mb-8">How Gradabroad Works</h2>
          <ol className="relative border-l-4 border-emerald-200 dark:border-emerald-700 ml-4">
            {steps.map((step, i) => (
              <li key={i} className="mb-10 ml-6 animate-fade-in" style={{ animationDelay: `${i * 0.1 + 0.2}s` }}>
                <span className="absolute -left-5 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-white font-bold shadow-lg">
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Community Section */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24 animate-fade-in">
        <div className="rounded-3xl border border-black/10 bg-gradient-to-br from-fuchsia-50 via-white to-emerald-50 p-10 shadow-xl shadow-fuchsia-200/30 dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-none flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-fuchsia-500">Join the Gradabroad Community</h2>
          <p className="mb-6 text-zinc-600 dark:text-zinc-300 text-center max-w-xl">
            Connect with other applicants, share tips, and get the latest updates. Follow us on Instagram or join our Discord!
          </p>
          <div className="flex gap-6">
            <a href="https://discord.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-white font-semibold shadow-lg hover:scale-105 transition">
              <FaDiscord className="text-xl" /> Discord
            </a>
            <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-400 px-5 py-2 text-white font-semibold shadow-lg hover:scale-105 transition">
              <FaInstagram className="text-xl" /> Instagram
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
