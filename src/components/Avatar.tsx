import type { Profile } from "@/lib/profiles";

export function Avatar({
  profile,
  className = "size-24 rounded-xl text-4xl",
}: {
  profile: Pick<Profile, "name" | "color" | "avatar"> | null | undefined;
  className?: string;
}) {
  const a = profile?.avatar;
  const isImg = a?.startsWith("data:") || a?.startsWith("http");
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden font-display font-extrabold text-primary-foreground ${className}`}
      style={{ background: profile?.color ?? "var(--primary)" }}
    >
      {isImg ? (
        <img src={a} alt="" className="size-full object-cover" />
      ) : a ? (
        <span className="leading-none">{a}</span>
      ) : (
        (profile?.name.slice(0, 1).toUpperCase() ?? "?")
      )}
    </span>
  );
}
