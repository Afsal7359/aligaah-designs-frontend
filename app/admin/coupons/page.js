'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Input, Textarea, Select, Check, Modal } from '@/components/admin/AdminUI';

const blank = {
  code: '', description: '', type: 'percent', value: 10,
  minCartValue: 0, maxDiscount: 0, usageLimit: 0, expiresAt: '', isActive: true,
};

export default function CouponsAdmin() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = () => api.get('/coupons', true).then(setItems).catch(() => {});
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setForm(blank); setEditing('new'); setErr(''); };
  const openEdit = (c) => { setForm({ ...c, expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '' }); setEditing(c._id); setErr(''); };

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const body = {
        ...form, code: form.code.toUpperCase().trim(),
        value: Number(form.value), minCartValue: Number(form.minCartValue) || 0,
        maxDiscount: Number(form.maxDiscount) || 0, usageLimit: Number(form.usageLimit) || 0,
        expiresAt: form.expiresAt || undefined,
      };
      if (editing === 'new') await api.post('/coupons', body, true);
      else await api.put(`/coupons/${editing}`, body);
      setEditing(null); load();
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  const remove = async (c) => { if (!confirm(`Delete coupon ${c.code}?`)) return; await api.del(`/coupons/${c._id}`); load(); };

  return (
    <div>
      <div className="a-toolbar">
        <div style={{ color: 'var(--a-soft)', fontSize: 14 }}>Discount codes customers apply at checkout</div>
        <button className="btn btn-gold" onClick={openNew}>+ Add coupon</button>
      </div>
      <div className="a-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="a-table">
          <thead><tr><th>Code</th><th>Discount</th><th>Min cart</th><th>Used</th><th>Expires</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c._id}>
                <td><b>{c.code}</b><div style={{ fontSize: 12, color: 'var(--a-muted)' }}>{c.description}</div></td>
                <td>{c.type === 'percent' ? `${c.value}%` : `₹${c.value}`}{c.maxDiscount ? <span style={{ fontSize: 11, color: 'var(--a-muted)' }}> (max ₹{c.maxDiscount})</span> : null}</td>
                <td>₹{c.minCartValue}</td>
                <td>{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : '—'}</td>
                <td><span className={`pill ${c.isActive ? 'on' : 'off'}`}>{c.isActive ? 'Active' : 'Off'}</span></td>
                <td><div className="a-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>Delete</button>
                </div></td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={7} className="a-empty">No coupons yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'Add coupon' : 'Edit coupon'} onClose={() => setEditing(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-gold" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </>}>
          {err && <div className="login-err">{err}</div>}
          <div className="a-form">
            <Input label="Code" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="WELCOME10" />
            <Select label="Type" value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed amount (₹)</option>
            </Select>
            <Input label={form.type === 'percent' ? 'Percent off' : 'Amount off (₹)'} type="number" value={form.value} onChange={(e) => set('value', e.target.value)} />
            <Input label="Max discount cap (₹, 0 = none)" type="number" value={form.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} />
            <Input label="Minimum cart value (₹)" type="number" value={form.minCartValue} onChange={(e) => set('minCartValue', e.target.value)} />
            <Input label="Usage limit (0 = unlimited)" type="number" value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} />
            <Input label="Expires on" type="date" value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} />
            <Textarea label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} />
            <div className="a-field full"><Check label="Active" checked={form.isActive} onChange={(v) => set('isActive', v)} /></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
