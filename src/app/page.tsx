"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  Plus,
  Bookmark,
  ListChecks,
  Wallet,
  Bell,
  Compass,
  Pause,
  Play,
} from "@/components/LandingIcons";
import s from "./home.module.css";

const views = ["Shortlist", "Checklist", "Budget"] as const;
type View = (typeof views)[number];
const faq = [
  [
    "What can I do with GradAbroad?",
    "Explore programs in Germany, save a personal shortlist, keep application notes and deadlines together, track document preparation, and plan expenses. It’s a workspace for organizing your own applications.",
  ],
  [
    "Can I explore programs before signing in?",
    "Yes. You can browse the catalogue without an account. Sign in when you’re ready to save programs and keep your planning progress.",
  ],
  [
    "Does GradAbroad submit my applications?",
    "No. You apply through each university’s official application process. GradAbroad helps you organize the steps, while the university remains the source for current entry requirements and deadlines.",
  ],
  [
    "Can I upload my documents?",
    "Your Documents is your private library for PDF, JPG, and PNG files, up to 3 MB each. Sign in to upload, download, or delete your files. The tracker checklist separately records what you have prepared; uploading does not submit anything to a university.",
  ],
  [
    "How do notifications work?",
    "Shortlist additions, removals, and application-status changes appear as in-app notifications. You can find them in the bell at the top of any page. Email deadline reminders are not currently available.",
  ],
];

function ScrollWorkspace({ paused }: { paused: boolean }) {
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = frame.current;
    if (!element || paused) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pendingFrame = 0;

    function update() {
      pendingFrame = 0;
      if (!element) return;
      if (reducedMotion.matches) {
        element.style.setProperty("--workspace-scale", "1");
        element.style.setProperty("--workspace-opacity", "1");
        return;
      }
      // Measure the unscaled wrapper so the animation cannot feed back into itself.
      const top = element.getBoundingClientRect().top;
      const progress = Math.min(
        1,
        Math.max(
          0,
          (window.innerHeight * 0.9 - top) / (window.innerHeight * 0.75),
        ),
      );
      const maximum = window.innerWidth <= 700 ? 1 : 1.04;
      element.style.setProperty(
        "--workspace-scale",
        String(0.86 + progress * (maximum - 0.86)),
      );
      element.style.setProperty("--workspace-opacity", String(0.4 + progress * 0.6));
    }

    function scheduleUpdate() {
      if (!pendingFrame) pendingFrame = window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    reducedMotion.addEventListener("change", scheduleUpdate);
    return () => {
      window.cancelAnimationFrame(pendingFrame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      reducedMotion.removeEventListener("change", scheduleUpdate);
    };
  }, [paused]);

  return (
    <div ref={frame} className={s.workspaceZoom}>
      <ProductPreview />
    </div>
  );
}

function ProductPreview() {
  const [view, setView] = useState<View>("Shortlist");
  const [checked, setChecked] = useState([true, true, false, false]);
  const icons = [Bookmark, ListChecks, Wallet];
  return (
    <div className={s.workspace}>
      <div className={s.windowBar}>
        <span className={s.windowDots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>YOUR GERMANY WORKSPACE</span>
        <span className={s.demoLabel}>Interactive example</span>
      </div>
      <div className={s.workspaceBody}>
        <aside className={s.previewSidebar}>
          <span className={s.previewBrand}>
            <Compass /> GradAbroad
          </span>
          <p>MY WORKSPACE</p>
          <div
            role="tablist"
            aria-label="Explore workspace features"
            className={s.previewTabs}
          >
            {views.map((name, i) => {
              const Icon = icons[i];
              return (
                <button
                  key={name}
                  role="tab"
                  id={`preview-tab-${name}`}
                  aria-selected={view === name}
                  aria-controls="workspace-panel"
                  tabIndex={view === name ? 0 : -1}
                  onKeyDown={(event) => {
                    if (
                      [
                        "ArrowRight",
                        "ArrowDown",
                        "ArrowLeft",
                        "ArrowUp",
                        "Home",
                        "End",
                      ].includes(event.key)
                    ) {
                      event.preventDefault();
                      const index =
                        event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? 2
                            : (i +
                                (["ArrowLeft", "ArrowUp"].includes(event.key)
                                  ? 2
                                  : 1)) %
                              3;
                      setView(views[index]);
                      document
                        .getElementById(`preview-tab-${views[index]}`)
                        ?.focus();
                    }
                  }}
                  onClick={() => setView(name)}
                >
                  <Icon />
                  {name}
                </button>
              );
            })}
          </div>
          <div className={s.previewDestination}>
            <span className={s.flag} aria-hidden="true" />
            Germany<span>Your next chapter</span>
          </div>
        </aside>
        <div
          className={s.previewMain}
          id="workspace-panel"
          role="tabpanel"
          aria-labelledby={`preview-tab-${view}`}
          tabIndex={0}
        >
          <div className={s.previewHeading}>
            <div>
              <p>PLAN WITH PERSPECTIVE</p>
              <h3>
                {view === "Shortlist"
                  ? "A little more clarity."
                  : view === "Checklist"
                    ? "One step closer."
                    : "Make room for the journey."}
              </h3>
            </div>
            <span className={s.avatar}>YOU</span>
          </div>
          <div key={view} className={s.panelTransition}>
            {view === "Shortlist" ? (
              <>
                <div className={s.previewStats}>
                  <div>
                    <span>Saved programs</span>
                    <strong>03</strong>
                  </div>
                  <div>
                    <span>Applications started</span>
                    <strong>01</strong>
                  </div>
                  <div>
                    <span>Your destination</span>
                    <strong>
                      DE<span> Germany</span>
                    </strong>
                  </div>
                </div>
                <div className={s.tableLabel}>
                  <span>YOUR SHORTLIST</span>
                  <span>Application status</span>
                </div>
                {[
                  ["BE", "Berlin", "Program option 01", "Applied"],
                  ["MU", "Munich", "Program option 02", "Shortlisted"],
                  ["AA", "Aachen", "Program option 03", "Shortlisted"],
                ].map(([initials, city, name, status]) => (
                  <div className={s.programRow} key={city}>
                    <span className={s.cityIcon}>{initials}</span>
                    <div>
                      <strong>{city}</strong>
                      <span>{name}</span>
                    </div>
                    <span
                      className={status === "Applied" ? s.applied : s.status}
                    >
                      {status}
                    </span>
                    <ArrowUpRight />
                  </div>
                ))}
              </>
            ) : view === "Checklist" ? (
              <>
                <div className={s.progressLabel}>
                  <span>Document preparation</span>
                  <strong>{checked.filter(Boolean).length} of 4 ready</strong>
                </div>
                <div className={s.progressTrack}>
                  <span
                    style={{ width: `${checked.filter(Boolean).length * 25}%` }}
                  />
                </div>
                <div className={s.demoChecklist}>
                  {[
                    "Passport",
                    "Academic transcript",
                    "Language test",
                    "Letter of recommendation",
                  ].map((label, i) => (
                    <label key={label}>
                      <input
                        type="checkbox"
                        checked={checked[i]}
                        onChange={() =>
                          setChecked((previous) =>
                            previous.map((value, index) =>
                              i === index ? !value : value,
                            ),
                          )
                        }
                      />
                      <span>{label}</span>
                      <span>{checked[i] ? "Prepared" : "To prepare"}</span>
                    </label>
                  ))}
                </div>
                <p className={s.demoHint}>
                  Try checking a document. This example won’t change your
                  account.
                </p>
              </>
            ) : (
              <>
                <div className={s.budgetTotal}>
                  <span>Example monthly living expenses</span>
                  <strong>
                    €800<span> / month</span>
                  </strong>
                </div>
                {[
                  ["Rent", "€400", "50%"],
                  ["Groceries", "€200", "25%"],
                  ["Transport", "€100", "12.5%"],
                  ["Other", "€100", "12.5%"],
                ].map(([label, amount, width]) => (
                  <div className={s.budgetRow} key={label}>
                    <span>{label}</span>
                    <div>
                      <i style={{ width }} />
                    </div>
                    <strong>{amount}</strong>
                  </div>
                ))}
                <p className={s.demoHint}>
                  Illustrative amounts, not a cost-of-living estimate. Set your
                  own budget in the app.
                </p>
              </>
            )}
          </div>
          <div className={s.previewFoot}>
            <span>
              <span className={s.liveDot} /> A place for every next step
            </span>
            <span>Sample data</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function JourneyVisual() {
  return (
    <div className={s.journey} aria-hidden="true">
      <div className={s.orbitGlow} />
      <div className={s.orbit}>
        <span />
      </div>
      <div className={s.orbitTwo} />
      <svg className={s.globe} viewBox="0 0 400 400" fill="none">
        <defs>
          <radialGradient id="globe-fill" cx=".3" cy=".2" r=".8">
            <stop stopColor="#25483e" />
            <stop offset="1" stopColor="#101915" />
          </radialGradient>
          <clipPath id="globe-clip">
            <circle cx="200" cy="200" r="150" />
          </clipPath>
        </defs>
        <circle
          cx="200"
          cy="200"
          r="150"
          fill="url(#globe-fill)"
          stroke="#52685c"
          strokeOpacity=".5"
        />
        <g clipPath="url(#globe-clip)" stroke="#8aa99b" strokeOpacity=".2">
          <ellipse cx="200" cy="200" rx="95" ry="150" />
          <ellipse cx="200" cy="200" rx="40" ry="150" />
          <ellipse cx="200" cy="200" rx="150" ry="55" />
          <ellipse cx="200" cy="200" rx="150" ry="115" />
          <path d="M50 200h300M200 50v300" />
        </g>
        <path
          d="M90 257Q140 82 275 130"
          stroke="#b9f3d3"
          strokeWidth="1.5"
          strokeDasharray="4 7"
          className={s.flightPath}
        />
        <circle cx="275" cy="130" r="5" fill="#c0f4d8" />
        <circle cx="275" cy="130" r="12" stroke="#c0f4d8" strokeOpacity=".5" />
        <circle cx="90" cy="257" r="4" fill="#9bada4" />
      </svg>
      <div className={s.destinationCard}>
        <span className={s.flag} />
        <span>
          Next stop<strong>Germany</strong>
        </span>
        <ArrowUpRight />
      </div>
      <div className={s.floatingNote}>
        <span className={s.checkCircle}>
          <Check />
        </span>
        <div>
          From possibilities
          <br />
          <strong>to a plan.</strong>
        </div>
      </div>
      <div className={s.coordinates}>
        51° N &nbsp; 10° E <span>YOUR NEXT CHAPTER</span>
      </div>
      <span className={s.orbitStar}>+</span>
      <span className={s.orbitStarTwo}>+</span>
    </div>
  );
}

export default function Home() {
  const [paused, setPaused] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!root.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "true");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    root.current
      .querySelectorAll("[data-reveal]")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  return (
    <div className={s.landing} ref={root} data-paused={paused}>
      <a href="#home-content" className={s.skipLink}>
        Skip to page content
      </a>
      <section className={`${s.hero} ${s.container}`} id="home-content">
        <div className={s.heroCopy}>
          <p className={s.eyebrow}>
            <span className={s.liveDot} /> YOUR STUDY PLANS. A CLEARER
            DIRECTION.
          </p>
          <h1>
            Big plans for
            <br />
            Germany.
            <br />
            <span>One clear place.</span>
          </h1>
          <p className={s.heroDescription}>
            Turn scattered research into your next chapter. Find programs, build
            your shortlist, and keep every application moving.
          </p>
          <div className={s.actions}>
            <Link href="/browse-programs" className={s.primary}>
              Explore programs <ArrowUpRight />
            </Link>
            <a href="#workspace" className={s.secondary}>
              See how it works <ArrowRight />
            </a>
          </div>
          <p className={s.heroNote}>
            <Check /> Explore first. Sign in when you’re ready to save.
          </p>
        </div>
        <JourneyVisual />
        <div className={s.heroBottom}>
          <span>BUILT FOR THE JOURNEY AHEAD</span>
          <a href="#workspace">
            Take a closer look <span>↓</span>
          </a>
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-pressed={paused}
          >
            {paused ? <Play /> : <Pause />}
            {paused ? "Resume motion" : "Pause motion"}
          </button>
        </div>
      </section>

      <div className={s.capabilityStrip}>
        <div className={s.container}>
          {[
            [Compass, "Discover programs"],
            [Bookmark, "Build your shortlist"],
            [ListChecks, "Track your progress"],
            [Wallet, "Plan your expenses"],
          ].map(([Icon, label]) => {
            const FeatureIcon = Icon as typeof Compass;
            return (
              <span key={label as string}>
                <FeatureIcon />
                {label as string}
              </span>
            );
          })}
        </div>
      </div>

      <section
        className={`${s.container} ${s.productSection}`}
        id="workspace"
        data-reveal
      >
        <div className={s.sectionHeading}>
          <div>
            <p className={s.eyebrow}>A WORKSPACE, NOT ANOTHER SPREADSHEET</p>
            <h2>
              Less keeping track.
              <br />
              <span>More moving forward.</span>
            </h2>
          </div>
          <p>
            Your shortlist, preparation, and budget belong together. Get a feel
            for how your plan takes shape.
          </p>
        </div>
        <ScrollWorkspace paused={paused} />
        <p className={s.previewCaption}>
          An illustrative look at the tools inside GradAbroad. Your workspace
          starts with your choices.
        </p>
      </section>

      <section
        className={`${s.container} ${s.workflow}`}
        id="how-it-works"
        data-reveal
      >
        <div className={s.sectionHeading}>
          <div>
            <p className={s.eyebrow}>FROM FIRST SEARCH TO NEXT STEP</p>
            <h2>
              A little structure.
              <br />
              <span>A lot more possibility.</span>
            </h2>
          </div>
          <Link href="/dashboard" className={s.textLink}>
            Open your workspace <ArrowUpRight />
          </Link>
        </div>
        <div className={s.steps}>
          <article>
            <div className={s.stepNumber}>
              01 <Compass />
            </div>
            <h3>Find your direction.</h3>
            <p>
              Explore bachelor’s and master’s programs in Germany. Bring the
              options that interest you into focus.
            </p>
            <Link href="/browse-programs">
              Browse programs <ArrowRight />
            </Link>
          </article>
          <article>
            <div className={s.stepNumber}>
              02 <Bookmark />
            </div>
            <h3>Make it your plan.</h3>
            <p>
              Save programs, add notes, and keep your deadlines together. Build
              a shortlist that makes sense for you.
            </p>
            <Link href="/dashboard/my-shortlist">
              Your shortlist <ArrowRight />
            </Link>
          </article>
          <article>
            <div className={s.stepNumber}>
              03 <ListChecks />
            </div>
            <h3>Know what comes next.</h3>
            <p>
              Track application stages and document preparation. See what’s
              ready, and what still needs your attention.
            </p>
            <Link href="/dashboard/my-tracker">
              Your application tracker <ArrowRight />
            </Link>
          </article>
        </div>
      </section>

      <section className={`${s.container} ${s.detailGrid}`} data-reveal>
        <article className={s.budgetFeature}>
          <p className={s.eyebrow}>MAKE THE NUMBERS MAKE SENSE</p>
          <h2>
            Your ambition.
            <br />
            Your budget.
          </h2>
          <p>
            Plan preparation costs and monthly living expenses in separate
            calculators. Adjust the amounts as your plans become clearer.
          </p>
          <Link href="/dashboard/expense-calculator" className={s.textLink}>
            Plan your expenses <ArrowUpRight />
          </Link>
          <div className={s.abstractBars} aria-hidden="true">
            {[45, 75, 55, 95, 65, 80, 50].map((height, i) => (
              <i
                key={i}
                style={{ height: `${height}%`, animationDelay: `${i * -0.7}s` }}
              />
            ))}
          </div>
        </article>
        <article className={s.updatesFeature}>
          <span className={s.featureIcon}>
            <Bell />
          </span>
          <p className={s.eyebrow}>THE SMALL STEPS ADD UP</p>
          <h2>
            Keep the progress.
            <br />
            Lose the guesswork.
          </h2>
          <p>
            Shortlist changes and application-status updates stay in your
            notification center. Come back knowing where you left off.
          </p>
          <div className={s.activityExample}>
            <span className={s.checkCircle}>
              <Check />
            </span>
            <div>
              <strong>Application status updated</strong>
              <span>One more step in your journey.</span>
            </div>
            <span>Now</span>
          </div>
          <span className={s.exampleCaption}>Example notification</span>
        </article>
      </section>

      <section className={`${s.container} ${s.faq}`} data-reveal>
        <div>
          <p className={s.eyebrow}>GOOD QUESTIONS. CLEAR ANSWERS.</p>
          <h2>
            Before you
            <br />
            <span>take the next step.</span>
          </h2>
        </div>
        <div className={s.faqList}>
          {faq.map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <Plus />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={s.finalSection} data-reveal>
        <div className={s.finalOrbit} aria-hidden="true" />
        <div className={s.container}>
          <p className={s.eyebrow}>
            YOUR NEXT CHAPTER STARTS WITH A FIRST STEP
          </p>
          <h2>
            Make room
            <br />
            for <span>what’s next.</span>
          </h2>
          <p>
            A clearer plan for studying in Germany. Built one choice at a time.
          </p>
          <Link className={s.primary} href="/browse-programs">
            Find your first program <ArrowUpRight />
          </Link>
        </div>
      </section>
      <footer className={`${s.footer} ${s.container}`}>
        <div>
          <Link href="/" className={s.footerBrand}>
            <Compass />
            GradAbroad
          </Link>
          <p>A clearer path to studying in Germany.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/browse-programs">Programs</Link>
          <Link href="/dashboard">Workspace</Link>
          <a href="#how-it-works">How it works</a>
        </nav>
        <span>Plan thoughtfully. Go further.</span>
      </footer>
    </div>
  );
}
