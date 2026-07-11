'use client';
import { useEffect, useRef, useState } from 'react';

export default function Scroller({ children }) {
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = () => {
    const t = trackRef.current;
    if (!t) return;
    setAtStart(t.scrollLeft <= 2);
    setAtEnd(t.scrollLeft + t.clientWidth >= t.scrollWidth - 2);
  };

  useEffect(() => {
    update();
    const t = trackRef.current;
    if (!t) return;
    t.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    const id = setTimeout(update, 300);
    return () => {
      t.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      clearTimeout(id);
    };
  }, [children]);

  const step = () => {
    const t = trackRef.current;
    const first = t && t.querySelector('*');
    if (!first) return 300;
    const style = getComputedStyle(t);
    const gap = parseFloat(style.columnGap || style.gap || 16) || 16;
    const base = first.getBoundingClientRect().width + gap;
    return base * (window.innerWidth >= 860 ? 2 : 1);
  };

  const scroll = (dir) => {
    const t = trackRef.current;
    if (!t) return;
    t.scrollBy({ left: dir === 'next' ? step() : -step(), behavior: 'smooth' });
  };

  return (
    <div className="scroller">
      <button className="scroll-btn prev" disabled={atStart} onClick={() => scroll('prev')}>
        <svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" /></svg>
      </button>
      <div className="track" ref={trackRef}>{children}</div>
      <button className="scroll-btn next" disabled={atEnd} onClick={() => scroll('next')}>
        <svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" /></svg>
      </button>
    </div>
  );
}
