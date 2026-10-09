import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const db = vi.hoisted(() => ({
  preferences: null as Record<string, unknown> | null,
  failSave: false,
  failLoad: false,
  user: 'user-a',
  updates: [] as Record<string, unknown>[],
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh() {} }) }));
vi.mock('@/lib/UserContext', () => ({ useUser: () => ({ email: 'test@example.com' }) }));
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: db.user } } }) },
    from(table: string) {
      const rows = [{ id: 'saved-row', university_name: 'TU Berlin', course_name: 'IMES', status: 'Applied', note: 'Existing note', deadline: null, program_level: 'master' }];
      const result = () => ({ data: table === 'tracker_preferences' ? db.preferences : rows, error: db.failLoad ? new Error('Unavailable') : null });
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: async () => result(),
        maybeSingle: async () => result(),
        then: (resolve: (value: ReturnType<typeof result>) => unknown) => Promise.resolve(result()).then(resolve),
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

beforeEach(() => { db.preferences = null; db.failSave = false; db.failLoad = false; db.user = 'user-a'; db.updates = []; });
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
  const note = screen.getByPlaceholderText('Add your notes...');
  fireEvent.change(note, { target: { value: 'Updated note' } });
  expect(db.updates).toHaveLength(1);
  fireEvent.blur(note);
  await waitFor(() => expect(db.updates).toContainEqual({ note: 'Updated note' }));
});
