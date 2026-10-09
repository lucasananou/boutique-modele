export function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="px-6 md:px-16 pt-12 md:pt-20 pb-10 text-center">
      {eyebrow && <div className="eyebrow mb-4">{eyebrow}</div>}
      <h1 className="font-serif font-normal text-[40px] md:text-[56px] leading-[1.05] text-ink max-w-[820px] mx-auto">
        {title}
      </h1>
      {subtitle && (
        <p className="font-sans text-[16px] md:text-[18px] leading-[1.7] text-warm-700 max-w-[640px] mx-auto mt-6">
          {subtitle}
        </p>
      )}
    </header>
  );
}
