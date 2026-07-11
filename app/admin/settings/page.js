'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Input, Textarea, ImageUploader } from '@/components/admin/AdminUI';

export default function SettingsAdmin() {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { api.get('/settings').then(setForm).catch((e) => setErr(e.message)); }, []);
  if (!form) return <div className="a-panel">Loading settings…</div>;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSocial = (k, v) => setForm((f) => ({ ...f, social: { ...f.social, [k]: v } }));
  const setShip = (k, v) => setForm((f) => ({ ...f, shipping: { ...f.shipping, [k]: Number(v) || 0 } }));

  const save = async () => {
    setBusy(true); setMsg(''); setErr('');
    try {
      const saved = await api.put('/settings', form);
      setForm(saved);
      setMsg('Settings saved. Refresh the storefront to see title/favicon updates.');
      setTimeout(() => setMsg(''), 4000);
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  return (
    <div>
      {msg && <div className="a-panel" style={{ background: '#e4f5ec', color: 'var(--a-green)' }}>{msg}</div>}
      {err && <div className="login-err">{err}</div>}

      <div className="a-panel">
        <h3>Site identity <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--a-muted)' }}>(browser title & favicon)</span></h3>
        <div className="a-form">
          <Input label="Site title (browser tab)" full value={form.siteTitle} onChange={(e) => set('siteTitle', e.target.value)} />
          <Input label="Brand name" value={form.brandName} onChange={(e) => set('brandName', e.target.value)} />
          <Input label="Brand subtitle" value={form.brandSub} onChange={(e) => set('brandSub', e.target.value)} />
          <Textarea label="Tagline / meta description" full value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
        </div>
        <div className="a-grid2" style={{ marginTop: 16 }}>
          <div className="a-field"><label>Header logo</label>
            <ImageUploader folder="aligaah/brand" value={form.logo}
              onChange={(img) => setForm((f) => ({ ...f, logo: img.url, logoPublicId: img.publicId }))} /></div>
          <div className="a-field"><label>Footer logo (transparent)</label>
            <ImageUploader folder="aligaah/brand" value={form.logoTransparent}
              onChange={(img) => setForm((f) => ({ ...f, logoTransparent: img.url, logoTransparentPublicId: img.publicId }))} /></div>
          <div className="a-field"><label>Favicon</label>
            <ImageUploader square folder="aligaah/brand" value={form.favicon}
              onChange={(img) => setForm((f) => ({ ...f, favicon: img.url, faviconPublicId: img.publicId }))} />
            <div className="a-note">Used as the browser-tab icon. Square PNG works best.</div></div>
        </div>
      </div>

      <div className="a-panel">
        <h3>Footer & social links</h3>
        <div className="a-form">
          <Textarea label="Footer text" full value={form.footerText} onChange={(e) => set('footerText', e.target.value)} />
          <Input label="Facebook URL" value={form.social?.facebook || ''} onChange={(e) => setSocial('facebook', e.target.value)} />
          <Input label="X (Twitter) URL" value={form.social?.x || ''} onChange={(e) => setSocial('x', e.target.value)} />
          <Input label="Pinterest URL" value={form.social?.pinterest || ''} onChange={(e) => setSocial('pinterest', e.target.value)} />
          <Input label="LinkedIn URL" value={form.social?.linkedin || ''} onChange={(e) => setSocial('linkedin', e.target.value)} />
          <Input label="Telegram URL" value={form.social?.telegram || ''} onChange={(e) => setSocial('telegram', e.target.value)} />
        </div>
      </div>

      <div className="a-panel">
        <h3>Shipping</h3>
        <div className="a-form">
          <Input label="Free shipping above (₹, 0 = off)" type="number" value={form.shipping?.freeAbove || 0} onChange={(e) => setShip('freeAbove', e.target.value)} />
          <Input label="Flat shipping fee (₹)" type="number" value={form.shipping?.flatFee || 0} onChange={(e) => setShip('flatFee', e.target.value)} />
        </div>
      </div>

      <button className="btn btn-gold" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save all settings'}</button>
    </div>
  );
}
