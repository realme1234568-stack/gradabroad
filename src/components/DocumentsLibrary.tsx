"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiArrowDown, FiArrowUpRight, FiCheck, FiFileText, FiFolder, FiLock, FiShield, FiTrash2, FiUploadCloud, FiX } from "react-icons/fi";
import { supabase } from "@/lib/supabaseClient";
import { DOCUMENT_CATEGORIES, documentSize, MAX_DOCUMENT_BYTES, MAX_DOCUMENTS, type DocumentCategory, type StudentDocument } from "@/lib/documents";
import s from "@/app/dashboard/your-documents/documents.module.css";

async function responseData(response: Response) {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not complete this action. Please retry.");
  return data;
}

export default function DocumentsLibrary() {
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>("Academic records");
  const [filter, setFilter] = useState("All documents");
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState<StudentDocument | null>(null);
  const owner = useRef<string | null>(null);
  const epoch = useRef(0);
  const lock = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const deletionDialog = useRef<HTMLDialogElement>(null);
  const deleteTrigger = useRef<HTMLElement | null>(null);
  const requests = useRef(new Set<AbortController>());
  const uploadRequest = useRef<XMLHttpRequest | null>(null);

  const load = useCallback(async () => {
    const current = epoch.current;
    if (!owner.current) return;
    const controller = new AbortController();
    requests.current.add(controller);
    setLoading(true); setError(null);
    try {
      const data = await responseData(await fetch("/api/documents", { headers: { "X-Document-Account": owner.current }, cache: "no-store", signal: controller.signal }));
      if (current === epoch.current) setDocuments(data.documents);
    } catch (failure) {
      if (current === epoch.current && !controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Could not load your documents.");
    } finally {
      requests.current.delete(controller);
      if (current === epoch.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let initialized = false;
    let timer: ReturnType<typeof setTimeout>;
    const reset = (id: string | null) => {
      if (!active || (initialized && owner.current === id)) return;
      initialized = true;
      epoch.current++;
      owner.current = id;
      requests.current.forEach(controller => controller.abort());
      uploadRequest.current?.abort();
      lock.current = false;
      setDocuments([]); setFile(null); setDeleting(null); setBusy(null); setProgress(0); setNotice(null); setError(null); setFilter("All documents"); setCategory("Academic records");
      if (input.current) input.current.value = "";
      setSignedIn(Boolean(id)); setLoading(Boolean(id));
      clearTimeout(timer);
      if (id) timer = setTimeout(() => void load(), 0);
    };
    const { data } = supabase.auth.onAuthStateChange((_event, session) => reset(session?.user.id ?? null));
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!initialized) {
        reset(error ? null : data.user?.id ?? null);
        if (error && active) setError("Could not verify your session. Sign in again to continue.");
      }
    }).catch(() => { if (!initialized) reset(null); });
    const controllers = requests.current;
    const invalidate = () => { epoch.current++; };
    return () => {
      active = false; invalidate(); clearTimeout(timer);
      controllers.forEach(controller => controller.abort()); uploadRequest.current?.abort(); data.subscription.unsubscribe();
    };
  }, [load]);

  useEffect(() => {
    if (deleting) deletionDialog.current?.showModal();
    else {
      if (deletionDialog.current?.open) deletionDialog.current.close();
      deleteTrigger.current?.focus();
    }
  }, [deleting]);

  function chooseFile(selected: File | null) {
    if (lock.current) return;
    setError(null); setNotice(null); setFile(null);
    if (!selected) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(selected.name)) { setError("Choose a PDF, JPG, or PNG file."); return; }
    if (!selected.size || selected.size > MAX_DOCUMENT_BYTES) { setError("Choose a non-empty file smaller than 3 MB."); return; }
    setFile(selected);
  }

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!file || lock.current || !owner.current) return;
    lock.current = true;
    const current = epoch.current;
    setBusy("upload"); setProgress(0); setError(null); setNotice(null);
    try {
      const uploaded: StudentDocument = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        uploadRequest.current = xhr;
        xhr.open("POST", "/api/documents");
        xhr.timeout = 90000;
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.setRequestHeader("X-Document-Name", encodeURIComponent(file.name));
        xhr.setRequestHeader("X-Document-Category", category);
        xhr.setRequestHeader("X-Document-Account", owner.current!);
        xhr.upload.onprogress = event => {
          if (current === epoch.current && event.lengthComputable) setProgress(Math.min(95, Math.round(event.loaded / event.total * 95)));
        };
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status !== 201) reject(new Error(data.error || "Upload failed. Refresh your library before retrying."));
            else resolve(data.document);
          } catch { reject(new Error("Upload could not be confirmed. Refresh your library before retrying.")); }
        };
        xhr.onerror = xhr.ontimeout = () => reject(new Error("Connection interrupted. Refresh your library before retrying."));
        xhr.onabort = () => reject(new Error("Upload cancelled. Refresh your library to check its status."));
        xhr.send(file);
      });
      if (current !== epoch.current) return;
      setDocuments(previous => [uploaded, ...previous.filter(item => item.id !== uploaded.id)]);
      setProgress(100); setFile(null);
      if (input.current) input.current.value = "";
      setNotice("Your document has been uploaded.");
    } catch (failure) {
      if (current === epoch.current) setError(failure instanceof Error ? failure.message : "Upload failed.");
    } finally {
      if (current === epoch.current) { lock.current = false; setBusy(null); uploadRequest.current = null; }
    }
  }

  async function act(document: StudentDocument, action: "download" | "delete") {
    if (lock.current || !owner.current) return;
    lock.current = true;
    const current = epoch.current;
    const controller = new AbortController();
    requests.current.add(controller);
    setBusy(document.id); setError(null); setNotice(null);
    try {
      const response = await fetch(`/api/documents/${document.id}`, { method: action === "delete" ? "DELETE" : "GET", headers: { "X-Document-Account": owner.current }, cache: "no-store", signal: controller.signal });
      if (!response.ok) await responseData(response);
      if (action === "download") {
        const blob = await response.blob();
        if (current !== epoch.current) return;
        const url = URL.createObjectURL(blob);
        const link = window.document.createElement("a");
        link.href = url; link.download = document.original_name;
        window.document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        await responseData(response);
        if (current !== epoch.current) return;
        setDocuments(previous => previous.filter(item => item.id !== document.id));
        setDeleting(null); setNotice("Your document has been deleted from your library.");
      }
    } catch (failure) {
      if (current === epoch.current && !controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Could not complete this action.");
    } finally {
      requests.current.delete(controller);
      if (current === epoch.current) { lock.current = false; setBusy(null); }
    }
  }

  const used = documents.reduce((total, document) => total + document.size_bytes, 0);
  const visible = documents.filter(document => filter === "All documents" || document.category === filter);
  return (
    <div className={`app-page mx-auto w-full max-w-6xl px-6 ${s.page}`}>
      <div className={s.heading}><div><p className="page-eyebrow">YOUR APPLICATION ESSENTIALS</p><h1>Your Documents</h1><p>A private place for the paperwork behind your next chapter.</p></div><span className={s.private}><FiLock aria-hidden="true" /> Private library</span></div>
      <div className={s.stats}>
        <div><FiFolder aria-hidden="true" /><span><strong>{loading ? "—" : documents.length}</strong> of {MAX_DOCUMENTS} documents</span></div>
        <div><FiFileText aria-hidden="true" /><span><strong>{documentSize(used)}</strong> stored</span></div>
        <div><FiShield aria-hidden="true" /><span>Downloads require your signed-in account</span></div>
      </div>
      {!signedIn && !loading ? <section className={s.empty}><FiLock aria-hidden="true" /><h2>Sign in to open your library.</h2><p>Your documents are attached to your account.</p><Link className={s.primary} href="/auth/error?reason=signin&next=%2Fdashboard%2Fyour-documents">Sign in <FiArrowUpRight aria-hidden="true" /></Link></section> : <>
        <div className={s.grid}>
          <form className={s.upload} onSubmit={upload} aria-label="Upload a document">
            <p className="page-eyebrow">KEEP IT TOGETHER</p><h2>Add a document.</h2><p>Organise a copy of the documents you need for your applications.</p>
            <label className={s.drop} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!busy && !loading) chooseFile(event.dataTransfer.files[0] ?? null); }}>
              <FiUploadCloud aria-hidden="true" /><strong>{file ? file.name : "Choose a file or drop it here"}</strong><span>{file ? documentSize(file.size) : "PDF, JPG or PNG · up to 3 MB"}</span>
              <input ref={input} type="file" aria-label="Choose document file" accept=".pdf,.jpg,.jpeg,.png" disabled={Boolean(busy) || loading} onChange={event => chooseFile(event.target.files?.[0] ?? null)} />
            </label>
            <label className={s.field}>Document category<select value={category} disabled={Boolean(busy)} onChange={event => setCategory(event.target.value as DocumentCategory)}>{DOCUMENT_CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></label>
            <p className={s.hint}>PDFs must be unencrypted and non-interactive, with up to 200 pages. Location metadata is removed from uploaded images.</p>
            <button className={s.primary} type="submit" disabled={!file || Boolean(busy) || loading || documents.length >= MAX_DOCUMENTS}><FiUploadCloud aria-hidden="true" /> {busy === "upload" ? "Uploading & checking…" : "Upload document"}</button>
            {busy === "upload" && <div><progress className={s.progress} aria-label="Document upload progress" max={100} value={progress} /><p className={s.hint}>{progress >= 95 ? "Checking and storing your file…" : `${progress}% uploaded`}</p></div>}
          </form>
          <section className={s.library} aria-label="Your uploaded documents">
            <div className={s.libraryHeading}><div><p className="page-eyebrow">READY WHEN YOU NEED THEM</p><h2>Your library</h2></div><button type="button" className={s.secondary} disabled={Boolean(busy) || loading} onClick={() => void load()}>Refresh</button></div>
            <label className={s.field}>Filter by category<select value={filter} onChange={event => setFilter(event.target.value)}><option>All documents</option>{DOCUMENT_CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></label>
            {loading ? <p role="status" className={s.empty}>Loading your documents…</p> : error && !documents.length ? <div className={s.empty}><p>Your library could not be loaded or updated. Use Refresh to check its latest state.</p></div> : !visible.length ? <div className={s.empty}><FiFolder aria-hidden="true" /><h3>{documents.length ? "No documents in this category." : "A fresh start for your files."}</h3><p>{documents.length ? "Choose another category to see your documents." : "Upload your first document. Only your account can access it through GradAbroad."}</p></div> : <ul className={s.list}>{visible.map(document => <li key={document.id} className={s.document}><span className={s.fileIcon}><FiFileText aria-hidden="true" /></span><div className={s.documentInfo}><strong>{document.original_name}</strong><span>{document.category} · {documentSize(document.size_bytes)}</span><span>{new Date(document.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}{document.state === "pending" ? " · Incomplete upload — refresh or delete after 10 minutes" : ""}</span></div><div className={s.actions}><button type="button" disabled={Boolean(busy) || document.state !== "ready"} aria-label={`Download ${document.original_name}`} onClick={() => void act(document, "download")}><FiArrowDown aria-hidden="true" /></button><button type="button" disabled={Boolean(busy)} aria-label={`Delete ${document.original_name}`} onClick={event => { deleteTrigger.current = event.currentTarget; setError(null); setDeleting(document); }}><FiTrash2 aria-hidden="true" /></button></div></li>)}</ul>}
          </section>
        </div>
        <aside className={s.privacy}><FiShield aria-hidden="true" /><div><h2>Personal documents. Personal access.</h2><p>Files are stored privately and checked against your account on every download. There are no public sharing links. Upload only files you own or have permission to store, and keep your originals backed up. Uploading a file does not mark a tracker checklist item as complete or send it to a university.</p></div></aside>
      </>}
      {error && <div className={s.error} role="alert">{error}</div>}
      {notice && <div className={s.notice} role="status"><FiCheck aria-hidden="true" /> {notice}</div>}
      <dialog ref={deletionDialog} className={s.dialog} aria-labelledby="delete-document-title" onCancel={event => { if (busy) event.preventDefault(); else setDeleting(null); }} onClose={() => { if (!busy) setDeleting(null); }}>
        <button type="button" aria-label="Close deletion confirmation" className={s.close} disabled={Boolean(busy)} onClick={() => setDeleting(null)}><FiX aria-hidden="true" /></button><FiTrash2 aria-hidden="true" /><h2 id="delete-document-title">Delete this document?</h2><p><strong>{deleting?.original_name}</strong> will be removed from your library. This cannot be undone here. Keep a copy if you still need it.</p>
        {error && <p role="alert" className={s.error}>{error}</p>}
        <div className={s.dialogActions}><button type="button" className={s.secondary} disabled={Boolean(busy)} onClick={() => setDeleting(null)}>Keep document</button><button type="button" className={s.danger} disabled={Boolean(busy)} onClick={() => deleting && void act(deleting, "delete")}>{busy ? "Deleting…" : "Delete document"}</button></div>
      </dialog>
    </div>
  );
}
