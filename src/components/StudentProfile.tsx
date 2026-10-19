"use client";
import { useEffect, useRef, useState } from "react";
import type { useAccountData } from "@/lib/accountData";
import {
  ageFromDateOfBirth,
  emptyProfile,
  localDateString,
  profileDisplayValue,
  profileSections,
  profileValidationError,
  type Profile,
  type ProfileField,
  type ProfileKey,
} from "@/lib/profile";
import FeedbackBox from "@/components/FeedbackBox";
import { Check, ArrowUpRight } from "@/components/LandingIcons";
import s from "@/app/my-profile/profile.module.css";

type ProfileAccount = ReturnType<typeof useAccountData<Profile>>;
export default function StudentProfile({
  account,
}: {
  account: ProfileAccount;
}) {
  const {
    value,
    setValue,
    save,
    reset,
    hasRecord,
    loading,
    saving,
    error,
    ready,
    dirty,
  } = account;
  const profile = { ...emptyProfile, ...value };
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const showingForm = !hasRecord || editing;
  useEffect(() => {
    if (!ready || !showingForm || !dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeNavigate = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element).closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return;
      const destination = new URL(link.href, window.location.href);
      if (
        destination.origin === window.location.origin &&
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search
      )
        return;
      if (
        !window.confirm(
          "Your profile has unsaved changes. Leave without saving?",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", beforeNavigate, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", beforeNavigate, true);
    };
  }, [ready, showingForm, dirty]);
  const age = ageFromDateOfBirth(profile.dateOfBirth);
  const fieldCount = Object.values(profile).filter((text) =>
    text.trim(),
  ).length;
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  const interest = profileSections
    .flatMap((section) => section.fields)
    .find((field) => field.key === "programInterest")!;
  function update(key: ProfileKey, text: string) {
    setSaved(false);
    setValidationError(null);
    setValue({ ...profile, [key]: text });
  }
  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaved(false);
    const validation = profileValidationError(profile);
    if (validation) {
      setValidationError(validation);
      requestAnimationFrame(() => alertRef.current?.focus());
      return;
    }
    if (await save(profile)) {
      setEditing(false);
      setSaved(true);
      requestAnimationFrame(() => editButton.current?.focus());
    }
  }
  function renderField(field: ProfileField) {
    const id = `profile-${field.key}`;
    const text = profile[field.key];
    const hint = field.hint;
    const maxLength = ["firstName", "lastName"].includes(field.key)
      ? 100
      : field.type === "textarea"
        ? 2000
        : field.type === "url"
          ? 500
          : 200;
    const control = field.options ? (
      <select
        id={id}
        value={text}
        onChange={(event) => update(field.key, event.target.value)}
      >
        <option value="">Select</option>
        {field.options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    ) : field.type === "textarea" ? (
      <textarea
        id={id}
        rows={4}
        maxLength={maxLength}
        value={text}
        onChange={(event) => update(field.key, event.target.value)}
      />
    ) : (
      <input
        id={id}
        type={field.type ?? "text"}
        value={text}
        onChange={(event) => update(field.key, event.target.value)}
        maxLength={maxLength}
        autoComplete={field.autocomplete}
        min={field.type === "number" ? 0 : undefined}
        step={
          field.type === "number"
            ? field.key.endsWith("Score") || field.key.endsWith("Scale")
              ? "0.001"
              : "1"
            : undefined
        }
        max={field.type === "date" ? localDateString() : undefined}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
    );
    return (
      <div key={field.key} className={field.wide ? s.wide : undefined}>
        <label htmlFor={id}>{field.label}</label>
        {field.key === "dateOfBirth" ? (
          <div className={s.dob}>
            {control}
            <output aria-live="polite" aria-label="Calculated age">
              <span>Age</span>
              <strong>{age === null ? "—" : `${age} years`}</strong>
            </output>
          </div>
        ) : (
          control
        )}
        {hint && (
          <p id={`${id}-hint`} className={s.hint}>
            {hint}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className={`app-page mx-auto w-full max-w-6xl px-6 py-12 ${s.page}`}>
      <p className="page-eyebrow">YOUR STORY. YOUR NEXT CHAPTER.</p>
      <div className={s.pageHeading}>
        <div>
          <h1>My Profile</h1>
          <p>
            Your background, achievements, and plans. Together in one place.
          </p>
        </div>
        {hasRecord && !showingForm && ready && (
          <button
            ref={editButton}
            type="button"
            className="ga-primary"
            onClick={() => {
              setEditing(true);
              setSaved(false);
            }}
          >
            Edit profile <ArrowUpRight />
          </button>
        )}
      </div>
      <div className={s.privacy}>
        <Check />
        <span>
          Your profile is private to your account. Every field is optional; add
          what is useful to your plans.
        </span>
      </div>
      {loading && <p role="status">Loading your profile…</p>}
      {error && (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}
      {saved && ready && (
        <p role="status" className={s.success}>
          <Check />
          Saved!
        </p>
      )}
      {showingForm ? (
        <>
          <div className={s.editorIntro}>
            <div>
              <span>
                {hasRecord ? "REFINE YOUR PROFILE" : "LET’S GET TO KNOW YOU"}
              </span>
              <h2>
                {hasRecord
                  ? "Keep your story up to date."
                  : "Build a profile that feels like you."}
              </h2>
              <p>
                Save once to turn these details into your personal profile page.
                You can come back to add more at any time.
              </p>
            </div>
            <span className={s.fieldCount}>{fieldCount} details added</span>
          </div>
          <nav className={s.sectionNav} aria-label="Profile sections">
            {profileSections.map((section, i) => (
              <a key={section.id} href={`#profile-${section.id}`}>
                <span>0{i + 1}</span>
                {section.title}
              </a>
            ))}
          </nav>
          <form onSubmit={handleSave} className={s.form}>
            {validationError && (
              <p role="alert" ref={alertRef} tabIndex={-1} className={s.error}>
                {validationError}
              </p>
            )}
            {profileSections.map((section, i) => (
              <fieldset
                disabled={!ready || saving}
                key={section.id}
                id={`profile-${section.id}`}
                className={s.formSection}
              >
                <legend>
                  <span>0{i + 1}</span>
                  {section.title}
                </legend>
                <p className={s.sectionDescription}>{section.description}</p>
                <div className={s.fields}>
                  {section.fields.map(renderField)}
                </div>
              </fieldset>
            ))}
            <div className={s.saveBar}>
              <div>
                <strong>
                  {saving
                    ? "Saving your profile…"
                    : dirty
                      ? "You have unsaved changes"
                      : "Your details, at your pace"}
                </strong>
                <p>Changes are saved only when you select Save Changes.</p>
              </div>
              <div>
                {hasRecord && (
                  <button
                    type="button"
                    disabled={saving}
                    className={s.secondary}
                    onClick={() => {
                      reset();
                      setEditing(false);
                      setValidationError(null);
                    }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="ga-primary"
                  disabled={!dirty || saving || !ready}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </>
      ) : (
        <div className={s.resume}>
          <header className={s.identity}>
            <div className={s.monogram} aria-hidden="true">
              {`${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase() ||
                "GA"}
            </div>
            <div>
              <p>STUDENT PROFILE</p>
              <h2>{name || "Your student profile"}</h2>
              <span>
                {profile.programInterest
                  ? `${profileDisplayValue(interest, profile.programInterest)} applicant`
                  : "Your next chapter starts here"}
                {profile.subjectInterest ? ` · ${profile.subjectInterest}` : ""}
              </span>
              <div className={s.contactLine}>
                {[
                  profile.email,
                  profile.phone,
                  [profile.city, profile.country].filter(Boolean).join(", "),
                ]
                  .filter(Boolean)
                  .map((text, i) => (
                    <span key={i}>{text}</span>
                  ))}
              </div>
            </div>
          </header>
          <div className={s.resumeBody}>
            <aside className={s.resumeAside}>
              <span>AT A GLANCE</span>
              <strong>{fieldCount} details</strong>
              <p>
                {
                  profileSections.filter((section) =>
                    section.fields.some((field) => profile[field.key]),
                  ).length
                }{" "}
                of {profileSections.length} sections started
              </p>
              <nav aria-label="Saved profile sections">
                {profileSections.map((section) => (
                  <a key={section.id} href={`#saved-${section.id}`}>
                    {section.title}
                  </a>
                ))}
              </nav>
              <p>
                Add details when you’re ready. This profile is a personal
                record, not an admission assessment.
              </p>
            </aside>
            <div className={s.resumeSections}>
              {profileSections.map((section, i) => {
                const filled = section.fields.filter((field) =>
                  Boolean(profile[field.key]),
                );
                return (
                  <section
                    key={section.id}
                    id={`saved-${section.id}`}
                    className={s.resumeSection}
                  >
                    <h3>
                      <span>0{i + 1}</span>
                      {section.title}
                    </h3>
                    {filled.length ? (
                      <dl>
                        {filled.map((field) => (
                          <div
                            key={field.key}
                            className={field.wide ? s.wide : undefined}
                          >
                            <dt>{field.label}</dt>
                            <dd>
                              {field.type === "url" ? (
                                <a
                                  href={profile[field.key]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {profile[field.key]} <ArrowUpRight />
                                </a>
                              ) : (
                                profileDisplayValue(field, profile[field.key])
                              )}
                              {field.key === "dateOfBirth" && age !== null && (
                                <span className={s.ageBadge}>
                                  {age} years old
                                </span>
                              )}
                              {(field.key === "class12Score" ||
                                field.key === "graduationScore") && (
                                <span className={s.gradeSuffix}>
                                  {profile[
                                    field.key === "class12Score"
                                      ? "class12GradeType"
                                      : "graduationGradeType"
                                  ] === "percentage"
                                    ? "%"
                                    : ` / ${profile[field.key === "class12Score" ? "class12Scale" : "graduationScale"]}`}
                                </span>
                              )}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className={s.emptySection}>
                        No details added yet. Use Edit profile to add this part
                        of your story.
                      </p>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <FeedbackBox />
    </div>
  );
}
