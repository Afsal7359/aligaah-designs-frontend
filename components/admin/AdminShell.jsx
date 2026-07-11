'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const NAV = [
  ['/admin', 'Dashboard', 'M4 13h6V4H4v9zm10 7h6V4h-6v16zM4 20h6v-5H4v5z'],
  ['/admin/products', 'Products', 'M20 7 12 3 4 7v10l8 4 8-4V7zM4 7l8 4 8-4M12 21V11'],
  ['/admin/categories', 'Categories', 'M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 13h6v6h-6z'],
  ['/admin/banners', 'Banners', 'M3 5h18v14H3zM3 9h18M8 13h8'],
  ['/admin/coupons', 'Coupons', 'M4 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 8v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-8zM12 6v12'],
  ['/admin/reviews', 'Reviews', 'M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z'],
  ['/admin/orders', 'Orders', 'M6 2h12l2 5H4zM4 7v13h16V7M9 11h6'],
  ['/admin/settings', 'Settings', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.5 2h-5l-.3 2.6a7 7 0 0 0-1.7 1l-2.4-1-2 3.4L3 11a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.3 2.4h5l.3-2.6a7 7 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6a7 7 0 0 0 .1-1z'],
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  const [navOpen, setNavOpen] = useState(false);

  const isLogin = pathname === '/admin/login';

  useEffect(() => {
    const token = localStorage.getItem('aligaah_admin_token');
    const n = localStorage.getItem('aligaah_admin_name') || 'Admin';
    setName(n);
    if (!token && !isLogin) {
      router.replace('/admin/login');
      return;
    }
    if (token && isLogin) {
      router.replace('/admin');
      return;
    }
    setReady(true);
  }, [pathname, isLogin, router]);

  const logout = () => {
    localStorage.removeItem('aligaah_admin_token');
    localStorage.removeItem('aligaah_admin_name');
    router.replace('/admin/login');
  };

  if (isLogin) return <div className="admin">{children}</div>;
  if (!ready) return <div className="admin" style={{ padding: 40 }}>Loading…</div>;

  const title = (NAV.find(([href]) => href === pathname) || [, 'Admin'])[1];

  return (
    <div className={`admin${navOpen ? ' nav-open' : ''}`}>
      <div className="a-backdrop" onClick={() => setNavOpen(false)} />
      <aside className="a-side">
        <div className="a-brand">
          <img src="/logo-mark.png" alt="Aligaah" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <div><b>ALIGAAH</b><span>ADMIN PANEL</span></div>
        </div>
        <nav className="a-nav">
          {NAV.map(([href, label, d]) => (
            <Link key={href} href={href} className={pathname === href ? 'active' : ''} onClick={() => setNavOpen(false)}>
              <svg viewBox="0 0 24 24"><path d={d} /></svg>{label}
            </Link>
          ))}
        </nav>
        <button className="a-logout" onClick={logout}>↳ Log out</button>
      </aside>
      <div className="a-main">
        <div className="a-top">
          <div className="a-top-l">
            <button className="a-menu-btn" onClick={() => setNavOpen(true)} aria-label="Menu">
              <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
            <h1>{title}</h1>
          </div>
          <div className="who">Signed in as <b>{name}</b> · <a href="/" target="_blank" style={{ color: 'var(--a-gold-d)' }}>View site ↗</a></div>
        </div>
        <div className="a-content">{children}</div>
      </div>
    </div>
  );
}
