import { noIndex } from '@/lib/seo';
export const metadata = { robots: noIndex };
export default function PrivateLayout({ children }: { children: React.ReactNode }) { return children; }
