import React from 'react';
import emailjs from '@emailjs/browser';
import Link from 'next/link';

export default function FeedbackBox() {
  const [feedback, setFeedback] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [showPopup, setShowPopup] = React.useState(false);

  const handleSend = async () => {
    if (!feedback.trim()) return;
    setSending(true);
    try {
      await emailjs.send(
        'service_9u7fx3n',
        'template_yk9iiu9',
        {
          name: "Anonymous User",
          email: "realme1234568@gmail.com",
          message: feedback,
        },
        'hAzYMGuWTckYlKD63'
      );
      setSent(true);
      setFeedback("");
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
        setSent(false);
      }, 2500);
    } catch (err) {
      console.error("EmailJS error:", err);
      alert("Failed to send feedback. Please try again later.\n");
    }
    setSending(false);
  };

  return (
    <>
      <div className="feedback-panel">
        {showPopup && <p role="status" className="feedback-confirmation">Your feedback has been sent. Thank you for helping improve GradAbroad.</p>}
        <div className="text-sm font-semibold mb-2 text-ink">Have some feedback for us?</div>
        <textarea
          aria-label="General product feedback"
          aria-describedby="feedback-privacy-help"
          className="w-full rounded-lg border border-line border-accent-ink p-2 text-sm resize-none focus:ring-2 focus:ring-accent-ink focus:outline-none mb-2"
          rows={4}
          maxLength={800}
          placeholder="Share your feedback…"
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          style={{ minHeight: 80, maxHeight: 120, overflow: 'hidden' }}
        />
        <p id="feedback-privacy-help" className="mb-3 text-xs leading-6 text-muted">General product feedback only. Do not include private documents, passwords or sign-in links. For account help, privacy or deletion requests, use <Link href="/contact" className="text-accent-ink underline underline-offset-4">Contact Us</Link>.</p>
        <button
          onClick={handleSend}
          disabled={sending || !feedback.trim()}
          className={
            `w-full mt-1 rounded ga-primary text-ink font-bold py-2 text-sm shadow-sm transition   ` +
            (sending || !feedback.trim() ? 'opacity-60' : '')
          }
        >
          {sent ? 'Sent!' : sending ? 'Sending...' : 'Send'}
        </button>
      </div>

    </>
  );
}
