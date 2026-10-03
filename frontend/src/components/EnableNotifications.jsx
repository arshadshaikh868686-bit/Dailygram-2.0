import { useState } from 'react';
import { enablePush } from '../lib/push';

export default function EnableNotifications() {
  const [enabled, setEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setBusy(true);
    setError('');

    try {
      const result = await enablePush();

      if (result.ok) {
        setEnabled(true);
      } else if (result.reason === 'denied') {
        setError('Notifications are blocked. Please allow them in your browser site settings.');
      } else if (result.reason === 'unsupported') {
        setError('Push notifications are not supported by this browser.');
      } else {
        setError('Failed to set up notifications. Please try again.');
      }
    } catch (e) {
      console.error('enablePush failed:', e);
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (enabled) {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/10">
        <span>🔔</span> Notifications enabled
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? (
          <>
            <svg className="h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Enabling...</span>
          </>
        ) : (
          <>
            <span>🔔</span> Enable notifications
          </>
        )}
      </button>

      {error && (
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
