'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Input, Textarea, Check, ImageUploader, Modal } from '@/components/admin/AdminUI';

const blank = { name: '', description: '', order: 0, image: '', imagePublicId: '', isActive: true };

export default function CategoriesAdmin() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = () => api.get('/categories?all=1').then(setItems).catch(() => {});
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setForm(blank); setEditing('new'); setErr(''); };
  const openEdit = (c) => { setForm({ ...c }); setEditing(c._id); setErr(''); };

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const body = { ...form, order: Number(form.order) || 0 };
      if (editing === 'new') await api.post('/categories', body, true);
      else await api.put(`/categories/${editing}`, body);
      setEditing(null); load();
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  const remove = async (c) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try { await api.del(`/categories/${c._id}`); load(); }
    catch (ex) { alert(ex.message); }
  };

  return (
    <div>
      <div className="a-toolbar">
        <div style={{ color: 'var(--a-soft)', fontSize: 14 }}>Collections shown on the storefront</div>
        <button className="btn btn-gold" onClick={openNew}>+ Add category</button>
      </div>
      <div className="a-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="a-table">
          <thead><tr><th>Category</th><th>Slug</th><th>Products</th><th>Order</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c._id}>
                <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {c.image ? <img className="a-thumb sq" src={c.image} alt="" /> : <div className="a-thumb sq" />}
                  <b>{c.name}</b>
                </td>
                <td style={{ color: 'var(--a-muted)' }}>{c.slug}</td>
                <td>{c.count ?? '—'}</td>
                <td>{c.order}</td>
                <td><span className={`pill ${c.isActive ? 'on' : 'off'}`}>{c.isActive ? 'Active' : 'Hidden'}</span></td>
                <td><div className="a-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>Delete</button>
                </div></td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={6} className="a-empty">No categories yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Add category' : 'Edit category'} onClose={() => setEditing(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-gold" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </>}>
          {err && <div className="login-err">{err}</div>}
          <div className="a-form">
            <Input label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Saree" />
            <Input label="Display order" type="number" value={form.order} onChange={(e) => set('order', e.target.value)} />
            <Textarea label="Description" full value={form.description} onChange={(e) => set('description', e.target.value)} />
            <div className="a-field full">
              <label>Category image (circle on storefront)</label>
              <ImageUploader square folder="aligaah/categories" value={form.image}
                onChange={(img) => setForm((f) => ({ ...f, image: img.url, imagePublicId: img.publicId }))} />
            </div>
            <div className="a-field full"><Check label="Active (visible on storefront)" checked={form.isActive} onChange={(v) => set('isActive', v)} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
