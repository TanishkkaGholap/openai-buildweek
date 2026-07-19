export default function Loader({ label }) {
  return (
    <div className="loading-line">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}
