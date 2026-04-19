export default function Loader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="loader-dot" />
      <span>{text}</span>
    </div>
  );
}
