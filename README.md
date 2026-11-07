# D&Z Cartique — Modern E-commerce Storefront

**Live site:** https://dz-cartique.web.app/

D&Z Cartique is a full-featured, React-powered fashion e-commerce storefront built with Vite, React Router, Firebase Authentication, and Cloud Firestore. It delivers a complete shopping experience — from product discovery and cart management to secure checkout and order tracking — backed by a role-based admin dashboard for store management.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Product Data Model](#product-data-model)
- [Admin Dashboard](#admin-dashboard)
- [Firebase Deployment](#firebase-deployment)
- [Security](#security)
- [Browser Support](#browser-support)

---

## Features

### Storefront

- **Responsive catalog** — Product grid with category tabs, price-range filtering, search (name, description, category, tags), availability filter, featured/sale toggles, and price sorting (low-to-high, high-to-low, featured).
- **URL-based filter state** — All filters and sorting are reflected in the URL (`/?category=shirts&sort=price-low&search=cotton`), so users can refresh, share, and use browser back/forward without losing their selection.
- **Product detail pages** — Dedicated `/products/:productId` pages with image gallery (main image + thumbnails), description, category, badge, sale/original pricing, stock status, quantity selector, and related products from the same category.
- **Persistent cart** — Cart survives browser refresh via `localStorage`. Add items, update quantities, and remove items seamlessly.
- **Search & discovery** — Real-time search across product name, description, category, and tags, plus active filter chips with individual removal and "clear all."

### Authentication & Account

- **Firebase Authentication** — Email/password login, registration, and password reset.
- **Protected routes** — Checkout, order history, and profile pages require authentication.
- **User profiles** — Editable name, phone, and delivery address, synced to Firestore.
- **Theme switching** — Light and dark themes with automatic system preference detection.

### Checkout & Orders

- **Cash-on-delivery checkout** — Secure checkout flow with delivery details and order summary.
- **Server-side price verification** — Product prices and totals are recalculated from Firestore at checkout; browser-submitted prices are never trusted.
- **Stock validation** — Cart items are checked for availability before order placement (sold-out or low-stock warnings).
- **Order history** — Real-time order list with status badges (Processing, Confirmed, Shipped, Delivered, Cancelled).
- **Order detail pages** — `/orders/:orderId` with full status timeline, item images, delivery address, payment method, tracking number, and estimated delivery date.
- **Admin status updates** — Admin status changes reflect automatically in customer order views via Firestore real-time listeners.

### Admin Dashboard (Role-Protected)

Accessible at `/admin` for users with `role: "admin"` on their Firestore user document:

- **Overview** — Store statistics: total orders, processing, shipped, delivered, revenue, product count, and low-stock alerts.
- **Orders** — Search by customer email/name, filter by status, update order status, add tracking numbers, view order details, and bulk status updates.
- **Products** — Create, edit, and delete products with full catalog management (name, description, price, sale price, compare-at price, category, badge, featured flag, stock, image URL, thumbnail URL, alt text, and image gallery).
- **Stock** — Inline stock-level editing with low-stock and out-of-stock indicators.
- **Customers** — View registered customers, update roles (customer/admin), and view per-customer order history.
- **Settings** — Shipping thresholds, store information, and danger-zone utilities.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite |
| Routing | React Router 7 |
| Styling | CSS (custom design tokens, responsive, dark mode) |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Hosting | Firebase Hosting |
| State management | React Context (Cart, Auth, Theme) |

---

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- A Firebase project with Authentication and Firestore enabled

### Installation

```bash
git clone https://github.com/Hassnain2003/E-commerce-Website-live.git
cd E-commerce-Website-live/E-commerce
npm install
cp .env.example .env
```

### Environment Configuration

Fill in your Firebase web app configuration values in `.env`:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Get these values from your Firebase project settings → General → Your apps → Web app config.

### Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run preview
```

Production output is generated in `dist/`.

---

## Project Structure

```
E-commerce/
├── public/                 # Static assets
├── src/
│   ├── App.jsx             # React Router configuration
│   ├── main.jsx            # Entry point with providers
│   ├── components/
│   │   ├── layout/         # AppShell, ProfileMenu
│   │   ├── store/          # ProductCard, CartLineItem, ProductGallery, RelatedProducts
│   │   └── ui/             # StatusMessage
│   ├── context/            # AuthContext, CartContext, ThemeContext
│   ├── pages/              # HomePage, ProductDetailsPage, CartPage, CheckoutPage, OrderHistoryPage, OrderDetailsPage, AdminPage, LoginPage, ProfilePage, NotFoundPage
│   ├── services/           # firebase.js, products.js, orders.js, orderHistory.js, admin.js, storage.js, profile.js, accounts.js
│   └── styles/             # global.css
├── views/                  # Original static implementation (migration reference)
├── .env.example            # Environment variable template
├── .firebaserc             # Firebase project alias
├── firebase.json           # Hosting & Firestore configuration
├── firestore.rules         # Security rules
├── vite.config.js          # Vite configuration
└── README.md
```

---

## Product Data Model

Product documents in the `products` Firestore collection support the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Product display name (required) |
| `description` | string | Product description |
| `price` | number | Base price in PKR (required) |
| `category` | string | Product category |
| `imageUrl` | string | Main product image URL |
| `salePrice` | number | Discounted price (optional) |
| `compareAtPrice` | number | Original price for strikethrough display (optional) |
| `badge` | string | Merchandising label such as "New" or "Limited" (optional) |
| `featured` | boolean | Boosts sort order on homepage (optional) |
| `tags` | array[string] | Searchable tags (optional) |
| `stock` | number | Inventory count; `0` shows sold-out state (optional) |
| `gallery` | array[string] | Additional image URLs for detail page gallery (optional) |
| `thumbnailUrl` | string | Preferred thumbnail URL (optional) |
| `altText` | string | Descriptive alt text for accessibility (optional) |

Products are normalized at the service boundary, so older documents remain compatible.

---

## Admin Dashboard

The admin workspace at `/admin` is role-protected. To gain access:

1. Register through Firebase Authentication.
2. Create or update a Firestore document at `users/{uid}` with `role: "admin"`.
3. The role must be assigned through a trusted administrative process — users cannot promote themselves (enforced by Firestore rules).

Admin tabs:
- **Overview** — Store stats and recent orders
- **Orders** — Search, filter, update status, add tracking numbers
- **Products** — Full product CRUD with image gallery management
- **Stock** — Inventory control with inline stock editing
- **Customers** — Customer management and role assignment
- **Settings** — Store configuration and utilities

---

## Firebase Deployment

### Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### Deploy Hosting & Firestore Rules

```bash
npm run build
firebase deploy --only hosting,firestore --project dz-cartique
```

The Firebase project alias is configured in `.firebaserc`. Firebase Hosting serves the `dist/` directory with SPA rewrite support, so React Router routes continue working on refresh.

### Deploy Hosting Only

```bash
firebase deploy --only hosting --project dz-cartique
```

### Deploy Firestore Rules Only

```bash
firebase deploy --only firestore --project dz-cartique
```

---

## Security

- **No hardcoded credentials** — Admin access is determined solely by the `role` field on the user's Firestore document, assigned through a trusted process.
- **Firestore rules** — Enforce read/write access control for products, orders, and users. Users can only read/write their own data; admins have full access.
- **No exposed secrets** — `.env` is gitignored and must never be committed. Firebase web config values are public client configuration; security is provided by Firestore rules and Firebase Authentication.
- **Server-side price verification** — Checkout reads product prices from Firestore and recalculates totals; browser-submitted prices are never trusted.
- **Payment** — Cash on delivery only. Card payment processing is not implemented until a trusted server-side payment flow is added.

---

## Browser Support

Tested and supported on:
- Chrome, Edge, Firefox, Safari (desktop and mobile)
- Responsive layouts for desktop, tablet, and mobile
- Dark mode and reduced-motion preferences respected
