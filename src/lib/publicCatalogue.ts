import 'server-only';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { catalogueReady, type ProgramDetails } from '@/lib/programDetails';
import { normalizeProgramLevel } from '@/lib/programLevel';
import type { CatalogueFilters } from '@/lib/seo';
export type PublicProgram = { id: string; university_name: string; course_name: string; level: 'bachelor' | 'master'; language: 'English'; details: ProgramDetails };
export function publicCatalogueClient() {
  // Public catalogue reads must never inherit account cookies or use a service-role key.
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(12000), next: { revalidate: 300, tags: ['public-catalogue'] } }) },
  });
}
export function validPublicProgram(value: unknown): value is PublicProgram {
  if (!value || typeof value !== 'object') return false;
  const p = value as PublicProgram;
  return typeof p.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.id)
    && typeof p.university_name === 'string' && typeof p.course_name === 'string' && ['bachelor', 'master'].includes(p.level)
    && p.language === 'English' && catalogueReady(p.details);
}
export const getCatalogue = cache(async (level: CatalogueFilters['level'], query: string, band: string, page: number): Promise<{ items: PublicProgram[]; total: number; page: number }> => {
  const { data, error } = await publicCatalogueClient().rpc('search_english_programs', { p_level: level, p_query: query, p_band: band, p_page: page - 1 });
  if (error || !data || !Array.isArray(data.items) || data.items.length > 24 || !Number.isSafeInteger(data.total) || data.total < data.items.length || data.page !== page - 1
    || !data.items.every((p: unknown) => validPublicProgram(p) && p.level === level)) throw new Error('The public catalogue is temporarily unavailable.');
  return data;
});
export const getPublicProgram = cache(async (id: string): Promise<PublicProgram | null> => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const { data, error } = await publicCatalogueClient().from('programs').select('id,university_name,course_name,level,language,details')
    .eq('id', id).eq('is_published', true).eq('language', 'English').maybeSingle();
  if (error) throw new Error('This program is temporarily unavailable.');
  if (!data) return null;
  const program = { ...data, level: normalizeProgramLevel(data.level) };
  return validPublicProgram(program) ? program : null;
});
export async function sitemapPrograms(): Promise<PublicProgram[]> {
  const db = publicCatalogueClient(), items: PublicProgram[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.from('programs').select('id,university_name,course_name,level,language,details')
      .eq('is_published', true).eq('language', 'English').order('id').range(offset, offset + 999);
    if (error || !Array.isArray(data)) throw new Error('The public sitemap is temporarily unavailable.');
    for (const row of data) { const p = { ...row, level: normalizeProgramLevel(row.level) }; if (validPublicProgram(p)) items.push(p); }
    if (data.length < 1000) break;
  }
  return items;
}
