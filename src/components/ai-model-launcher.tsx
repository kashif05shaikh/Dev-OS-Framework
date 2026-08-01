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

/** Row of model buttons: copies the prompt, then opens that model's chat. */
export function AiModelLauncher({
  onLaunch,
  className,
}: {
  onLaunch: (model: AiModelTarget) => void;
  className?: string;
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {AI_MODEL_TARGETS.map((model) => (
        <Tooltip key={model.id}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Copy prompt and open ${model.label}`}
              onClick={() => onLaunch(model)}
              className="flex size-7 items-center justify-center rounded-md border border-border bg-muted/40 transition-colors hover:bg-accent"
              style={{ color: model.color }}
            >
              <ModelIcon model={model} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            Copy &amp; open {model.label}
            {model.prefills ? " (prefilled)" : " (paste it)"}
          </TooltipContent>
        </Tooltip>
      ))}
      </div>
    </TooltipProvider>
  );
}