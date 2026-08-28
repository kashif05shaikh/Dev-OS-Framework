import { useEffect } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";

/**
 * Ambient dashboard backdrop: subtle grid, floating glow orbs, noise texture
 * and a spotlight that follows the cursor. Purely decorative, GPU friendly.
 */
export function AmbientBackground() {
  const mx = useMotionValue(50);
  const my = useMotionValue(20);
  const sx = useSpring(mx, { stiffness: 60, damping: 22, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 60, damping: 22, mass: 0.6 });
  const spotlight = useMotionTemplate`radial-gradient(600px circle at ${sx}% ${sy}%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 65%)`;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth) * 100);
      my.set((e.clientY / window.innerHeight) * 100);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="dash-grid absolute inset-0 opacity-[0.35]" />

      <motion.div
        className="absolute -left-40 -top-40 size-[38rem] rounded-full blur-[120px]"
        style={{ background: "color-mix(in oklab, var(--primary) 22%, transparent)" }}
        animate={{ x: [0, 60, -20, 0], y: [0, 40, 80, 0], scale: [1, 1.12, 0.95, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-52 top-1/3 size-[34rem] rounded-full blur-[130px]"
        style={{ background: "color-mix(in oklab, var(--chart-5) 20%, transparent)" }}
        animate={{ x: [0, -50, 20, 0], y: [0, -60, 30, 0], scale: [1, 0.92, 1.1, 1] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-14rem] left-1/3 size-[30rem] rounded-full blur-[130px]"
        style={{ background: "color-mix(in oklab, var(--chart-2) 16%, transparent)" }}
        animate={{ x: [0, 40, -40, 0], y: [0, -30, 10, 0] }}
        transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div className="absolute inset-0" style={{ background: spotlight }} />
      <div className="dash-noise absolute inset-0" />
    </div>
  );
}