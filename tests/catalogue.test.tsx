import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { emptyDetails } from '@/lib/programDetails';
const db = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ rpc: db.rpc }) }));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND'); } }));
vi.mock('@/components/ProgramList', () => ({ default: ({ programs }: { programs: { id: string; course_name: string }[] }) => <div>{programs.map(p => <a key={p.id} href={`/programs/${p.id}`}>{p.course_name}</a>)}</div> }));
import Browse from '@/app/browse-programs/page';
const details = { ...emptyDetails, english_taught: true, official_url: 'https://example.edu/course', teaching_notes: 'English throughout', reviewed_on: '2026-01-01' };
const row = (level: string, course = `${level} Course`) => ({ id: '00000000-0000-0000-0000-000000000001', university_name: 'Example University', course_name: course, level, language: 'English', details });
beforeEach(() => { db.rpc.mockReset().mockImplementation(async (_name, params) => ({ data: { items: [row(params.p_level)], total: 25, page: params.p_page }, error: null })); });
afterEach(cleanup);
test('catalogue sends normalized URL filters to the database and renders crawlable pagination links', async () => {
 render(await Browse({searchParams:Promise.resolve({level:'bachelor',page:'2',q:'  Aachen  ',band:'open'})}));
 expect(db.rpc).toHaveBeenLastCalledWith('search_english_programs',{p_level:'bachelor',p_page:1,p_query:'Aachen',p_band:'open'});
 expect(screen.getByRole('link',{name:'Previous'}).getAttribute('href')).toBe('/browse-programs?level=bachelor&q=Aachen&band=open');
 expect(screen.getByRole('link',{name:'Masters'}).getAttribute('href')).toBe('/browse-programs?q=Aachen&band=open');
 const search=screen.getByRole('searchbox') as HTMLInputElement;
 expect(search.value).toBe('Aachen');expect(search.closest('form')?.getAttribute('method')).toBe('get');expect(search.closest('form')?.querySelector('[name="page"]')).toBeNull();
 expect(screen.getByRole('link',{name:'Clear filters'}).getAttribute('href')).toBe('/browse-programs?level=bachelor');
 expect(screen.getByRole('link',{name:'bachelor Course'})).toBeTruthy();
});
test('unfiltered first page links to the next page and the bachelor catalogue without requiring JavaScript',async()=>{
 render(await Browse({searchParams:Promise.resolve({})}));
 expect(screen.getByRole('link',{name:'Next'}).getAttribute('href')).toBe('/browse-programs?page=2');
 expect(screen.getByRole('link',{name:'Bachelors'}).getAttribute('href')).toBe('/browse-programs?level=bachelor');
 expect(screen.queryByRole('link',{name:'Previous'})).toBeNull();
 expect(screen.getByRole('link',{name:'Add your university or program in My Shortlist'}).getAttribute('href')).toBe('/dashboard/my-shortlist');
});
test('failed queries throw for the error boundary rather than serving an empty successful catalogue',async()=>{
 db.rpc.mockResolvedValueOnce({data:null,error:new Error('offline')});
 await expect(Browse({searchParams:Promise.resolve({})})).rejects.toThrow('temporarily unavailable');
});
test.each([{...row('master'),language:'German'},{...row('master'),details:{...details,english_taught:false}},{...row('master'),details:null},row('bachelor')])('rejects malformed or out-of-scope catalogue responses',async bad=>{
 db.rpc.mockResolvedValue({data:{items:[bad],total:1,page:0},error:null});
 await expect(Browse({searchParams:Promise.resolve({})})).rejects.toThrow('temporarily unavailable');
});
test('pagination beyond the available range returns not found',async()=>{
 await expect(Browse({searchParams:Promise.resolve({page:'3'})})).rejects.toThrow('NOT_FOUND');
});
