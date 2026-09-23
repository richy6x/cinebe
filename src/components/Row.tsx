import type { ReactNode } from "react";

export function Row({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between gap-4 px-5">
        <h2 className="section-bar text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
        {action}
      </div>
      <div className="row-scroll px-5">{children}</div>
    </section>
  );
}
