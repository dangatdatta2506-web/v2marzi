import { Link } from "@tanstack/react-router";

export type LegalSection = { heading: string; body: string[] };

export function LegalPage({
  eyebrow,
  title,
  updated,
  sections,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      <nav className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>{" "}
        / {title}
      </nav>
      <header className="mt-8">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">{title}</h1>
        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">{updated}</p>
      </header>
      <div className="mt-10 space-y-9">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="font-display text-2xl">{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
