import {
  motion,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
} from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export const riseIn = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};


/** Section wrapper that fades/rises into view and staggers its children. */
export function Reveal({
  children,
  className,
  ...rest
}: { children: ReactNode; className?: string } & HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={riseIn}
      initial="hidden"
      animate="show"
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * Flat, professional surface. No tilt, scale or backdrop blur — hover only
 * changes border and shadow, which keeps text perfectly sharp.
 */
export function GlassCard({
  children,
  className,
  tilt: _tilt = true,
  interactive = true,
}: {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
  interactive?: boolean;
}) {
  return (
    <div
      data-interactive={interactive ? "true" : undefined}
      className={cn("dash-card group relative overflow-hidden", className)}
    >
      <div className="relative">{children}</div>
    </div>
  );
}


/** Animated number counter with spring easing. */
export function Counter({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const spring = useSpring(0, { stiffness: 70, damping: 20, mass: 0.7 });
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    spring.set(value);
  }, [value, spring, reduce]);

  useEffect(() => {
    if (reduce) return;
    return spring.on("change", (v) => setDisplay(v));
  }, [spring, reduce]);

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

/** Tiny animated sparkline drawn from a value series. */
export function Sparkline({
  data,
  className,
  stroke = "var(--primary)",
}: {
  data: number[];
  className?: string;
  stroke?: string;
}) {
  const pts = data.length > 1 ? data : [0, 0];
  const max = Math.max(...pts, 1);
  const min = Math.min(...pts, 0);
  const span = max - min || 1;
  const w = 100;
  const h = 28;
  const coords = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const line = `M${coords.join(" L")}`;
  const area = `${line} L${w},${h} L0,${h} Z`;
  const id = `spark-${stroke.replace(/\W/g, "")}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("h-7 w-full", className)}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={area}
        fill={`url(#${id})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
    </svg>
  );
}

/** Animated progress bar. */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/8", className)}>
      <motion.div
        className="h-full rounded-full"
        style={{
          background:
            "linear-gradient(90deg, color-mix(in oklab, var(--primary) 70%, transparent), var(--primary))",
        }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

/** Shimmering skeleton block for loading states. */
export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("dash-shimmer rounded-xl", className)} />;
}

/** Character-by-character typing effect. */
export function Typewriter({ text, speed = 18 }: { text: string; speed?: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? text : "");

  useEffect(() => {
    if (reduce) {
      setShown(text);
      return;
    }
    setShown("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed, reduce]);

  return (
    <span>
      {shown}
      <motion.span
        className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-primary"
        animate={{ opacity: [1, 0.15, 1] }}
        transition={{ duration: 1.1, repeat: Infinity }}
      />
    </span>
  );
}