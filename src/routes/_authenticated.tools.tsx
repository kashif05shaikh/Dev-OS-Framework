import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";

import { DevServices } from "@/components/dev-services";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Route = createFileRoute("/_authenticated/tools")({
  head: () => ({
    meta: [
      { title: "Dev Tools — DevOS" },
      {
        name: "description",
        content:
          "Quick launch your developer stack: GitHub, Vercel, Netlify, Railway, Render, Supabase, Cloudinary, Docker Hub, MongoDB Atlas, Firebase, plus VS Code, Cursor, Antigravity and Codex.",
      },
      { property: "og:title", content: "Dev Tools — DevOS" },
      {
        property: "og:description",
        content: "One-click access to every dashboard and editor you use while building.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ToolsPage,
});

function ToolsPage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <div className="mr-auto">
          <h1 className="text-sm font-semibold">Dev Tools</h1>
          <p className="text-xs text-muted-foreground">
            Quick launch every dashboard and editor you work in
          </p>
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4">
          <DevServices />

          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Wrench className="size-3" />
            Links open in a new tab — sign in with your own accounts.
          </p>
        </div>
      </ScrollArea>
    </div>
  );
}
