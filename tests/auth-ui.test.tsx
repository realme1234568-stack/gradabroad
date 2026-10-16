import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const auth = vi.hoisted(() => ({ getUser: vi.fn(), signInWithOtp: vi.fn(), signInWithOAuth: vi.fn(), signOut: vi.fn() }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: { auth: {
  ...auth,
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
} } }));
import AuthPanel from '@/components/AuthPanel';
import AuthErrorPage from '@/app/auth/error/page';
beforeEach(() => { vi.resetAllMocks(); auth.getUser.mockResolvedValue({ data: { user: null } }); });
afterEach(cleanup);

test('a failed OAuth request shows feedback and re-enables retry', async () => {
  auth.signInWithOAuth.mockRejectedValue(new Error('Network'));
  render(<AuthPanel />);
  const button = screen.getByRole('button', { name: 'Continue with Google' }) as HTMLButtonElement;
  fireEvent.click(button);
  await screen.findByText(/Could not reach the sign-in service/);
  expect(button.disabled).toBe(false);
});

test('an email failure preserves the email and allows retry', async () => {
  auth.signInWithOtp.mockResolvedValue({ error: new Error('Rate limited') });
  render(<AuthPanel />);
  const input = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'test@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send magic link' }));
  await screen.findByText(/Could not send the sign-in link/);
  expect(input.value).toBe('test@example.com');
  expect((screen.getByRole('button', { name: 'Send magic link' }) as HTMLButtonElement).disabled).toBe(false);
});

test('sign-out failures remain visible to signed-in users', async () => {
  auth.getUser.mockResolvedValue({ data: { user: { email: 'test@example.com' } } });
  auth.signOut.mockResolvedValue({ error: new Error('Network') });
  render(<AuthPanel />);
  fireEvent.click(await screen.findByRole('button', { name: 'Sign out' }));
  await screen.findByText('Could not sign out. Please try again.');
  expect(screen.getByText('test@example.com')).toBeTruthy();
});

test('callback error page explains recovery and offers sign-in immediately', async () => {
  render(await AuthErrorPage({ searchParams: Promise.resolve({ reason: 'invalid-link' }) }));
  expect(screen.getByRole('alert').textContent).toContain('expired');
  expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeTruthy();
  await waitFor(() => expect(auth.getUser).toHaveBeenCalled());
});

test('unknown error input uses a safe message', async () => {
  render(await AuthErrorPage({ searchParams: Promise.resolve({ reason: 'untrusted-provider-text' }) }));
  expect(screen.getByRole('alert').textContent).toBe('We could not complete sign-in. Please try again below.');
  await waitFor(() => expect(auth.getUser).toHaveBeenCalled());
});


test('sign-in entry explains the next step and preserves destination for OAuth and email', async () => {
  auth.signInWithOAuth.mockResolvedValue({ error: null });
  auth.signInWithOtp.mockResolvedValue({ error: null });
  render(await AuthErrorPage({ searchParams: Promise.resolve({ reason: 'signin', next: '/dashboard' }) }));
  expect(screen.getByRole('heading', { name: 'Sign in to continue' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));
  await waitFor(() => expect(auth.signInWithOAuth).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback?next=%2Fdashboard' } }));
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'test@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send magic link' }));
  await waitFor(() => expect(auth.signInWithOtp).toHaveBeenCalledWith({ email: 'test@example.com', options: { emailRedirectTo: window.location.origin + '/auth/callback?next=%2Fdashboard' } }));
});
