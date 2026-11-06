# D&Z Cartique

Modern React storefront for D&Z Cartique, migrated from the original course project into a Vite-powered application backed by Firebase Authentication and Firestore.

Live site: [https://dz-cartique.web.app/](https://dz-cartique.web.app/)

## Features

- Responsive fashion storefront
- Firestore product catalog
- Product metadata normalization for featured items, sale pricing, badges, tags, and stock states
- Category filtering, search, and sorting
- Persistent browser cart
- Firebase email/password authentication
- Password reset flow
- Protected checkout and order history
- Role-protected admin order workspace
- Firestore security rules for users, products, and orders
- Firebase Hosting SPA rewrite configuration

## Tech stack

- React
- Vite
- React Router
- Firebase Authentication
- Cloud Firestore
- CSS with responsive design tokens

## Local setup

Requirements:

- Node.js 20 or newer
- npm
- A Firebase project with Authentication and Firestore enabled

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Fill in the `VITE_FIREBASE_*` values from the Firebase web app configuration, then run:

```bash
npm run dev
```

The original static implementation is preserved under [`views/`](./views) as a migration reference.

## Product fields

Existing product documents only need `name`, `description`, `price`, `category`, and optionally `imageUrl`. The storefront also supports these optional fields:

- `featured`: Boolean used by the default catalog sort.
- `salePrice`: Numeric price lower than `price`.
- `compareAtPrice`: Original numeric price for future merchandising.
- `badge`: Short label such as `New` or `Limited`.
- `tags`: Array of searchable product tags.
- `stock`: Numeric inventory value; `0` displays a sold-out state.
- `gallery`: Array of additional image URLs for the product detail image gallery.
- `thumbnailUrl`: Preferred thumbnail URL used where a smaller product image is needed.
- `altText`: Descriptive alt text for the product image (accessibility and fallback).

Product images are served from Firebase Storage (`dz-cartique.appspot.com`) with download URLs stored in Firestore. The `imageUrl` field is preserved for backward compatibility; external URLs still work but Firebase Storage URLs are recommended for production reliability.

Products are normalized at the service boundary so older documents remain compatible with the richer catalog experience.

## Production build

```bash
npm run build
npm run preview
```

The production output is generated in `dist/`. It is intentionally ignored by Git and is the directory configured for Firebase Hosting.

## Firebase deployment

Install and authenticate the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
```

Deploy the hosting build and Firestore rules:

```bash
npm run build
firebase deploy --only hosting,firestore
```

The Firebase project alias is configured in [`.firebaserc`](./.firebaserc). Confirm that the selected Firebase project is the intended project before deploying.

## Admin access

Admin access does not use a password embedded in frontend code. A user must:

1. Register through Firebase Authentication.
2. Have a matching Firestore document at `users/{uid}`.
3. Have `role: "admin"` on that document.

The role must be assigned through a trusted administrative process. The Firestore rules prevent a user from promoting themselves.

## Security notes

- `.env` is ignored and must never be committed.
- Firebase web configuration values are public client configuration; Firestore rules and Firebase Authentication provide access control.
- Product prices and order totals are currently calculated in the browser. A trusted backend or Cloud Function is required for server-side price verification and production payment processing.
- The current checkout supports cash on delivery. Card payment processing is intentionally not implemented until a trusted server-side payment flow is added.

## Project documentation

The original submitted course report is preserved in [`docs/project-report.pdf`](./docs/project-report.pdf).
