import { useEffect, useState } from "react";

import { aiPlatformFavicon, aiPlatformLogo, type AiPlatform } from "@/lib/ai-models";
import { cn } from "@/lib/utils";

/** Brand logo with an automatic favicon fallback. */
export function AiLogo({ platform, className }: { platform: AiPlatform; className?: string }) {
  const [src, setSrc] = useState(aiPlatformLogo(platform));

  useEffect(() => {
    setSrc(aiPlatformLogo(platform));
  }, [platform]);

  return (
    <img
      src={src}
      alt={`${platform.label} logo`}
      loading="lazy"
      onError={() => {
        const fallback = aiPlatformFavicon(platform);
        if (src !== fallback) {
          setSrc(fallback);
        }
      }}
      className={cn("size-5 shrink-0 object-contain", className)}
    />
  );
}
