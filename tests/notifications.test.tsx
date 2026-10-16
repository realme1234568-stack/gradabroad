import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const db = vi.hoisted(() => ({
  owner: 'one' as string | null,
  rows: [] as { id: string; user_id: string; message: string; created_at: string; read_at: string | null }[],
  fail: false,
  authChanged: null as null | ((event: string, session: { user: { id: string } } | null) => void),
}));
vi.mock('@/lib/supabaseClient', () => ({ supabase: {
  auth: {
    getUser: async () => ({ data: { user: db.owner ? { id: db.owner } : null } }),
    onAuthStateChange: (callback: typeof db.authChanged) => { db.authChanged = callback; return { data: { subscription: { unsubscribe() {} } } }; },
  },
  from: () => {
    let user = ''; let patch: { read_at: string };
    const chain = {
      select: () => chain, order: () => chain,
      eq: (_key: string, value: string) => { user = value; return chain; },
      limit: async () => ({ data: db.rows.filter(row => row.user_id === user), error: db.fail ? new Error('offline') : null }),
      update: (value: typeof patch) => { patch = value; return chain; },
      in: async (_key: string, ids: string[]) => {
        if (db.fail) return { error: new Error('offline') };
        db.rows = db.rows.map(row => row.user_id === user && ids.includes(row.id) ? { ...row, ...patch } : row);
        return { error: null };
      },
    }; return chain;
  },
} }));
import NotificationProvider, { useNotifications } from '@/components/NotificationProvider';
function Controls() {
  const { notify, openCenter, unread } = useNotifications();
  return <><button onClick={() => notify('Program added')}>Notify</button><button onClick={openCenter}>Open center</button><span>Unread: {unread}</span></>;
}
const row = (id: string, user_id = 'one') => ({ id, user_id, message: 'Saved notification ' + id, created_at: '2026-10-16T12:00:00Z', read_at: null });
beforeEach(() => {
  db.owner = 'one'; db.rows = [row('old')]; db.fail = false;
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

test('popup lasts three seconds then history loads; history survives remount', async () => {
  const view = render(<NotificationProvider><Controls /></NotificationProvider>);
  await screen.findByText('Unread: 1');
  expect(screen.queryByText('New notification')).toBeNull();
  vi.useFakeTimers(); db.rows.push(row('new'));
  fireEvent.click(screen.getByText('Notify'));
  expect(screen.getByText('New notification')).toBeTruthy();
  await act(async () => { await vi.advanceTimersByTimeAsync(2999); });
  expect(screen.getByText('New notification')).toBeTruthy();
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  expect(screen.queryByText('New notification')).toBeNull();
  expect(screen.getByText('Unread: 2')).toBeTruthy();
  vi.useRealTimers(); view.unmount();
  render(<NotificationProvider><Controls /></NotificationProvider>);
  await screen.findByText('Unread: 2'); fireEvent.click(screen.getByText('Open center'));
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.getByText('Saved notification new')).toBeTruthy();
});

test('a burst queues popups without extending the first three seconds', async () => {
  render(<NotificationProvider><Controls /></NotificationProvider>); await screen.findByText('Unread: 1');
  vi.useFakeTimers(); fireEvent.click(screen.getByText('Notify'));
  await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  fireEvent.click(screen.getByText('Notify'));
  await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
  expect(screen.getByText('New notification')).toBeTruthy();
  await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
  expect(screen.queryByText('New notification')).toBeNull();
});

test('account changes clear popups and isolate notification history', async () => {
  db.rows.push(row('other', 'two'));
  render(<NotificationProvider><Controls /></NotificationProvider>); await screen.findByText('Unread: 1');
  fireEvent.click(screen.getByText('Notify'));
  await act(async () => { db.owner = 'two'; db.authChanged?.('SIGNED_IN', { user: { id: 'two' } }); });
  expect(screen.queryByText('New notification')).toBeNull();
  fireEvent.click(screen.getByText('Open center'));
  await screen.findByText('Saved notification other');
  expect(screen.queryByText('Saved notification old')).toBeNull();
  await act(async () => { db.owner = null; db.authChanged?.('SIGNED_OUT', null); });
  fireEvent.click(screen.getByText('Open center'));
  expect(screen.getByText('Sign in to view your notifications.')).toBeTruthy();
  expect(screen.queryByText('Saved notification other')).toBeNull();
});

test('read state persists and loading failures offer retry rather than an empty inbox', async () => {
  render(<NotificationProvider><Controls /></NotificationProvider>); await screen.findByText('Unread: 1');
  fireEvent.click(screen.getByText('Open center'));
  await waitFor(() => expect((screen.getByText('Mark all as read') as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByText('Mark all as read'));
  await screen.findByText('Unread: 0');
  expect(db.rows[0].read_at).not.toBeNull();
  db.fail = true; fireEvent.click(screen.getByText('Open center'));
  await screen.findByRole('alert'); expect(screen.queryByText('No notifications yet.')).toBeNull();
  db.fail = false; fireEvent.click(screen.getByText('Retry'));
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
});
