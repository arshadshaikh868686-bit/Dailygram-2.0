import { useState } from 'react';
import { enablePush } from '../lib/push';

export default function EnableNotifications() {
  // Permission pehle se mili hui hai to button chhupa denge
  const [enabled, setEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setBusy(true);
    setError('');

    try {
      const result = await enablePush(); // permission + subscribe + backend save

      if (result.ok) {
        setEnabled(true);
      } else if (result.reason === 'denied') {
        setError('Notifications blocked hain. Browser ki site settings se allow karo.');
      } else if (result.reason === 'unsupported') {
        setError('Is browser mein notifications supported nahi hain.');
      } else {
        setError('Notifications setup nahi ho paye.');
      }
    } catch (e) {
      console.error('enablePush failed:', e); // asli error console mein dikhega
      setError('Kuch gadbad ho gayi, dobara try karo.');
    } finally {
      setBusy(false);
    }
  };

  if (enabled) {
    return <p className="text-xs font-semibold text-emerald-600">🔔 Notifications on hain</p>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {busy ? 'Enabling...' : '🔔 Enable notifications'}
      </button>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}