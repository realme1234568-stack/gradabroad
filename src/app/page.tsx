"use client";


import Image from "next/image";
import Link from "next/link";
import { FaDiscord, FaInstagram, FaCheckCircle, FaGlobeEurope, FaUserGraduate, FaChartLine } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import Typewriter from "@/components/Typewriter";
import ScrollReveal from "@/components/ScrollReveal";

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
  // Parallax effect for hero section
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const heroBg1 = useRef<HTMLDivElement>(null);
  const heroBg2 = useRef<HTMLDivElement>(null);
  const heroBg3 = useRef<HTMLDivElement>(null);
  const heroImgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const section = heroSectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const moveX = (x - centerX) / 30;
      const moveY = (y - centerY) / 30;
      if (heroBg1.current) heroBg1.current.style.transform = `translate(${-moveX * 2}px, ${-moveY * 2}px)`;
      if (heroBg2.current) heroBg2.current.style.transform = `translate(${moveX * 2}px, ${moveY * 2}px)`;
      if (heroBg3.current) heroBg3.current.style.transform = `translate(${-moveX * 1.5}px, ${moveY * 1.5}px)`;
      if (heroImgRef.current) heroImgRef.current.style.transform = `translate(${moveX * 3}px, ${moveY * 3}px) scale(1.04)`;
    };
    const reset = () => {
      if (heroBg1.current) heroBg1.current.style.transform = '';
      if (heroBg2.current) heroBg2.current.style.transform = '';
      if (heroBg3.current) heroBg3.current.style.transform = '';
      if (heroImgRef.current) heroImgRef.current.style.transform = '';
    };
    const section = heroSectionRef.current;
    if (section) {
      section.addEventListener('mousemove', handleMouseMove);
      section.addEventListener('mouseleave', reset);
    }
    return () => {
      if (section) {
        section.removeEventListener('mousemove', handleMouseMove);
        section.removeEventListener('mouseleave', reset);
      }
    };
  }, []);
  // (removed duplicate heroImgRef and useEffect)
  // Removed scroll-based scaling for hero image

  // Removed scroll-based scaling for pexels image

  const { firstName, loading } = useUser();
  return (
    <div className="relative overflow-hidden bg-white text-zinc-900 transition-colors duration-200 dark:bg-black dark:text-white animate-fade-in">
      {/* Animated background gradients */}
      <div ref={heroBg1} className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/30 blur-3xl dark:bg-emerald-400/20 animate-pulse will-change-transform" />
      <div ref={heroBg2} className="pointer-events-none absolute -right-32 top-20 h-64 w-64 rounded-full bg-cyan-400/30 blur-3xl dark:bg-cyan-400/20 animate-pulse will-change-transform" />
      <div ref={heroBg3} className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl dark:bg-fuchsia-400/10 animate-pulse will-change-transform" />

      {/* Hero Section */}
      <section className="relative border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-6 pt-28 pb-24 grid md:grid-cols-2 gap-16 items-center">
          {/* LEFT SIDE */}
          <div className="space-y-8">
            {/* Subtle Personalized Greeting */}
            {firstName && (
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Hi {firstName},
              </p>
            )}
            <p className="text-sm font-semibold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
              Germany Study Planner
            </p>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-zinc-900 dark:text-white">
              Plan your Germany
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                master’s journey
              </span>
              with clarity.
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-xl">
              Shortlist universities, track deadlines, manage documents, and stay ahead —
              all in one powerful dashboard built for serious applicants.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/dashboard"
                className="px-8 py-4 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30 hover:scale-105 hover:shadow-xl transition-all duration-300"
              >
                Get Started
              </Link>
              <Link
                href="/browse-programs"
                className="px-8 py-4 rounded-xl border border-zinc-300 dark:border-zinc-700 font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Browse Programs
              </Link>
            </div>
            <div className="pt-6 flex flex-wrap gap-6 text-sm text-zinc-500 dark:text-zinc-400">
              <div>✔ Tuition-free public universities</div>
              <div>✔ English-taught programs</div>
              <div>✔ Post-study work options</div>
            </div>
          </div>
          {/* RIGHT SIDE */}
          <div className="relative">
            <div className="absolute -top-10 -right-10 h-40 w-40 bg-indigo-500/20 blur-3xl rounded-full" />
            <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-6">
              <Image
                src="/hero-students.jpg"
                alt="Students planning Germany study"
                width={600}
                height={400}
                className="rounded-xl object-cover"
                priority
              />
              {/* Fake UI preview bars */}
              <div className="mt-6 space-y-2">
                <div className="h-3 bg-indigo-500 rounded-full w-3/4" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full w-1/2" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </section>
      

      {/* Animated Pexels Image Section */}
      <ScrollReveal>
        <section className="mx-auto w-full max-w-6xl px-6 pb-20">
          <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-cyan-50 via-white to-emerald-50 p-10 shadow-xl shadow-cyan-200/30 backdrop-blur dark:border-white/10 dark:bg-zinc-900/95 dark:shadow-none flex flex-col items-center justify-center luxury-card" style={{color: '#ededed'}}>
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
            <h2 className="text-2xl font-bold mb-8 text-center dark:text-zinc-900">Enjoy the culture of Germany</h2>
            <div className="w-full flex justify-center">
              <Image
                src="/pexels-laura-paredis-1047081-13138159.jpg"
                alt="Cologne Cathedral"
                width={900}
                height={600}
                className="rounded-2xl border border-black/10 bg-white/80 shadow-lg shadow-purple-200/30 dark:border-white/10 dark:bg-black/50 dark:shadow-none object-cover w-full h-[420px] max-w-3xl animate-float"
                priority
              />
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Why Germany Section */}
      <ScrollReveal>
        <section className="mx-auto w-full max-w-6xl px-6 pb-20">
          <div className="rounded-3xl border border-black/10 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 p-10 shadow-xl shadow-cyan-200/30 backdrop-blur dark:border-white/10 dark:bg-zinc-900/95 dark:shadow-lg dark:shadow-white/10 grid md:grid-cols-2 gap-10 items-center luxury-card" style={{color: '#ededed'}}>
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
              <div className="mt-8 text-base text-zinc-700 dark:text-zinc-100 font-semibold italic">
                Built by study abroad students for students
              </div>
            </div>
            <div className="flex justify-center">
              <Image
                src="/pexels-tretty-gmbh-bike-scooter-sharing-51316081-7706670.jpg"
                alt="Cycling in Germany"
                width={420}
                height={560}
                className="rounded-2xl border border-black/10 shadow-lg shadow-cyan-200/30 dark:border-white/10 dark:shadow-none object-cover max-h-[420px] w-auto animate-float"
                priority
              />
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Testimonials Carousel */}
      <ScrollReveal>
        <section className="mx-auto w-full max-w-6xl px-6 pb-20">
          <h2 className="text-2xl font-bold mb-8 text-center text-zinc-900 dark:text-white">What Students Say</h2>
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
          {testimonials.map((t, i) => (
            <div key={i} className="min-w-[320px] max-w-xs flex-shrink-0 snap-center rounded-2xl border border-black/10 bg-white/95 p-6 shadow-md shadow-emerald-200/30 dark:border-white/10 dark:bg-zinc-900/95 dark:shadow-none luxury-card animate-fade-in-up hover:scale-[1.035] transition-transform duration-200" style={{animationDelay: `${i * 0.1 + 0.2}s`}}>
              <div className="flex items-center gap-3 mb-3">
                <Image src={t.avatar} alt={t.name} width={48} height={48} className="rounded-full border border-emerald-200" />
                <span className="font-semibold text-lg text-zinc-900 dark:text-white">{t.name}</span>
              </div>
                <p className="text-zinc-700 dark:text-white italic">“{t.quote}”</p>
            </div>
          ))}
          </div>
        </section>
      </ScrollReveal>

      {/* How it Works Timeline */}
      <ScrollReveal>
        <section className="mx-auto w-full max-w-6xl px-6 pb-20">
          <div className="rounded-3xl border border-black/10 bg-white/95 p-10 shadow-xl shadow-cyan-200/30 backdrop-blur dark:border-white/10 dark:bg-zinc-900/95 dark:shadow-none luxury-card">
          <h2 className="text-2xl font-bold mb-8 text-zinc-900 dark:text-white">How Gradabroad Works</h2>
          <ol className="relative border-l-4 border-emerald-200 dark:border-emerald-700 ml-4">
            {steps.map((step, i) => (
              <li key={i} className="mb-10 ml-6 animate-fade-in" style={{ animationDelay: `${i * 0.1 + 0.2}s` }}>
                <span className="absolute -left-5 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 text-white font-bold shadow-lg">
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{step.title}</h3>
                <p className="text-sm text-zinc-700 dark:text-white mt-1">{step.description}</p>
              </li>
            ))}
          </ol>
          </div>
        </section>
      </ScrollReveal>

      {/* Community Section */}
      <ScrollReveal>
        <section className="mx-auto w-full max-w-6xl px-6 pb-24">
          <div className="rounded-3xl border border-black/10 bg-gradient-to-br from-fuchsia-50 via-white to-emerald-50 p-10 shadow-xl shadow-fuchsia-200/30 dark:border-white/10 dark:bg-zinc-900/95 dark:shadow-none flex flex-col md:flex-row items-center justify-between gap-8 luxury-card">
          <div className="flex flex-col items-center md:items-start flex-1">
            <h2 className="text-2xl font-bold mb-4 text-fuchsia-500 dark:text-fuchsia-300">Join the Gradabroad Community</h2>
            <p className="mb-6 text-zinc-700 dark:text-white text-center md:text-left max-w-xl">
              Connect with other applicants, share tips, and get the latest updates. Follow us on Instagram or join our Discord!
            </p>
            <div className="flex gap-6 mb-4 md:mb-0">
              <a href="https://discord.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-white font-semibold shadow-lg hover:scale-105 transition ripple-btn">
                <FaDiscord className="text-xl icon-hover-animate" /> Discord
              </a>
              <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-400 px-5 py-2 text-white font-semibold shadow-lg hover:scale-105 transition ripple-btn">
                <FaInstagram className="text-xl icon-hover-animate" /> Instagram
              </a>
            </div>
          </div>
            {/* Feedback Section removed from landing page */}
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}








