import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const db = vi.hoisted(() => ({
  notify: vi.fn(),
  preferences: null as Record<string, unknown> | null,
  failSave: false,
  failLoad: false,
  throwLoad: false,
  user: 'user-a' as string | null,
  status: 'Applied',
  updates: [] as Record<string, unknown>[],
}));
vi.mock('@/components/NotificationProvider', () => ({ useNotifications: () => ({ notify: db.notify }) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {} }) }));
vi.mock('@/lib/UserContext', () => ({ useUser: () => ({ email: 'test@example.com' }) }));
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: db.user ? { id: db.user } : null } }), onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}) },
    from(table: string) {
      const rows = [{ id: 'saved-row', university_name: 'TU Berlin', course_name: 'IMES', status: db.status, note: 'Existing note', deadline: null, program_level: 'master' }];
      const result = () => ({ data: table === 'tracker_preferences' ? db.preferences : rows, error: db.failLoad ? new Error('Unavailable') : null });
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        range: async () => { if (db.throwLoad) throw new Error('Network unavailable'); return result(); },
        maybeSingle: async () => result(),
        then: (resolve: (value: ReturnType<typeof result>) => unknown, reject?: (error: unknown)=>unknown) => Promise.resolve().then(()=>{if(db.throwLoad)throw new Error('Network unavailable');return result();}).then(resolve,reject),
      };
      return {
        ...chain,
        update(value: Record<string, unknown>) { db.updates.push(value); return chain; },
        async upsert(value: Record<string, unknown>) {
          if (db.failSave) return { error: new Error('Unavailable') };
          db.preferences = structuredClone(value);
          return { error: null };
        },
      };
    },
  },
}));
import MyTrackerPage from '@/app/dashboard/my-tracker/page';
import ProgramList from '@/components/ProgramList';
import Dashboard from '@/app/dashboard/page';
import MyShortlist from '@/app/dashboard/my-shortlist/page';
import OlderTracker from '@/app/application-tracker/page';
import { checklistDrafts } from '@/lib/checklistDraft';
import { normalizeApplicationStatus } from '@/lib/applicationStatus';

beforeEach(() => { db.notify.mockReset(); checklistDrafts.clear(); db.preferences = null; db.failSave = false; db.failLoad = false; db.throwLoad = false; db.user = 'user-a'; db.updates = []; db.status = 'Applied'; });
afterEach(cleanup);

test('saved checklist and custom documents survive remount', async () => {
  const view = render(<MyTrackerPage />);
  fireEvent.click(await screen.findByLabelText('Mark Passport as complete'));
  fireEvent.click(screen.getByLabelText('Toggle GMAT for TU Berlin'));
  fireEvent.change(screen.getByPlaceholderText('Add document...'), { target: { value: 'Visa' } });
  fireEvent.submit(screen.getByPlaceholderText('Add document...').closest('form')!);
  fireEvent.click(screen.getByRole('button', { name: 'Save checklist' }));
  await screen.findByText('Checklist saved.');
  expect(db.preferences?.user_id).toBe('user-a');
  view.unmount();
  render(<MyTrackerPage />);
  expect((await screen.findByLabelText('Mark Passport as complete') as HTMLInputElement).checked).toBe(true);
  expect(screen.getByLabelText('Mark Visa as complete')).toBeTruthy();
  expect(screen.getByLabelText('Toggle GMAT for TU Berlin').querySelector('span')).not.toBeNull();
});

test('failed checklist save retains edits and permits retry', async () => {
  render(<MyTrackerPage />);
  fireEvent.click(await screen.findByLabelText('Mark Passport as complete'));
  db.failSave = true;
  fireEvent.click(screen.getByRole('button', { name: 'Save checklist' }));
  await screen.findByText(/Could not save your checklist/);
  expect((screen.getByLabelText('Mark Passport as complete') as HTMLInputElement).checked).toBe(true);
  expect(db.preferences).toBeNull();
  db.failSave = false;
  fireEvent.click(screen.getByRole('button', { name: 'Save checklist' }));
  await screen.findByText('Checklist saved.');
});

test('failed initial load does not expose a blank editable checklist', async () => {
  db.failLoad = true;
  render(<MyTrackerPage />);
  await screen.findByText(/Could not load your tracker/);
  expect(screen.queryByRole('button', { name: 'Save checklist' })).toBeNull();
});

test('changing accounts prevents saving a checklist into another account', async () => {
  render(<MyTrackerPage />);
  fireEvent.click(await screen.findByLabelText('Mark Passport as complete'));
  db.user = 'user-b';
  fireEvent.click(screen.getByRole('button', { name: 'Save checklist' }));
  await screen.findByText(/Could not save your checklist/);
  expect(db.preferences).toBeNull();
});

test('catalogue recognises saved programs and updates metadata using its displayed key', async () => {
  render(<ProgramList programs={[{ id: 'catalogue-id', university_name: 'TU Berlin', course_name: 'IMES', level: 'masters', language: 'English' }]} />);
  expect((await screen.findByRole('button', { name: /Already Shortlisted/ }) as HTMLButtonElement).disabled).toBe(true);
  const status = screen.getByRole('combobox') as HTMLSelectElement;
  expect(status.value).toBe('Applied');
  fireEvent.change(status, { target: { value: 'Interview' } });
  await waitFor(() => expect(status.value).toBe('Interview'));
  expect(db.updates).toContainEqual({ status: 'Interview' });
  expect(db.notify).toHaveBeenCalledWith('TU Berlin — IMES: status changed to Interview.');
  const note = screen.getByPlaceholderText('Add your notes...');
  fireEvent.change(note, { target: { value: 'Updated note' } });
  expect(db.updates).toHaveLength(1);
  fireEvent.blur(note);
  await waitFor(() => expect(db.updates).toContainEqual({ note: 'Updated note' }));
});


test.each(['Admit', 'Accepted', 'Interview', 'Waitlisted'])('status %s is represented consistently on every editable screen', async stored => {
  db.status = stored;
  const expected = normalizeApplicationStatus(stored);
  for (const component of [
    <ProgramList key="catalogue" programs={[{ id: 'catalogue-id', university_name: 'TU Berlin', course_name: 'IMES', level: 'masters', language: 'English' }]} />,
    <Dashboard key="dashboard" />,
    <MyTrackerPage key="tracker" />,
  ]) {
    const view = render(component);
    const status = await screen.findByRole('combobox', component.type === MyTrackerPage ? { name: /Application status for/ } : {}) as HTMLSelectElement;
    await waitFor(() => expect(status.value).toBe(expected));
    const values = Array.from(status.options).map(option => option.value);
    expect(values).toEqual(stored === 'Waitlisted' ? ['Waitlisted', 'Shortlisted', 'Applied', 'Interview', 'Accepted', 'Rejected'] : ['Shortlisted', 'Applied', 'Interview', 'Accepted', 'Rejected']);
    fireEvent.change(status, { target: { value: 'Accepted' } });
    await waitFor(() => expect(db.updates).toContainEqual({ status: 'Accepted' }));
    view.unmount(); db.updates = [];
  }
});


test.each([['dashboard', Dashboard], ['shortlist', MyShortlist], ['older tracker', OlderTracker]])('%s explains loading failures and retries', async (_name, Page) => {
  db.failLoad = true; render(<Page />);
  await screen.findByRole('alert');
  expect(screen.queryByText(/No universities shortlisted yet|No tracker entries yet/)).toBeNull();
  db.failLoad = false;
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  expect(screen.getAllByText('TU Berlin').length).toBeGreaterThan(0);
});

test('internal navigation can be cancelled and checklist drafts survive remount until saved', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  const view = render(<><a href="/dashboard">Dashboard link</a><MyTrackerPage /></>);
  fireEvent.click(await screen.findByLabelText('Mark Passport as complete'));
  const link = screen.getByText('Dashboard link');
  expect(fireEvent.click(link)).toBe(false);
  expect(confirm).toHaveBeenCalledTimes(1);
  expect((screen.getByLabelText('Mark Passport as complete') as HTMLInputElement).checked).toBe(true);
  view.unmount();
  const restored = render(<MyTrackerPage />);
  await screen.findByText('Restored your unsaved checklist changes.');
  expect((screen.getByLabelText('Mark Passport as complete') as HTMLInputElement).checked).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Save checklist' }));
  await screen.findByText('Checklist saved.');
  expect(checklistDrafts.size).toBe(0);
  restored.unmount(); confirm.mockRestore();
});

test('unsaved checklist drafts are isolated by account', async () => {
  const view = render(<MyTrackerPage />);
  fireEvent.click(await screen.findByLabelText('Mark Passport as complete'));
  view.unmount(); db.user = 'user-b'; render(<MyTrackerPage />);
  expect((await screen.findByLabelText('Mark Passport as complete') as HTMLInputElement).checked).toBe(false);
  expect(screen.queryByText('Restored your unsaved checklist changes.')).toBeNull();
});


test.each([Dashboard, MyShortlist, OlderTracker])('a thrown network error ends loading and offers retry', async Page => {
  db.throwLoad = true; render(<Page />);
  await screen.findByRole('alert');
  db.throwLoad = false; fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  expect(screen.getAllByText('TU Berlin').length).toBeGreaterThan(0);
});


test('typing document names and changing application status do not dirty the checklist', async () => {
  render(<MyTrackerPage />);
  await screen.findByLabelText('Mark Passport as complete');
  const save = screen.getByRole('button', { name: 'Save checklist' }) as HTMLButtonElement;
  fireEvent.change(screen.getByPlaceholderText('Add document...'), { target: { value: 'Visa' } });
  expect(save.disabled).toBe(true);
  fireEvent.change(screen.getByRole('combobox', { name: /Application status for/ }), { target: { value: 'Interview' } });
  await waitFor(() => expect(db.updates).toContainEqual({ status: 'Interview' }));
  expect(save.disabled).toBe(true);
  expect(checklistDrafts.size).toBe(0);
  fireEvent.submit(screen.getByPlaceholderText('Add document...').closest('form')!);
  expect(save.disabled).toBe(false);
  fireEvent.click(save); await screen.findByText('Checklist saved.');
  fireEvent.change(screen.getByRole('combobox', { name: /Application status for/ }), { target: { value: 'Accepted' } });
  await waitFor(() => expect(db.updates).toContainEqual({ status: 'Accepted' }));
  expect(save.disabled).toBe(true);
});

test('both tracker URLs render the same component', () => {
  expect(OlderTracker).toBe(MyTrackerPage);
});

test('signed-out shortlisting offers sign-in instead of a generic retry', async () => {
  db.user = null;
  render(<ProgramList programs={[{ id: 'catalogue-id', university_name: 'TU Berlin', course_name: 'IMES', level: 'masters', language: 'English' }]} />);
  const button = await screen.findByRole('button', { name: 'Add to shortlist' });
  await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(button);
  await screen.findByText('Please sign in to save programs to your shortlist.');
  expect(screen.getByRole('button', { name: 'Sign in to shortlist' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
});

test('tracker status failures retain the saved status and allow retry without dirtying the checklist', async () => {
  render(<MyTrackerPage />);
  const control = await screen.findByRole('combobox', { name: /Application status for/ }) as HTMLSelectElement;
  db.failLoad = true;
  fireEvent.change(control, { target: { value: 'Interview' } });
  await screen.findByText('Could not save application status. Please retry.');
  expect(control.value).toBe('Applied');
  expect(db.notify).not.toHaveBeenCalled();
  expect((screen.getByRole('button', { name: 'Save checklist' }) as HTMLButtonElement).disabled).toBe(true);
  db.failLoad = false;
  fireEvent.change(control, { target: { value: 'Interview' } });
  await screen.findByText('Application status saved.');
  expect(control.value).toBe('Interview');
  expect(db.notify).toHaveBeenCalledTimes(1);
});

test('tracker verifies the current account before changing an application status', async () => {
  render(<MyTrackerPage />);
  const control = await screen.findByRole('combobox', { name: /Application status for/ });
  db.user = 'user-b';
  fireEvent.change(control, { target: { value: 'Accepted' } });
  await screen.findByText('Could not save application status. Please retry.');
  expect(db.updates).toHaveLength(0);expect(db.notify).not.toHaveBeenCalled();
});
