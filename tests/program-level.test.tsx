import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { getProgramLevel, normalizeProgramLevel } from '@/lib/programLevel';
const rows = vi.hoisted(() => [
  { id: 'imes', university_name: 'TU Berlin', course_name: 'IMES', program_level: null, status: 'Shortlisted' },
  { id: 'science', university_name: 'Science University', course_name: 'B.Sc. Computer Science', program_level: null, status: 'Shortlisted' },
  { id: 'plural', university_name: 'Other University', course_name: 'Economics', program_level: ' Masters ', status: 'Shortlisted' },
  { id: 'unknown', university_name: 'Unknown University', course_name: 'Unclassified Course', program_level: null, status: 'Shortlisted' },
]);
vi.mock('@/lib/supabaseClient', () => ({ supabase: {
  auth: { getUser: async () => ({ data: { user: { id: 'test-user' } } }), onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}) },
  from: () => {
    const chain = {
      select: () => chain, eq: () => chain,
      order: () => chain, range: async () => ({data:rows,error:null}),
      then: (resolve: (value: {data:typeof rows;error:null})=>unknown) => Promise.resolve({data:rows,error:null}).then(resolve),
      maybeSingle: async () => ({ data: null, error: null }),
    };
    return chain;
  },
} }));
import MyShortlistPage from '@/app/dashboard/my-shortlist/page';
import MyTrackerPage from '@/app/dashboard/my-tracker/page';
afterEach(cleanup);

test.each(['master', 'masters', ' Master’s ', "Master's"])( '%s normalizes to master', value => {
  expect(normalizeProgramLevel(value)).toBe('master');
});
test.each(['bachelor', 'bachelors', ' Bachelor’s '])('%s normalizes to bachelor', value => {
  expect(normalizeProgramLevel(value)).toBe('bachelor');
});
test.each([
  ['M.Sc. Economics', 'master'], ['MSc Economics', 'master'], ['M.A. History', 'master'],
  ['B.Sc. Physics', 'bachelor'], ['BA History', 'bachelor'], ['B.Eng. Engineering', 'bachelor'],
  ['Business Management', null], ['Marketing', null], ['IMES', null],
])('infers %s only when supported by a degree prefix', (course_name, expected) => {
  expect(getProgramLevel({ university_name: 'Unknown', course_name })).toBe(expected);
});
test('recognises IMES by the existing catalogue and honours explicit degree levels', () => {
  expect(getProgramLevel(rows[0])).toBe('master');
  expect(getProgramLevel({ ...rows[0], program_level: 'bachelor' })).toBe('bachelor');
});
test('every saved entry appears exactly once, including unclassified programs', async () => {
  render(<MyShortlistPage />);
  await screen.findByText('IMES');
  const masters = screen.getByRole('region', { name: 'Your Masters Program Shortlist' });
  expect(within(masters).getByText('IMES')).toBeTruthy();
  expect(within(masters).getByText('Economics')).toBeTruthy();
  const unknown = screen.getByRole('region', { name: /degree level unknown/ });
  expect(within(unknown).getByText('Unclassified Course')).toBeTruthy();
  for (const row of rows) expect(screen.getAllByText(row.course_name)).toHaveLength(1);
  expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(rows.length);
});
test('tracker degree filters use the same legacy classification and All includes unknown entries', async () => {
  render(<MyTrackerPage />);
  await screen.findByText('IMES');
  fireEvent.click(screen.getByRole('button', { name: 'Master’s' }));
  expect(screen.getByText('IMES')).toBeTruthy();
  expect(screen.getByText('Economics')).toBeTruthy();
  expect(screen.queryByText('B.Sc. Computer Science')).toBeNull();
  expect(screen.queryByText('Unclassified Course')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Bachelor’s' }));
  expect(screen.getByText('B.Sc. Computer Science')).toBeTruthy();
  expect(screen.queryByText('IMES')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'All' }));
  for (const row of rows) expect(screen.getByText(row.course_name)).toBeTruthy();
});
