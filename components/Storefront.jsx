'use client';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { api } from '@/lib/api';
import { trackScreen } from '@/lib/analytics';
import { Tile, StarRow, fmt } from './ui';
import ProductCard from './ProductCard';
import Scroller from './Scroller';

export default function Storefront() {
  const store = useStore();
  const {
    settings, cart, cartCount, cartTotal, changeQty, removeFromCart, clearCart,
    wishlist, toggleWish, addToCart, productsByCode, registerProducts, toast, toastMsg,
    view, goHome, openCategory, openView, openProduct, activeCategory, activeProduct,
  } = store;

  const [hero, setHero] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [arrivalFilter, setArrivalFilter] = useState('all');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('menu');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [showTop, setShowTop] = useState(false);

  // product detail + checkout
  const [detailQty, setDetailQty] = useState(1);
  const [detailSize, setDetailSize] = useState('M');
  const [checkoutForm, setCheckoutForm] = useState({ name: '', phone: '', email: '', line1: '', city: '', state: '', pincode: '' });
  const [couponCode, setCouponCode] = useState('');
  const [couponInfo, setCouponInfo] = useState({ discount: 0, msg: '' });
  const [payMethod, setPayMethod] = useState('razorpay');
  const [placing, setPlacing] = useState(false);
  const [orderDone, setOrderDone] = useState(null);

  // ---------- data ----------
  useEffect(() => {
    api.get('/banners?position=hero').then((b) => setHero(b[0] || null)).catch(() => {});
    api.get('/categories').then(setCategories).catch(() => {});
    api.get('/products?limit=100').then((d) => {
      setProducts(d.products || []);
      registerProducts(d.products || []);
    }).catch(() => {});
    api.get('/products?tag=featured&limit=12').then((d) => {
      setFeatured(d.products || []);
      registerProducts(d.products || []);
    }).catch(() => {});
    api.get('/reviews').then(setReviews).catch(() => {});
    trackScreen('Home', '/');
  }, [registerProducts]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { if (view) goHome(); setSearchOpen(false); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [view, goHome]);

  const arrivals = useMemo(() => {
    if (arrivalFilter === 'featured') return products.filter((p) => p.isFeatured);
    if (arrivalFilter === 'best') return products.filter((p) => p.isBestSeller);
    return products;
  }, [products, arrivalFilter]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.categoryName || '').toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const categoryProducts = useMemo(() => {
    if (!activeCategory) return [];
    const name = (activeCategory.name || activeCategory.slug || '').toLowerCase();
    return products.filter((p) => (p.categoryName || '').toLowerCase() === name);
  }, [products, activeCategory]);

  const s = settings || {};
  const social = s.social || {};

  // ---------- helpers ----------
  const jump = (id, e) => {
    if (e) e.preventDefault();
    if (view) goHome();
    setSearchActive(false);
    setDrawerOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 40);
  };
  const submitSearch = () => {
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    setSearchActive(true);
    goHome();
    trackScreen('Search: ' + searchQuery, '/search');
    window.scrollTo({ top: 0 });
  };
  const goCheckout = () => {
    if (!cart.length) { toast('Your cart is empty'); return; }
    setOrderDone(null);
    openView('checkout', 'Checkout');
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const r = await api.post('/coupons/validate', { code: couponCode, cartValue: cartTotal });
      setCouponInfo({ discount: r.discount, msg: `Applied — you save ${fmt(r.discount)}` });
      toast('Coupon applied');
    } catch (e) {
      setCouponInfo({ discount: 0, msg: e.message || 'Invalid coupon' });
    }
  };
  const orderTotal = Math.max(0, cartTotal - couponInfo.discount);

  const loadRazorpay = () => new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) return resolve(true);
    const sc = document.createElement('script');
    sc.src = 'https://checkout.razorpay.com/v1/checkout.js';
    sc.onload = () => resolve(true);
    sc.onerror = () => resolve(false);
    document.body.appendChild(sc);
  });

  const finishOrder = (order) => {
    clearCart();
    setCouponCode('');
    setCouponInfo({ discount: 0, msg: '' });
    setPlacing(false);
    setOrderDone(order);
    window.scrollTo({ top: 0 });
  };

  const placeOrder = async () => {
    const f = checkoutForm;
    if (!cart.length) { toast('Your cart is empty'); return; }
    if (!f.name || !f.phone || !f.line1 || !f.pincode) { toast('Please fill name, phone, address and pincode'); return; }
    setPlacing(true);
    const payload = {
      items: cart.map((i) => ({ code: i.code, qty: i.qty })),
      shipping: f,
      couponCode: couponInfo.discount ? couponCode : undefined,
      shippingFee: 0,
    };
    try {
      if (payMethod === 'razorpay') {
        const init = await api.post('/orders/razorpay', payload);
        if (init.disabled) {
          const order = await api.post('/orders', { ...payload, paymentMethod: 'COD' });
          toast('Online payment not configured — placed as Cash on Delivery');
          finishOrder(order);
          return;
        }
        const ok = await loadRazorpay();
        if (!ok) { toast('Could not load payment gateway'); setPlacing(false); return; }
        const rzp = new window.Razorpay({
          key: init.keyId,
          amount: init.amount,
          currency: init.currency || 'INR',
          name: `${s.brandName || 'Aligaah'} ${s.brandSub || 'Designs'}`,
          description: 'Order payment',
          order_id: init.orderId,
          prefill: { name: f.name, email: f.email, contact: f.phone },
          theme: { color: '#B0902F' },
          handler: async (resp) => {
            try {
              const order = await api.post('/orders/verify', { ...payload, ...resp });
              finishOrder(order);
            } catch (e) { toast(e.message || 'Payment verification failed'); setPlacing(false); }
          },
          modal: { ondismiss: () => setPlacing(false) },
        });
        rzp.open();
      } else {
        const order = await api.post('/orders', { ...payload, paymentMethod: 'COD' });
        finishOrder(order);
      }
    } catch (e) {
      toast(e.message || 'Could not place order');
      setPlacing(false);
    }
  };

  const homeVisible = !view && !searchActive;

  return (
    <div className="app">
      {/* Social bar */}
      <div className="social-bar">
        <a href={social.facebook || '#'} aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M13 22v-8h2.7l.4-3H13V9c0-.9.3-1.5 1.6-1.5H16V4.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H7v3h2.8v8H13z" /></svg></a>
        <a href={social.x || '#'} aria-label="X"><svg viewBox="0 0 24 24"><path d="M17.5 3h3l-6.6 7.5L21.7 21h-6l-4.7-6.1L5.6 21H2.5l7-8-6.8-10h6.1l4.2 5.6L17.5 3z" /></svg></a>
        <a href={social.pinterest || '#'} aria-label="Pinterest"><svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 4 5.7 4 8.9c0 1.9.7 3.6 2.3 4.2.3.1.5 0 .5-.3l.2-.9c.1-.3 0-.4-.1-.6-.4-.5-.7-1.2-.7-2.1 0-2.7 2-5.1 5.3-5.1 2.9 0 4.5 1.8 4.5 4.1 0 3.1-1.4 5.7-3.4 5.7-1.1 0-2-.9-1.7-2 .3-1.3 1-2.7 1-3.7 0-.8-.5-1.5-1.4-1.5-1.1 0-2 1.2-2 2.7 0 1 .3 1.6.3 1.6l-1.4 5.7c-.4 1.7-.1 3.8 0 4 0 .1.2.2.3.1.1-.1 1.6-2 2.1-3.8l.8-3c.4.8 1.5 1.4 2.7 1.4 3.6 0 6-3.3 6-7.6C20.6 5.1 17.6 2 12 2z" /></svg></a>
        <a href={social.linkedin || '#'} aria-label="LinkedIn"><svg viewBox="0 0 24 24"><path d="M6.5 8.5v11H3v-11h3.5zM4.7 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM21 19.5h-3.5v-5.8c0-1.4-.5-2.3-1.7-2.3-1 0-1.5.6-1.8 1.3-.1.2-.1.6-.1.9v5.9H8.4s.1-9.6 0-10.6h3.5v1.5c.5-.7 1.3-1.8 3.1-1.8 2.3 0 4 1.5 4 4.6v6.3z" /></svg></a>
        <a href={social.telegram || '#'} aria-label="Telegram"><svg viewBox="0 0 24 24"><path d="M21.9 4.3 18.7 19.5c-.2 1-.9 1.3-1.7.8l-4.7-3.5-2.3 2.2c-.3.3-.5.5-.9.5l.3-4.6 8.4-7.6c.4-.3-.1-.5-.6-.2L7 12.3l-4.5-1.4c-1-.3-1-.9.2-1.4l17.6-6.8c.8-.3 1.5.2 1.2 1.6z" /></svg></a>
      </div>

      {/* Header */}
      <header className="header">
        <button className="menu-btn" onClick={() => setDrawerOpen(true)}>
          <span className="bars"><span /><span /><span /></span>Menu
        </button>
        <nav className="desk-nav">
          <a href="#" className="active" onClick={(e) => { e.preventDefault(); goHome(); setSearchActive(false); }}>HOME</a>
          <a href="#shop" onClick={(e) => jump('shop', e)}>SHOP</a>
          <a href="#cats" onClick={(e) => jump('cats', e)}>CATEGORIES</a>
          <a href="#reviews" onClick={(e) => jump('reviews', e)}>REVIEWS</a>
        </nav>
        <div className="brand" style={{ cursor: 'pointer' }} onClick={() => { goHome(); setSearchActive(false); }}>
          <img className="logo" src={s.logo || '/logo-mark.png'} alt="logo" />
          <div className="name">{s.brandName || 'ALIGAAH'}</div>
          <div className="sub">{s.brandSub || 'DESIGNS'}</div>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => openView('cart', 'Cart')}>
            <svg viewBox="0 0 24 24"><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
            <span className="badge">{cartCount}</span>
          </button>
          <button className="icon-btn" onClick={() => { setSearchOpen(true); setTimeout(() => document.getElementById('searchInput')?.focus(), 150); }}>
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
          </button>
        </div>
      </header>

      {/* HOME */}
      {homeVisible && (
        <main>
          {/* Hero */}
          <section className="hero">
            <Tile src={hero?.image} i={1} />
            <div className="hero-copy">
              <h1 dangerouslySetInnerHTML={{ __html: (hero?.title || 'Unleash Your Fashion Potential').replace(/\n/g, '<br>') }} />
              <a href={hero?.link || '#shop'} className="shop-now" onClick={(e) => jump('shop', e)}>{hero?.buttonText || 'SHOP NOW'}</a>
            </div>
          </section>

          {/* Featured Categories */}
          <section className="section" id="cats">
            <div className="eyebrow">Curated Collections</div>
            <h2>Featured Categories</h2>
            <Scroller>
              {categories.map((c, i) => (
                <div className="cat-card" key={c._id} onClick={() => openCategory(c.slug, c.name)}>
                  <div className="circle"><Tile src={c.image} i={i + 2} /></div>
                  <h3>{c.name.toUpperCase()}</h3>
                  <p>{c.count} products</p>
                </div>
              ))}
            </Scroller>
          </section>

          <div className="divider" />

          {/* New Arrivals */}
          <section className="section" id="shop">
            <div className="eyebrow">Fresh Finds</div>
            <h2>New Arrivals</h2>
            <div className="tabs">
              {[['all', 'ALL'], ['featured', 'FEATURED'], ['best', 'BEST SELLING']].map(([f, label]) => (
                <button key={f} className={`tab ${arrivalFilter === f ? 'active' : ''}`} onClick={() => setArrivalFilter(f)}>{label}</button>
              ))}
            </div>
            <div className="track arrivals-grid">
              {arrivals.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          </section>

          <div className="divider" />

          {/* Featured Products */}
          <section className="section" id="featuredSec">
            <div className="eyebrow">Top Picks</div>
            <h2>Featured Products</h2>
            <Scroller>
              {featured.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </Scroller>
          </section>

          {/* Reviews */}
          <section className="reviews" id="reviews">
            <div className="eyebrow">Happy Customers</div>
            <h2>What Our Clients Say</h2>
            <Scroller>
              {reviews.map((r, i) => (
                <div className="review-card" key={r._id}>
                  <StarRow n={r.stars} />
                  <div className="quote">&ldquo;{r.text}&rdquo;</div>
                  <div className="reviewer">
                    <div className="av"><Tile src={r.avatar} i={i} /></div>
                    <div className="who"><b>{r.name}</b><span>{r.role}</span></div>
                  </div>
                </div>
              ))}
            </Scroller>
          </section>

          {/* Footer */}
          <footer className="footer">
            <img className="flogo" src={s.logoTransparent || '/logo-transparent.png'} alt="logo" />
            <p>{s.footerText || 'Handcrafted ethnic wear and modern classics for the woman who dresses with intention.'}</p>
            <div className="flinks"><a href="#">About</a><a href="#shop" onClick={(e) => jump('shop', e)}>Shop</a><a href="#">Contact</a><a href="#">Shipping</a><a href="#">Returns</a></div>
            <div className="copy">© {new Date().getFullYear()} {s.brandName || 'Aligaah'} Designs. All rights reserved.</div>
          </footer>
        </main>
      )}

      {/* SEARCH RESULTS */}
      {searchActive && (
        <section>
          <div className="view-head">
            <button className="view-back" onClick={() => { setSearchActive(false); goHome(); }}><svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" /></svg> BACK</button>
            <span className="view-htitle">Search</span><span style={{ width: 64 }} />
          </div>
          <div className="page-banner"><div className="eyebrow">Results for</div><h2>&ldquo;{searchQuery}&rdquo;</h2></div>
          <div className="page-body">
            <div className="page-count"><b>{searchResults.length}</b> result{searchResults.length === 1 ? '' : 's'}</div>
            <div className="page-grid">
              {searchResults.length ? searchResults.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)
                : <div className="page-empty">No products matched your search.</div>}
            </div>
          </div>
        </section>
      )}

      {/* CATEGORY VIEW */}
      {view === 'category' && (
        <section>
          <div className="view-head">
            <button className="view-back" onClick={goHome}><svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" /></svg> BACK</button>
            <span className="view-htitle">{activeCategory?.name}</span><span style={{ width: 64 }} />
          </div>
          <div className="page-banner"><div className="eyebrow">Collection</div><h2>{activeCategory?.name}</h2></div>
          <div className="page-body">
            <div className="page-count"><b>{categoryProducts.length}</b> product{categoryProducts.length === 1 ? '' : 's'}</div>
            <div className="page-grid">
              {categoryProducts.length ? categoryProducts.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)
                : <div className="page-empty">No products in this collection yet — new pieces are on the way.</div>}
            </div>
          </div>
        </section>
      )}

      {/* PRODUCT DETAIL VIEW */}
      {view === 'product' && (
        <section>
          <div className="view-head">
            <button className="view-back" onClick={goHome}><svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" /></svg> BACK</button>
            <span className="view-htitle">{activeProduct?.title || 'Product'}</span><span style={{ width: 64 }} />
          </div>
          {activeProduct ? (
            <div className="page-body">
              <div className="pdp">
                <div className="pdp-media">
                  <Tile src={activeProduct.images?.[0]?.url || activeProduct.image} i={0} />
                  <div className="pdp-badges">
                    {activeProduct.discount ? <span className="b b-disc">-{activeProduct.discount}%</span> : null}
                    {activeProduct.isHot ? <span className="b b-hot">HOT</span> : null}
                  </div>
                </div>
                <div className="pdp-info">
                  <div className="pdp-cat">{activeProduct.categoryName}</div>
                  <h1 className="pdp-title">{activeProduct.title}</h1>
                  <div className="pdp-code">Code: {activeProduct.code}</div>
                  <div className="pdp-price">
                    {activeProduct.oldPrice ? <span className="old">{fmt(activeProduct.oldPrice)}</span> : null}
                    <span className="new">{fmt(activeProduct.price)}</span>
                  </div>
                  {activeProduct.description
                    ? <p className="pdp-desc">{activeProduct.description}</p>
                    : <p className="pdp-desc">Handcrafted {activeProduct.categoryName?.toLowerCase()} finished by hand in our studio. Premium fabric, quality-checked before dispatch.</p>}
                  <div className="pdp-sizes">
                    <span className="pdp-lbl">Size</span>
                    <div className="size-row">
                      {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                        <button key={sz} className={`size-chip ${detailSize === sz ? 'active' : ''}`} onClick={() => setDetailSize(sz)}>{sz}</button>
                      ))}
                    </div>
                  </div>
                  <div className="pdp-qty">
                    <span className="pdp-lbl">Quantity</span>
                    <div className="qty">
                      <button onClick={() => setDetailQty((q) => Math.max(1, q - 1))}>−</button>
                      <span>{detailQty}</span>
                      <button onClick={() => setDetailQty((q) => q + 1)}>+</button>
                    </div>
                  </div>
                  <div className="pdp-actions">
                    <button className="btn-primary" disabled={activeProduct.isSoldOut}
                      onClick={() => { for (let k = 0; k < detailQty; k++) addToCart(activeProduct.code); }}>
                      {activeProduct.isSoldOut ? 'SOLD OUT' : 'ADD TO CART'}
                    </button>
                    <button className="btn-outline"
                      onClick={() => { for (let k = 0; k < detailQty; k++) addToCart(activeProduct.code); setOrderDone(null); openView('checkout', 'Checkout'); }}>
                      BUY NOW
                    </button>
                    <button className={`pdp-heart ${wishlist.includes(activeProduct.code) ? 'liked' : ''}`}
                      onClick={() => toggleWish(activeProduct.code)} aria-label="Wishlist">
                      <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9.3-8.3C1 8.5 2.4 5 5.6 5 7.6 5 9 6.3 12 9c3-2.7 4.4-4 6.4-4 3.2 0 4.6 3.5 2.9 6.7C19 15.6 12 20 12 20z" /></svg>
                    </button>
                  </div>
                  <ul className="pdp-meta">
                    <li>Handcrafted, quality-checked piece</li>
                    <li>PAN-India shipping in 2–5 days</li>
                    <li>7-day easy exchange</li>
                  </ul>
                </div>
              </div>
              {(() => {
                const related = products.filter((p) => p.categoryName === activeProduct.categoryName && p.code !== activeProduct.code).slice(0, 4);
                return related.length ? (
                  <div className="pdp-related">
                    <h3>You may also like</h3>
                    <div className="page-grid">
                      {related.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          ) : <div className="page-empty">Loading…</div>}
        </section>
      )}

      {/* CHECKOUT VIEW */}
      {view === 'checkout' && (
        <section>
          <div className="view-head">
            <button className="view-back" onClick={() => (orderDone ? goHome() : openView('cart', 'Cart'))}><svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" /></svg> BACK</button>
            <span className="view-htitle">Checkout</span><span style={{ width: 64 }} />
          </div>
          <div className="page-banner"><div className="eyebrow">Almost there</div><h2>Checkout</h2></div>
          <div className="page-body">
            {orderDone ? (
              <div className="order-success">
                <div className="os-check"><svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg></div>
                <h3>Thank you! Your order is placed.</h3>
                <p className="os-id">Order ID: <b>{orderDone._id}</b></p>
                <p>Total <b>{fmt(orderDone.grandTotal)}</b> · {orderDone.isPaid ? 'Paid online' : 'Cash on Delivery'}</p>
                <button className="btn-primary" style={{ maxWidth: 280, margin: '22px auto 0' }} onClick={goHome}>CONTINUE SHOPPING</button>
              </div>
            ) : (
              <div className="checkout-grid">
                <div className="checkout-form">
                  <h3>Shipping details</h3>
                  <div className="field"><label>Full name *</label><input value={checkoutForm.name} onChange={(e) => setCheckoutForm((f) => ({ ...f, name: e.target.value }))} /></div>
                  <div className="c-row">
                    <div className="field"><label>Phone *</label><input value={checkoutForm.phone} onChange={(e) => setCheckoutForm((f) => ({ ...f, phone: e.target.value }))} /></div>
                    <div className="field"><label>Email</label><input type="email" value={checkoutForm.email} onChange={(e) => setCheckoutForm((f) => ({ ...f, email: e.target.value }))} /></div>
                  </div>
                  <div className="field"><label>Address *</label><input value={checkoutForm.line1} onChange={(e) => setCheckoutForm((f) => ({ ...f, line1: e.target.value }))} /></div>
                  <div className="c-row">
                    <div className="field"><label>City</label><input value={checkoutForm.city} onChange={(e) => setCheckoutForm((f) => ({ ...f, city: e.target.value }))} /></div>
                    <div className="field"><label>State</label><input value={checkoutForm.state} onChange={(e) => setCheckoutForm((f) => ({ ...f, state: e.target.value }))} /></div>
                    <div className="field"><label>Pincode *</label><input value={checkoutForm.pincode} onChange={(e) => setCheckoutForm((f) => ({ ...f, pincode: e.target.value }))} /></div>
                  </div>
                  <h3 style={{ marginTop: 20 }}>Payment method</h3>
                  <label className={`pay-opt ${payMethod === 'razorpay' ? 'sel' : ''}`}>
                    <input type="radio" name="pay" checked={payMethod === 'razorpay'} onChange={() => setPayMethod('razorpay')} />
                    <span><b>Pay online</b><em>UPI · Cards · Netbanking (Razorpay)</em></span>
                  </label>
                  <label className={`pay-opt ${payMethod === 'cod' ? 'sel' : ''}`}>
                    <input type="radio" name="pay" checked={payMethod === 'cod'} onChange={() => setPayMethod('cod')} />
                    <span><b>Cash on Delivery</b><em>Pay when it arrives</em></span>
                  </label>
                </div>
                <div className="checkout-summary">
                  <h3>Order summary</h3>
                  {cart.map((i) => {
                    const p = productsByCode[i.code];
                    if (!p) return null;
                    return <div className="cs-line" key={i.code}><span>{p.title} × {i.qty}</span><b>{fmt(p.price * i.qty)}</b></div>;
                  })}
                  <div className="cs-coupon">
                    <input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                    <button onClick={applyCoupon}>APPLY</button>
                  </div>
                  {couponInfo.msg ? <div className="cs-coupon-msg" style={{ color: couponInfo.discount ? '#2e9e6b' : '#C56239' }}>{couponInfo.msg}</div> : null}
                  <div className="cs-line"><span>Subtotal</span><b>{fmt(cartTotal)}</b></div>
                  {couponInfo.discount ? <div className="cs-line"><span>Discount</span><b>−{fmt(couponInfo.discount)}</b></div> : null}
                  <div className="cs-line"><span>Shipping</span><b>Free</b></div>
                  <div className="cs-total"><span>Total</span><b>{fmt(orderTotal)}</b></div>
                  <button className="btn-primary" disabled={placing || !cart.length} onClick={placeOrder}>
                    {placing ? 'Processing…' : (payMethod === 'razorpay' ? `PAY ${fmt(orderTotal)}` : 'PLACE ORDER')}
                  </button>
                  <p className="cs-note">🔒 Secure checkout</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CART VIEW */}
      {view === 'cart' && (
        <section>
          <div className="view-head">
            <button className="view-back" onClick={goHome}><svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" /></svg> BACK</button>
            <span className="view-htitle">Shopping Cart</span><span style={{ width: 64 }} />
          </div>
          <div className="page-banner"><div className="eyebrow">Your Bag</div><h2>Shopping Cart</h2></div>
          <div className="page-body">
            <div className="cart-wrap">
              {cart.length ? cart.map((i) => {
                const p = productsByCode[i.code];
                if (!p) return null;
                return (
                  <div className="line-item" key={i.code}>
                    <div className="li-img"><Tile src={p.images?.[0]?.url} i={0} /></div>
                    <div className="li-info">
                      <div className="li-title">{p.title}</div>
                      <div className="li-cat">{p.categoryName}</div>
                      <div className="li-price">{fmt(p.price)}</div>
                      <div className="li-controls">
                        <div className="qty">
                          <button onClick={() => changeQty(i.code, -1)}>−</button>
                          <span>{i.qty}</span>
                          <button onClick={() => changeQty(i.code, 1)}>+</button>
                        </div>
                        <button className="li-remove" onClick={() => removeFromCart(i.code)}>Remove</button>
                      </div>
                    </div>
                    <div className="li-sub">{fmt(p.price * i.qty)}</div>
                  </div>
                );
              }) : (
                <div className="page-empty">Your cart is empty.<br />
                  <button className="btn-primary" style={{ maxWidth: 260, margin: '18px auto 0' }} onClick={() => jump('shop')}>CONTINUE SHOPPING</button>
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="cart-summary">
                <div className="cart-row"><span className="lbl">Subtotal</span><span className="tot">{fmt(cartTotal)}</span></div>
                <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 14 }}>Taxes included. Shipping calculated at checkout.</div>
                <button className="btn-primary" onClick={goCheckout}>CHECKOUT</button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* WISHLIST VIEW */}
      {view === 'wishlist' && (
        <section>
          <div className="view-head">
            <button className="view-back" onClick={goHome}><svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" /></svg> BACK</button>
            <span className="view-htitle">Wishlist</span><span style={{ width: 64 }} />
          </div>
          <div className="page-banner"><div className="eyebrow">Saved for later</div><h2>My Wishlist</h2></div>
          <div className="page-body">
            <div className="page-grid">
              {wishlist.length ? wishlist.map((code, i) => {
                const p = productsByCode[code] || products.find((x) => x.code === code);
                return p ? <ProductCard key={code} product={p} index={i} /> : null;
              }) : <div className="page-empty">Your wishlist is empty.<br />Tap the ♥ on any product to save it here.</div>}
            </div>
          </div>
        </section>
      )}

      {/* ACCOUNT VIEW */}
      {view === 'account' && (
        <section>
          <div className="view-head">
            <button className="view-back" onClick={goHome}><svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" /></svg> BACK</button>
            <span className="view-htitle">My Account</span><span style={{ width: 64 }} />
          </div>
          <div className="page-banner"><div className="eyebrow">Welcome</div><h2>My Account</h2></div>
          <div className="page-body">
            <div className="account-wrap">
              <div className="field"><label>Email address</label><input type="email" placeholder="you@example.com" /></div>
              <div className="field"><label>Password</label><input type="password" placeholder="••••••••" /></div>
              <button className="btn-primary" onClick={() => toast('Signed in (demo)')}>SIGN IN</button>
              <div className="acct-alt">New here? <a href="#" style={{ color: 'var(--gold-500)', fontWeight: 600 }} onClick={(e) => { e.preventDefault(); toast('Registration (demo)'); }}>Create an account</a></div>
              <ul className="acct-menu">
                <li><a href="#" onClick={(e) => { e.preventDefault(); toast('No orders yet'); }}>My Orders <span>›</span></a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); openView('wishlist', 'Wishlist'); }}>My Wishlist <span>›</span></a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); toast('Saved addresses (demo)'); }}>Saved Addresses <span>›</span></a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); toast('Track order (demo)'); }}>Track Order <span>›</span></a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); toast('Logged out (demo)'); }}>Log Out <span>›</span></a></li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Back to top */}
      <button className={`to-top ${showTop ? 'show' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6" /></svg>
      </button>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        <button className={`bn ${!view ? 'active' : ''}`} onClick={() => { goHome(); setSearchActive(false); setTimeout(() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }), 40); }}>
          <svg viewBox="0 0 24 24"><path d="M4 9h16l-1-4H5L4 9z" /><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" /><path d="M9 20v-6h6v6" /></svg><span>Shop</span>
        </button>
        <button className={`bn ${view === 'wishlist' ? 'active' : ''}`} onClick={() => openView('wishlist', 'Wishlist')}>
          <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9.3-8.3C1 8.5 2.4 5 5.6 5 7.6 5 9 6.3 12 9c3-2.7 4.4-4 6.4-4 3.2 0 4.6 3.5 2.9 6.7C19 15.6 12 20 12 20z" /></svg><span>Wishlist</span>
          {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
        </button>
        <button className={`bn ${view === 'cart' ? 'active' : ''}`} onClick={() => openView('cart', 'Cart')}>
          <svg viewBox="0 0 24 24"><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg><span>Cart</span>
          <span className="badge">{cartCount}</span>
        </button>
        <button className={`bn ${view === 'account' ? 'active' : ''}`} onClick={() => openView('account', 'Account')}>
          <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg><span>My account</span>
        </button>
      </nav>

      {/* Drawer */}
      <div className={`overlay ${drawerOpen ? 'show' : ''}`} onClick={() => setDrawerOpen(false)} />
      <aside className={`drawer ${drawerOpen ? 'show' : ''}`}>
        <div className="drawer-search">
          <input type="text" placeholder="Search for products"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { submitSearch(); setDrawerOpen(false); } }} />
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
        </div>
        <div className="drawer-tabs">
          <button className={`drawer-tab ${drawerTab === 'menu' ? 'active' : ''}`} onClick={() => setDrawerTab('menu')}>MENU</button>
          <button className={`drawer-tab ${drawerTab === 'cats' ? 'active' : ''}`} onClick={() => setDrawerTab('cats')}>CATEGORIES</button>
        </div>
        <div className={`drawer-panel ${drawerTab === 'menu' ? 'active' : ''}`}>
          <ul className="drawer-list">
            <li><a href="#" className="active" onClick={(e) => { e.preventDefault(); goHome(); setSearchActive(false); setDrawerOpen(false); }}>HOME</a></li>
            <li><a href="#shop" onClick={(e) => jump('shop', e)}>SHOP</a></li>
            <li><a href="#" onClick={(e) => jump('cats', e)}>CATEGORIES</a></li>
            <li><a href="#" onClick={(e) => jump('reviews', e)}>REVIEWS</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); openView('wishlist', 'Wishlist'); setDrawerOpen(false); }}><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9.3-8.3C1 8.5 2.4 5 5.6 5 7.6 5 9 6.3 12 9c3-2.7 4.4-4 6.4-4 3.2 0 4.6 3.5 2.9 6.7C19 15.6 12 20 12 20z" /></svg>WISHLIST</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); openView('cart', 'Cart'); setDrawerOpen(false); }}><svg viewBox="0 0 24 24"><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>CART</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); openView('account', 'Account'); setDrawerOpen(false); }}><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>LOGIN / REGISTER</a></li>
          </ul>
        </div>
        <div className={`drawer-panel ${drawerTab === 'cats' ? 'active' : ''}`}>
          <ul className="drawer-list">
            {categories.map((c) => (
              <li key={c._id}><a href="#" onClick={(e) => { e.preventDefault(); openCategory(c.slug, c.name); setDrawerOpen(false); }}>{c.name.toUpperCase()}</a></li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Search overlay */}
      <div className={`search-overlay ${searchOpen ? 'show' : ''}`}>
        <div className="row">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
          <input id="searchInput" type="text" placeholder="Search for products"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }} />
          <button className="close" onClick={() => setSearchOpen(false)}>Cancel</button>
        </div>
      </div>

      {/* Toast */}
      <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg}</div>
    </div>
  );
}
