# Aligaah Designs — Full-Stack E-commerce

A complete conversion of the Aligaah storefront into a full-stack app:

- **Frontend** — Next.js 14 (App Router). The original design is preserved **pixel-for-pixel** (same CSS), now data-driven from the API.
- **Backend** — Node.js + Express + MongoDB (Mongoose).
- **Admin panel** — full store control at `/admin` (products, categories, banners, coupons, reviews, orders, site settings, analytics).
- **Images** — uploaded through the admin and stored on **Cloudinary**.
- **Analytics** — page/screen visits, most-viewed products, most-visited screens, and **date-wise** visitor charts.

```
aligaah/
├── backend/     Express + MongoDB API
├── frontend/    Next.js storefront + admin panel
└── docker-compose.yml
```

---

## 1. Prerequisites

- Node.js 18+ and npm
- A MongoDB database (local `mongod`, or a free MongoDB Atlas cluster)
- A free Cloudinary account (for image uploads) — https://cloudinary.com

---

## 2. Run the backend

```bash
cd backend
cp .env.example .env          # then edit .env with your values
npm install
npm run seed                  # loads the catalog + creates the admin user
npm run dev                   # starts on http://localhost:5000
```

Fill in `.env`:

| Variable | What it is |
|---|---|
| `MONGO_URI` | e.g. `mongodb://127.0.0.1:27017/aligaah` or your Atlas URI |
| `JWT_SECRET` | any long random string |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | the admin login created by the seed |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from your Cloudinary dashboard |
| `CLIENT_URL` | frontend origin for CORS, e.g. `http://localhost:3000` |

`npm run seed` populates the same products, categories and reviews from the
original storefront, a hero banner, two demo coupons (`WELCOME10`, `FLAT500`),
default site settings, and the admin account.

## 3. Run the frontend

```bash
cd frontend
cp .env.local.example .env.local     # set NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev                          # http://localhost:3000
```

- **Storefront:** http://localhost:3000
- **Admin panel:** http://localhost:3000/admin  (log in with your `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

---

## 4. Run everything with Docker (optional)

```bash
# from the project root — set your Cloudinary keys in the shell first
export CLOUDINARY_CLOUD_NAME=xxx CLOUDINARY_API_KEY=xxx CLOUDINARY_API_SECRET=xxx
docker compose up --build
# then seed once:
docker compose exec backend npm run seed
```

Storefront → http://localhost:3000, API → http://localhost:5000, admin → http://localhost:3000/admin

---

## 5. What the admin panel controls

| Section | You can manage |
|---|---|
| **Dashboard** | Total/unique visitors, orders, revenue, **date-wise visits chart**, **most-viewed products**, **most-visited screens** (last 7 / 30 / 90 days) |
| **Products** | Full CRUD, image upload, price/MRP (auto-discount %), stock, and flags: Hot, Featured, Best seller, New arrival, Sold out, Active |
| **Categories** | CRUD + circle image; product counts stay in sync |
| **Banners** | Hero & promo banners with image, heading, button text/link, position, order, active toggle |
| **Coupons** | Percent or fixed codes, min cart, max-discount cap, usage limit, expiry, active toggle |
| **Reviews** | Testimonials shown on the storefront (name, rating, text, avatar) |
| **Orders** | View orders and change status (pending → confirmed → shipped → delivered / cancelled) |
| **Settings** | **Site title** (browser tab), **favicon**, header/footer **logo**, brand name, tagline, footer text, social links, shipping rules |

Everything visible on the storefront — hero, categories, products, reviews,
logo, title, favicon, social links, footer — is driven by these admin sections.

---

## 6. How the requested features map to the code

| Requirement | Where |
|---|---|
| Convert design to Next.js (no design change) | `frontend/app/globals.css` (verbatim CSS) + `components/Storefront.jsx` |
| Backend Node/Express/MongoDB | `backend/` |
| Admin panel, full features | `frontend/app/admin/*` |
| User engagement / visits date-wise | `models/Visit.js`, `controllers/analyticsController.js`, dashboard chart |
| Most-viewed products | `GET /api/analytics/top-products` |
| Most-visited screens | `GET /api/analytics/top-screens` |
| Image uploads via Cloudinary | `controllers/uploadController.js`, `lib/api.js → uploadImage()` |
| Banner management | `models/Banner.js`, `app/admin/banners` |
| Logo + favicon + title | `models/Settings.js`, `app/layout.js` (dynamic metadata), `app/admin/settings` |
| Coupon codes | `models/Coupon.js`, `app/admin/coupons`, `POST /api/coupons/validate` |

See `API.md` for the full endpoint list.
