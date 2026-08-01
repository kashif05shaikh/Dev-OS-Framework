import { useState } from "react";

import {
  CODING_PLATFORM_COLOR,
  CODING_PLATFORM_ICON,
  CODING_PLATFORM_LABEL,
} from "@/lib/devos-types";
import { cn } from "@/lib/utils";

export function PlatformLogo({
  platform,
  className,
}: {
  platform: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const color = CODING_PLATFORM_COLOR[platform] ?? CODING_PLATFORM_COLOR["other"]!;
  const slug = CODING_PLATFORM_ICON[platform];
  const label = CODING_PLATFORM_LABEL[platform] ?? platform;

  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold uppercase",
        className,
      )}
      style={{ backgroundColor: `${color}22`, color }}
    >
      {slug && !failed ? (
        <img
          src={`https://cdn.simpleicons.org/${slug}/${color.replace("#", "")}`}
          alt={`${label} logo`}
          loading="lazy"
          className="size-[60%]"
          onError={() => setFailed(true)}
        />
      ) : (
        label.slice(0, 2)
      )}
    </span>
  );
}
