import { beforeEach, expect, test, vi } from 'vitest';
import { emptyDetails } from '@/lib/programDetails';
const db=vi.hoisted(()=>({rows:[] as Record<string,unknown>[],error:false,filters:[] as [string,unknown][],key:'',options:{} as Record<string,unknown>}));
vi.mock('server-only',()=>({}));
vi.mock('@/components/ProgramList',()=>({default:()=>null}));
vi.mock('@/components/ProgramDetailsView',()=>({default:()=>null}));
vi.mock('@supabase/supabase-js',()=>({createClient:(_url:string,key:string,options:Record<string,unknown>)=>{
 db.key=key;db.options=options;return{rpc:async(_name:string,params:{p_page:number})=>({data:{items:[],total:25,page:params.p_page},error:db.error?new Error('Unavailable'):null}),from:(table:string)=>{
 if(table!=='programs')throw new Error('Only public catalogue may be queried');
 const filters:[string,unknown][]=[];const get=()=>({data:db.rows.filter(row=>filters.every(([key,value])=>row[key]===value)),error:db.error?new Error('Unavailable'):null});
 const chain={select:()=>chain,eq:(key:string,value:unknown)=>{filters.push([key,value]);db.filters.push([key,value]);return chain;},order:()=>chain,
 range:async(start:number,end:number)=>{const result=get();return{...result,data:result.data.slice(start,end+1)};},maybeSingle:async()=>{const result=get();return{...result,data:result.data[0]??null};}};
 return chain;
 }};
}}));
import { getPublicProgram, sitemapPrograms } from '@/lib/publicCatalogue';
import sitemap, { sitemapXml } from '@/lib/sitemap';
import { generateMetadata as programMetadata } from '@/app/programs/[id]/page';
import { generateMetadata as browseMetadata } from '@/app/browse-programs/page';
const details={...emptyDetails,english_taught:true,official_url:'https://example.edu/program',reviewed_on:'2026-10-01',teaching_notes:'Entirely in English'};
const row={id:'00000000-0000-0000-0000-000000000001',university_name:'Public University',course_name:'M.Sc. Economics',level:'master',language:'English',details,is_published:true};
beforeEach(()=>{db.rows=[{...row}];db.error=false;db.filters=[];vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://public.example');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','public-anon-only');});
test('program metadata is specific, self-canonical and includes social sharing information',async()=>{
 const meta=await programMetadata({params:Promise.resolve({id:row.id})});expect(meta.title).toBe('M.Sc. Economics — Public University | GradAbroad');expect(meta.description).toContain('Taught in English');expect(meta.alternates?.canonical).toBe(`https://www.gradabroad.online/programs/${row.id}`);expect(meta.openGraph).toHaveProperty('url',`https://www.gradabroad.online/programs/${row.id}`);
 expect(db.key).toBe('public-anon-only');expect(db.options).toHaveProperty('auth.persistSession',false);
});
test('unpublished and non-English programs are excluded from details and sitemap reads',async()=>{
 db.rows=[{...row,is_published:false},{...row,id:'00000000-0000-0000-0000-000000000002',language:'German'}];
 expect(await getPublicProgram(row.id)).toBeNull();expect(await sitemapPrograms()).toHaveLength(0);
 expect((await programMetadata({params:Promise.resolve({id:row.id})})).robots).toEqual({index:false,follow:false});
});
test('sitemap contains public program and catalogue URLs, without any private account data',async()=>{
 const result=await sitemap();expect(result).toContainEqual({url:`https://www.gradabroad.online/programs/${row.id}`});expect(result).toContainEqual({url:'https://www.gradabroad.online/browse-programs?level=bachelor'});
 expect(result.every(item=>!item.url.match(/dashboard|auth|settings|my-profile|admin|api\/|legal\/accept/))).toBe(true);
 expect(result.every(item=>item.lastModified===undefined)).toBe(true);
});
test('sitemap validates program details and reads beyond the API thousand-row limit',async()=>{
 db.rows=Array.from({length:1001},(_,i)=>({...row,id:`00000000-0000-0000-0000-${String(i).padStart(12,'0')}`}));
 db.rows.push({...row,id:'00000000-0000-0000-0000-999999999999',details:{...details,english_taught:false}});
 expect(await sitemapPrograms()).toHaveLength(1001);
});
test('a database outage fails sitemap generation instead of publishing a successful empty sitemap',async()=>{
 db.error=true;await expect(sitemap()).rejects.toThrow('temporarily unavailable');await expect(getPublicProgram(row.id)).rejects.toThrow('temporarily unavailable');
});
test('filtered search results are noindex while unfiltered pagination keeps its own canonical',async()=>{
 const meta=await browseMetadata({searchParams:Promise.resolve({page:'2',level:'bachelor'})});expect(meta.alternates?.canonical).toBe('https://www.gradabroad.online/browse-programs?level=bachelor&page=2');expect(meta.robots).toBeUndefined();
 const filtered=await browseMetadata({searchParams:Promise.resolve({q:'science'})});expect(filtered.robots).toEqual({index:false,follow:true});
});

test('sitemap XML escapes query separators and remains valid XML',async()=>{
 const xml=sitemapXml([{url:'https://www.gradabroad.online/browse-programs?level=bachelor&page=2'}]);
 expect(xml).toContain('level=bachelor&amp;page=2');
 const parsed=new DOMParser().parseFromString(xml,'application/xml');expect(parsed.querySelector('parsererror')).toBeNull();
 expect(parsed.querySelector('loc')?.textContent).toBe('https://www.gradabroad.online/browse-programs?level=bachelor&page=2');
});

test('temporary database errors do not turn failure messages into indexable program pages',async()=>{
 db.error=true;
 expect((await programMetadata({params:Promise.resolve({id:row.id})})).robots).toEqual({index:false,follow:false});
 expect((await browseMetadata({searchParams:Promise.resolve({})})).robots).toEqual({index:false,follow:false});
});
