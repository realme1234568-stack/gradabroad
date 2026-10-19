export const legacyProfile = {
  firstName: "",
  lastName: "",
  programInterest: "",
  qualification: "",
  englishTest: "",
  aptitudeTest: "",
};
export const emptyProfile = {
  ...legacyProfile,
  email: "",
  phone: "",
  dateOfBirth: "",
  nationality: "",
  languages: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  schoolName: "",
  class12Board: "",
  class12Stream: "",
  class12Year: "",
  class12GradeType: "",
  class12Score: "",
  class12Scale: "",
  collegeName: "",
  degreeName: "",
  degreeSubject: "",
  graduationYear: "",
  graduationGradeType: "",
  graduationScore: "",
  graduationScale: "",
  englishScore: "",
  englishDate: "",
  aptitudeScore: "",
  aptitudeDate: "",
  germanLevel: "",
  subjectInterest: "",
  preferredIntake: "",
  intakeYear: "",
  preferredCities: "",
  fundingPlan: "",
  currentRole: "",
  employer: "",
  experienceMonths: "",
  skills: "",
  achievements: "",
  activities: "",
  about: "",
  linkedinUrl: "",
  portfolioUrl: "",
};
export type ProfileKey = keyof typeof emptyProfile;
export type Profile = typeof legacyProfile &
  Partial<Record<Exclude<ProfileKey, keyof typeof legacyProfile>, string>>;
export type ProfileField = {
  key: ProfileKey;
  label: string;
  type?: "email" | "tel" | "date" | "url" | "number" | "textarea";
  options?: [string, string][];
  hint?: string;
  autocomplete?: string;
  wide?: boolean;
};
export type ProfileSection = {
  id: string;
  title: string;
  description: string;
  fields: ProfileField[];
};
const gradeOptions: [string, string][] = [
  ["percentage", "Percentage"],
  ["cgpa", "CGPA / GPA"],
];
export const profileSections: ProfileSection[] = [
  {
    id: "personal",
    title: "Personal & contact details",
    description: "The basics, in your own words.",
    fields: [
      { key: "firstName", label: "First Name", autocomplete: "given-name" },
      { key: "lastName", label: "Last Name", autocomplete: "family-name" },
      {
        key: "email",
        label: "Email address",
        type: "email",
        autocomplete: "email",
        hint: "Contact email only. This does not change your sign-in email.",
      },
      { key: "phone", label: "Phone number", type: "tel", autocomplete: "tel" },
      {
        key: "dateOfBirth",
        label: "Date of birth",
        type: "date",
        autocomplete: "bday",
      },
      { key: "nationality", label: "Nationality" },
      { key: "languages", label: "Languages spoken" },
      {
        key: "about",
        label: "About me",
        type: "textarea",
        wide: true,
        hint: "A short introduction, your interests, and what you hope to study.",
      },
    ],
  },
  {
    id: "address",
    title: "Address",
    description: "Where you are currently based.",
    fields: [
      {
        key: "addressLine1",
        label: "Address line 1",
        autocomplete: "address-line1",
        wide: true,
      },
      {
        key: "addressLine2",
        label: "Address line 2",
        autocomplete: "address-line2",
        wide: true,
      },
      { key: "city", label: "City", autocomplete: "address-level2" },
      {
        key: "state",
        label: "State / province",
        autocomplete: "address-level1",
      },
      {
        key: "postalCode",
        label: "Postal code / PIN code",
        autocomplete: "postal-code",
        hint: "Letters and numbers are supported for international addresses.",
      },
      {
        key: "country",
        label: "Country of residence",
        autocomplete: "country-name",
      },
    ],
  },
  {
    id: "school",
    title: "Class 12 / secondary education",
    description: "Your school qualification and original grading system.",
    fields: [
      { key: "schoolName", label: "School name" },
      { key: "class12Board", label: "Board / awarding body" },
      { key: "class12Stream", label: "Stream / subjects" },
      { key: "class12Year", label: "Class 12 completion year", type: "number" },
      {
        key: "class12GradeType",
        label: "Class 12 grading system",
        options: gradeOptions,
      },
      { key: "class12Score", label: "Class 12 marks / CGPA", type: "number" },
      {
        key: "class12Scale",
        label: "Class 12 maximum CGPA / GPA",
        type: "number",
        hint: "For example, 10 or 4. Percentages are always out of 100.",
      },
    ],
  },
  {
    id: "university",
    title: "University education",
    description:
      "Your most recent or current degree. Leave blank if it does not apply.",
    fields: [
      {
        key: "qualification",
        label: "Your highest qualification",
        options: [
          ["12th", "12th pass"],
          ["graduate", "Graduate"],
          ["postgraduate", "Postgraduate"],
          ["other", "Other"],
        ],
      },
      { key: "degreeName", label: "Degree title" },
      { key: "degreeSubject", label: "Major / specialisation" },
      { key: "collegeName", label: "College / university name" },
      {
        key: "graduationYear",
        label: "Graduation / expected completion year",
        type: "number",
      },
      {
        key: "graduationGradeType",
        label: "Graduation grading system",
        options: gradeOptions,
      },
      {
        key: "graduationScore",
        label: "Graduation CGPA / percentage",
        type: "number",
      },
      {
        key: "graduationScale",
        label: "Graduation maximum CGPA / GPA",
        type: "number",
        hint: "Use your university’s original scale. No automatic grade conversion.",
      },
    ],
  },
  {
    id: "tests",
    title: "Language & aptitude tests",
    description: "Record your tests and scores exactly as reported.",
    fields: [
      {
        key: "englishTest",
        label: "Have you taken any English tests?",
        options: [
          ["ielts", "IELTS"],
          ["toefl", "TOEFL"],
          ["duolingo", "Duolingo"],
          ["pte", "PTE"],
          ["cambridge", "Cambridge English"],
          ["other", "Other"],
        ],
      },
      {
        key: "englishScore",
        label: "English test score",
        hint: "You can include overall and section scores.",
      },
      { key: "englishDate", label: "English test date", type: "date" },
      {
        key: "germanLevel",
        label: "German proficiency",
        options: [
          ["none", "Not started"],
          ["a1", "A1"],
          ["a2", "A2"],
          ["b1", "B1"],
          ["b2", "B2"],
          ["c1", "C1"],
          ["c2", "C2"],
        ],
      },
      {
        key: "aptitudeTest",
        label: "Have you given any aptitude test?",
        options: [
          ["gmat", "GMAT"],
          ["gre", "GRE"],
          ["testas", "TestAS"],
          ["other", "Other"],
        ],
      },
      { key: "aptitudeScore", label: "Aptitude test score" },
      { key: "aptitudeDate", label: "Aptitude test date", type: "date" },
    ],
  },
  {
    id: "experience",
    title: "Experience & achievements",
    description: "The experience and interests that make your profile yours.",
    fields: [
      { key: "currentRole", label: "Current / most recent role" },
      { key: "employer", label: "Employer / organisation" },
      {
        key: "experienceMonths",
        label: "Work experience (months)",
        type: "number",
      },
      { key: "skills", label: "Skills", type: "textarea" },
      {
        key: "achievements",
        label: "Projects, awards & achievements",
        type: "textarea",
        wide: true,
      },
      {
        key: "activities",
        label: "Volunteering & extracurricular activities",
        type: "textarea",
        wide: true,
      },
      { key: "linkedinUrl", label: "LinkedIn URL", type: "url" },
      {
        key: "portfolioUrl",
        label: "Portfolio / personal website",
        type: "url",
      },
    ],
  },
  {
    id: "preferences",
    title: "Study plans",
    description: "Your direction for the next chapter.",
    fields: [
      {
        key: "programInterest",
        label: "Which program are you interested in?",
        options: [
          ["bachelors", "Bachelors"],
          ["masters", "Masters"],
          ["doctorate", "Doctorate"],
          ["other", "Other"],
        ],
      },
      { key: "subjectInterest", label: "Preferred subjects / specialisations" },
      {
        key: "preferredIntake",
        label: "Preferred intake",
        options: [
          ["winter", "Winter"],
          ["summer", "Summer"],
          ["flexible", "Flexible / undecided"],
        ],
      },
      { key: "intakeYear", label: "Target intake year", type: "number" },
      { key: "preferredCities", label: "Preferred cities / regions" },
      {
        key: "fundingPlan",
        label: "Funding plan",
        options: [
          ["self", "Self / family funded"],
          ["loan", "Education loan"],
          ["scholarship", "Scholarship"],
          ["mixed", "Combination"],
          ["undecided", "Undecided"],
        ],
      },
    ],
  },
];

export function localDateString(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function ageFromDateOfBirth(
  value: string,
  today = new Date(),
): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const birth = new Date(year, month - 1, day);
  if (
    year < 1900 ||
    birth.getFullYear() !== year ||
    birth.getMonth() !== month - 1 ||
    birth.getDate() !== day ||
    value > localDateString(today)
  )
    return null;
  let age = today.getFullYear() - year;
  if (
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day)
  )
    age--;
  return age;
}
export function profileValidationError(
  profile: Profile,
  today = new Date(),
): string | null {
  if (
    profile.dateOfBirth &&
    ageFromDateOfBirth(profile.dateOfBirth, today) === null
  )
    return "Enter a valid date of birth from 1900 onwards that is not in the future.";
  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email))
    return "Enter a valid email address.";
  for (const key of ["linkedinUrl", "portfolioUrl"] as const) {
    if (profile[key]) {
      try {
        const url = new URL(profile[key]!);
        if (!["https:", "http:"].includes(url.protocol))
          return "Website links must start with https:// or http://.";
      } catch {
        return "Enter a complete website link, including https://.";
      }
    }
  }
  for (const prefix of ["class12", "graduation"] as const) {
    const score = profile[`${prefix}Score`];
    const type = profile[`${prefix}GradeType`];
    const scale = profile[`${prefix}Scale`];
    if (score) {
      if (!type)
        return `Choose the ${prefix === "class12" ? "Class 12" : "graduation"} grading system.`;
      const maximum = type === "percentage" ? 100 : Number(scale);
      if (
        !/^\d+(?:\.\d{1,3})?$/.test(score) ||
        !Number.isFinite(maximum) ||
        maximum <= 0 ||
        maximum > 100 ||
        Number(score) > maximum
      )
        return `Check your ${prefix === "class12" ? "Class 12" : "graduation"} score and maximum grade. Percentages must be 0–100; CGPA needs its original scale.`;
    }
    if (
      scale &&
      (!/^\d+(?:\.\d{1,3})?$/.test(scale) ||
        Number(scale) <= 0 ||
        Number(scale) > 100)
    )
      return "Maximum GPA / CGPA must be greater than 0 and at most 100.";
  }
  for (const key of ["class12Year", "graduationYear", "intakeYear"] as const) {
    const year = profile[key];
    if (
      year &&
      (!/^\d{4}$/.test(year) ||
        Number(year) < 1900 ||
        Number(year) > today.getFullYear() + 10)
    )
      return "Enter a four-digit education or intake year from 1900 up to ten years from now.";
  }
  if (
    profile.experienceMonths &&
    (!/^\d+$/.test(profile.experienceMonths) ||
      Number(profile.experienceMonths) > 1200)
  )
    return "Work experience must be a whole number from 0 to 1,200 months.";
  for (const key of ["englishDate", "aptitudeDate"] as const) {
    if (profile[key] && ageFromDateOfBirth(profile[key]!, today) === null)
      return "Test dates must be valid dates from 1900 onwards and not in the future.";
  }
  return null;
}
export function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as Record<string, unknown>;
  if (
    !Object.keys(legacyProfile).every(
      (key) => typeof p[key] === "string" && (p[key] as string).length <= 100,
    )
  )
    return false;
  for (const section of profileSections)
    for (const field of section.fields) {
      const text = p[field.key];
      if (text === undefined) continue;
      if (
        typeof text !== "string" ||
        text.length >
          (field.type === "textarea" ? 2000 : field.type === "url" ? 500 : 200)
      )
        return false;
      if (
        field.options &&
        text &&
        !field.options.some(([option]) => option === text)
      )
        return false;
    }
  return profileValidationError(p as Profile) === null;
}
export function hasProfileDetails(profile: Profile): boolean {
  return Object.keys(emptyProfile).some((key) =>
    Boolean(profile[key as ProfileKey]?.trim()),
  );
}
export function profileDisplayValue(
  field: ProfileField,
  value: string,
): string {
  if (field.options)
    return field.options.find(([key]) => key === value)?.[1] ?? value;
  if (field.type === "date") {
    const [year, month, day] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(year, month - 1, day));
  }
  return value;
}
