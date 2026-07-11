import { API_URL } from './api';

function sessionId() {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('aligaah_sid');
  if (!id) {
    id = 'sid_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('aligaah_sid', id);
  }
  return id;
}

// Fire-and-forget page/screen tracking
export function trackScreen(screen, path) {
  if (typeof window === 'undefined') return;
  try {
    fetch(`${API_URL}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        type: 'page',
        screen,
        path: path || (typeof location !== 'undefined' ? location.pathname : '/'),
        sessionId: sessionId(),
        referrer: typeof document !== 'undefined' ? document.referrer : '',
      }),
    }).catch(() => {});
  } catch (_) {}
}

export { sessionId };
