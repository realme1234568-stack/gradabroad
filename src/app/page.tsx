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
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    quote: "Gradabroad made my Germany application journey so much easier! The tracker is a game changer.",
  },
  {
    name: "Maya R.",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    quote: "Loved the clean UI and the reminders. I never missed a deadline!",
  },
  {
    name: "Lukas F.",
    avatar: "https://randomuser.me/api/portraits/men/65.jpg",
    quote: "The shortlist feature helped me stay organized and focused. Highly recommend!",
  },
];

import { useUser } from "@/lib/UserContext";

export default function Home() {
  // Removed scroll-based scaling for hero image

  // Removed scroll-based scaling for pexels image

  const { firstName, loading } = useUser();
  return (
    <div className="relative overflow-hidden bg-white text-zinc-900 transition-colors duration-200 dark:bg-black dark:text-white">
      {/* Animated background gradients */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/30 blur-3xl dark:bg-emerald-400/20 animate-pulse" />
      <div className="pointer-events-none absolute -right-32 top-20 h-64 w-64 rounded-full bg-cyan-400/30 blur-3xl dark:bg-cyan-400/20 animate-pulse" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-400/10 animate-pulse" />

      {/* Hero Section */}
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 pb-20 pt-16 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="space-y-7">
          {/* Fun greeting if logged in */}
          {firstName && (
            <div className="mb-2 animate-bounce">
              <span className="inline-block text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-fuchsia-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
                Hi {firstName}!
              </span>
              <span className="ml-2 text-lg md:text-xl font-bold text-emerald-400 animate-wiggle">👋</span>
            </div>
          )}
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500 animate-fade-in">
            Study Abroad Planner
          </p>
          <h1 className="text-5xl font-extrabold leading-tight md:text-6xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-400 bg-clip-text text-transparent animate-gradient-x">
            Your Germany Study Journey, Upgraded.
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-300 md:text-xl animate-fade-in">
            Plan, shortlist, and track your applications with a modern dashboard.
          </p>
          <div className="flex flex-wrap gap-4 animate-fade-in">
            <Link
              href="/browse-programs"
              className="rounded-full bg-[radial-gradient(circle_at_top,_#34d399,_#22d3ee,_#0ea5e9)] px-6 py-3 text-base font-bold text-zinc-900 shadow-lg shadow-emerald-400/30 transition hover:scale-105 hover:brightness-110"
            >
              Browse Programs
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-[radial-gradient(circle_at_top,_#a78bfa,_#6366f1,_#06b6d4)] px-6 py-3 text-base font-bold text-zinc-900 shadow-md shadow-indigo-300/40 transition hover:scale-105 hover:brightness-110"
            >
              My Dashboard
            </Link>
            <Link
              href="/dashboard/my-tracker"
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
        <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-8 shadow-xl shadow-emerald-200/30 dark:border-white/10 dark:from-zinc-900 dark:via-zinc-950 dark:to-black dark:shadow-none animate-fade-in flex flex-col items-center">
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
            <div className="w-full flex justify-center">
              <Image
                src="/hero-students.jpg"
                alt="Students in front of a German university"
                width={420}
                height={300}
                className="rounded-2xl border border-black/10 bg-white/80 shadow-lg shadow-cyan-200/30 dark:border-white/10 dark:bg-black/50 dark:shadow-none object-cover max-h-[320px] w-auto"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Animated Pexels Image Section */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20 animate-fade-in">
        <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-10 shadow-xl shadow-cyan-200/30 backdrop-blur dark:border-white/10 dark:bg-zinc-800/80 dark:shadow-none flex flex-col items-center justify-center">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
          <h2 className="text-2xl font-bold mb-8 text-center dark:text-zinc-900">Enjoy the culture of Germany</h2>
          <div className="w-full flex justify-center">
            <Image
              src="/pexels-laura-paredis-1047081-13138159.jpg"
              alt="Cologne Cathedral"
              width={900}
              height={600}
              className="rounded-2xl border border-black/10 bg-white/80 shadow-lg shadow-purple-200/30 dark:border-white/10 dark:bg-black/50 dark:shadow-none object-cover w-full h-[420px] max-w-3xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* Why Germany Section */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20 animate-fade-in">
        <div className="rounded-3xl border border-black/10 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 p-10 shadow-xl shadow-cyan-200/30 backdrop-blur dark:border-white/10 dark:bg-white/90 dark:shadow-lg dark:shadow-white/10 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-emerald-500 dark:text-emerald-500">Why Study in Germany?</h2>
            <div className="grid gap-6">
              <div className="flex items-center gap-4">
                <FaCheckCircle className="text-3xl text-emerald-400" />
                <div>
                  <span className="font-semibold dark:text-zinc-900">Affordable Education</span>
                  <div className="text-sm text-zinc-500 dark:text-zinc-800">Most public universities have no tuition fees.</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <FaGlobeEurope className="text-3xl text-cyan-400" />
                <div>
                  <span className="font-semibold dark:text-zinc-900">Global Recognition</span>
                  <div className="text-sm text-zinc-500 dark:text-zinc-800">Degrees are valued by employers worldwide.</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <FaUserGraduate className="text-3xl text-amber-400" />
                <div>
                  <span className="font-semibold dark:text-zinc-900">Student Life</span>
                  <div className="text-sm text-zinc-500 dark:text-zinc-800">Vibrant cities, diverse culture, and travel opportunities.</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <FaChartLine className="text-3xl text-fuchsia-400" />
                <div>
                  <span className="font-semibold dark:text-zinc-900">Career Prospects</span>
                  <div className="text-sm text-zinc-500 dark:text-zinc-800">Strong industry links and post-study work options.</div>
                </div>
              </div>
            </div>
            <div className="mt-8 text-base text-zinc-700 dark:text-zinc-900 font-semibold italic">
              Built by study abroad students for students
            </div>
          </div>
          <div className="flex justify-center">
            <Image
              src="/pexels-tretty-gmbh-bike-scooter-sharing-51316081-7706670.jpg"
              alt="Cycling in Germany"
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
        <div className="rounded-3xl border border-black/10 bg-gradient-to-br from-fuchsia-50 via-white to-emerald-50 p-10 shadow-xl shadow-fuchsia-200/30 dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-none flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start flex-1">
            <h2 className="text-2xl font-bold mb-4 text-fuchsia-500">Join the Gradabroad Community</h2>
            <p className="mb-6 text-zinc-600 dark:text-zinc-300 text-center md:text-left max-w-xl">
              Connect with other applicants, share tips, and get the latest updates. Follow us on Instagram or join our Discord!
            </p>
            <div className="flex gap-6 mb-4 md:mb-0">
              <a href="https://discord.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-white font-semibold shadow-lg hover:scale-105 transition">
                <FaDiscord className="text-xl" /> Discord
              </a>
              <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-400 px-5 py-2 text-white font-semibold shadow-lg hover:scale-105 transition">
                <FaInstagram className="text-xl" /> Instagram
              </a>
            </div>
          </div>
            {/* Feedback Section removed from landing page */}
        </div>
      </section>
    </div>
  );
}



