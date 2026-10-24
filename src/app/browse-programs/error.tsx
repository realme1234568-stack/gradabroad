'use client';
export default function CatalogueError({ reset }: { reset: () => void }) { return <div className="app-page mx-auto max-w-3xl px-6"><h1>Programs temporarily unavailable</h1><p role="alert">Could not load programs. Please retry.</p><button type="button" onClick={reset} className="ga-primary mt-6 rounded-lg px-5 py-3">Retry</button></div>; }
