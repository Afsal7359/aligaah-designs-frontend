'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Input, Textarea, Select, Check, ImageUploader, Modal } from '@/components/admin/AdminUI';

const blank = { name: '', role: 'Verified Buyer', stars: 5, text: '', avatar: '', avatarPublicId: '', order: 0, isApproved: true };

export default function ReviewsAdmin() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = () => api.get('/reviews?all=1').then(setItems).catch(() => {});
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setForm(blank); setEditing('new'); setErr(''); };
  const openEdit = (r) => { setForm({ ...r }); setEditing(r._id); setErr(''); };

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const body = { ...form, stars: Number(form.stars), order: Number(form.order) || 0 };
      if (editing === 'new') await api.post('/reviews', body, true);
      else await api.put(`/reviews/${editing}`, body);
      setEditing(null); load();
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  const remove = async (r) => { if (!confirm(`Delete review by ${r.name}?`)) return; await api.del(`/reviews/${r._id}`); load(); };

  return (
    <div>
      <div className="a-toolbar">
        <div style={{ color: 'var(--a-soft)', fontSize: 14 }}>Testimonials shown on the storefront</div>
        <button className="btn btn-gold" onClick={openNew}>+ Add review</button>
      </div>
      <div className="a-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="a-table">
          <thead><tr><th>Reviewer</th><th>Rating</th><th>Text</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {items.map((r) => (
              <tr key={r._id}>
                <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {r.avatar ? <img className="a-thumb sq" style={{ borderRadius: '50%' }} src={r.avatar} alt="" /> : <div className="a-thumb sq" style={{ borderRadius: '50%' }} />}
                  <div><b>{r.name}</b><div style={{ fontSize: 12, color: 'var(--a-muted)' }}>{r.role}</div></div>
                </td>
                <td>{'★'.repeat(r.stars)}<span style={{ color: '#ddd' }}>{'★'.repeat(5 - r.stars)}</span></td>
                <td style={{ maxWidth: 340, color: 'var(--a-soft)', fontSize: 13 }}>{r.text.slice(0, 90)}{r.text.length > 90 ? '…' : ''}</td>
                <td><span className={`pill ${r.isApproved ? 'on' : 'off'}`}>{r.isApproved ? 'Shown' : 'Hidden'}</span></td>
                <td><div className="a-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(r)}>Delete</button>
                </div></td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={5} className="a-empty">No reviews yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Add review' : 'Edit review'} onClose={() => setEditing(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-gold" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </>}>
          {err && <div className="login-err">{err}</div>}
          <div className="a-form">
            <Input label="Reviewer name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            <Input label="Role / label" value={form.role} onChange={(e) => set('role', e.target.value)} />
            <Select label="Rating" value={form.stars} onChange={(e) => set('stars', e.target.value)}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
            </Select>
            <Input label="Display order" type="number" value={form.order} onChange={(e) => set('order', e.target.value)} />
            <Textarea label="Review text" full value={form.text} onChange={(e) => set('text', e.target.value)} />
            <div className="a-field full">
              <label>Avatar</label>
              <ImageUploader square folder="aligaah/reviews" value={form.avatar}
                onChange={(img) => setForm((f) => ({ ...f, avatar: img.url, avatarPublicId: img.publicId }))} />
            </div>
            <div className="a-field full"><Check label="Approved (visible on storefront)" checked={form.isApproved} onChange={(v) => set('isApproved', v)} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
