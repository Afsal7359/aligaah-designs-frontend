import './globals.css';
import { StoreProvider } from '@/context/StoreContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function getSettings() {
  try {
    const res = await fetch(`${API_URL}/settings`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  }
}

// Dynamic <title> + favicon driven by admin Settings.
// When no custom favicon is set, Next.js falls back to app/icon.svg automatically.
export async function generateMetadata() {
  const s = await getSettings();
  const title = s?.siteTitle || 'Aligaah Designs — Handcrafted Ethnic Wear';
  const description = s?.tagline || 'Handcrafted ethnic wear and modern classics.';
  const meta = { title, description };
  if (s?.favicon) meta.icons = { icon: s.favicon, shortcut: s.favicon, apple: s.favicon };
  return meta;
}

export default async function RootLayout({ children }) {
  const settings = await getSettings();
  return (
    <html lang="en">
      <body>
        <StoreProvider initialSettings={settings}>{children}</StoreProvider>
      </body>
    </html>
  );
}
