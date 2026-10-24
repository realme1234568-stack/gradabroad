import { normalizeApplicationStatus } from '@/lib/applicationStatus';
import { deadlineDays, type ShortlistItem } from '@/lib/shortlist';
export const coreDocuments = ['Passport', 'APS', 'IELTS', 'LOR', 'Transcript'];
export const applicationDocuments = ['GMAT'];
export function documentProgress(labels: string[], values: Record<string, boolean> = {}) {
  const total = labels.length, complete = labels.filter(label => values[label] === true).length;
  return { complete, total, percent: total ? Math.round(complete / total * 100) : 0 };
}
export function needsDeadlineAction(item: ShortlistItem, now = new Date()) {
  const days = deadlineDays(item.deadline, now);
  return normalizeApplicationStatus(item.status) === 'Shortlisted' && days !== null && days <= 30;
}
export function trackerCsv(items: ShortlistItem[], labels: string[], values: Record<string, Record<string, boolean>>) {
  // Quoting alone does not prevent spreadsheet formula execution.
  const cell = (value: unknown) => {
    let text = String(value ?? '');
    if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  const rows = [['University','Program','Degree','Status','Deadline','Completed application checks','Total application checks','Website','Notes'], ...items.map(item => {
    const progress = documentProgress(labels, values[item.id]);
    return [item.university_name,item.course_name,item.program_level,normalizeApplicationStatus(item.status),item.deadline,progress.complete,progress.total,item.official_url,item.note];
  })];
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}
