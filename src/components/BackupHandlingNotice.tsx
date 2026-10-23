import styles from "@/app/legal/legal.module.css";

export default function BackupHandlingNotice() {
  return <aside className={styles.policy} aria-labelledby="backup-handling-title">
    <h2 id="backup-handling-title">Supplemental backup notice · 23 October 2026</h2>
    <p>GradAbroad uses an additional disaster-recovery process. It copies account and sign-in records, profiles, planning information, policy-acceptance records and uploaded documents from Supabase to a restricted operator computer. Temporary readable exports are needed during backup and recovery checks and are removed when the process finishes normally. An interrupted process may require the operator to remove temporary exports.</p>
    <p>Recovery copies are encrypted before being placed in the private Google Drive account controlled by GradAbroad. Google Drive for desktop transfers the encrypted archives; the recovery key is kept outside that Drive folder. An encrypted local recovery repository is also maintained. Access to the operator computer, source credentials and recovery keys is restricted to authorised operators. An operator with the recovery key can decrypt these copies.</p>
    <p>Daily backups and retention are enabled only after an initial recovery test succeeds. Active retention is seven days, while keeping the latest successful recovery point if newer backups fail. Files removed through Drive for desktop may remain in Google Drive Trash for up to another 30 days and continue to count towards storage. Provider logs and other provider retention are governed by their own policies. Storage limits or a Mac that is offline, asleep or signed out can delay or stop backups.</p>
    <p>Verified deletion requests must be reapplied before a recovered service is made available. Backup storage and provider processing are not guaranteed to remain in India or the European Union. For privacy, deletion or recovery questions, contact <a href="mailto:gradabroad.online@gmail.com">gradabroad.online@gmail.com</a>.</p>
    <p>This dated operational notice supplements the policy above. It describes backup handling and does not guarantee recovery.</p>
  </aside>;
}
