import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function InfoAccordion({
  items,
}: {
  items: { title: string; content: ReactNode }[];
}) {
  const [open, setOpen] = useState<string | null>(items[0]?.title ?? null);
  return (
    <div className="mt-8 border-t border-border">
      {items.map((item) => {
        const isOpen = open === item.title;
        return (
          <div key={item.title} className="border-b border-border">
            <button
              onClick={() => setOpen(isOpen ? null : item.title)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 py-4 text-left text-[0.72rem] uppercase tracking-[0.18em]"
            >
              {item.title}
              <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <div className="pb-5 text-sm leading-relaxed text-muted-foreground">{item.content}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
