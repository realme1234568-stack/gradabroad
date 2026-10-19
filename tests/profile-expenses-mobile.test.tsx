import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
vi.mock('@/components/FeedbackBox', () => ({ default: () => null }));
vi.mock('@/components/AuthPanel', () => ({ default: () => <p>Account controls</p> }));
vi.mock('@/components/ThemeToggle', () => ({ default: () => <p>Theme controls</p> }));
import Profile from '@/app/my-profile/page';
import Expenses from '@/dashboard/GermanyLivingExpenseCalculator';
import Header from '@/components/Header';
import IndiaExpenses from '@/dashboard/ExpenseCalculator';
import { parseAmount, expenseTotal } from '@/lib/expenses';

beforeEach(() => { db.rows.clear(); db.failLoad = false; db.failSave = false; db.owner = 'one'; });
afterEach(cleanup);
const waitReady = async (label: string) => waitFor(() => expect(screen.getByLabelText(label).closest('fieldset')?.disabled).toBe(false));

test('profile save persists all fields, reloads, and permits clearing fields', async () => {
  const view = render(<Profile />);
  await waitReady('First Name');
  fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Ada' } });
  fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Lovelace' } });
  fireEvent.change(screen.getByLabelText('Which program are you interested in?'), { target: { value: 'masters' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  await screen.findByText('Saved!');
  view.unmount(); render(<Profile />);
  fireEvent.click(await screen.findByRole('button', {name: 'Edit profile'}));
  await waitReady('First Name');
  expect((screen.getByLabelText('First Name') as HTMLInputElement).value).toBe('Ada');
  expect((screen.getByLabelText('Which program are you interested in?') as HTMLSelectElement).value).toBe('masters');
  fireEvent.change(screen.getByLabelText('First Name'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  await screen.findByText('Saved!');
  expect(db.rows.get('one:profile')).toMatchObject({ firstName: '', lastName: 'Lovelace' });
});

test('profile save failure preserves edits without claiming success, then retries', async () => {
  render(<Profile />); await waitReady('First Name'); db.failSave = true;
  fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Ada' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  await screen.findByRole('alert');
  expect(screen.queryByText('Saved!')).toBeNull();
  expect((screen.getByLabelText('First Name') as HTMLInputElement).value).toBe('Ada');
  db.failSave = false;
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  await screen.findByText('Saved!');
});

test('failed initial load prevents overwriting stored records', async () => {
  db.failLoad = true; render(<Profile />);
  await screen.findByRole('alert');
  expect(screen.getByLabelText('First Name').closest('fieldset')?.disabled).toBe(true);
  expect(db.rows.size).toBe(0);
});

test('account switch cannot save old profile to a new account', async () => {
  render(<Profile />); await waitReady('First Name');
  fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Private' } });
  db.owner = 'two'; fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  await screen.findByRole('alert'); expect(db.rows.size).toBe(0);
});

test.each(['', ' ', '-1', 'NaN', 'Infinity', '1.234', '1e3', '1000000001'])('rejects invalid amount %s', value => {
  expect(parseAmount(value)).toBeNull();
});
test('preserves zero and decimals and totals in cents', () => {
  expect(parseAmount('0')).toBe(0); expect(parseAmount('12.34')).toBe(12.34);
  expect(expenseTotal([{ head: 'a', amount: .1 }, { head: 'b', amount: .2 }])).toBe(.3);
});

test('expense decimals persist on add and remount; blank edit does not corrupt totals', async () => {
  const view = render(<Expenses />); await waitReady('Expense name');
  fireEvent.change(screen.getByLabelText('Expense name'), { target: { value: 'Coffee' } });
  fireEvent.change(screen.getByLabelText('Expense amount'), { target: { value: '12.34' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add expense' }));
  await screen.findByText('Coffee');
  expect(screen.getByText('812.34 €')).toBeTruthy();
  view.unmount(); render(<Expenses />); await screen.findByText('Coffee');
  fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
  fireEvent.change(screen.getByLabelText('Edit expense amount'), { target: { value: '' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save expense' }));
  await screen.findByRole('alert');
  expect(screen.getByText('812.34 €')).toBeTruthy();
  expect((db.rows.get('one:expenses-eur') as { amount: number }[])[0].amount).toBe(400);
});

test('failed expense write leaves draft available for retry', async () => {
  render(<Expenses />); await waitReady('Expense name'); db.failSave = true;
  fireEvent.change(screen.getByLabelText('Expense name'), { target: { value: 'Coffee' } });
  fireEvent.change(screen.getByLabelText('Expense amount'), { target: { value: '2.50' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add expense' }));
  await screen.findByRole('alert'); expect(screen.queryByText('Coffee')).toBeNull();
  expect((screen.getByLabelText('Expense name') as HTMLInputElement).value).toBe('Coffee');
  db.failSave = false; fireEvent.click(screen.getByRole('button', { name: 'Add expense' }));
  await screen.findByText('Coffee');
});

test('mobile menu exposes destinations, closes on navigation and Escape', () => {
  render(<Header />);
  const toggle = screen.getByRole('button', { name: 'Open navigation' });
  fireEvent.click(toggle);
  const nav = screen.getByRole('navigation', { name: 'Mobile navigation' });
  expect(within(nav).getAllByRole('link')).toHaveLength(3);
  const dashboardLink = within(nav).getByText('Your Dashboard');
  dashboardLink.addEventListener('click', event => event.preventDefault(), { once: true });
  fireEvent.click(dashboardLink);
  expect(screen.queryByRole('navigation', { name: 'Mobile navigation' })).toBeNull();
  fireEvent.click(toggle); fireEvent.keyDown(document, { key: 'Escape' });
  expect(toggle.getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(toggle);
});


test('INR edits retain decimals and do not overwrite EUR or another account', async () => {
  db.rows.set('one:expenses-eur', [{ head: 'Rent', amount: 400 }]);
  db.rows.set('two:expenses-inr', [{ head: 'Private', amount: 50 }]);
  const view = render(<IndiaExpenses />); await waitReady('Expense name');
  fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
  fireEvent.change(screen.getByLabelText('Edit expense amount'), { target: { value: '1234.56' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save expense' }));
  await waitFor(() => expect(screen.queryByLabelText('Edit expense amount')).toBeNull());
  view.unmount(); render(<IndiaExpenses />); await waitReady('Expense name');
  fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
  expect((screen.getByLabelText('Edit expense amount') as HTMLInputElement).value).toBe('1234.56');
  expect(db.rows.get('one:expenses-eur')).toEqual([{ head: 'Rent', amount: 400 }]);
  expect(db.rows.get('two:expenses-inr')).toEqual([{ head: 'Private', amount: 50 }]);
});

test('removing a custom expense persists across remount', async () => {
  db.rows.set('one:expenses-eur', Array.from({ length: 5 }, (_, i) => ({ head: `Expense ${i}`, amount: 1 })));
  const view = render(<Expenses />); await waitReady('Expense name');
  fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
  await waitFor(() => expect(screen.queryByText('Expense 4')).toBeNull());
  view.unmount(); render(<Expenses />); await waitReady('Expense name');
  expect(screen.queryByText('Expense 4')).toBeNull();
  expect(screen.getByText('4 €')).toBeTruthy();
});

test('budget target persists separately by currency and calculates decimal remainder', async () => {
  db.rows.set('one:expenses-eur', [{head:'Rent',amount:400.25}]);
  const view=render(<Expenses/>); await waitReady('Expense name');
  await waitFor(()=>expect((screen.getByLabelText('Budget target') as HTMLInputElement).disabled).toBe(false));
  fireEvent.change(screen.getByLabelText('Budget target'),{target:{value:'500.50'}});
  expect(screen.getByText('€100.25')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Save target'}));
  await waitFor(()=>expect(db.rows.get('one:budget-eur')).toEqual({amount:'500.50'}));
  view.unmount(); const next=render(<Expenses/>); await waitReady('Expense name');
  await waitFor(()=>expect((screen.getByLabelText('Budget target') as HTMLInputElement).value).toBe('500.50'));
  next.unmount();render(<IndiaExpenses/>);await waitReady('Expense name');
  expect((screen.getByLabelText('Budget target') as HTMLInputElement).value).toBe('');
  expect(db.rows.get('one:expenses-eur')).toEqual([{head:'Rent',amount:400.25}]);
});

test('budget failure preserves draft and permits retry; zero and clearing are valid', async () => {
  render(<Expenses/>);await waitReady('Expense name');
  await waitFor(()=>expect((screen.getByLabelText('Budget target') as HTMLInputElement).disabled).toBe(false));
  fireEvent.change(screen.getByLabelText('Budget target'),{target:{value:'0'}});
  expect(screen.getByText('Over budget')).toBeTruthy();
  db.failSave=true;fireEvent.click(screen.getByRole('button',{name:'Save target'}));
  await screen.findByRole('alert');expect(db.rows.has('one:budget-eur')).toBe(false);
  expect((screen.getByLabelText('Budget target') as HTMLInputElement).value).toBe('0');
  db.failSave=false;fireEvent.click(screen.getByRole('button',{name:'Save target'}));
  await waitFor(()=>expect(db.rows.get('one:budget-eur')).toEqual({amount:'0'}));
  fireEvent.change(screen.getByLabelText('Budget target'),{target:{value:''}});
  fireEvent.click(screen.getByRole('button',{name:'Save target'}));
  await waitFor(()=>expect(db.rows.get('one:budget-eur')).toEqual({amount:''}));
});

test('editing a filtered row saves the original expense index and category', async () => {
  render(<Expenses/>);await waitReady('Expense name');
  fireEvent.change(screen.getByLabelText('Filter by category'),{target:{value:'Transport'}});
  fireEvent.click(screen.getByRole('button',{name:'Edit'}));
  expect((screen.getByLabelText('Edit expense name') as HTMLInputElement).value).toBe('Transport');
  fireEvent.change(screen.getByLabelText('Edit expense amount'),{target:{value:'125.25'}});
  fireEvent.change(screen.getByLabelText('Edit expense category'),{target:{value:'Travel'}});
  fireEvent.click(screen.getByRole('button',{name:'Save expense'}));
  await waitFor(()=>expect(screen.queryByLabelText('Edit expense amount')).toBeNull());
  const rows=db.rows.get('one:expenses-eur') as {head:string;amount:number;category?:string}[];
  expect(rows[0]).toEqual({head:'Rent',amount:400});
  expect(rows[2]).toEqual({head:'Transport',amount:125.25,category:'Travel'});
  expect(screen.getByText('No expenses in this category.')).toBeTruthy();
  expect(screen.getByText('825.25 €')).toBeTruthy();
});

test('removal cannot shift another expense while its edit is open', async () => {
  db.rows.set('one:expenses-eur', Array.from({length:6},(_,i)=>({head:`Expense ${i}`,amount:i})));
  render(<Expenses/>);await waitReady('Expense name');
  fireEvent.click(screen.getAllByRole('button',{name:'Edit'})[5]);
  expect((screen.getByRole('button',{name:'Remove'}) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByLabelText('Filter by category') as HTMLSelectElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Edit expense amount'),{target:{value:'25.50'}});
  fireEvent.click(screen.getByRole('button',{name:'Save expense'}));
  await waitFor(()=>expect(screen.queryByLabelText('Edit expense amount')).toBeNull());
  const rows=db.rows.get('one:expenses-eur') as {head:string;amount:number}[];
  expect(rows[4]).toEqual({head:'Expense 4',amount:4});
  expect(rows[5]).toMatchObject({head:'Expense 5',amount:25.5});
});

test('expanded profile becomes a resume after save, reloads, and cancels edits', async () => {
  const view=render(<Profile/>);await waitReady('First Name');
  fireEvent.change(screen.getByLabelText('First Name'),{target:{value:'Mira'}});
  fireEvent.change(screen.getByLabelText('Email address'),{target:{value:'mira@example.com'}});
  fireEvent.change(screen.getByLabelText('Date of birth'),{target:{value:'2000-04-15'}});
  fireEvent.change(screen.getByLabelText('Postal code / PIN code'),{target:{value:'SW1A 1AA'}});
  fireEvent.change(screen.getByLabelText('Class 12 grading system'),{target:{value:'percentage'}});
  fireEvent.change(screen.getByLabelText('Class 12 marks / CGPA'),{target:{value:'92.5'}});
  fireEvent.click(screen.getByRole('button',{name:'Save Changes'}));
  await screen.findByRole('button',{name:'Edit profile'});
  expect(screen.queryByLabelText('First Name')).toBeNull();
  expect(screen.getByText('SW1A 1AA')).toBeTruthy();
  expect(screen.getAllByText('mira@example.com').length).toBeGreaterThan(0);
  expect(db.rows.get('one:profile')).toMatchObject({email:'mira@example.com',dateOfBirth:'2000-04-15',class12Score:'92.5'});
  view.unmount();render(<Profile/>);
  fireEvent.click(await screen.findByRole('button',{name:'Edit profile'}));
  expect((screen.getByLabelText('Email address') as HTMLInputElement).value).toBe('mira@example.com');
  fireEvent.change(screen.getByLabelText('First Name'),{target:{value:'Unsaved'}});
  fireEvent.click(screen.getByRole('button',{name:'Cancel'}));
  expect(screen.queryByText('Unsaved')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Edit profile'}));
  expect((screen.getByLabelText('First Name') as HTMLInputElement).value).toBe('Mira');
});

test('legacy six-field profiles open in resume view and keep their details when extended', async () => {
  db.rows.set('one:profile',{firstName:'Legacy',lastName:'Student',programInterest:'masters',qualification:'graduate',englishTest:'ielts',aptitudeTest:'gre'});
  render(<Profile/>);
  fireEvent.click(await screen.findByRole('button',{name:'Edit profile'}));
  expect((screen.getByLabelText('Have you taken any English tests?') as HTMLSelectElement).value).toBe('ielts');
  fireEvent.change(screen.getByLabelText('City'),{target:{value:'Berlin'}});
  fireEvent.click(screen.getByRole('button',{name:'Save Changes'}));
  await screen.findByRole('button',{name:'Edit profile'});
  expect(db.rows.get('one:profile')).toMatchObject({firstName:'Legacy',englishTest:'ielts',city:'Berlin'});
});

test('invalid GPA scale keeps profile in edit mode without saving', async () => {
  render(<Profile/>);await waitReady('First Name');
  fireEvent.change(screen.getByLabelText('Graduation grading system'),{target:{value:'cgpa'}});
  fireEvent.change(screen.getByLabelText('Graduation CGPA / percentage'),{target:{value:'8.5'}});
  fireEvent.click(screen.getByRole('button',{name:'Save Changes'}));
  await screen.findByRole('alert');
  expect(db.rows.has('one:profile')).toBe(false);
  expect(screen.getByLabelText('Graduation CGPA / percentage')).toBeTruthy();
});
