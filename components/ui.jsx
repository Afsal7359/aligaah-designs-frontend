'use client';

const tones = [
  ['#efe0c6', '#ddc79a'], ['#e6ddcf', '#cdbfa6'], ['#eadfd0', '#d8c3a0'],
  ['#e4dcc9', '#cdbe9c'], ['#efe6d6', '#d9c9ab'], ['#e8ddc7', '#d0bd94'],
  ['#e9e0d0', '#d4c2a0'], ['#e3dac6', '#cabf9e'],
];
export const tone = (i) => tones[Math.abs(i) % tones.length];

export const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN') + '.00';

// Image tile matching the original .ph placeholder-with-fallback behaviour
export function Tile({ src, i = 0, alt = '' }) {
  const [c1, c2] = tone(i);
  return (
    <div className="ph" style={{ '--c1': c1, '--c2': c2 }}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ) : null}
    </div>
  );
}

export function StarRow({ n = 5 }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={i <= n ? '' : 'off'} viewBox="0 0 24 24">
          <path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7L12 2z" />
        </svg>
      ))}
    </div>
  );
}
