'use client';
import { useStore } from '@/context/StoreContext';
import { Tile, fmt } from './ui';

export default function ProductCard({ product, index = 0 }) {
  const { addToCart, toggleWish, wishlist, openProduct } = useStore();
  const p = product;
  const img = p.images && p.images.length ? p.images[0].url : (p.image || '');
  const liked = wishlist.includes(p.code);
  const catName = p.categoryName || (p.category && p.category.name) || '';

  return (
    <div className="card" onClick={() => openProduct(p.code)}>
      <div className="img-wrap">
        <div className="badges">
          {p.discount ? <div className="b b-disc">-{p.discount}%</div> : null}
          {p.isSoldOut ? <div className="b b-sold">SOLD<br />OUT</div> : null}
          {p.isHot ? <div className="b b-hot">HOT</div> : null}
        </div>
        <Tile src={img} i={index} />
        <div className="card-actions">
          <button title="Add to cart" onClick={(e) => { e.stopPropagation(); addToCart(p.code); }}>
            <svg viewBox="0 0 24 24"><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /><path d="M3 4h2l2.2 11h9.5l1.8-8H6" /></svg>
          </button>
          <button className={liked ? 'liked' : ''} title="Wishlist"
            onClick={(e) => { e.stopPropagation(); toggleWish(p.code); }}>
            <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9.3-8.3C1 8.5 2.4 5 5.6 5 7.6 5 9 6.3 12 9c3-2.7 4.4-4 6.4-4 3.2 0 4.6 3.5 2.9 6.7C19 15.6 12 20 12 20z" /></svg>
          </button>
        </div>
      </div>
      <div className="title">{p.code}- {p.title}</div>
      <div className="cats">{catName}</div>
      <div className="price">
        {p.oldPrice ? <span className="old">{fmt(p.oldPrice)}</span> : null}
        <span className="new">{fmt(p.price)}</span>
      </div>
    </div>
  );
}
