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
      <div className="flex flex-col items-center bg-white/80 dark:bg-zinc-900/80 border border-black/10 dark:border-white/10 rounded-2xl p-5 shadow-md w-full max-w-xs min-w-[220px] mx-auto mt-8 relative">
        {showPopup && (
          <div
            className="absolute left-1/2 z-20 flex flex-col items-center justify-center px-8 py-6 rounded-3xl font-extrabold text-xl animate-crazy-pop feedback-popup-glow"
            style={{
              top: '-40px',
              transform: 'translate(-50%, 0) rotate(-3deg) scale(1.05)',
              minWidth: 260,
              minHeight: 100,
              background: 'rgba(24, 24, 27, 0.95)',
              color: '#fff',
              boxShadow: '0 4px 32px 0 rgba(34,197,94,0.25), 0 0 24px 4px #06b6d4',
              border: '2px solid #fff',
              transition: 'opacity 0.3s',
              textAlign: 'center',
              backdropFilter: 'blur(2px)',
            }}
          >
            <span className="text-4xl mb-2 animate-spin-slow">🎉✨🎊</span>
            <span className="block animate-crazy-text">Your feedback is shared with the founder!</span>
          </div>
        )}
        <div className="text-sm font-semibold mb-2 text-zinc-700 dark:text-zinc-200">Have some feedback for us?</div>
        <textarea
          className="w-full rounded-lg border border-emerald-200 dark:border-emerald-700 p-2 text-sm resize-none focus:ring-2 focus:ring-emerald-300 focus:outline-none mb-2"
          rows={4}
          maxLength={800}
          placeholder="Write directly to the developer... (Completely anonymous)"
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          style={{ minHeight: 80, maxHeight: 120, overflow: 'hidden' }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !feedback.trim()}
          className={
            `w-full mt-1 rounded bg-gradient-to-r from-emerald-400 to-cyan-400 text-white font-bold py-2 text-sm shadow-md transition hover:from-emerald-500 hover:to-cyan-500 ` +
            (sending || !feedback.trim() ? 'opacity-60' : 'animate-glow')
          }
        >
          {sent ? 'Sent!' : sending ? 'Sending...' : 'Send'}
        </button>
      </div>
      <style jsx global>{`
        .feedback-popup-glow {
          border-radius: 1.5rem;
          background: rgba(24, 24, 27, 0.95) !important;
          color: #fff !important;
          box-shadow: 0 4px 32px 0 rgba(34,197,94,0.25), 0 0 24px 4px #06b6d4;
          border: 2px solid #fff;
          text-align: center;
          backdrop-filter: blur(2px);
        }
        @media (prefers-color-scheme: light) {
          .feedback-popup-glow {
            background: rgba(255,255,255,0.98) !important;
            color: #18181b !important;
            border: 2px solid #18181b;
          }
        }
        @keyframes crazy-pop {
          0% { transform: scale(0.7) rotate(-10deg); filter: brightness(1.2); }
          20% { transform: scale(1.1) rotate(8deg); filter: brightness(1.4); }
          40% { transform: scale(0.95) rotate(-6deg); filter: brightness(1.1); }
          60% { transform: scale(1.08) rotate(6deg); filter: brightness(1.3); }
          80% { transform: scale(1.02) rotate(-4deg); filter: brightness(1.2); }
          100% { transform: scale(1.08) rotate(-6deg); filter: brightness(1.2); }
        }
        .animate-crazy-pop {
          animation: crazy-pop 2.5s cubic-bezier(0.68,-0.55,0.27,1.55);
        }
        @keyframes crazy-text {
          0%,100% { color: #fff; text-shadow: 0 0 8px #34d399, 0 0 16px #f472b6; }
          20% { color: #f472b6; text-shadow: 0 0 12px #34d399, 0 0 24px #06b6d4; }
          40% { color: #06b6d4; text-shadow: 0 0 16px #f472b6, 0 0 32px #34d399; }
          60% { color: #34d399; text-shadow: 0 0 20px #06b6d4, 0 0 40px #f472b6; }
          80% { color: #fff; text-shadow: 0 0 24px #34d399, 0 0 48px #f472b6; }
        }
        .animate-crazy-text {
          animation: crazy-text 2.5s linear;
        }
        .animate-spin-slow {
          animation: spin 2.5s linear;
        }
        @keyframes glow {
          0% { box-shadow: 0 0 0px #34d399, 0 0 0px #06b6d4; }
          50% { box-shadow: 0 0 16px #34d399, 0 0 32px #06b6d4; }
          100% { box-shadow: 0 0 0px #34d399, 0 0 0px #06b6d4; }
        }
        .animate-glow {
          animation: glow 1.5s infinite;
        }
      `}</style>
    </>
  );
}
