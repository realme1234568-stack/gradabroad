import { applicationStatuses, normalizeApplicationStatus } from "@/lib/applicationStatus";

export default function ApplicationStatusOptions({ value }: { value?: string | null }) {
  const current = normalizeApplicationStatus(value);
  return <>
    {!applicationStatuses.some(status => status === current) && <option value={current}>{current}</option>}
    {applicationStatuses.map(status => <option key={status} value={status}>{status}</option>)}
  </>;
}
