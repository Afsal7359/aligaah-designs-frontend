'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(null);

  const load = () => api.get('/orders', true).then(setOrders).catch(() => setOrders([]));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setStatus = async (o, status) => {
    await api.put(`/orders/${o._id}/status`, { status, isPaid: o.isPaid });
    load();
  };

  return (
    <div>
      <div className="a-toolbar"><div style={{ color: 'var(--a-soft)', fontSize: 14 }}>Customer orders</div></div>
      <div className="a-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="a-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{o._id.slice(-6).toUpperCase()}</td>
                <td>{o.shipping?.name || o.user?.name || 'Guest'}<div style={{ fontSize: 12, color: 'var(--a-muted)' }}>{o.shipping?.email || o.user?.email || ''}</div></td>
                <td>{o.items?.length || 0}</td>
                <td><b>₹{o.grandTotal}</b>{o.coupon?.code ? <div style={{ fontSize: 11, color: 'var(--a-gold-d)' }}>{o.coupon.code} −₹{o.coupon.discount}</div> : null}</td>
                <td>
                  <select value={o.status} onChange={(e) => setStatus(o, e.target.value)}
                    style={{ border: '1.5px solid var(--a-line)', borderRadius: 8, padding: '5px 8px', fontSize: 13, fontFamily: 'inherit' }}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ fontSize: 12.5 }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => setOpen(o)}>View</button></td>
              </tr>
            ))}
            {!orders.length && <tr><td colSpan={7} className="a-empty">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Order #{open._id.slice(-6).toUpperCase()}</h2>
            <div style={{ marginBottom: 14, fontSize: 14, color: 'var(--a-soft)' }}>
              <b>{open.shipping?.name}</b> · {open.shipping?.phone} · {open.shipping?.email}<br />
              {[open.shipping?.line1, open.shipping?.city, open.shipping?.state, open.shipping?.pincode].filter(Boolean).join(', ')}
            </div>
            <table className="a-table">
              <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
              <tbody>
                {open.items?.map((it, i) => (
                  <tr key={i}><td>{it.title} <span style={{ color: 'var(--a-muted)' }}>({it.code})</span></td><td>{it.qty}</td><td>₹{it.price}</td></tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 16, textAlign: 'right', fontSize: 15 }}>
              <div>Items: ₹{open.itemsTotal}</div>
              {open.coupon?.discount ? <div style={{ color: 'var(--a-gold-d)' }}>Coupon {open.coupon.code}: −₹{open.coupon.discount}</div> : null}
              <div>Shipping: ₹{open.shippingFee}</div>
              <div style={{ fontWeight: 700, fontSize: 20, marginTop: 6 }}>Total: ₹{open.grandTotal}</div>
            </div>
            <div className="modal-foot"><button className="btn btn-ghost" onClick={() => setOpen(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
