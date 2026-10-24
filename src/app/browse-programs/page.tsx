import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProgramList from '@/components/ProgramList';
import ProgramResearchNote from '@/components/ProgramResearchNote';
import { admissionBands } from '@/lib/programDetails';
import { getCatalogue } from '@/lib/publicCatalogue';
import { catalogueFilters, cataloguePath, noIndex, publicMetadata, type SearchValues } from '@/lib/seo';

type Props = { searchParams: Promise<SearchValues> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const filters = catalogueFilters(await searchParams);
  let empty = false;
  try { empty = (await getCatalogue(filters.level, filters.query, filters.band, filters.page)).total === 0; }
  catch { return { title: 'Programs temporarily unavailable | GradAbroad', robots: noIndex }; }
  const title = `English-Taught ${filters.level === 'master' ? 'Master’s' : 'Bachelor’s'} Programs in Germany${filters.page > 1 ? ` — Page ${filters.page}` : ''} | GradAbroad`;
  return { ...publicMetadata(title, 'Explore English-taught degrees at public German universities. Compare requirements, intakes, tuition and official application sources.', cataloguePath(filters)),
    ...(empty || filters.query || filters.band !== 'all' ? { robots: { index: false, follow: true } } : {}) };
}
export default async function BrowseProgramsPage({ searchParams }: Props) {
  const filters = catalogueFilters(await searchParams);
  const { level, page, query, band } = filters;
  const { items, total } = await getCatalogue(level, query, band, page);
  const pages = Math.max(1, Math.ceil(total / 24));
  if (page > pages) notFound();
  return <div className="app-page mx-auto w-full max-w-6xl px-6 py-12">
    <p className="page-eyebrow">FIND YOUR DIRECTION</p><h1>Browse Programs</h1>
    <p>English-taught degrees at public universities across Germany. Compare published requirements, intakes and costs, then build your shortlist.</p>
    <p className="mt-6 rounded-xl border border-line bg-surface px-5 py-4 text-sm leading-7 text-ink"><strong>Can’t find your dream university? Add it manually <Link href="/dashboard/my-shortlist" className="text-accent-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4" aria-label="Add your university or program in My Shortlist">here</Link>.</strong></p>
    <nav className="degree-tabs" aria-label="Program degree">{([['bachelor','Bachelors'],['master','Masters']] as const).map(([value,label]) => <Link key={value} href={cataloguePath({ ...filters, level: value, page: 1 })} aria-current={level === value ? 'page' : undefined}
      className={`inline-flex items-center rounded-full border-2 px-5 py-3 text-sm font-semibold transition-colors ${level === value ? 'border-accent-ink bg-accent-soft text-accent-ink' : 'border-line bg-surface text-ink'}`}>{label}</Link>)}</nav>
    <form key={cataloguePath(filters)} action="/browse-programs" method="get" className="my-8 flex flex-wrap items-end gap-4 rounded-xl border border-line bg-surface p-5">
      {level === 'bachelor' && <input type="hidden" name="level" value="bachelor" />}
      <label className="w-full min-w-0 text-xs text-muted sm:flex-1">University or program<input name="q" defaultValue={query} className="mt-2 block w-full rounded-lg border border-line bg-background px-3 py-3 text-sm text-ink" type="search" maxLength={120} placeholder="Search Germany’s public programs" /></label>
      <label className="w-full text-xs text-muted sm:w-auto">Admission requirements<select name="band" defaultValue={band} className="mt-2 block w-full max-w-full rounded-lg border border-line bg-background px-3 py-3 text-sm text-ink"><option value="all">All planning groups</option>{Object.entries(admissionBands).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <button type="submit" className="ga-primary rounded-lg px-5 py-3 text-sm">Search</button>
      {(query || band !== 'all') && <Link href={cataloguePath({ ...filters, page: 1, query: '', band: 'all' })} className="px-3 py-3 text-sm underline">Clear filters</Link>}
    </form>
    <p className="mb-6 text-xs leading-6 text-muted">Planning groups describe entry requirements, not acceptance chances or university rankings. Open admission still requires all stated qualifications. Check each program’s sources and review date.</p>
    {items.length ? <><ProgramList key={cataloguePath(filters)} programs={items} /><nav aria-label="Catalogue pagination" className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-muted"><span>{total} {total === 1 ? 'program' : 'programs'} · Page {page} of {pages}</span><div className="flex flex-wrap gap-3">
      {page > 1 && <Link rel="prev" className="rounded border border-line px-4 py-2" href={cataloguePath({ ...filters, page: page - 1 })}>Previous</Link>}
      {Array.from({ length: pages }, (_, index) => index + 1).filter(value => value === 1 || value === pages || Math.abs(value - page) <= 1).map(value => <Link key={value} className={`rounded border border-line px-4 py-2 ${page === value ? 'bg-accent-soft text-accent-ink' : ''}`} aria-label={`Page ${value}`} aria-current={page === value ? 'page' : undefined} href={cataloguePath({ ...filters, page: value })}>{value}</Link>)}
      {page < pages && <Link rel="next" className="rounded border border-line px-4 py-2" href={cataloguePath({ ...filters, page: page + 1 })}>Next</Link>}
    </div></nav></> : <p className="rounded-xl border border-line bg-surface p-8 text-muted">No {level === 'master' ? 'Master’s' : 'Bachelor’s'} programs match these filters. <Link className="underline" href={cataloguePath({ ...filters, page: 1, query: '', band: 'all' })}>View all programs</Link></p>}
    <ProgramResearchNote />
  </div>;
}
