"use client";
import Link from 'next/link';
import { useState } from 'react';
import { FaArrowRight, FaCheck, FaFileAlt, FaPassport, FaGlobe, FaCertificate, FaUserGraduate } from 'react-icons/fa';
import ApplicationStatusOptions from '@/components/ApplicationStatusOptions';
import { applicationStatuses, normalizeApplicationStatus } from '@/lib/applicationStatus';
import { getProgramLevel } from '@/lib/programLevel';
import { deadlineDays, deadlineLabel, programWebsite, type ShortlistItem } from '@/lib/shortlist';
import { applicationDocuments, coreDocuments, documentProgress, needsDeadlineAction, trackerCsv } from '@/lib/trackerWorkspace';
import styles from './tracker.module.css';

type Props = {
  programs: ShortlistItem[]; loading: boolean; error: string | null; saving: boolean; statusBusy: string | null;
  statusMessage: string | null; saveMessage: string | null; dirty: boolean;
  docStatus: Record<string, Record<string, boolean>>; customDocs: string[]; newDoc: string;
  mandatoryStatus: Record<string, boolean>; customMandatoryDocs: string[]; newMandatoryDoc: string;
  onRetry: () => void; onSave: () => void; onStatus: (item: ShortlistItem, status: string) => void;
  onNewDoc: (value: string) => void; onNewMandatoryDoc: (value: string) => void;
  onToggleCore: (doc: string) => void; onToggleDoc: (id: string, doc: string) => void;
  onAddCore: (doc: string) => void; onAddDoc: (doc: string) => void;
  onRemoveCore: (doc: string) => void; onRemoveDoc: (doc: string) => void;
};
const icons = [FaPassport, FaCertificate, FaGlobe, FaUserGraduate, FaFileAlt];
function Progress({ complete, total, label }: { complete: number; total: number; label: string }) {
  const percent = total ? Math.round(complete / total * 100) : 0;
  return <div className={styles.progress} role="progressbar" aria-label={label} aria-valuenow={complete} aria-valuemin={0} aria-valuemax={total || 1}><span style={{ width: `${percent}%` }} /></div>;
}
export default function TrackerWorkspace(p: Props) {
  const [degree, setDegree] = useState('all'), [query, setQuery] = useState(''), [status, setStatus] = useState('all');
  const [sort, setSort] = useState('deadline'), [view, setView] = useState<'cards' | 'board' | 'matrix'>('cards');
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const allCore = [...new Set([...coreDocuments, ...p.customMandatoryDocs])];
  const allDocs = [...new Set([...applicationDocuments, ...p.customDocs])];
  const core = documentProgress(allCore, p.mandatoryStatus);
  const now = new Date();
  const statuses = [...new Set([...applicationStatuses, ...p.programs.map(item => normalizeApplicationStatus(item.status))])];
  const count = (value: string) => p.programs.filter(item => normalizeApplicationStatus(item.status) === value).length;
  const actionCount = p.programs.filter(item => needsDeadlineAction(item, now)).length;
  const activeCount = count('Applied') + count('Interview');
  const unknown = p.programs.filter(item => !getProgramLevel(item)).length;
  const filtersActive = query !== '' || degree !== 'all' || status !== 'all' || attentionOnly;
  const visible = p.programs.filter(item => (degree === 'all' || (getProgramLevel(item) ?? 'unknown') === degree)
    && (status === 'all' || normalizeApplicationStatus(item.status) === status)
    && (!attentionOnly || needsDeadlineAction(item, now))
    && [item.university_name, item.course_name, item.note ?? ''].some(value => value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())))
    .sort((a, b) => {
      if (sort === 'university') return a.university_name.localeCompare(b.university_name) || a.course_name.localeCompare(b.course_name);
      if (sort === 'recent') return (b.created_at ?? '').localeCompare(a.created_at ?? '');
      const rank = (item: ShortlistItem) => {
        if (sort === 'readiness') return documentProgress(allDocs, p.docStatus[item.id]).percent;
        const days = deadlineDays(item.deadline, now);
        return days === null ? Number.MAX_SAFE_INTEGER : days < 0 ? 100000 - days : days;
      };
      return rank(a) - rank(b);
    });
  function clear() { setDegree('all'); setQuery(''); setStatus('all'); setAttentionOnly(false); }
  function addDocument(global: boolean) {
    const value = (global ? p.newMandatoryDoc : p.newDoc).trim(), existing = global ? allCore : allDocs;
    if (!value || value.length > 64) { setDocError('Enter a document name of 1–64 characters.'); return; }
    if (existing.some(doc => doc.toLocaleLowerCase() === value.toLocaleLowerCase())) { setDocError('That document is already on this checklist.'); return; }
    setDocError(null); if (global) p.onAddCore(value); else p.onAddDoc(value);
  }
  function exportCsv() {
    const url = URL.createObjectURL(new Blob([trackerCsv(visible, allDocs, p.docStatus)], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = 'gradabroad-applications.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function statusControl(item: ShortlistItem) {
    return <label className={styles.statusControl}><span>Application status</span><select aria-label={`Application status for ${item.course_name} at ${item.university_name}`} value={normalizeApplicationStatus(item.status)} disabled={p.saving || p.statusBusy !== null}
      onChange={event => p.onStatus(item, event.target.value)}><ApplicationStatusOptions value={item.status} /></select>{p.statusBusy === item.id && <small role="status">Saving status…</small>}</label>;
  }
  function docToggle(item: ShortlistItem, doc: string) {
    const checked = p.docStatus[item.id]?.[doc] === true;
    return <button type="button" className={`${styles.docToggle} ${checked ? styles.checked : ''}`} aria-pressed={checked} aria-label={`Toggle ${doc} for ${item.university_name}`} onClick={() => p.onToggleDoc(item.id, doc)} disabled={p.saving}>
      {checked ? <span><FaCheck aria-hidden="true" /></span> : <span aria-hidden="true" className={styles.unchecked} />}{view !== 'matrix' && <>{doc}<small>{checked ? 'Ready' : 'To prepare'}</small></>}
    </button>;
  }
  function card(item: ShortlistItem) {
    const progress = documentProgress(allDocs, p.docStatus[item.id]), days = deadlineDays(item.deadline, now);
    const website = programWebsite(item.official_url), level = getProgramLevel(item);
    return <article key={item.id} className={styles.card} aria-label={`${item.course_name} at ${item.university_name}`}>
      <div className={styles.cardTop}><span className={styles.monogram} aria-hidden="true">{item.university_name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('')}</span>
        <span className={styles.tag}>{level === 'master' ? 'Master’s' : level === 'bachelor' ? 'Bachelor’s' : 'Degree not specified'}{item.entry_source === 'manual' ? ' · Personal entry' : ''}</span></div>
      <h3>{item.university_name}</h3><p className={styles.course}>{item.course_name}</p>
      {statusControl(item)}
      <div className={`${styles.deadline} ${days !== null && days <= 7 && normalizeApplicationStatus(item.status) === 'Shortlisted' ? styles.urgent : ''}`}><span>APPLICATION DEADLINE</span><strong>{deadlineLabel(item.deadline, now)}</strong></div>
      <div className={styles.readiness}><div><span>Application checks</span><strong>{progress.complete}/{progress.total} ready</strong></div><Progress {...progress} label={`Application document progress for ${item.course_name}`} /></div>
      <details className={styles.documents} open><summary>Document checklist</summary><p>Track your own preparation. Check which documents this program actually requires.</p><div className={styles.docList}>{allDocs.map(doc => <div key={doc}>{docToggle(item, doc)}</div>)}</div></details>
      {item.note && <div className={styles.note}><span>YOUR NOTES</span><p>{item.note}</p></div>}
      <footer className={styles.cardFooter}><Link href="/dashboard/my-shortlist">Edit details & notes ↗</Link>{website && <a href={website} target="_blank" rel="noopener noreferrer">Program website ↗</a>}</footer>
    </article>;
  }
  return <main className={`app-page ${styles.page}`}>
    <header className={styles.header}><div><p className="page-eyebrow">YOUR APPLICATION WORKSPACE</p><h1>My Tracker<span className={styles.titleDot}>.</span></h1><p>A clearer view of every application. Prepare your documents, watch your deadlines, and keep the next step in sight.</p></div><Link className={styles.primaryLink} href="/dashboard/my-shortlist">Manage applications <FaArrowRight aria-hidden="true" /></Link></header>
    {p.loading ? <p role="status" className={styles.empty}>Loading your tracker...</p> : p.error ? <div role="alert" className={styles.error}>{p.error}<button type="button" onClick={p.onRetry}>Retry</button></div> : <>
      <section className={styles.stats} aria-label="Application overview">
        <div><span>YOUR APPLICATIONS</span><strong>{p.programs.length.toString().padStart(2, '0')}</strong><p>One workspace for every choice</p></div>
        <div><span>IN PROGRESS</span><strong>{activeCount.toString().padStart(2, '0')}</strong><p>Applied or preparing for interview</p></div>
        <div><span>OFFERS RECEIVED</span><strong>{count('Accepted').toString().padStart(2, '0')}</strong><p>Applications marked accepted</p></div>
        <div><span>CORE DOCUMENTS</span><strong>{core.complete}<small>/{core.total}</small></strong><Progress {...core} label="Core document progress" /><p>Your preparation, across applications</p></div>
      </section>
      <div className={styles.attention}><div><span className={styles.signal} aria-hidden="true" /><p><strong>{actionCount ? `${actionCount} ${actionCount === 1 ? 'application needs' : 'applications need'} deadline attention` : 'Make your next move count.'}</strong><span>{actionCount ? 'Shortlisted applications with a deadline within 30 days or already passed. Confirm dates with each university.' : 'Add deadlines in My Shortlist to bring your next application into focus.'}</span></p></div>{actionCount > 0 ? <button type="button" aria-pressed={attentionOnly} onClick={() => { setAttentionOnly(value => !value); setStatus('all'); setDegree('all'); setQuery(''); }}> {attentionOnly ? 'Show all applications' : 'Review deadlines'} ↗</button> : <Link href="/dashboard/my-shortlist">Update deadlines ↗</Link>}</div>
      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <section className={styles.panel} aria-label="Mandatory Documents Checklist"><div className={styles.sectionHeading}><FaFileAlt aria-hidden="true" /><h2>Core documents</h2></div><p className={styles.caption}>Your shared preparation checklist. Requirements vary by program and applicant.</p>
            <div className={styles.progressLabel}><span>Preparation progress</span><strong>{core.percent}%</strong></div><Progress {...core} label="Shared preparation progress" />
            <fieldset disabled={p.saving}><ul className={styles.coreList}>{allCore.map((doc, index) => { const Icon = icons[index] ?? FaFileAlt; return <li key={doc}><Icon aria-hidden="true" /><label><input type="checkbox" checked={p.mandatoryStatus[doc] === true} onChange={() => p.onToggleCore(doc)} aria-label={`Mark ${doc} as complete`} />{doc}</label>{p.customMandatoryDocs.includes(doc) && !coreDocuments.includes(doc) && <button type="button" aria-label={`Remove ${doc}`} onClick={() => { if (window.confirm(`Remove ${doc} from your core checklist?`)) p.onRemoveCore(doc); }}>×</button>}</li>; })}</ul>
              <form className={styles.addForm} onSubmit={event => { event.preventDefault(); addDocument(true); }}><input aria-label="New core document" placeholder="Add document..." maxLength={64} value={p.newMandatoryDoc} onChange={event => p.onNewMandatoryDoc(event.target.value)} /><button type="submit">Add</button></form>
            </fieldset><Link className={styles.libraryLink} href="/dashboard/your-documents">Open Your Documents ↗</Link><p className={styles.footnote}>Checking a box does not upload or verify a file.</p>
          </section>
          <section className={styles.panel}><h2>Application documents</h2><p className={styles.caption}>These checks appear on each application. Mark a check ready only when it applies to that program.</p><fieldset disabled={p.saving}><div className={styles.docTags}>{allDocs.map(doc => <span key={doc}>{doc}{p.customDocs.includes(doc) && !applicationDocuments.includes(doc) && <button type="button" aria-label={`Delete ${doc}`} onClick={() => { if (window.confirm(`Remove ${doc} and its completion marks from every application?`)) p.onRemoveDoc(doc); }}>×</button>}</span>)}</div><form className={styles.addForm} onSubmit={event => { event.preventDefault(); addDocument(false); }}><input aria-label="New application document" placeholder="Add doc..." maxLength={64} value={p.newDoc} onChange={event => p.onNewDoc(event.target.value)} /><button type="submit" aria-label="Add doc">Add</button></form></fieldset>{docError && <p role="alert" className={styles.caption}>{docError}</p>}</section>
          <div className={`${styles.savePanel} ${p.dirty ? styles.unsaved : ''}`}><div><span className={styles.signal} aria-hidden="true" /><p role="status">{p.saveMessage ?? (p.dirty ? 'Unsaved checklist changes' : 'Checklist loaded')}</p></div><button type="button" className="ga-primary" disabled={!p.dirty || p.saving || p.statusBusy !== null} onClick={p.onSave}>{p.saving ? 'Saving…' : 'Save checklist'}</button><p>Status changes save immediately. Save your checklist separately.</p></div>
        </aside>
        <section className={styles.applications} aria-label="Applications">
          <div className={styles.sectionHeader}><div><p className={styles.eyebrow}>FROM POSSIBILITY TO PROGRESS</p><h2>Your applications <span>{p.programs.length}</span></h2></div><button type="button" className={styles.secondary} onClick={exportCsv} disabled={!visible.length}>Export CSV ↓</button></div>
          <div className={styles.filters}><label className={styles.search}>Find an application<input type="search" value={query} onChange={event => setQuery(event.target.value)} maxLength={120} placeholder="Search university, program or notes" /></label><label>Sort by<select value={sort} onChange={event => setSort(event.target.value)}><option value="deadline">Upcoming deadline</option><option value="recent">Recently added</option><option value="university">University A–Z</option><option value="readiness">Least document progress</option></select></label></div>
          <div className={styles.degreeFilters} aria-label="Filter by degree">{[['all','All'],['bachelor','Bachelor’s'],['master','Master’s'],...(unknown ? [['unknown','Not specified']] : [])].map(([value,label]) => <button type="button" key={value} aria-pressed={degree === value} onClick={() => setDegree(value)}>{label}</button>)}</div>
          <div className={styles.statusFilters} aria-label="Filter by application status"><button type="button" aria-pressed={status === 'all'} onClick={() => setStatus('all')}>All statuses</button>{statuses.map(value => <button type="button" key={value} aria-pressed={status === value} onClick={() => setStatus(value)}>{value}<span>{count(value)}</span></button>)}</div>
          {unknown > 0 && <p className={styles.caption}>{unknown} saved program(s) have an unknown degree level and appear under All.</p>}
          <div className={styles.viewBar}><p>{visible.length} of {p.programs.length} applications{filtersActive && <button type="button" onClick={clear}>Clear filters</button>}</p><div className={styles.viewSwitch} aria-label="Application view">{[['cards','Cards'],['board','Status board'],['matrix','Document matrix']].map(([value,label]) => <button type="button" key={value} aria-pressed={view === value} onClick={() => setView(value as typeof view)}>{label}</button>)}</div></div>
          {p.statusMessage && <p role="status" className={styles.statusMessage}>{p.statusMessage}</p>}
          {!p.programs.length ? <div className={styles.empty}><FaFileAlt aria-hidden="true" /><h3>No applications to track yet.</h3><p>Save a catalogue program or add a university of your own. It will appear here automatically.</p><Link className={styles.primaryLink} href="/dashboard/my-shortlist">Add your first application ↗</Link></div> : !visible.length ? <div className={styles.empty}><h3>No applications match these filters.</h3><button type="button" onClick={clear}>Show all applications</button></div> : view === 'cards' ? <div className={styles.cards}>{visible.map(card)}</div> : view === 'board' ? <div className={styles.board} role="region" aria-label="Application status board" tabIndex={0}>{statuses.map(value => <section key={value} className={styles.column} aria-label={`${value} applications`}><header><span className={styles.signal} aria-hidden="true" /><h3>{value}</h3><span>{visible.filter(item => normalizeApplicationStatus(item.status) === value).length}</span></header>{visible.filter(item => normalizeApplicationStatus(item.status) === value).map(card)}{!visible.some(item => normalizeApplicationStatus(item.status) === value) && <p className={styles.columnEmpty}>No applications here yet.</p>}</section>)}</div> : <div className={styles.tableViewport} role="region" aria-label="University document tracker" tabIndex={0}><table className={styles.table}><caption>Application document comparison — checks track preparation, not uploaded or verified files.</caption><thead><tr><th scope="col">Documents</th>{visible.map(item => <th key={item.id} scope="col"><h3>{item.university_name}</h3><p>{item.course_name}</p>{statusControl(item)}</th>)}</tr></thead><tbody>{allDocs.map(doc => <tr key={doc}><th scope="row">{doc}</th>{visible.map(item => <td key={item.id}>{docToggle(item, doc)}</td>)}</tr>)}</tbody></table></div>}
        </section>
      </div>
    </>}
  </main>;
}
