import { useEffect, useState } from "react";
import { ExternalLink, FolderOpen, MonitorPlay, Rocket } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { openExternal } from "@/lib/open-external";

type Service = {
  name: string;
  desc: string;
  url: string;
  slug: string;
  color: string;
};

const SERVICES: Service[] = [
  { name: "GitHub", desc: "Repositories & pull requests", url: "https://github.com/", slug: "github", color: "ffffff" },
  { name: "Vercel", desc: "Frontend deployments", url: "https://vercel.com/dashboard", slug: "vercel", color: "ffffff" },
  { name: "Netlify", desc: "Sites & builds", url: "https://app.netlify.com/", slug: "netlify", color: "00C7B7" },
  { name: "Railway", desc: "Services & databases", url: "https://railway.app/dashboard", slug: "railway", color: "ffffff" },
  { name: "Render", desc: "Web services & cron", url: "https://dashboard.render.com/", slug: "render", color: "46E3B7" },
  { name: "Supabase", desc: "Postgres, auth & storage", url: "https://supabase.com/dashboard", slug: "supabase", color: "3FCF8E" },
  { name: "Cloudinary", desc: "Media library & transforms", url: "https://console.cloudinary.com/", slug: "cloudinary", color: "3448C5" },
  { name: "Docker Hub", desc: "Container images", url: "https://hub.docker.com/", slug: "docker", color: "2496ED" },
  { name: "MongoDB Atlas", desc: "Clusters & collections", url: "https://cloud.mongodb.com/", slug: "mongodb", color: "47A248" },
  { name: "Firebase", desc: "Realtime DB, hosting & auth", url: "https://console.firebase.google.com/", slug: "firebase", color: "DD2C00" },
];

type Editor = {
  name: string;
  desc: string;
  launch: string;
  fallback?: string;
  logo: string;
};

const EDITORS: Editor[] = [
  {
    name: "VS Code",
    desc: "Launch the desktop app",
    launch: "vscode://",
    fallback: "https://vscode.dev/",
    logo: "https://cdn.simpleicons.org/visualstudiocode/007ACC",
  },
  {
    name: "Cursor",
    desc: "Open the Cursor editor",
    launch: "cursor://",
    fallback: "https://cursor.com/",
    logo: "https://www.google.com/s2/favicons?domain=cursor.com&sz=64",
  },
  {
    name: "Antigravity",
    desc: "Google Antigravity IDE",
    launch: "antigravity://",
    fallback: "https://antigravity.google/",
    logo: "https://www.google.com/s2/favicons?domain=antigravity.google&sz=64",
  },
  {
    name: "Codex",
    desc: "OpenAI Codex workspace",
    launch: "https://chatgpt.com/codex",
    logo: "https://cdn.simpleicons.org/openai/ffffff",
  },
];

const PATH_KEY = "devos:project-path";

function iconUrl(slug: string, color: string) {
  return `https://cdn.simpleicons.org/${slug}/${color}`;
}

function launchProtocol(url: string, fallback?: string) {
  if (typeof window === "undefined") return;
  if (url.startsWith("http")) {
    openExternal(url);
    return;
  }
  window.location.href = url;
  if (fallback) {
    toast("Opening desktop app…", {
      description: "Nothing happened? Use the web version instead.",
      action: { label: "Open web", onClick: () => openExternal(fallback) },
    });
  }
}

export function DevServices() {
  const [projectPath, setProjectPath] = useState("");

  useEffect(() => {
    setProjectPath(localStorage.getItem(PATH_KEY) ?? "");
  }, []);

  const savePath = (value: string) => {
    setProjectPath(value);
    localStorage.setItem(PATH_KEY, value);
  };

  const openProject = () => {
    const path = projectPath.trim();
    if (!path) {
      toast.error("Add your local project path first");
      return;
    }
    const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
    launchProtocol(`vscode://file/${normalized}`, "https://vscode.dev/");
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Rocket className="size-3.5 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Quick launch</h2>
          <span className="text-[11px] text-muted-foreground">
            Opens each dashboard in a new tab — sign in with your own account
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SERVICES.map((service) => (
            <button
              key={service.name}
              type="button"
              onClick={() => openExternal(service.url)}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/50"
            >
              <img
                src={iconUrl(service.slug, service.color)}
                alt=""
                loading="lazy"
                className="size-6 shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">{service.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{service.desc}</span>
              </span>
              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <MonitorPlay className="size-3.5 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Editors & AI IDEs</h2>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {EDITORS.map((editor) => (
            <div
              key={editor.name}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card/50 p-3"
            >
              <div className="flex items-center gap-2">
                <img src={editor.logo} alt="" loading="lazy" className="size-5 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{editor.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{editor.desc}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-[11px]"
                  onClick={() => launchProtocol(editor.launch, editor.fallback)}
                >
                  Launch {editor.name}
                </Button>
                {editor.fallback ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[11px]"
                    onClick={() => openExternal(editor.fallback!)}
                  >
                    Web
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2 rounded-xl border border-border bg-card/50 p-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="size-3.5 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Open current project</h2>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Paste the absolute path of your local project folder — it is saved on this device and opens
          straight in VS Code.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[240px] flex-1 space-y-1">
            <Label className="text-[11px]" htmlFor="project-path">
              Project path
            </Label>
            <Input
              id="project-path"
              value={projectPath}
              onChange={(event) => savePath(event.target.value)}
              placeholder="C:/Users/you/dev/devos  or  /Users/you/dev/devos"
              className="h-8 text-xs"
            />
          </div>
          <Button size="sm" className="h-8 text-[11px]" onClick={openProject}>
            Open in VS Code
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 text-[11px]"
            onClick={() => openExternal("https://vscode.dev/")}
          >
            Open vscode.dev
          </Button>
        </div>
      </section>
    </div>
  );
}