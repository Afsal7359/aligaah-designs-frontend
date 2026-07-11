'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Input, Select, Check, ImageUploader, Modal } from '@/components/admin/AdminUI';

const blank = {
  title: '', subtitle: '', buttonText: 'SHOP NOW', link: '#shop',
  image: '', imagePublicId: '', position: 'hero', order: 0, isActive: true,
};

export default function BannersAdmin() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = () => api.get('/banners?all=1').then(setItems).catch(() => {});
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setForm(blank); setEditing('new'); setErr(''); };
  const openEdit = (b) => { setForm({ ...b }); setEditing(b._id); setErr(''); };

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const body = { ...form, order: Number(form.order) || 0 };
      if (editing === 'new') await api.post('/banners', body, true);
      else await api.put(`/banners/${editing}`, body);
      setEditing(null); load();
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  const remove = async (b) => { if (!confirm('Delete this banner?')) return; await api.del(`/banners/${b._id}`); load(); };

  return (
    <div>
      <div className="a-toolbar">
        <div style={{ color: 'var(--a-soft)', fontSize: 14 }}>Hero & promotional banners</div>
        <button className="btn btn-gold" onClick={openNew}>+ Add banner</button>
      </div>
      <div className="a-cards" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>
        {items.map((b) => (
          <div key={b._id} className="a-panel" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
            <div style={{ position: 'relative', height: 130, background: '#efe6d6' }}>
              {b.image && <img src={b.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              <span className={`pill ${b.isActive ? 'on' : 'off'}`} style={{ position: 'absolute', top: 10, right: 10 }}>{b.isActive ? 'Active' : 'Hidden'}</span>
              <span className="pill b" style={{ position: 'absolute', top: 10, left: 10 }}>{b.position}</span>
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontWeight: 600 }}>{b.title || '(no title)'}</div>
              <div style={{ fontSize: 12.5, color: 'var(--a-muted)', marginBottom: 10 }}>Button: {b.buttonText} → {b.link}</div>
              <div className="a-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(b)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
        {!items.length && <div className="a-empty">No banners yet.</div>}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Add banner' : 'Edit banner'} onClose={() => setEditing(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-gold" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </>}>
          {err && <div className="login-err">{err}</div>}
          <div className="a-form">
            <Input label="Heading" full value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Unleash Your Fashion Potential" />
            <Input label="Button text" value={form.buttonText} onChange={(e) => set('buttonText', e.target.value)} />
            <Input label="Button link" value={form.link} onChange={(e) => set('link', e.target.value)} placeholder="#shop" />
            <Select label="Position" value={form.position} onChange={(e) => set('position', e.target.value)}>
              <option value="hero">Hero (main)</option>
              <option value="promo">Promo</option>
              <option value="strip">Strip</option>
            </Select>
            <Input label="Display order" type="number" value={form.order} onChange={(e) => set('order', e.target.value)} />
            <div className="a-field full">
              <label>Banner image</label>
              <ImageUploader folder="aligaah/banners" value={form.image}
                onChange={(img) => setForm((f) => ({ ...f, image: img.url, imagePublicId: img.publicId }))} />
            </div>
            <div className="a-field full"><Check label="Active" checked={form.isActive} onChange={(v) => set('isActive', v)} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
