import { publicMetadata } from "@/lib/seo";
import LegalPolicy from "@/components/LegalPolicy";
export const metadata = publicMetadata("Terms & Conditions | GradAbroad", "Read the terms for using GradAbroad’s Germany study-planning tools and preliminary program information.", "/terms");
export default function TermsPage() { return <div className="app-page px-5"><LegalPolicy kind="terms" /></div>; }
