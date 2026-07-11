export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function authHeaders() {
  if (typeof window === 'undefined') return {};
  const t = localStorage.getItem('aligaah_admin_token') || localStorage.getItem('aligaah_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function request(path, { method = 'GET', body, auth = false, headers = {} } = {}) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? authHeaders() : {}),
      ...headers,
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}${path}`, opts);
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) throw new Error((data && data.message) || 'Request failed');
  return data;
}

export const api = {
  get: (p, auth = false) => request(p, { auth }),
  post: (p, body, auth = false) => request(p, { method: 'POST', body, auth }),
  put: (p, body, auth = true) => request(p, { method: 'PUT', body, auth }),
  del: (p, body, auth = true) => request(p, { method: 'DELETE', body, auth }),
};

// Upload a File object (multipart) to the backend -> Cloudinary
export async function uploadImage(file, folder = 'aligaah') {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('aligaah_admin_token') : null;
  const fd = new FormData();
  fd.append('image', file);
  fd.append('folder', folder);
  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data; // { url, publicId }
}
