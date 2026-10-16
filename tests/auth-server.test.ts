// @vitest-environment node
import { beforeEach, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { CookieMethodsServer } from '@supabase/ssr';

const mocks = vi.hoisted(() => ({
  create: vi.fn(), getUser: vi.fn(), exchange: vi.fn(), rateLimit: vi.fn(),
}));
vi.mock('@supabase/ssr', () => ({ createServerClient: mocks.create }));
vi.mock('@/utils/rateLimitEdge', () => ({ rateLimit: mocks.rateLimit }));
import { proxy } from '@/proxy';
import { GET } from '@/app/auth/callback/route';
let cookies: CookieMethodsServer;
beforeEach(() => {
  vi.resetAllMocks();
  mocks.create.mockImplementation((_url, _key, options) => {
    cookies = options.cookies;
    return { auth: { getUser: mocks.getUser, exchangeCodeForSession: mocks.exchange } };
  });
  mocks.rateLimit.mockResolvedValue(null);
});
const req = (path: string) => new NextRequest(`https://gradabroad.test${path}`, {
  headers: { cookie: 'session.0=old; session.1=obsolete' },
});
const rotate = () => cookies.setAll!([
  { name: 'session.0', value: 'new', options: { path: '/', secure: true, sameSite: 'lax' } },
  { name: 'session.1', value: '', options: { path: '/', maxAge: 0 } },
]);

test('refreshed and cleared cookie chunks reach both request and browser', async () => {
  mocks.getUser.mockImplementation(async () => {
    expect(await cookies.getAll()).toHaveLength(2);
    await rotate();
    return { data: { user: { id: 'user' } }, error: null };
  });
  const request = req('/dashboard');
  const response = await proxy(request);
  expect(request.cookies.get('session.0')?.value).toBe('new');
  expect(response.headers.get('x-middleware-request-cookie')).toContain('session.0=new');
  expect(response.cookies.get('session.0')).toMatchObject({ value: 'new', secure: true, sameSite: 'lax' });
  expect(response.cookies.get('session.1')?.maxAge).toBe(0);
  expect(response.headers.get('cache-control')).toContain('no-store');
});

test('invalid sessions redirect with cleanup cookies intact', async () => {
  mocks.getUser.mockImplementation(async () => { await rotate(); return { data: { user: null }, error: new Error('Expired') }; });
  const response = await proxy(req('/dashboard/my-tracker'));
  expect(response.headers.get('location')).toBe('https://gradabroad.test/auth/error?reason=session&next=%2Fdashboard%2Fmy-tracker');
  expect(response.cookies.get('session.1')?.maxAge).toBe(0);
});

test('service exceptions show an error rather than crashing', async () => {
  mocks.getUser.mockRejectedValue(new Error('Network'));
  expect((await proxy(req('/dashboard'))).headers.get('location')).toContain('reason=unavailable');
});

test('public and error pages do not enter an authentication redirect loop', async () => {
  await proxy(req('/auth/error?reason=session'));
  await proxy(req('/'));
  expect(mocks.create).not.toHaveBeenCalled();
});

test('successful exchange retains session cookies on the home redirect', async () => {
  mocks.exchange.mockImplementation(async () => { await rotate(); return { data: { session: {} }, error: null }; });
  const response = await GET(req('/auth/callback?code=valid'));
  expect(mocks.exchange).toHaveBeenCalledWith('valid');
  expect(response.headers.get('location')).toBe('https://gradabroad.test/');
  expect(response.cookies.get('session.0')?.value).toBe('new');
  expect(response.cookies.get('session.1')?.maxAge).toBe(0);
});

test.each([
  ['/auth/callback', 'invalid-link'],
  ['/auth/callback?error=access_denied&error_description=private-details', 'cancelled'],
  ['/auth/callback?error=server_error', 'failed'],
])('handles callback %s without exchanging or exposing provider details', async (path, reason) => {
  const response = await GET(req(path));
  expect(response.headers.get('location')).toBe(`https://gradabroad.test/auth/error?reason=${reason}`);
  expect(mocks.exchange).not.toHaveBeenCalled();
});

test('rejected exchange retains cleanup cookies and reports an invalid link', async () => {
  mocks.exchange.mockImplementation(async () => { await rotate(); return { data: { session: null }, error: new Error('Expired') }; });
  const response = await GET(req('/auth/callback?code=expired'));
  expect(response.headers.get('location')).toContain('reason=invalid-link');
  expect(response.cookies.get('session.1')?.maxAge).toBe(0);
});

test('exchange exceptions and rate limits give actionable errors', async () => {
  mocks.exchange.mockRejectedValue(new Error('Network'));
  expect((await GET(req('/auth/callback?code=x'))).headers.get('location')).toContain('reason=unavailable');
  mocks.rateLimit.mockResolvedValue(new Response(null, { status: 429 }));
  expect((await GET(req('/auth/callback?code=x'))).headers.get('location')).toContain('reason=rate-limited');
});


test('signed-out Get started opens sign-in with dashboard destination', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
  const response = await proxy(req('/dashboard'));
  const destination = new URL(response.headers.get('location')!);
  expect(destination.pathname).toBe('/auth/error');
  expect(destination.searchParams.get('reason')).toBe('signin');
  expect(destination.searchParams.get('next')).toBe('/dashboard');
});
test.each([['/dashboard/my-tracker', '/dashboard/my-tracker'], ['/browse-programs', '/browse-programs'], ['https://evil.example', '/'], ['//evil.example', '/']])('callback safely handles destination %s', async (next, expected) => {
  mocks.exchange.mockResolvedValue({ data: { session: {} }, error: null });
  const response = await GET(req('/auth/callback?code=valid&next=' + encodeURIComponent(next)));
  expect(response.headers.get('location')).toBe('https://gradabroad.test' + expected);
});
