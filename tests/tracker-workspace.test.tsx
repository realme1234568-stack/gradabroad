import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import TrackerWorkspace from '@/app/dashboard/my-tracker/TrackerWorkspace';
import { documentProgress, needsDeadlineAction, trackerCsv } from '@/lib/trackerWorkspace';
import type { ShortlistItem } from '@/lib/shortlist';
import type { ComponentProps } from 'react';
const rows: ShortlistItem[] = [
 {id:'a',university_name:'Berlin University',course_name:'M.Sc. Data',program_level:'master',status:'Shortlisted',deadline:'2026-11-02',note:'Check language requirements',official_url:'https://example.edu/apply'},
 {id:'b',university_name:'Munich University',course_name:'B.Sc. Physics',program_level:'bachelor',status:'Admit',deadline:'2026-09-01',official_url:'javascript:alert(1)'},
 {id:'c',university_name:'Bonn University',course_name:'Unclassified program',status:'Waitlisted'},
];
function props(): ComponentProps<typeof TrackerWorkspace> { return {programs:rows,loading:false,error:null,saving:false,statusBusy:null,statusMessage:null,saveMessage:null,dirty:false,docStatus:{a:{GMAT:true}},customDocs:[],newDoc:'',mandatoryStatus:{Passport:true},customMandatoryDocs:[],newMandatoryDoc:'',onRetry:vi.fn(),onSave:vi.fn(),onStatus:vi.fn(),onNewDoc:vi.fn(),onNewMandatoryDoc:vi.fn(),onToggleCore:vi.fn(),onToggleDoc:vi.fn(),onAddCore:vi.fn(),onAddDoc:vi.fn(),onRemoveCore:vi.fn(),onRemoveDoc:vi.fn()}; }
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();});
test('readiness counts only current checklist labels and valid true completion values',()=>{
 expect(documentProgress(['GMAT','SOP'],{GMAT:true,deleted:true,SOP:false})).toEqual({complete:1,total:2,percent:50});
 expect(documentProgress([],{})).toEqual({complete:0,total:0,percent:0});
});
test('deadline attention excludes finished/submitted programs and preserves unknown dates',()=>{
 const now=new Date(2026,9,24);
 expect(needsDeadlineAction(rows[0],now)).toBe(true);expect(needsDeadlineAction(rows[1],now)).toBe(false);
 expect(needsDeadlineAction({...rows[0],deadline:'2026-10-01'},now)).toBe(true);
 expect(needsDeadlineAction({...rows[0],deadline:'See website'},now)).toBe(false);
 expect(needsDeadlineAction({...rows[0],status:'Applied'},now)).toBe(false);
});
test('cards show saved details and legacy statuses; filters combine and can reset',()=>{
 render(<TrackerWorkspace {...props()}/>);
 const card=screen.getByRole('article',{name:'M.Sc. Data at Berlin University'});
 expect(within(card).getByText('Check language requirements')).toBeTruthy();expect(within(card).getByRole('link',{name:'Program website ↗'}).getAttribute('rel')).toBe('noopener noreferrer');
 expect(screen.getAllByRole('link',{name:'Program website ↗'})).toHaveLength(1);
 expect((screen.getByRole('combobox',{name:'Application status for B.Sc. Physics at Munich University'}) as HTMLSelectElement).value).toBe('Accepted');
 fireEvent.change(screen.getByLabelText('Find an application'),{target:{value:'language'}});expect(screen.getAllByRole('article')).toHaveLength(1);
 fireEvent.click(screen.getByRole('button',{name:'Clear filters'}));fireEvent.click(screen.getByRole('button',{name:'Bachelor’s'}));expect(screen.getAllByRole('article')).toHaveLength(1);
 fireEvent.click(screen.getByRole('button',{name:'Clear filters'}));expect(screen.getAllByRole('article')).toHaveLength(3);
});
test('board and matrix retain unknown status entries and checklist controls without marking edits',()=>{
 const p=props();render(<TrackerWorkspace {...p}/>);
 fireEvent.click(screen.getByRole('button',{name:'Status board'}));expect(screen.getByRole('region',{name:'Waitlisted applications'})).toBeTruthy();
 expect(screen.getAllByRole('article')).toHaveLength(3);expect(p.onToggleDoc).not.toHaveBeenCalled();expect(p.onSave).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Document matrix'}));expect(screen.getByRole('table')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Toggle GMAT for Berlin University'}));expect(p.onToggleDoc).toHaveBeenCalledWith('a','GMAT');
});
test('review deadlines selects only actionable programs and clears conflicting filters',()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date(2026,9,24));render(<TrackerWorkspace {...props()}/>);
 fireEvent.change(screen.getByLabelText('Find an application'),{target:{value:'Munich'}});fireEvent.click(screen.getByRole('button',{name:'Review deadlines ↗'}));
 expect(screen.getAllByRole('article')).toHaveLength(1);expect(screen.getByText('M.Sc. Data')).toBeTruthy();
});
test('duplicate checklist names are rejected without changing the checklist',()=>{
 const p=props();p.newDoc='gmat';render(<TrackerWorkspace {...p}/>);fireEvent.submit(screen.getByLabelText('New application document').closest('form')!);
 expect(screen.getByRole('alert').textContent).toContain('already');expect(p.onAddDoc).not.toHaveBeenCalled();
});
test('CSV preserves multiline notes, quotes values, normalizes statuses and neutralizes formulas',()=>{
 const csv=trackerCsv([{...rows[1],university_name:'=WEBSERVICE("https://bad")',note:'line one\nline "two"'},{...rows[0],course_name:'\t=1+1'}],['GMAT'],{a:{GMAT:true}});
 expect(csv).toContain('"\'=WEBSERVICE(""https://bad"")"');expect(csv).toContain('"\'\t=1+1"');expect(csv).toContain('"Accepted"');expect(csv).toContain('line one\nline ""two""');expect(csv.startsWith('\uFEFF')).toBe(true);
});
