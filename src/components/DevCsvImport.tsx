"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TableOption = "programs" | "shortlists" | "application_tracker";

const schemaHints: Record<TableOption, string> = {
  programs: "user_id, university_name, course_name, level, language, intake",
  shortlists: "user_id, university_name, course_name, deadline, status",
  application_tracker: "user_id, university_name, course_name, status, checklist",
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line).map((v) => v.replace(/^"|"$/g, ""));
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {});
  });

  return { headers, rows };
}

function normalizeChecklist(value: string) {
  if (!value) return [];
  if (value.startsWith("[") || value.startsWith("{")) {
    try {
      const parsed = JSON.parse(value.replace(/'/g, '"'));
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return value
        .replace(/[{}]/g, "")
        .split(",")
        .map((item) => item.replace(/"/g, "").trim())
        .filter(Boolean);
    }
  }
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function DevCsvImport() {
  const [table, setTable] = useState<TableOption>("programs");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { headers, rows } = useMemo(() => parseCsv(csvText), [csvText]);

  const handleFile = async (file: File) => {
    const text = await file.text();
    setCsvText(text);
    setFileName(file.name);
  };

  const handleImport = async () => {
    setLoading(true);
    setStatus(null);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setStatus("Sign in first to import.");
      setLoading(false);
      return;
    }

    if (rows.length === 0) {
      setStatus("No rows detected in CSV.");
      setLoading(false);
      return;
    }

    const payload = rows.map((row) => {
      const userId = row.user_id || user.id;
      const base = { ...row, user_id: userId };
      if (table === "application_tracker") {
        return { ...base, checklist: normalizeChecklist(row.checklist) };
      }
      return base;
    });

    const { error } = await supabase.from(table).insert(payload);

    if (error) {
      setStatus(error.message);
    } else {
      setStatus(`Imported ${payload.length} rows into ${table}.`);
    }

    setLoading(false);
  };

  return (
    <div className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-xl shadow-emerald-200/30 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70 dark:shadow-none">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Target table
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Columns: {schemaHints[table]}
          </p>
        </div>
        <select
          value={table}
          onChange={(event) => setTable(event.target.value as TableOption)}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-white/10 dark:bg-black/60 dark:text-white"
        >
          <option value="programs">programs</option>
          <option value="shortlists">shortlists</option>
          <option value="application_tracker">application_tracker</option>
        </select>
      </div>

      <div className="mt-6 grid gap-4">
        <input
          type="file"
          accept=".csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
          className="text-sm text-zinc-600 file:mr-4 file:rounded-full file:border-0 file:bg-[radial-gradient(circle_at_top,_#34d399,_#22d3ee,_#0ea5e9)] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-zinc-900 dark:text-zinc-300"
        />
        <textarea
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          placeholder="Paste CSV here"
          rows={8}
          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-zinc-900 dark:border-white/10 dark:bg-black/60 dark:text-white"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{fileName ? `Loaded: ${fileName}` : "No file loaded"}</span>
        <span>Headers: {headers.join(", ") || "(none)"}</span>
        <span>Rows: {rows.length}</span>
      </div>

      {status ? (
        <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-200">{status}</p>
      ) : null}

      <button
        type="button"
        onClick={handleImport}
        disabled={loading}
        className="mt-6 rounded-full bg-[radial-gradient(circle_at_top,_#34d399,_#22d3ee,_#0ea5e9)] px-5 py-2 text-xs font-semibold text-zinc-900 shadow-md shadow-emerald-200/40 transition hover:scale-[1.01] disabled:opacity-60"
      >
        Import CSV
      </button>
    </div>
  );
}
