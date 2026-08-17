import Link from "next/link";

/**
 * Velnix brand lockup. The spark + italic-serif wordmark is the locked logo.
 * `✦ 𝓥𝓮𝓵𝓷𝓲𝔁`
 */
export function Brand({
  size = "md",
  href = "/",
}: {
  size?: "sm" | "md";
  href?: string | null;
}) {
  const cls = `brand ${size === "sm" ? "sm" : ""}`;
  const inner = (
    <>
      <span className="spark">✦</span>
      <span className="word">𝓥𝓮𝓵𝓷𝓲𝔁</span>
    </>
  );
  if (href === null) return <span className={cls}>{inner}</span>;
  return (
    <Link href={href} className={cls} aria-label="Velnix home">
      {inner}
    </Link>
  );
}
