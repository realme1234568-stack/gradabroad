"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiDownload,
  FiEdit2,
  FiGlobe,
  FiLock,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiX,
} from "react-icons/fi";
import { supabase } from "@/lib/supabaseClient";
import {
  blankProgram,
  catalogueCsv,
  editProgram,
  isOwnerCatalogue,
  isOwnerOverview,
  isOwnerProgram,
  ownerError,
  programDraftError,
  type OwnerCatalogue,
  type OwnerOverview,
  type OwnerProgram,
  type ProgramDraft,
} from "@/lib/owner";
import s from "@/app/admin/admin.module.css";

type Filter = { query: string; state: string; page: number };
const initialFilter: Filter = { query: "", state: "all", page: 0 };
export default function OwnerDashboard({
  ownerId,
  client = supabase,
}: {
  ownerId: string;
  client?: Pick<typeof supabase, "rpc" | "auth">;
}) {
  const [overview, setOverview] = useState<OwnerOverview | null>(null);
  const [catalogue, setCatalogue] = useState<OwnerCatalogue | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [accessValid, setAccessValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [selection, setSelection] = useState<OwnerProgram | "new" | null>(null);
  const [draft, setDraft] = useState<ProgramDraft>(blankProgram);
  const dialog = useRef<HTMLDialogElement>(null);
  const catalogueHeading = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const generation = useRef(0);
  const loadNumber = useRef(0);
  const busy = useRef(false);

  const load = useCallback(
    async (next: Filter) => {
      const current = generation.current;
      const request = ++loadNumber.current;
      setLoading(true);
      setError(null);
      try {
        const [stats, programs] = await Promise.all([
          client.rpc("owner_overview"),
          client.rpc("owner_programs", {
            p_query: next.query,
            p_state: next.state,
            p_page: next.page,
          }),
        ]);
        if (current !== generation.current || request !== loadNumber.current)
          return;
        if (stats.error || programs.error)
          throw new Error(
            ownerError(
              stats.error || programs.error,
              "Could not load the owner workspace. Please retry.",
            ),
          );
        if (!isOwnerOverview(stats.data) || !isOwnerCatalogue(programs.data))
          throw new Error(
            "The owner workspace returned an unexpected response. Please reload.",
          );
        setOverview(stats.data);
        setCatalogue(programs.data);
        setFilter(next);
      } catch (err) {
        if (current === generation.current && request === loadNumber.current)
          setError(
            err instanceof Error
              ? err.message
              : "Could not load the owner workspace. Please retry.",
          );
      } finally {
        if (current === generation.current && request === loadNumber.current)
          setLoading(false);
      }
    },
    [client],
  );
  useEffect(() => {
    const invalidate = () => {
      generation.current++;
      loadNumber.current++;
    };
    void load(initialFilter);
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user.id === ownerId) return;
      invalidate();
      setAccessValid(false);
      setOverview(null);
      setCatalogue(null);
      setSelection(null);
      setSuccess("");
      setLoading(false);
    });
    return () => {
      invalidate();
      data.subscription.unsubscribe();
    };
  }, [ownerId, load, client]);
  useEffect(() => {
    if (selection !== null) dialog.current?.showModal();
    else if (dialog.current?.open) dialog.current.close();
  }, [selection]);

  function open(program: OwnerProgram | "new") {
    returnFocus.current = document.activeElement as HTMLElement;
    setDraft(program === "new" ? { ...blankProgram } : editProgram(program));
    setFormError(null);
    setSelection(program);
  }
  function close() {
    if (busy.current) return;
    setSelection(null);
    returnFocus.current?.focus();
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!selection || busy.current || !accessValid) return;
    const invalid = programDraftError(draft);
    if (invalid) {
      setFormError(invalid);
      return;
    }
    busy.current = true;
    setSaving(true);
    setFormError(null);
    setSuccess("");
    const current = generation.current;
    try {
      const program = {
        ...draft,
        university_name: draft.university_name.trim(),
        course_name: draft.course_name.trim(),
        language: draft.language.trim(),
        ...(selection === "new" ? {} : { id: selection.id }),
      };
      const { data, error: saveError } = await client.rpc(
        "owner_save_program",
        {
          p_program: program,
          p_expected_revision: selection === "new" ? null : selection.revision,
        },
      );
      if (current !== generation.current) return;
      if (saveError || !isOwnerProgram(data))
        throw new Error(
          ownerError(
            saveError,
            "Could not save this program. Your changes remain here; please retry.",
          ),
        );
      setSelection(null);
      setCatalogue(null);
      setOverview(null);
      setSuccess(
        data.is_published
          ? "Program saved and published in the catalogue."
          : "Program saved as an unpublished entry. Existing student shortlists are unchanged.",
      );
      returnFocus.current?.focus();
      await load(filter);
      requestAnimationFrame(() =>
        catalogueHeading.current?.focus({ preventScroll: true }),
      );
    } catch (err) {
      if (current === generation.current)
        setFormError(
          err instanceof Error
            ? err.message
            : "Could not save this program. Please retry.",
        );
    } finally {
      busy.current = false;
      if (current === generation.current) setSaving(false);
    }
  }
  async function exportCatalogue() {
    if (busy.current || exporting || !accessValid) return;
    setExporting(true);
    setError(null);
    const current = generation.current;
    try {
      const all: OwnerProgram[] = [];
      let page = 0;
      let total = 1;
      while (all.length < total) {
        const { data, error: exportError } = await client.rpc(
          "owner_programs",
          { p_query: "", p_state: "all", p_page: page },
        );
        if (current !== generation.current) return;
        if (exportError || !isOwnerCatalogue(data))
          throw new Error(
            ownerError(
              exportError,
              "Could not export the catalogue. Please retry.",
            ),
          );
        total = data.total;
        all.push(...data.items);
        if (data.items.length === 0 && all.length < total)
          throw new Error("The catalogue changed during export. Please retry.");
        page++;
      }
      const url = URL.createObjectURL(
        new Blob(["\ufeff" + catalogueCsv(all)], {
          type: "text/csv;charset=utf-8",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "gradabroad-catalogue.csv";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setSuccess(
        "Catalogue exported. Includes published and unpublished entries.",
      );
    } catch (err) {
      if (current === generation.current)
        setError(
          err instanceof Error
            ? err.message
            : "Could not export the catalogue.",
        );
    } finally {
      if (current === generation.current) setExporting(false);
    }
  }
  if (!accessValid)
    return (
      <div className={`app-page ${s.page}`}>
        <h1>Account changed</h1>
        <p role="alert">
          The owner workspace has been cleared. Sign in with the owner account
          and reload.
        </p>
        <a href="/admin" className={s.textLink}>
          Reload owner workspace
        </a>
      </div>
    );
  return (
    <div className={`app-page ${s.page}`} aria-busy={loading || saving}>
      <a href="/dashboard" className={s.back}>
        <FiArrowLeft aria-hidden="true" /> Your dashboard
      </a>
      <header className={s.header}>
        <div>
          <p className="page-eyebrow">GRADABROAD · OWNER WORKSPACE</p>
          <h1>
            A little more control<span>.</span>
          </h1>
          <p>
            Look after the platform. Shape the catalogue. Keep your next move
            clear.
          </p>
        </div>
        <span className={s.ownerBadge}>
          <FiShield aria-hidden="true" /> Application owner
        </span>
      </header>
      {error && (
        <div role="alert" className={s.error}>
          <p>{error}</p>
          <button
            type="button"
            disabled={loading}
            onClick={() => void load(filter)}
          >
            Retry loading
          </button>
        </div>
      )}
      <p role="status" aria-live="polite" className={s.status}>
        {success || (loading ? "Loading your owner workspace…" : "")}
      </p>
      <section className={s.access} aria-label="Owner capabilities">
        <div>
          <FiLock aria-hidden="true" />
          <div>
            <p className="page-eyebrow">YOUR VERIFIED ACCOUNT</p>
            <h2>{overview?.email ?? "Verifying your account…"}</h2>
            <p>
              Full access to existing planning tools. No paid plan or account
              quota is currently configured.
            </p>
          </div>
        </div>
        <span>
          <FiCheck aria-hidden="true" /> Owner tools enabled
        </span>
      </section>
      <div className={s.stats}>
        {[
          ["Registered accounts", overview?.accounts],
          ["Catalogue programs", overview?.programs],
          ["Published programs", overview?.published],
          ["Saved applications", overview?.shortlists],
          ["Journeys started", overview?.journeys],
        ].map(([label, value]) => (
          <section key={label} className={s.stat}>
            <p>{label}</p>
            <strong>
              {typeof value === "number" ? value.toLocaleString() : "—"}
            </strong>
          </section>
        ))}
      </div>
      <section className={s.catalogue} aria-labelledby="catalogue-title">
        <div className={s.sectionHeading}>
          <div>
            <p className="page-eyebrow">THE PROGRAM CATALOGUE</p>
            <h2 ref={catalogueHeading} tabIndex={-1} id="catalogue-title">
              Make every entry count.
            </h2>
            <p>
              Add or edit entries and control which ones students can discover.
            </p>
          </div>
          <div className={s.actions}>
            <button
              type="button"
              disabled={loading || saving || exporting}
              onClick={() => void exportCatalogue()}
            >
              <FiDownload aria-hidden="true" />
              {exporting ? "Exporting…" : "Export catalogue"}
            </button>
            <button
              type="button"
              className="ga-primary"
              disabled={loading || saving}
              onClick={() => open("new")}
            >
              <FiPlus aria-hidden="true" /> Add program
            </button>
          </div>
        </div>
        <form
          className={s.filters}
          onSubmit={(event) => {
            event.preventDefault();
            void load({ query: search.trim(), state: filter.state, page: 0 });
          }}
        >
          <label>
            <span>Catalogue search</span>
            <div className={s.searchBox}>
              <FiSearch aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="University or course name"
                maxLength={120}
              />
            </div>
          </label>
          <label>
            <span>Visibility</span>
            <select
              value={filter.state}
              disabled={loading || saving}
              onChange={(event) =>
                void load({
                  query: search.trim(),
                  state: event.target.value,
                  page: 0,
                })
              }
            >
              <option value="all">All entries</option>
              <option value="published">Published</option>
              <option value="archived">Unpublished</option>
            </select>
          </label>
          <button type="submit" disabled={loading || saving}>
            Search
          </button>
          <button
            type="button"
            disabled={loading || saving}
            aria-label="Reload catalogue"
            onClick={() => void load(filter)}
          >
            <FiRefreshCw aria-hidden="true" />
          </button>
        </form>
        {catalogue ? (
          <>
            <div
              className={s.tableViewport}
              role="region"
              aria-label="Editable program catalogue"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">University / course</th>
                    <th scope="col">Degree</th>
                    <th scope="col">Language</th>
                    <th scope="col">Visibility</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {catalogue.items.map((program) => (
                    <tr key={program.id}>
                      <td>
                        <strong>{program.university_name}</strong>
                        <span>{program.course_name}</span>
                      </td>
                      <td>{program.level ?? "Unspecified"}</td>
                      <td>{program.language || "Unspecified"}</td>
                      <td>
                        <span
                          className={s.visibility}
                          data-published={program.is_published}
                        >
                          {program.is_published ? (
                            <FiGlobe aria-hidden="true" />
                          ) : (
                            <FiLock aria-hidden="true" />
                          )}
                          {program.is_published ? "Published" : "Unpublished"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          disabled={saving || loading}
                          aria-label={`Edit ${program.course_name} at ${program.university_name}`}
                          onClick={() => open(program)}
                        >
                          <FiEdit2 aria-hidden="true" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {catalogue.items.length === 0 && (
              <p className={s.empty}>No programs match these filters.</p>
            )}
            <div className={s.pagination}>
              <span>
                {catalogue.total.toLocaleString()} entries · Page{" "}
                {catalogue.page + 1} of{" "}
                {Math.max(1, Math.ceil(catalogue.total / 25))}
              </span>
              <div>
                <button
                  type="button"
                  disabled={loading || catalogue.page === 0}
                  onClick={() =>
                    void load({ ...filter, page: filter.page - 1 })
                  }
                >
                  <FiArrowLeft aria-hidden="true" />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={
                    loading || (catalogue.page + 1) * 25 >= catalogue.total
                  }
                  onClick={() =>
                    void load({ ...filter, page: filter.page + 1 })
                  }
                >
                  Next
                  <FiArrowRight aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className={s.empty}>
            {loading
              ? "Loading catalogue…"
              : "Catalogue unavailable. Use Retry loading above."}
          </p>
        )}
      </section>
      <div className={s.bottomGrid}>
        <section className={s.activity} aria-labelledby="activity-title">
          <p className="page-eyebrow">A CLEAR RECORD</p>
          <h2 id="activity-title">Recent owner activity</h2>
          {overview ? (
            overview.activity.length ? (
              <ol>
                {overview.activity.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>
                        {item.action
                          .replace("program.", "Program ")
                          .replace("owner.", "Owner ")}
                      </strong>
                      <time dateTime={item.recorded_at}>
                        {new Date(item.recorded_at).toLocaleString()}
                      </time>
                    </div>
                    <p>{item.summary}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={s.empty}>
                Catalogue changes will appear here once you make them.
              </p>
            )
          ) : (
            <p className={s.empty}>
              {loading ? "Loading activity…" : "Activity unavailable."}
            </p>
          )}
        </section>
        <aside className={s.safeguards}>
          <FiShield aria-hidden="true" />
          <h2>Ownership with care.</h2>
          <p>
            Catalogue edits are recorded. Unpublishing removes an entry from
            discovery while preserving students’ saved applications.
          </p>
          <p>
            Personal profiles, budgets, checklists, and journey details remain
            private to their users. This workspace shows platform totals.
          </p>
          <a href="/browse-programs" className={s.textLink}>
            See the public catalogue <FiArrowRight aria-hidden="true" />
          </a>
        </aside>
      </div>
      <dialog
        ref={dialog}
        className={s.dialog}
        aria-labelledby="program-editor-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => setSelection(null)}
      >
        {selection && (
          <>
            <button
              type="button"
              className={s.close}
              aria-label="Close program editor"
              disabled={saving}
              onClick={close}
            >
              <FiX aria-hidden="true" />
            </button>
            <p className="page-eyebrow">OWNER · CATALOGUE</p>
            <h2 id="program-editor-title">
              {selection === "new"
                ? "A new possibility."
                : "Refine this entry."}
            </h2>
            <p>
              Check the university’s official information before publishing.
            </p>
            <form onSubmit={(event) => void save(event)}>
              <fieldset disabled={saving}>
                <label>
                  University name
                  <input
                    required
                    maxLength={240}
                    value={draft.university_name}
                    onChange={(e) =>
                      setDraft({ ...draft, university_name: e.target.value })
                    }
                  />
                </label>
                <label>
                  Course name
                  <input
                    required
                    maxLength={400}
                    value={draft.course_name}
                    onChange={(e) =>
                      setDraft({ ...draft, course_name: e.target.value })
                    }
                  />
                </label>
                <div className={s.editorGrid}>
                  <label>
                    Degree level
                    <select
                      required
                      value={draft.level}
                      onChange={(e) =>
                        setDraft({ ...draft, level: e.target.value })
                      }
                    >
                      <option value="">Select degree</option>
                      <option value="bachelor">Bachelor’s</option>
                      <option value="master">Master’s</option>
                    </select>
                  </label>
                  <label>
                    Teaching language
                    <input
                      required
                      maxLength={120}
                      value={draft.language}
                      onChange={(e) =>
                        setDraft({ ...draft, language: e.target.value })
                      }
                      placeholder="e.g. English"
                    />
                  </label>
                </div>
                <label className={s.publish}>
                  <input
                    type="checkbox"
                    checked={draft.is_published}
                    onChange={(e) =>
                      setDraft({ ...draft, is_published: e.target.checked })
                    }
                  />
                  <span>
                    <strong>Publish in the public catalogue</strong>
                    <span>
                      {draft.is_published
                        ? "Students will be able to discover this entry after saving."
                        : "This entry will stay unpublished. Saved student applications are preserved."}
                    </span>
                  </span>
                </label>
                {formError && (
                  <p role="alert" className={s.error}>
                    {formError}
                  </p>
                )}
                <div className={s.dialogActions}>
                  <button type="submit" className="ga-primary">
                    {saving ? "Saving…" : "Save program"}
                  </button>
                  <button type="button" onClick={close}>
                    Cancel
                  </button>
                </div>
              </fieldset>
            </form>
          </>
        )}
      </dialog>
    </div>
  );
}
