import { useState } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

/** Row of model buttons opening each model's chat in a new tab. */
export function AiModelLauncher({
  onLaunch,
  getHref,
  className,
}: {
  onLaunch?: (model: AiModelTarget) => void;
  getHref?: (model: AiModelTarget) => string;
  className?: string;
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {AI_MODEL_TARGETS.map((model) => (
        <Tooltip key={model.id}>
          <TooltipTrigger asChild>
            <a
              href={getHref ? getHref(model) : model.url("")}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${model.label}`}
              onClick={() => onLaunch?.(model)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs transition-colors hover:bg-accent"
              style={{ color: model.color }}
            >
              <ModelIcon model={model} />
              <span className="text-foreground">{model.label}</span>
            </a>
          </TooltipTrigger>
          <TooltipContent>
            Open {model.label}
          </TooltipContent>
        </Tooltip>
      ))}
      </div>
    </TooltipProvider>
  );
}