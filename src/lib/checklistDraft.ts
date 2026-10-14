// Browser-memory drafts survive internal navigation (including Back/Forward).
// They are keyed by account and are cleared only after a confirmed save.
export type ChecklistDraft = {
  docStatus: Record<string, Record<string, boolean>>;
  customDocs: string[];
  mandatoryStatus: Record<string, boolean>;
  customMandatoryDocs: string[];
  newDoc: string;
  newMandatoryDoc: string;
};
export const checklistDrafts = new Map<string, ChecklistDraft>();
