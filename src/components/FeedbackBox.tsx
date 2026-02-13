import React from 'react';
import emailjs from '@emailjs/browser';


export default function FeedbackBox() {
  const [feedback, setFeedback] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const realEmail = "realme1234568@gmail.com";
  function maskEmail(email: string) {
    const [user, domain] = email.split("@");
    if (user.length <= 2) return user[0] + "*".repeat(user.length - 1) + "@" + domain;
    return (
      user[0] +
      "*".repeat(user.length - 2) +
      user[user.length - 1] +
      "@" + domain
    );
  }
  const maskedEmail = maskEmail(realEmail);

  const handleSend = async () => {
    if (!feedback.trim()) return;
    setSending(true);
    try {
      await emailjs.send(
        'service_9u7fx3n',
        'template_id6lw8p',
        {
          to_email: 'realme1234568@gmail.com',
          user_name: "User", // Optionally use a real name if available
          subject: "Feedback from user",
          message: feedback,
        },
        'hAzYMGuWTckYlKD63'
      );
      setSent(true);
      setFeedback("");
    } catch (err) {
      console.error("EmailJS error:", err);
      alert("Failed to send feedback. Please try again later.");
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col items-center bg-white/80 dark:bg-zinc-900/80 border border-black/10 dark:border-white/10 rounded-2xl p-5 shadow-md w-full max-w-xs min-w-[220px] mx-auto mt-8">
      <div className="text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-200">Have some feedback for us?</div>
      <textarea
        className="w-full rounded-lg border border-emerald-200 dark:border-emerald-700 p-2 text-sm resize-none focus:ring-2 focus:ring-emerald-300 focus:outline-none mb-2"
        rows={4}
        maxLength={800}
        placeholder="Write directly to the developer..."
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        style={{ minHeight: 80, maxHeight: 120, overflow: 'hidden' }}
      />
      <button
        onClick={handleSend}
        disabled={sending || !feedback.trim() || sent}
        className="w-full mt-1 rounded bg-gradient-to-r from-emerald-400 to-cyan-400 text-white font-bold py-2 text-sm shadow-md transition hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-60"
      >
        {sent ? 'Sent!' : sending ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}
