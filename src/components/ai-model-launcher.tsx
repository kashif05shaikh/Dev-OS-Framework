import { useState } from "react";

import { AI_MODEL_TARGETS, type AiModelTarget } from "@/lib/ai-models";
import { cn } from "@/lib/utils";

function ModelIcon({ model }: { model: AiModelTarget }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="text-[10px] font-semibold">{model.label.slice(0, 2)}</span>;
  return (
    <img
      src={`https://cdn.simpleicons.org/${model.icon}/${model.color.replace("#", "")}`}
      alt={`${model.label} logo`}
      loading="lazy"
      className="size-4"
      onError={() => setFailed(true)}
    />
  );
}

/** Simple text link for each AI model homepage. */
export function AiModelLauncher({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {AI_MODEL_TARGETS.map((model) => (
        <a
          key={model.id}
          href={model.url("")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ModelIcon model={model} />
          <span className="font-semibold uppercase tracking-wide">{model.label}</span>
          <span className="text-border">-</span>
          <span>{model.url("").replace(/^https?:\/\//, "").replace(/\/+$/, "")}</span>
        </a>
      ))}
    </div>
  );
}
