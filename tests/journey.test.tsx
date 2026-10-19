import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { emptyJourney, isJourneyProgress, journeySteps, resolveJourney, reopenJourney, type JourneyProgress } from '@/lib/journey';
import { signInDestination } from '@/lib/signInDestination';
const db = vi.hoisted(() => ({ rows: new Map<string, unknown>(), failLoad: false, failSave: false, owner: 'one' }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: {
  auth: {
    getUser: async () => ({ data: { user: { id: db.owner } } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  },
  from: () => {
    let owner = ''; let kind = ''; let next: { user_id: string; kind: string; data: unknown };
    const chain = {
      select: () => chain,
      eq: (field: string, val: string) => { if (field === 'kind') kind = val; else owner = val; return chain; },
      maybeSingle: async () => ({ data: db.rows.has(`${owner}:${kind}`) ? { data: structuredClone(db.rows.get(`${owner}:${kind}`)) } : null, error: db.failLoad ? new Error('offline') : null }),
      upsert: (row: typeof next) => { next = row; return chain; },
      single: async () => {
        if (db.failSave) return { data: null, error: new Error('offline') };
        db.rows.set(`${next.user_id}:${next.kind}`, structuredClone(next.data));
        return { data: { kind: next.kind }, error: null };
      },
    };
    return chain;
  },
} }));
import JourneyPage from '@/app/dashboard/my-journey/page';

beforeEach(() => {
  db.rows.clear(); db.failLoad = false; db.failSave = false; db.owner = 'one';
  HTMLElement.prototype.scrollTo = vi.fn(); HTMLElement.prototype.scrollBy = vi.fn();
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});
afterEach(cleanup);
const at = '2026-10-19T12:00:00.000Z';
function prefix(count: number): JourneyProgress {
  return { version: 1, resolved: journeySteps.slice(0, count).map(step => ({ id: step.id, outcome: 'completed', at })) };
}
async function openCurrent(name = 'Passport') {
  await waitFor(() => expect((screen.getByRole('button', { name: `${name} — current milestone` }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: `${name} — current milestone` }));
  return await screen.findByRole('dialog');
}

test('progress validates ordered milestones and conditional skips', () => {
  expect(isJourneyProgress(emptyJourney)).toBe(true);
  expect(isJourneyProgress(prefix(journeySteps.length))).toBe(true);
  expect(isJourneyProgress({version: 2, resolved: []})).toBe(false);
  expect(isJourneyProgress({version: 1, resolved: [{id:'visa',outcome:'completed',at}]})).toBe(false);
  expect(isJourneyProgress({version: 1, resolved: [{id:'passport',outcome:'skipped',at}]})).toBe(false);
  expect(isJourneyProgress({version: 1, resolved: [{id:'passport',outcome:'completed',at:'invalid'}]})).toBe(false);
  expect(resolveJourney(emptyJourney, 1, 'completed', at)).toBeNull();
  expect(resolveJourney(emptyJourney, 0, 'skipped', at)).toBeNull();
  expect(resolveJourney(prefix(3), 3, 'skipped', at)?.resolved[3].outcome).toBe('skipped');
  expect(resolveJourney(prefix(journeySteps.length), journeySteps.length, 'completed', at)).toBeNull();
  expect(reopenJourney(prefix(5), 2)).toEqual(prefix(2));
  expect(reopenJourney(prefix(2), -1)).toBeNull();
  expect(signInDestination('/dashboard/my-journey')).toBe('/dashboard/my-journey');
});

test('confirmation saves only the current milestone and reload preserves the next unlock', async () => {
  const view = render(<JourneyPage />);
  fireEvent.click(await openCurrent().then(d => within(d).getByRole('button', {name:'Not yet'})));
  expect(db.rows.size).toBe(0);
  const modal = await openCurrent();
  expect(within(modal).getByText(/If you have completed this phase/)).toBeTruthy();
  expect(within(modal).queryByRole('button', {name:'Not applicable — skip'})).toBeNull();
  fireEvent.click(within(modal).getByRole('button', { name: 'Continue' }));
  await screen.findByRole('button', { name: 'Academic eligibility — current milestone' });
  await waitFor(() => expect((db.rows.get('one:journey') as JourneyProgress).resolved[0].id).toBe('passport'));
  expect(screen.getByRole('button', { name: 'Passport — completed' })).toBeTruthy();
  expect(screen.getByRole('status').textContent).toMatch(/Academic eligibility unlocked/);
  view.unmount(); render(<JourneyPage />);
  await screen.findByRole('button', { name: 'Academic eligibility — current milestone' });
  expect(screen.getByRole('button', { name: 'Passport — completed' })).toBeTruthy();
});

test('future steps offer guidance without allowing an unlock', async () => {
  render(<JourneyPage />); await openCurrent();
  fireEvent.click(screen.getByRole('button', {name:'Not yet'}));
  fireEvent.click(screen.getByRole('button', {name:'Student visa — locked'}));
  const modal = await screen.findByRole('dialog');
  expect(within(modal).getByText(/Complete or resolve Passport first/)).toBeTruthy();
  expect(within(modal).queryByRole('button', { name:'Continue' })).toBeNull();
  expect(db.rows.size).toBe(0);
});

test('a failed save keeps the same stage active and permits retry without a false unlock', async () => {
  render(<JourneyPage />); const modal = await openCurrent(); db.failSave = true;
  fireEvent.click(within(modal).getByRole('button', {name:'Continue'}));
  await within(modal).findByRole('alert');
  expect(screen.getByRole('button', {name:'Passport — current milestone'})).toBeTruthy();
  expect(screen.getByRole('button', {name:'Academic eligibility — locked'})).toBeTruthy();
  expect(db.rows.size).toBe(0); expect(screen.getByRole('status').textContent).toBe('');
  db.failSave = false; fireEvent.click(within(modal).getByRole('button', {name:'Continue'}));
  await screen.findByRole('button', {name:'Academic eligibility — current milestone'});
});

test('conditional stages can be skipped and reopened with downstream progress cleared only after confirmation', async () => {
  db.rows.set('one:journey', prefix(3)); render(<JourneyPage />);
  const modal = await openCurrent('IELTS & language');
  fireEvent.click(within(modal).getByRole('button', {name:'Not applicable — skip'}));
  await screen.findByRole('button', {name:'IELTS & language — not applicable'});
  fireEvent.click(screen.getByRole('button', {name:'Academic eligibility — completed'}));
  fireEvent.click(await screen.findByRole('button', {name:'Reopen this milestone'}));
  expect((db.rows.get('one:journey') as JourneyProgress).resolved).toHaveLength(4);
  fireEvent.click(screen.getByRole('button', {name:'Reopen and lock later steps'}));
  await screen.findByRole('button', {name:'Academic eligibility — current milestone'});
  expect((db.rows.get('one:journey') as JourneyProgress).resolved).toHaveLength(1);
  expect(screen.getByRole('button', {name:'IELTS & language — locked'})).toBeTruthy();
});

test('load failure and invalid saved data block writes', async () => {
  db.failLoad = true; const view = render(<JourneyPage />);
  await screen.findByRole('alert');
  expect((screen.getByRole('button', {name:'Open milestone'}) as HTMLButtonElement).disabled).toBe(true);
  view.unmount(); db.failLoad = false; db.rows.set('one:journey', {version:1, resolved:[{id:'visa',outcome:'completed',at}]});
  render(<JourneyPage />); await screen.findByText('Your saved data could not be read. Please contact support.');
  expect((screen.getByRole('button', {name:'Open milestone'}) as HTMLButtonElement).disabled).toBe(true);
});

test('account change cannot copy progress into another account or overwrite profile and expenses', async () => {
  db.rows.set('one:profile', {firstName:'Private'}); db.rows.set('two:journey',prefix(2));
  render(<JourneyPage />); const modal = await openCurrent(); db.owner = 'two';
  fireEvent.click(within(modal).getByRole('button', {name:'Continue'}));
  await within(modal).findByRole('alert');
  expect(db.rows.has('one:journey')).toBe(false);
  expect(db.rows.get('two:journey')).toEqual(prefix(2));
  expect(db.rows.get('one:profile')).toEqual({firstName:'Private'});
});

test('last milestone lights up the ready-to-fly plane and progress survives a remount', async () => {
  db.rows.set('one:journey', prefix(journeySteps.length-1)); const view = render(<JourneyPage />);
  const modal = await openCurrent('Departure check');
  fireEvent.click(within(modal).getByRole('button', {name:'Continue'}));
  await screen.findByRole('img', {name:'Ready to fly to Germany'});
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe(String(journeySteps.length));
  expect(screen.getByRole('status').textContent).toMatch(/Ready to fly/);
  view.unmount(); render(<JourneyPage />);
  await screen.findByRole('img', {name:'Ready to fly to Germany'});
  expect((db.rows.get('one:journey') as JourneyProgress).resolved).toHaveLength(journeySteps.length);
});

test('Escape cancels the confirmation and motion can be paused without changing progress', async () => {
  render(<JourneyPage />); const modal = await openCurrent();
  fireEvent(modal, new Event('cancel', { cancelable: true }));
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  fireEvent.click(screen.getByRole('button', {name:'Pause motion'}));
  expect(screen.getByRole('button', {name:'Resume motion'}).getAttribute('aria-pressed')).toBe('true');
  expect(db.rows.size).toBe(0);
});
