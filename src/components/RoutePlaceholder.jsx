export function RoutePlaceholder({ eyebrow, title, description }) {
  return (
    <section className="route-placeholder">
      <div className="placeholder-copy">
        <p className="eyebrow"><span className="eyebrow-line" />{eyebrow}</p>
        <h1>{title}</h1>
        <p className="placeholder-description">{description}</p>
        <div className="placeholder-meta">
          <span>01</span>
          <span className="meta-rule" />
          <span>D&Z / 2025—26</span>
        </div>
      </div>
      <div className="placeholder-art" aria-hidden="true">
        <span className="art-ring ring-one" />
        <span className="art-ring ring-two" />
        <span className="art-label">CURATED<br />IN MOTION</span>
        <span className="art-caption">FORM / FUNCTION / FEELING</span>
      </div>
    </section>
  );
}
