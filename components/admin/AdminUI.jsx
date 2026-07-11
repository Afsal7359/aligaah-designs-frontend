'use client';
import { useState } from 'react';
import { uploadImage } from '@/lib/api';

export function Field({ label, full, children }) {
  return (
    <div className={`a-field ${full ? 'full' : ''}`}>
      {label && <label>{label}</label>}
      {children}
    </div>
  );
}

export function Input({ label, full, ...props }) {
  return <Field label={label} full={full}><input {...props} /></Field>;
}
export function Textarea({ label, full, ...props }) {
  return <Field label={label} full={full}><textarea {...props} /></Field>;
}
export function Select({ label, full, children, ...props }) {
  return <Field label={label} full={full}><select {...props}>{children}</select></Field>;
}
export function Check({ label, checked, onChange }) {
  return (
    <label className="a-check">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

// Uploads to Cloudinary via backend, returns {url, publicId}
export function ImageUploader({ value, onChange, folder = 'aligaah', square }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr('');
    try {
      const res = await uploadImage(file, folder);
      onChange(res); // {url, publicId}
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <div className="uploader">
      {value ? <img className="prev" src={value} alt="" style={square ? { borderRadius: 10 } : {}} />
        : <div className="prev" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#9aa2b1' }}>No image</div>}
      <div>
        <label className="btn btn-ghost btn-sm up">
          {busy ? 'Uploading…' : 'Upload image'}
          <input type="file" accept="image/*" hidden onChange={handle} disabled={busy} />
        </label>
        {value && <button className="btn btn-danger btn-sm" style={{ marginLeft: 8 }} onClick={() => onChange({ url: '', publicId: '' })}>Remove</button>}
        {err && <div className="a-note" style={{ color: 'var(--a-red)' }}>{err}</div>}
        <div className="a-note">Stored on Cloudinary</div>
      </div>
    </div>
  );
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Toggle({ on }) {
  return <span className={`pill ${on ? 'on' : 'off'}`}>{on ? 'Active' : 'Hidden'}</span>;
}
