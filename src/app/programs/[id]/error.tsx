'use client';
export default function ProgramError({ reset }: { reset: () => void }) { return <div className="app-page mx-auto max-w-3xl px-6"><h1>Program temporarily unavailable</h1><p role="alert">We could not load this program. Please try again.</p><button type="button" onClick={reset} className="ga-primary mt-6 rounded-lg px-5 py-3">Reload program</button></div>; }
