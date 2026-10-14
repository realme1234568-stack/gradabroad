import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const db = vi.hoisted(() => ({ mode: 'success', calls: 0, rows: [] as { id: string; university_name: string; course_name: string }[] }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: { from: () => ({
  select: () => ({ order: async () => ({ data: db.rows }) }),
  delete: () => { db.calls++; return { eq: () => ({ select: async () => {
    if (db.mode === 'throw') throw new Error('network');
    if (db.mode === 'error') return { data: null, error: new Error('denied') };
    if (db.mode === 'empty') return { data: [], error: null };
    db.rows = []; return { data: [{ id: 'saved' }], error: null };
  } }) }; },
}) } }));
import MyShortlist from '@/app/dashboard/my-shortlist/page';
beforeEach(() => { db.mode = 'success'; db.calls = 0; db.rows = [{ id: 'saved', university_name: 'TU Berlin', course_name: 'IMES' }]; });
afterEach(cleanup);
test.each(['error', 'empty', 'throw'])('failed deletion (%s) keeps the entry and allows retry', async mode => {
  db.mode = mode; render(<MyShortlist />);
  fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));
  await screen.findByRole('alert');
  expect(screen.getByText('TU Berlin')).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Remove' }) as HTMLButtonElement).disabled).toBe(false);
  db.mode = 'success'; fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
  await screen.findByText('No universities shortlisted yet.');
  expect(screen.queryByRole('alert')).toBeNull();
});
test('confirmed deletion stays removed after reload', async () => {
  const view = render(<MyShortlist />);
  const remove = await screen.findByRole('button', { name: 'Remove' });
  fireEvent.click(remove); fireEvent.click(remove);
  await waitFor(() => expect(screen.queryByText('TU Berlin')).toBeNull());
  expect(db.calls).toBe(1);
  view.unmount(); render(<MyShortlist />);
  await screen.findByText('No universities shortlisted yet.');
});
