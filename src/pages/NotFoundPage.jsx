import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="route-placeholder">
      <p className="eyebrow">404</p>
      <h1>That page moved.</h1>
      <p>
        <Link className="text-link" to="/">Return to the shop</Link>
      </p>
    </section>
  );
}
