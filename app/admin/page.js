'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from 'recharts';

const fmtMoney = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export default function Dashboard() {
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState(null);
  const [daily, setDaily] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topScreens, setTopScreens] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/analytics/overview?days=${days}`, true),
      api.get(`/analytics/visits-daily?days=${days}`, true),
      api.get('/analytics/top-products?limit=8', true),
      api.get('/analytics/top-screens?limit=8', true),
    ])
      .then(([o, d, tp, ts]) => { setOverview(o); setDaily(d); setTopProducts(tp); setTopScreens(ts); })
      .catch((e) => setErr(e.message));
  }, [days]);

  const t = overview?.totals || {};
  const chartData = daily.map((d) => ({ day: d.day.slice(5), Visits: d.total, Products: d.products, Visitors: d.visitors }));

  return (
    <div>
      {err && <div className="a-panel" style={{ color: 'var(--a-red)' }}>Could not load analytics: {err}</div>}

      <div className="a-toolbar">
        <div style={{ color: 'var(--a-soft)', fontSize: 14 }}>Store performance overview</div>
        <div className="a-actions">
          {[7, 30, 90].map((n) => (
            <button key={n} className={`btn btn-sm ${days === n ? 'btn-gold' : 'btn-ghost'}`} onClick={() => setDays(n)}>Last {n} days</button>
          ))}
        </div>
      </div>

      <div className="a-cards">
        <Stat lbl="Total Visits" val={t.visits ?? '—'} sub={`${t.pageVisits ?? 0} page · ${t.productVisits ?? 0} product`} />
        <Stat lbl="Unique Visitors" val={t.uniqueVisitors ?? '—'} sub={`in last ${days} days`} />
        <Stat lbl="Products" val={t.products ?? '—'} sub="in catalog" />
        <Stat lbl="Orders" val={t.orders ?? '—'} sub="all time" />
        <Stat lbl="Registered Users" val={t.users ?? '—'} sub="customers" />
        <Stat lbl="Revenue" val={fmtMoney(t.revenue)} sub="all orders" />
      </div>

      <div className="a-panel">
        <h3>Visitors by date <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--a-muted)' }}>({days} days)</span></h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 6, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A75A" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#C9A75A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="Visits" stroke="#B0902F" fill="url(#gv)" strokeWidth={2} />
              <Area type="monotone" dataKey="Visitors" stroke="#3b6fd4" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="a-grid2">
        <div className="a-panel">
          <h3>Most viewed products</h3>
          {topProducts.length ? (
            <table className="a-table">
              <thead><tr><th>Product</th><th>Category</th><th>Views</th></tr></thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.code}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.image ? <img className="a-thumb" src={p.image} alt="" /> : <div className="a-thumb" />}
                      <div><div style={{ fontWeight: 600 }}>{p.title}</div><div style={{ fontSize: 12, color: 'var(--a-muted)' }}>{p.code}</div></div>
                    </td>
                    <td>{p.category}</td>
                    <td><b>{p.views}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="a-empty">No product views tracked yet.</div>}
        </div>

        <div className="a-panel">
          <h3>Most visited screens</h3>
          {topScreens.length ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={topScreens} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="screen" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip />
                  <Bar dataKey="visits" fill="#C9A75A" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="a-empty">No screen visits tracked yet.<br />Browse the storefront to generate data.</div>}
        </div>
      </div>
    </div>
  );
}

function Stat({ lbl, val, sub }) {
  return (
    <div className="a-stat">
      <div className="lbl">{lbl}</div>
      <div className="val">{val}</div>
      <div className="sub">{sub}</div>
    </div>
  );
}
