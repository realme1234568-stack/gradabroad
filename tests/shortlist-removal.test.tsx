import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const db = vi.hoisted(() => ({ notify: vi.fn(), mode: 'success', calls: 0, rows: [] as { id: string; university_name: string; course_name: string }[] }));
vi.mock('@/components/NotificationProvider', () => ({ useNotifications: () => ({ notify: db.notify }) }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: {
 auth: { getUser: async () => ({data:{user:{id:'user-a'}}}), onAuthStateChange: () => ({data:{subscription:{unsubscribe(){}}}}) },
 from: () => {
  const chain = {select:()=>chain,eq:()=>chain,order:()=>chain,range:async()=>({data:db.rows,error:null})};
  return {...chain, delete:()=>{
   db.calls++;
   const deleted={eq:()=>deleted,select:async()=>{
    if(db.mode==='throw')throw new Error('network');
    if(db.mode==='error')return {data:null,error:new Error('denied')};
    if(db.mode==='empty')return {data:[],error:null};
    db.rows=[];return {data:[{id:'saved'}],error:null};
   }};
   return deleted;
  }};
 }
} }));
import MyShortlist from '@/app/dashboard/my-shortlist/page';
beforeEach(() => { db.notify.mockReset(); db.mode = 'success'; db.calls = 0; db.rows = [{ id: 'saved', university_name: 'TU Berlin', course_name: 'IMES' }]; });
afterEach(cleanup);
test.each(['error', 'empty', 'throw'])('failed deletion (%s) keeps the entry and allows retry', async mode => {
  db.mode = mode; render(<MyShortlist />);
  fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm removal' }));
  await screen.findByRole('alert');
  expect(screen.getByText('TU Berlin')).toBeTruthy();
  expect(db.notify).not.toHaveBeenCalled();
  expect((screen.getByRole('button', { name: 'Remove' }) as HTMLButtonElement).disabled).toBe(false);
  db.mode = 'success'; fireEvent.click(screen.getByRole('button', { name: 'Confirm removal' }));
  await screen.findByText('No universities shortlisted yet.');
  expect(screen.queryByRole('alert')).toBeNull();
  expect(db.notify).toHaveBeenCalledWith('TU Berlin — IMES removed from your shortlist.');
});
test('confirmed deletion stays removed after reload', async () => {
  const view = render(<MyShortlist />);
  const remove = await screen.findByRole('button', { name: 'Remove' });
  fireEvent.click(remove); const confirm = screen.getByRole('button', {name:'Confirm removal'}); fireEvent.click(confirm); fireEvent.click(confirm);
  await waitFor(() => expect(screen.queryByText('TU Berlin')).toBeNull());
  expect(db.calls).toBe(1);
  view.unmount(); render(<MyShortlist />);
  await screen.findByText('No universities shortlisted yet.');
});
