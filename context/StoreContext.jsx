'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { trackScreen } from '@/lib/analytics';

const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);

const CART_KEY = 'aligaah_cart';
const WISH_KEY = 'aligaah_wish';

export function StoreProvider({ initialSettings, children }) {
  const [settings, setSettings] = useState(initialSettings || null);
  const [cart, setCart] = useState([]);       // [{code, qty}]
  const [wishlist, setWishlist] = useState([]); // [code]
  const [toastMsg, setToastMsg] = useState('');
  const [view, setView] = useState(null);      // null | 'category' | 'product' | 'cart' | 'checkout' | 'wishlist' | 'account'
  const [activeCategory, setActiveCategory] = useState(null); // slug/name
  const [activeProduct, setActiveProduct] = useState(null);   // full product for detail page
  const [productsByCode, setProductsByCode] = useState({});

  // hydrate persisted cart/wishlist
  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem(CART_KEY) || '[]'));
      setWishlist(JSON.parse(localStorage.getItem(WISH_KEY) || '[]'));
    } catch (_) {}
  }, []);
  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem(WISH_KEY, JSON.stringify(wishlist)); }, [wishlist]);

  // load settings if not provided by server
  useEffect(() => {
    if (!settings) api.get('/settings').then(setSettings).catch(() => {});
  }, [settings]);

  const registerProducts = useCallback((list) => {
    if (!list || !list.length) return;
    setProductsByCode((prev) => {
      const next = { ...prev };
      list.forEach((p) => { if (p && p.code) next[p.code] = p; });
      return next;
    });
  }, []);

  const toast = useCallback((m) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(''), 1600);
  }, []);

  // ---- cart ----
  const addToCart = useCallback((code) => {
    setCart((prev) => {
      const it = prev.find((i) => i.code === code);
      if (it) return prev.map((i) => (i.code === code ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { code, qty: 1 }];
    });
    toast('Added to cart');
  }, [toast]);
  const changeQty = useCallback((code, d) => {
    setCart((prev) =>
      prev
        .map((i) => (i.code === code ? { ...i, qty: i.qty + d } : i))
        .filter((i) => i.qty > 0)
    );
  }, []);
  const removeFromCart = useCallback((code) => {
    setCart((prev) => prev.filter((i) => i.code !== code));
  }, []);
  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => {
    const p = productsByCode[i.code];
    return s + (p ? p.price * i.qty : 0);
  }, 0);

  // ---- wishlist ----
  const toggleWish = useCallback((code) => {
    setWishlist((prev) => {
      const liked = !prev.includes(code);
      toast(liked ? 'Added to wishlist' : 'Removed from wishlist');
      return liked ? [...prev, code] : prev.filter((c) => c !== code);
    });
  }, [toast]);

  // ---- navigation between in-app views ----
  const goHome = useCallback(() => { setView(null); if (typeof window !== 'undefined') window.scrollTo({ top: 0 }); }, []);
  const openCategory = useCallback((slug, name) => {
    setActiveCategory({ slug, name });
    setView('category');
    window.scrollTo({ top: 0 });
    trackScreen('Category: ' + (name || slug), '/category/' + slug);
  }, []);
  const openView = useCallback((v, screen) => {
    setView(v);
    window.scrollTo({ top: 0 });
    trackScreen(screen || v, '/' + v);
  }, []);
  const openProduct = useCallback((code) => {
    setActiveProduct(null);
    setView('product');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
    api.get(`/products/${code}`)
      .then((p) => { setActiveProduct(p); registerProducts([p]); })
      .catch(() => {});
    trackScreen('Product: ' + code, '/product/' + code);
  }, [registerProducts]);

  const value = {
    settings, setSettings,
    cart, cartCount, cartTotal, addToCart, changeQty, removeFromCart, clearCart,
    wishlist, toggleWish,
    productsByCode, registerProducts,
    toastMsg, toast,
    view, setView, activeCategory, activeProduct, goHome, openCategory, openView, openProduct,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
