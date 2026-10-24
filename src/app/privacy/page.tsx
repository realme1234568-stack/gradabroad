import { publicMetadata } from "@/lib/seo";
import LegalPolicy from "@/components/LegalPolicy";
import BackupHandlingNotice from "@/components/BackupHandlingNotice";
export const metadata = publicMetadata("Privacy Policy | GradAbroad", "Read how GradAbroad handles account information, private documents, service providers and privacy requests.", "/privacy");
export default function PrivacyPage() { return <div className="app-page px-5"><LegalPolicy kind="privacy" /><BackupHandlingNotice /></div>; }
