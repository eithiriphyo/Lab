# Ember & Wok — Food Delivery App

A complete, working food delivery app: a night-market-fire-themed ordering UI (menu browsing, cart, checkout) backed by a small Express server (menu API + order placement).

## Run it

```bash
cd emberwok
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

## What's included

- `server.js` — Express server. Serves the front end and two API routes:
  - `GET /api/menu` — returns the menu (from `data/menu.json`)
  - `POST /api/orders` — accepts `{ items, customer, total }`, returns an order confirmation with an ETA
- `data/menu.json` — all menu items/categories. Edit this to change the menu — no code changes needed.
- `public/` — the front end (`index.html`, `css/style.css`, `js/app.js`). Plain HTML/CSS/JS, no build step.

## How it works

1. On page load, the front end fetches `/api/menu` and renders categories + items.
2. Clicking **+** on an item adds it to an in-memory cart (client-side, in `app.js`).
3. The cart drawer shows line items, quantity controls, subtotal, delivery fee, and total.
4. **Checkout** opens a form for name/address/phone, then POSTs the cart to `/api/orders`.
5. The server validates the order, assigns an order ID and a random ETA, and returns a confirmation — shown in a confirmation modal.

Orders are stored in memory on the server and reset when you restart it (no database — this is a demo/lab setup).

## Customizing

- **Change the menu**: edit `data/menu.json` — add items, categories, prices, tags (`"spicy"`, `"veg"`, or `null`).
- **Change the brand**: colors and fonts are defined as CSS variables at the top of `public/css/style.css` (`:root { ... }`).
- **Add persistence**: swap the in-memory `orders` array in `server.js` for a real database (SQLite, Postgres, etc.) when you're ready to go beyond a lab.
- **Deploy it**: this is a standard Node/Express app — it'll run on Render, Railway, Fly.io, a VPS, or inside the Kubernetes/ArgoCD pipeline from earlier in this conversation if you containerize it with a Dockerfile.
