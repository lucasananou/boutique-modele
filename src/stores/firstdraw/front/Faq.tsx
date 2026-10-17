/* FAQ as Mycel guide cards: white rounded blocks, dashed circle toggle
   that turns into an x on open. */

export default function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="faq">
      {items.map((item) => (
        <details key={item.q}>
          <summary>
            {item.q}
            <span className="plus" aria-hidden="true">
              +
            </span>
          </summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  );
}
