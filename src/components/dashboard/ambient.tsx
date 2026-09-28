/**
 * Ambient backdrop: a single flat surface color with a very subtle hairline
 * grid. Intentionally static — no colored orbs, gradients or cursor spotlight,
 * so text always renders crisp on top of it.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="dash-grid absolute inset-0 opacity-[0.18]" />
    </div>
  );
}
