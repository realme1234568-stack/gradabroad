"use client";
import { useEffect, useRef, useState } from 'react';
import type { IconType } from 'react-icons';
import { FaPassport, FaPlaneDeparture, FaUniversity, FaLanguage, FaGraduationCap, FaSuitcaseRolling } from 'react-icons/fa';
import { FiAward, FiFileText, FiCompass, FiSend, FiCheck, FiLock, FiShield, FiHome, FiCreditCard, FiArrowRight, FiArrowLeft, FiX, FiExternalLink, FiInfo, FiRefreshCw, FiPause, FiPlay } from 'react-icons/fi';
import type { useAccountData } from '@/lib/accountData';
import { journeySteps, resolveJourney, reopenJourney, type JourneyProgress, type JourneyResolution } from '@/lib/journey';
import s from '@/app/dashboard/my-journey/journey.module.css';

const icons: Record<string, IconType> = { passport: FaPassport, graduate: FaGraduationCap, compass: FiCompass, language: FaLanguage, test: FiFileText, verified: FiShield, documents: FiFileText, send: FiSend, admission: FiAward, bank: FiCreditCard, health: FiShield, visa: FaPassport, home: FiHome, university: FaUniversity, ticket: FiSend, luggage: FaSuitcaseRolling };
type JourneyAccount = ReturnType<typeof useAccountData<JourneyProgress>>;
export default function MyJourney({ account }: { account: JourneyAccount }) {
  const { value, save, loading, saving, error, ready } = account;
  const current = value.resolved.length;
  const finished = current === journeySteps.length;
  const completed = value.resolved.filter(item => item.outcome === 'completed').length;
  const skipped = current - completed;
  const activeStep = journeySteps[current];
  const ActiveIcon = activeStep ? icons[activeStep.icon] : FaPlaneDeparture;
  const [selected, setSelected] = useState<number | null>(null);
  const [reopening, setReopening] = useState(false);
  const [beam, setBeam] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [motionPaused, setMotionPaused] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const nodes = useRef<(HTMLButtonElement | HTMLDivElement | null)[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const selectedStep = selected === null ? null : journeySteps[selected];
  const selectedRecord = selected === null ? undefined : value.resolved[selected];
  const selectedIsCurrent = selected === current;
  const selectedIsLocked = selected !== null && selected > current;
  const SelectedIcon = selectedStep ? icons[selectedStep.icon] : FiInfo;
  const percent = Math.round(current / journeySteps.length * 100);

  function scrollToStage(index: number) {
    const node = nodes.current[index];
    if (!node || !viewport.current) return;
    const container = viewport.current;
    const left = container.scrollLeft + node.getBoundingClientRect().left - container.getBoundingClientRect().left - container.clientWidth / 2 + node.offsetWidth / 2;
    container.scrollTo({ left, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  useEffect(() => {
    if (ready) scrollToStage(current);
  }, [ready, current]);
  useEffect(() => {
    if (beam === null) return;
    const timeout = setTimeout(() => setBeam(null), 2000);
    return () => clearTimeout(timeout);
  }, [beam]);
  useEffect(() => {
    if (selected !== null) dialog.current?.showModal();
    else if (dialog.current?.open) dialog.current.close();
  }, [selected]);

  function openStage(index: number) {
    returnFocus.current = document.activeElement as HTMLElement;
    setReopening(false);
    setSelected(index);
  }
  function closeDialog() {
    if (saving) return;
    setSelected(null);
    returnFocus.current?.focus();
  }
  async function advance(outcome: JourneyResolution['outcome']) {
    if (selected === null || !ready || saving) return;
    const next = resolveJourney(value, selected, outcome);
    if (!next) return;
    if (await save(next)) {
      setBeam(selected);
      setAnnouncement(`${journeySteps[selected].title} ${outcome === 'skipped' ? 'marked not applicable' : 'completed'}. ${journeySteps[selected + 1]?.title ? `${journeySteps[selected + 1].title} unlocked.` : 'Your departure preparations are complete. Ready to fly!'}`);
      setSelected(null);
      requestAnimationFrame(() => nodes.current[next.resolved.length]?.focus({ preventScroll: true }));
    }
  }
  async function reopen() {
    if (selected === null || !ready || saving) return;
    const next = reopenJourney(value, selected);
    if (!next) return;
    if (await save(next)) {
      setAnnouncement(`${journeySteps[selected].title} reopened. Later milestones have been locked again.`);
      setSelected(null);
      requestAnimationFrame(() => nodes.current[selected]?.focus({ preventScroll: true }));
    }
  }

  return (
    <div className={`app-page ${s.page}`} aria-busy={loading || saving} data-motion-paused={motionPaused || undefined}>
      <a className={s.back} href="/dashboard"><FiArrowLeft aria-hidden="true" /> Your dashboard</a>
      <header className={s.heading}>
        <div><p className="page-eyebrow">YOUR NEXT CHAPTER, ONE STEP AT A TIME</p><h1>My Journey<span>.</span></h1><p>From your first document to your first flight.<br />Every milestone brings Germany a little closer.</p></div>
        <div className={s.destination} aria-hidden="true"><span>FROM A PLAN</span><div><i /> <span className={s.destinationLine} /><FaPlaneDeparture /></div><strong>To Germany <span>DE</span></strong></div>
      </header>

      {error && selected === null && <div role="alert" className={s.error}><p>{error}</p>{!ready && !loading && <button type="button" onClick={() => window.location.reload()}>Reload journey</button>}</div>}
      <div className={s.overview}>
        <section className={s.next} aria-labelledby="next-step-title">
          <div className={s.nextIcon}><ActiveIcon aria-hidden="true" /></div>
          <div className={s.nextCopy}><p className="page-eyebrow">{loading ? 'LOADING YOUR JOURNEY' : !ready ? 'YOUR JOURNEY IS UNAVAILABLE' : finished ? 'CLEARED FOR YOUR NEXT CHAPTER' : `YOUR NEXT MILESTONE · ${String(current + 1).padStart(2, '0')}`}</p><h2 id="next-step-title">{loading ? 'Finding your place…' : !ready ? 'Let’s reconnect' : finished ? 'Germany is calling.' : activeStep.title}</h2><p>{finished ? 'Your departure preparations are checked off. Keep your documents close and your next chapter closer.' : activeStep?.tip}</p></div>
          <button type="button" className={`ga-primary ${s.primary}`} disabled={!ready || saving} onClick={() => finished ? scrollToStage(current) : openStage(current)}>{finished ? 'See your finish line' : 'Open milestone'}<FiArrowRight aria-hidden="true" /></button>
        </section>
        <section className={s.progressCard} aria-label="Journey progress">
          <div className={s.progressNumber}>{ready ? `${percent}%` : '—'}<span>of your route resolved</span></div>
          <div className={s.progressBar} role="progressbar" aria-label="Journey milestones resolved" aria-valuemin={0} aria-valuemax={journeySteps.length} aria-valuenow={ready ? current : undefined}><i style={{ width: ready ? `${percent}%` : '0%' }} /></div>
          <p>{ready ? `${completed} completed · ${skipped} not applicable · ${journeySteps.length - current} ahead` : 'Your progress appears after loading.'}</p>
        </section>
      </div>

      <section className={s.route} aria-labelledby="route-title">
        <div className={s.routeHeading}><div><p className="page-eyebrow">THE ROAD AHEAD</p><h2 id="route-title">Your route to Germany</h2></div><div className={s.routeControls}><button type="button" className={s.jump} disabled={!ready} onClick={() => scrollToStage(current)}>Jump to {finished ? 'finish' : 'current step'}</button><button type="button" aria-label="Scroll journey left" onClick={() => viewport.current?.scrollBy({ left: -440, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><FiArrowLeft aria-hidden="true" /></button><button type="button" aria-label="Scroll journey right" onClick={() => viewport.current?.scrollBy({ left: 440, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><FiArrowRight aria-hidden="true" /></button></div></div>
        <p className={s.routeHint}>Hover or focus for a quick tip. Select a circle for details. Complete the glowing milestone to unlock the next.</p>
        <div ref={viewport} className={s.viewport} tabIndex={0} role="region" aria-label="Horizontal journey milestones. Scroll sideways to explore.">
          <ol className={s.track}>
            {journeySteps.map((step, index) => {
              const record = value.resolved[index];
              const state = index < current ? record.outcome : index === current ? 'current' : 'locked';
              const Icon = icons[step.icon];
              return <li key={step.id} className={s.stage} data-state={state} data-arriving={beam === index - 1 || undefined}>
                <span className={s.phase}>{step.phase}</span>
                <div className={s.nodeArea}>
                  <button ref={node => { nodes.current[index] = node; }} type="button" className={s.node} disabled={!ready || saving} aria-current={index === current ? 'step' : undefined} aria-label={`${step.title} — ${state === 'current' ? 'current milestone' : state === 'completed' ? 'completed' : state === 'skipped' ? 'not applicable' : 'locked'}`} aria-describedby={`tip-${step.id}`} onClick={() => openStage(index)}>
                    <Icon aria-hidden="true" /><span className={s.badge}>{state === 'completed' ? <FiCheck /> : state === 'skipped' ? '−' : <FiLock />}</span>
                  </button>
                  <div role="tooltip" id={`tip-${step.id}`} className={s.tooltip}>{step.tip}</div>
                </div>
                <span className={s.stepNumber}>{String(index + 1).padStart(2, '0')}</span><h3>{step.title}</h3><span className={s.stateLabel}>{state === 'current' ? 'Your next step' : state === 'completed' ? 'Completed' : state === 'skipped' ? 'Not applicable' : 'Locked'}</span>
                <span aria-hidden="true" className={s.connector} data-lit={index < current || undefined} data-beam={beam === index || undefined}><i /></span>
              </li>;
            })}
            <li className={`${s.stage} ${s.finish}`} data-state={finished ? 'current' : 'locked'} data-arriving={beam === journeySteps.length - 1 || undefined}>
              <span className={s.phase}>Your next chapter</span>
              <div className={s.nodeArea}><div ref={node => { nodes.current[journeySteps.length] = node; }} tabIndex={0} className={`${s.node} ${finished ? s.planeReady : ''}`} role="img" aria-label={finished ? 'Ready to fly to Germany' : 'Flight finish line, locked until departure preparations are complete'} aria-describedby="tip-flight"><FaPlaneDeparture aria-hidden="true" /></div><div id="tip-flight" role="tooltip" className={s.tooltip}>{finished ? 'Your departure preparations are complete. Wishing you a wonderful next chapter.' : 'Resolve the milestones to light up your flight.'}</div></div>
              <span className={s.stepNumber}>DE</span><h3>{finished ? 'Ready to fly' : 'Germany awaits'}</h3><span className={s.stateLabel}>{finished ? 'Let your next chapter begin' : 'Your finish line'}</span>
            </li>
          </ol>
        </div>
        <div className={s.routeFooter}><div className={s.legend}><span><i data-kind="complete" /> Completed</span><span><i data-kind="current" /> Current</span><span><i /> Locked</span></div><button type="button" className={s.motionToggle} aria-pressed={motionPaused} onClick={() => setMotionPaused(paused => !paused)}>{motionPaused ? <FiPlay aria-hidden="true" /> : <FiPause aria-hidden="true" />}{motionPaused ? 'Resume motion' : 'Pause motion'}</button><span>{saving ? 'Saving your progress…' : ready ? 'Progress saved to your account' : 'Sign-in and a connection are needed to save'}</span></div>
      </section>

      <div className={s.notes}>
        <section className={s.planningNote}><FiInfo aria-hidden="true" /><div><h2>Your route, at your pace.</h2><p>This is a planning sequence, not an official processing order. Tasks can overlap. Requirements depend on your nationality, qualifications, university, and intake. Use “Not applicable” only after checking your route.</p><p>Your milestones are self-reported; they don’t change application statuses or certify eligibility.</p></div></section>
        <details className={s.arrival}><summary>And when you arrive? <span>+</span></summary><p>Keep these on your arrival checklist and follow your university and local authority’s instructions:</p><ul><li>Complete any remaining university enrolment and orientation.</li><li>Arrange address registration (Anmeldung) and a residence permit if required.</li><li>Activate your banking and any blocked-account payouts; confirm health cover.</li><li>Arrange a SIM, local transport, and your first days on campus.</li></ul></details>
      </div>
      <p role="status" aria-live="polite" className={s.announcement}>{announcement}</p>

      <dialog ref={dialog} className={s.dialog} aria-labelledby="journey-dialog-title" aria-describedby="journey-dialog-detail" onCancel={event => { event.preventDefault(); closeDialog(); }} onClose={() => { setSelected(null); }}>
        {selectedStep && <>
          <button type="button" className={s.close} aria-label="Close milestone" disabled={saving} onClick={closeDialog}><FiX aria-hidden="true" /></button>
          <div className={s.dialogIcon}><SelectedIcon aria-hidden="true" /></div><p className="page-eyebrow">MILESTONE {String((selected ?? 0) + 1).padStart(2, '0')} · {selectedStep.phase}</p>
          <h2 id="journey-dialog-title">{reopening ? `Reopen ${selectedStep.title}?` : selectedStep.title}</h2><p id="journey-dialog-detail">{reopening ? 'This will remove the completion or skip for this milestone and all later milestones. They will lock again. Your application statuses and other saved data will stay as they are.' : selectedStep.detail}</p>
          {!reopening && <ul className={s.checks}>{selectedStep.tasks.map(task => <li key={task}><FiCheck aria-hidden="true" />{task}</li>)}</ul>}
          {!reopening && <div className={s.links}>{'href' in selectedStep && <a href={selectedStep.href}>{selectedStep.link}<FiArrowRight aria-hidden="true" /></a>}{'source' in selectedStep && <a href={selectedStep.source} target="_blank" rel="noopener noreferrer">{selectedStep.sourceLabel}<FiExternalLink aria-hidden="true" /></a>}</div>}
          {error && <p role="alert" className={s.error}>{error}</p>}
          {reopening ? <><p className={s.confirmNote}>Only continue if you want to redo this part of your journey.</p><div className={s.dialogActions}><button type="button" className="ga-danger" disabled={saving} onClick={() => void reopen()}>{saving ? 'Saving…' : 'Reopen and lock later steps'}</button><button type="button" disabled={saving} onClick={() => setReopening(false)}>Go back</button></div></> : selectedIsCurrent ? <><p className={s.confirmNote}><FiInfo aria-hidden="true" /> If you have completed this phase, click Continue to confirm and unlock the next milestone.</p><div className={s.dialogActions}><button type="button" className="ga-primary" disabled={saving || !ready} onClick={() => void advance('completed')}>{saving ? 'Saving…' : 'Continue'}<FiArrowRight aria-hidden="true" /></button>{selectedStep.optional && <button type="button" disabled={saving || !ready} onClick={() => void advance('skipped')}>Not applicable — skip</button>}<button type="button" disabled={saving} onClick={closeDialog}>Not yet</button></div></> : selectedIsLocked ? <><p className={s.confirmNote}><FiLock aria-hidden="true" /> Complete or resolve {activeStep.title} first to unlock the next milestone.</p><button type="button" className={`ga-primary ${s.primary}`} onClick={closeDialog}>Got it</button></> : <><p className={s.confirmNote}><FiCheck aria-hidden="true" /> {selectedRecord?.outcome === 'skipped' ? 'Marked not applicable' : 'Completed'} · {selectedRecord ? new Date(selectedRecord.at).toLocaleDateString() : ''}</p><div className={s.dialogActions}><button type="button" className="ga-primary" onClick={closeDialog}>Done</button><button type="button" onClick={() => setReopening(true)}><FiRefreshCw aria-hidden="true" /> Reopen this milestone</button></div></>}
        </>}
      </dialog>
    </div>
  );
}
