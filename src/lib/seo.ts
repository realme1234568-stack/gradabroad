import type { Metadata } from 'next';
import { admissionBands, type ProgramDetails } from '@/lib/programDetails';
export const siteUrl = 'https://www.gradabroad.online';
export const siteDescription = 'Explore English-taught degrees at public universities in Germany. Compare program details and organize your shortlist, applications and study plans.';
export const noIndex: Metadata['robots'] = { index: false, follow: false };
export function publicMetadata(title: string, description: string, path: string): Metadata {
  const url = new URL(path, siteUrl).href;
  return { title, description, alternates: { canonical: url }, openGraph: { type: 'website', siteName: 'GradAbroad', title, description, url,
    images: [{ url: `${siteUrl}/brand/gradabroad-social-card.png`, width: 1200, height: 630, alt: 'GradAbroad — plan your studies in Germany' }] },
    twitter: { card: 'summary_large_image', title, description, images: [`${siteUrl}/brand/gradabroad-social-card.png`] } };
}
export type CatalogueFilters = { level: 'master' | 'bachelor'; page: number; query: string; band: string };
export type SearchValues = Record<string, string | string[] | undefined>;
export function catalogueFilters(values: SearchValues): CatalogueFilters {
  const one = (key: string) => typeof values[key] === 'string' ? values[key] as string : '';
  const page = one('page');
  return { level: one('level') === 'bachelor' ? 'bachelor' : 'master',
    page: /^\d{1,5}$/.test(page) && Number(page) >= 1 && Number(page) <= 10001 ? Number(page) : 1,
    query: one('q').trim().slice(0, 120), band: Object.hasOwn(admissionBands, one('band')) ? one('band') : 'all' };
}
export function cataloguePath(filters: CatalogueFilters): string {
  const query = new URLSearchParams();
  if (filters.level === 'bachelor') query.set('level', 'bachelor');
  if (filters.page > 1) query.set('page', String(filters.page));
  if (filters.query) query.set('q', filters.query);
  if (filters.band !== 'all') query.set('band', filters.band);
  return '/browse-programs' + (query.size ? '?' + query.toString() : '');
}
export function programDescription(program: {course_name: string; university_name: string; details: ProgramDetails}) {
  const lead = `${program.course_name} at ${program.university_name}, Germany. Taught in English.`;
  return `${lead} Review admission requirements, intakes, tuition and application sources.`;
}
export function jsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, '\\u003c'); }
