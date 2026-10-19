import React from 'react';
import emailjs from '@emailjs/browser';

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
          className="w-full rounded-lg border border-line border-accent-ink p-2 text-sm resize-none focus:ring-2 focus:ring-accent-ink focus:outline-none mb-2"
          rows={4}
          maxLength={800}
          placeholder="Share your feedback…"
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          style={{ minHeight: 80, maxHeight: 120, overflow: 'hidden' }}
        />
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
