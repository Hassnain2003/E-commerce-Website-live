export function StatusMessage({ title, description, action }) {
  return (
    <div className="status-message" role="status">
      <p className="eyebrow"><span className="eyebrow-line" />{title}</p>
      <p>{description}</p>
      {action}
    </div>
  );
}
