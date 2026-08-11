export function Placeholder({ emoji, title, line }: { emoji: string; title: string; line: string }) {
  return (
    <section className="screen active">
      <div className="placeholder">
        <div className="ph-emoji">{emoji}</div>
        <h2>{title}</h2>
        <p>{line}</p>
      </div>
    </section>
  );
}
