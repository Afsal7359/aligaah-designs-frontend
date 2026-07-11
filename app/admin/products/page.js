'use client';
import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { Input, Textarea, Select, Check, ImageUploader, Modal } from '@/components/admin/AdminUI';

const blank = {
  code: '', title: '', description: '', category: '', price: '', oldPrice: '',
  images: [], stock: 10,
  isHot: false, isSoldOut: false, isFeatured: false, isBestSeller: false, isNewArrival: true, isActive: true,
};

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = () => {
    api.get('/products?limit=200&all=1').then((d) => setProducts(d.products || [])).catch(() => {});
    api.get('/categories?all=1').then(setCategories).catch(() => {});
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return products.filter((p) =>
      p.title.toLowerCase().includes(s) || p.code.toLowerCase().includes(s) || (p.categoryName || '').toLowerCase().includes(s)
    );
  }, [products, q]);

  const openNew = () => { setForm({ ...blank, category: categories[0]?._id || '' }); setEditing('new'); setErr(''); };
  const openEdit = (p) => {
    setForm({
      ...p, category: p.category?._id || p.category || '',
      price: p.price, oldPrice: p.oldPrice, images: p.images || [],
    });
    setEditing(p._id); setErr('');
  };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const body = {
        ...form,
        price: Number(form.price), oldPrice: Number(form.oldPrice) || 0, stock: Number(form.stock) || 0,
      };
      if (editing === 'new') await api.post('/products', body, true);
      else await api.put(`/products/${editing}`, body);
      setEditing(null); load();
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  const remove = async (p) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    await api.del(`/products/${p._id}`);
    load();
  };

  return (
    <div>
      <div className="a-toolbar">
        <div className="a-search">
          <svg viewBox="0 0 24 24" width="16" height="16" style={{ stroke: '#9aa2b1', fill: 'none', strokeWidth: 1.8 }}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
          <input placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button className="btn btn-gold" onClick={openNew}>+ Add product</button>
      </div>

      <div className="a-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="a-table">
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Tags</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p._id}>
                <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {p.images?.[0]?.url ? <img className="a-thumb" src={p.images[0].url} alt="" /> : <div className="a-thumb" />}
                  <div><div style={{ fontWeight: 600 }}>{p.title}</div><div style={{ fontSize: 12, color: 'var(--a-muted)' }}>{p.code}</div></div>
                </td>
                <td>{p.categoryName}</td>
                <td><b>₹{p.price}</b>{p.oldPrice ? <span style={{ color: 'var(--a-muted)', textDecoration: 'line-through', marginLeft: 6, fontSize: 12 }}>₹{p.oldPrice}</span> : null}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {p.isHot && <span className="pill g">Hot</span>}
                    {p.isFeatured && <span className="pill b">Featured</span>}
                    {p.isBestSeller && <span className="pill b">Best</span>}
                    {p.isSoldOut && <span className="pill off">Sold out</span>}
                  </div>
                </td>
                <td><span className={`pill ${p.isActive ? 'on' : 'off'}`}>{p.isActive ? 'Active' : 'Hidden'}</span></td>
                <td>
                  <div className="a-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={6} className="a-empty">No products found.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add product' : 'Edit product'}
          onClose={() => setEditing(null)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn btn-gold" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
          </>}
        >
          {err && <div className="login-err">{err}</div>}
          <div className="a-form">
            <Input label="Product code" value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="AB0501" />
            <Input label="Title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Silk Saree" />
            <Select label="Category" value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
            <Input label="Stock" type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
            <Input label="Selling price (₹)" type="number" value={form.price} onChange={(e) => set('price', e.target.value)} />
            <Input label="MRP / old price (₹)" type="number" value={form.oldPrice} onChange={(e) => set('oldPrice', e.target.value)} />
            <Textarea label="Description" full value={form.description} onChange={(e) => set('description', e.target.value)} />
            <div className="a-field full">
              <label>Product image</label>
              <ImageUploader folder="aligaah/products"
                value={form.images?.[0]?.url}
                onChange={(img) => set('images', img.url ? [img] : [])} />
            </div>
            <div className="a-field full">
              <label>Flags</label>
              <div className="a-checks">
                <Check label="Active (visible)" checked={form.isActive} onChange={(v) => set('isActive', v)} />
                <Check label="Hot" checked={form.isHot} onChange={(v) => set('isHot', v)} />
                <Check label="Featured" checked={form.isFeatured} onChange={(v) => set('isFeatured', v)} />
                <Check label="Best seller" checked={form.isBestSeller} onChange={(v) => set('isBestSeller', v)} />
                <Check label="New arrival" checked={form.isNewArrival} onChange={(v) => set('isNewArrival', v)} />
                <Check label="Sold out" checked={form.isSoldOut} onChange={(v) => set('isSoldOut', v)} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
