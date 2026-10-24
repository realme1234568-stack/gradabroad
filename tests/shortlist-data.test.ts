import { expect, test } from 'vitest';
import { deadlineDays, deadlineLabel, emptyShortlistDraft, programWebsite, validateShortlistDraft } from '@/lib/shortlist';
const draft = { ...emptyShortlistDraft, university_name:'  Example University  ', course_name:'M.Sc. Economics', program_level:'master' };
test('custom entries require names and a degree; links cannot execute scripts or contain credentials', () => {
  expect(validateShortlistDraft(draft)).toMatchObject({university_name:'Example University',course_name:'M.Sc. Economics',program_level:'master',deadline:null,note:'',official_url:null,status:'Shortlisted'});
  for (const change of [{university_name:' '},{course_name:' '},{program_level:''},{official_url:'javascript:alert(1)'},{official_url:'https://user:password@example.com/'},{deadline:'2026-02-30'}])
    expect(()=>validateShortlistDraft({...draft,...change})).toThrow();
  for(const url of ['javascript:alert(1)','data:text/html,<script>','//example.com','file:///etc/passwd','https://example.com\n/path','https://name@example.com']) expect(programWebsite(url)).toBeNull();
  expect(programWebsite(' https://example.com/course?q=abc#apply ')).toBe('https://example.com/course?q=abc#apply');
});
test('deadline badges use calendar dates and do not roll invalid dates forward', () => {
  const today = new Date(2026,9,24,23,30);
  expect(deadlineDays('2026-10-24',today)).toBe(0);
  expect(deadlineDays('2026-10-25',today)).toBe(1);
  expect(deadlineDays('2026-10-23',today)).toBe(-1);
  expect(deadlineDays('2026-02-30',today)).toBeNull();
  expect(deadlineDays('winter intake',today)).toBeNull();
  expect(deadlineLabel('2026-10-24',today)).toContain('Due today');
  expect(deadlineLabel('2026-10-23',today)).toContain('Deadline passed');
});
test('editing old entries keeps unknown status, free-text deadlines and long notes intact', () => {
  const previous={id:'old',university_name:'Old University',course_name:'Old Program',status:'Waitlisted',deadline:'15 May — verify year',note:'x'.repeat(4100)};
  const result=validateShortlistDraft({...draft,university_name:previous.university_name,course_name:previous.course_name,program_level:'',status:'Waitlisted',deadline:previous.deadline,note:previous.note},previous);
  expect(result).not.toHaveProperty('status');
  expect(result).not.toHaveProperty('university_name');
  expect(result.deadline).toBe(previous.deadline);
  expect(result.note).toBe(previous.note);
  expect(validateShortlistDraft({...draft,status:'Accepted'},{...previous,status:'Admit'})).not.toHaveProperty('status');
});
