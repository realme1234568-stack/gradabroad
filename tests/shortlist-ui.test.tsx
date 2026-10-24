import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ShortlistItem } from '@/lib/shortlist';
const db=vi.hoisted(()=>({
 user:'user-a' as string|null, fail:false, empty:false, authFail:false, notify:vi.fn(), writes:[] as {table:string;operation:string;payload:Record<string,unknown>;filters:[string,unknown][]}[],
 rows:[] as (ShortlistItem & {user_id:string})[], authListener:undefined as undefined|((event:string,session:{user:{id:string}}|null)=>void), ranges:[] as number[],
}));
vi.mock('@/components/NotificationProvider',()=>({useNotifications:()=>({notify:db.notify})}));
vi.mock('@/lib/supabaseClient',()=>({supabase:{
 auth:{getUser:async()=>({data:{user:db.user?{id:db.user}:null},error:db.authFail?new Error('network'):null}),onAuthStateChange:(callback:typeof db.authListener)=>{db.authListener=callback;return{data:{subscription:{unsubscribe(){db.authListener=undefined;}}}};}},
 from(table:string){
  let operation='select',payload:Record<string,unknown>={};
  const filters:[string,unknown][]=[];
  const respond=async()=>{
   if(table==='tracker_preferences')return{data:null,error:null};
   if(operation==='select')return{data:structuredClone(db.rows.filter(row=>filters.every(([key,value])=>row[key as keyof typeof row]===value))),error:null};
   db.writes.push({table,operation,payload,filters});
   if(db.fail)return{data:null,error:{code:'failed'}};
   if(db.empty)return{data:null,error:null};
   if(operation==='insert'){
    const row={id:'custom-'+db.writes.length,created_at:new Date().toISOString(),...payload} as typeof db.rows[number];
    db.rows.push(row);return{data:row,error:null};
   }
   const found=db.rows.find(row=>filters.every(([key,value])=>row[key as keyof typeof row]===value));
   if(!found)return{data:null,error:null};
   if(operation==='update'){Object.assign(found,payload);return{data:{...found},error:null};}
   db.rows=db.rows.filter(row=>row!==found);return{data:[{id:found.id}],error:null};
  };
  const chain={select:()=>chain,eq:(key:string,value:unknown)=>{filters.push([key,value]);return chain;},order:()=>chain,
   range:async(start:number,end:number)=>{db.ranges.push(start);const result=await respond();return{...result,data:Array.isArray(result.data)?result.data.slice(start,end+1):result.data};},
   single:respond,maybeSingle:respond,then:(resolve:(v:unknown)=>unknown,reject:(e:unknown)=>unknown)=>respond().then(resolve,reject),
   insert:(value:Record<string,unknown>)=>{operation='insert';payload=value;return chain;},update:(value:Record<string,unknown>)=>{operation='update';payload=value;return chain;},delete:()=>{operation='delete';return chain;}};
  return chain;
 }
}}));
import Shortlist from '@/app/dashboard/my-shortlist/page';
import Tracker from '@/app/dashboard/my-tracker/page';
const row={id:'existing',user_id:'user-a',university_name:'Example University',course_name:'M.Sc. Economics',program_level:'master',status:'Shortlisted',note:'Existing note',deadline:null,entry_source:'saved' as const};
beforeEach(()=>{db.user='user-a';db.fail=false;db.empty=false;db.authFail=false;db.rows=[];db.writes=[];db.ranges=[];db.notify.mockReset();});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
async function openAdd(){fireEvent.click(await screen.findByRole('button',{name:'+ Add your own program'}));await screen.findByRole('heading',{name:'Add your own program'});}
function fillAdd(){
 fireEvent.change(screen.getByLabelText('University name'),{target:{value:'Personal University'}});
 fireEvent.change(screen.getByLabelText('Program name'),{target:{value:'M.Sc. Personal Program'}});
 fireEvent.change(screen.getByLabelText('Degree level'),{target:{value:'master'}});
}
function submit(){fireEvent.submit(screen.getByRole('button',{name:/Add to my shortlist|Save changes/}).closest('form')!);}
test('a custom entry persists privately, reloads, and is visible in the existing tracker',async()=>{
 const view=render(<Shortlist/>);await screen.findByText('No universities shortlisted yet.');await openAdd();fillAdd();
 fireEvent.change(screen.getByLabelText('Program website (optional)'),{target:{value:'https://example.edu/apply'}});
 fireEvent.change(screen.getByLabelText('Your notes'),{target:{value:'Check module requirements'}});submit();
 await screen.findByText('Program added. It is also available in your application tracker.');
 expect(db.writes).toHaveLength(1);expect(db.writes[0]).toMatchObject({table:'shortlists',operation:'insert',payload:{user_id:'user-a',entry_source:'manual',official_url:'https://example.edu/apply',note:'Check module requirements'}});
 expect(db.notify).toHaveBeenCalledWith('Personal University — M.Sc. Personal Program added to your shortlist.');
 expect(screen.getByRole('link',{name:'Program website ↗'}).getAttribute('rel')).toBe('noopener noreferrer');
 view.unmount();const reloaded=render(<Shortlist/>);await screen.findByText('M.Sc. Personal Program');expect(screen.getByText('Check module requirements')).toBeTruthy();
 reloaded.unmount();render(<Tracker/>);await screen.findByText('M.Sc. Personal Program');
});
test.each(['failure','empty'])('unconfirmed insertion (%s) keeps the draft and permits retry',async(mode)=>{
 render(<Shortlist/>);await screen.findByText('No universities shortlisted yet.');await openAdd();fillAdd();db.fail=mode==='failure';db.empty=mode==='empty';submit();
 await screen.findByText(/Could not save your program/);expect((screen.getByLabelText('Program name') as HTMLInputElement).value).toBe('M.Sc. Personal Program');expect(db.rows).toHaveLength(0);expect(db.notify).not.toHaveBeenCalled();
 db.fail=false;db.empty=false;submit();await screen.findByText('Program added. It is also available in your application tracker.');
});
test('case and whitespace duplicates are prevented without overwriting the saved entry',async()=>{
 db.rows=[{...row}];render(<Shortlist/>);await screen.findByText('M.Sc. Economics');await openAdd();fillAdd();
 fireEvent.change(screen.getByLabelText('University name'),{target:{value:' example  UNIVERSITY '}});fireEvent.change(screen.getByLabelText('Program name'),{target:{value:'m.sc. economics'}});submit();
 await screen.findByText(/already in your shortlist/);expect(db.writes).toHaveLength(0);
});
test('status, notes, link and deadline edits use the owner filter and survive reload',async()=>{
 db.rows=[{...row}];const view=render(<Shortlist/>);fireEvent.click(await screen.findByRole('button',{name:'Edit M.Sc. Economics at Example University'}));
 fireEvent.change(screen.getByLabelText('Application status'),{target:{value:'Interview'}});fireEvent.change(screen.getByLabelText('Application deadline'),{target:{value:'2026-12-01'}});fireEvent.change(screen.getByLabelText('Your notes'),{target:{value:'Interview preparation'}});submit();
 await screen.findByText('Program details saved.');expect(db.writes[0].filters).toEqual([['id','existing'],['user_id','user-a']]);expect(db.writes[0].payload).not.toHaveProperty('university_name');
 expect(db.notify).toHaveBeenCalledWith('Example University — M.Sc. Economics: status changed to Interview.');
 view.unmount();render(<Shortlist/>);await screen.findByText('Interview preparation');expect(within(screen.getByRole('article',{name:'M.Sc. Economics at Example University'})).getByText('Interview')).toBeTruthy();expect(screen.getByText(/1 Dec 2026/)).toBeTruthy();
});
test('signing out before save never sends a personal entry under a stale identity',async()=>{
 render(<Shortlist/>);await screen.findByText('No universities shortlisted yet.');await openAdd();fillAdd();db.user=null;submit();
 await screen.findByText(/Your sign-in changed/);expect(db.writes).toHaveLength(0);expect(screen.queryByLabelText('Your notes')).toBeNull();
});
test('transient session-check errors keep form edits for retry',async()=>{
 render(<Shortlist/>);await screen.findByText('No universities shortlisted yet.');await openAdd();fillAdd();db.authFail=true;submit();
 await screen.findByText(/Could not save your program/);expect(screen.getByLabelText('Program name')).toBeTruthy();expect(db.writes).toHaveLength(0);
});
test('account switching clears the previous account’s programs and open draft',async()=>{
 db.rows=[{...row},{...row,id:'b',user_id:'user-b',university_name:'Other University',course_name:'Other Program'}];render(<Shortlist/>);await screen.findByText('M.Sc. Economics');await openAdd();fillAdd();
 act(()=>{db.user='user-b';db.authListener?.('SIGNED_IN',{user:{id:'user-b'}});});
 await screen.findByText('Other Program');expect(screen.queryByText('M.Sc. Economics')).toBeNull();expect(screen.queryByLabelText('Your notes')).toBeNull();
});
test('search and status filters preserve legacy records and do not expose unsafe links',async()=>{
 db.rows=[{...row,status:'Admit',official_url:'javascript:alert(1)'},{...row,id:'other',university_name:'Second University',course_name:'Unclassified degree',program_level:null}];render(<Shortlist/>);await screen.findByText('Unclassified degree');
 expect(screen.queryByRole('link',{name:'Program website ↗'})).toBeNull();fireEvent.change(screen.getByLabelText('Status',{selector:'select'}),{target:{value:'Accepted'}});expect(screen.queryByText('Unclassified degree')).toBeNull();expect(screen.getByText('M.Sc. Economics')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Clear filters'}));fireEvent.change(screen.getByLabelText('Find a saved program'),{target:{value:'Unclassified'}});expect(screen.queryByText('M.Sc. Economics')).toBeNull();expect(screen.getByText('Unclassified degree')).toBeTruthy();
});
test('removal requires confirmation; a failed database deletion keeps the entry',async()=>{
 db.rows=[{...row}];render(<Shortlist/>);fireEvent.click(await screen.findByRole('button',{name:'Remove'}));expect(db.writes).toHaveLength(0);fireEvent.click(screen.getByRole('button',{name:'Keep program'}));expect(screen.queryByRole('button',{name:'Confirm removal'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Remove'}));db.fail=true;fireEvent.click(screen.getByRole('button',{name:'Confirm removal'}));await screen.findByText(/Could not remove this program/);expect(screen.getByText('M.Sc. Economics')).toBeTruthy();db.fail=false;fireEvent.click(screen.getByRole('button',{name:'Confirm removal'}));await screen.findByText('No universities shortlisted yet.');
});
test('save and cancel guard actual unsaved edits, and notes render as text',async()=>{
 db.rows=[{...row,note:'<img src=x onerror=alert(1)>'}];render(<Shortlist/>);await screen.findByText('M.Sc. Economics');expect(screen.queryByRole('img')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Edit M.Sc. Economics at Example University'}));expect((screen.getByRole('button',{name:'Save changes'}) as HTMLButtonElement).disabled).toBe(true);
 fireEvent.change(screen.getByLabelText('Your notes'),{target:{value:'Changed'}});const confirm=vi.spyOn(window,'confirm').mockReturnValue(false);fireEvent.click(screen.getByRole('button',{name:'Cancel'}));expect(confirm).toHaveBeenCalled();expect(screen.getByLabelText('Your notes')).toBeTruthy();
});
test('saved programs beyond the default thousand-row API limit remain visible',async()=>{
 db.rows=Array.from({length:1001},(_,i)=>({...row,id:String(i),course_name:'Program '+i}));render(<Shortlist/>);await screen.findByText('Program 1000');expect(db.ranges).toEqual([0,1000]);expect(within(screen.getByLabelText('Shortlist summary')).getByText('1001')).toBeTruthy();
},20000);
