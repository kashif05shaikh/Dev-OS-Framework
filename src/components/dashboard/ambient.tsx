/**
 * Ambient backdrop: a single flat surface color with a very subtle hairline
 * grid. Intentionally static — no colored orbs, gradients or cursor spotlight,
 * so text always renders crisp on top of it.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      {/* Visuvate studio luxury aurora wash */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] opacity-40 blur-[130px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.14) 0%, rgba(60, 60, 60, 0.06) 45%, transparent 70%)",
        }}
      />
      <div className="dash-grid absolute inset-0 opacity-[0.14]" />
    </div>
  );
}
