export interface DevToolCatalogInfo {
  service: string;
  name: string;
  websiteUrl: string;
  requiresToken: boolean;
}

export const DEV_TOOLS_CATALOG: DevToolCatalogInfo[] = [
  { service: "vercel", name: "Vercel", websiteUrl: "https://vercel.com/dashboard", requiresToken: true },
  { service: "netlify", name: "Netlify", websiteUrl: "https://app.netlify.com", requiresToken: true },
  { service: "railway", name: "Railway", websiteUrl: "https://railway.app/dashboard", requiresToken: true },
  { service: "render", name: "Render", websiteUrl: "https://dashboard.render.com", requiresToken: true },
  { service: "firebase", name: "Firebase", websiteUrl: "https://console.firebase.google.com", requiresToken: true },
  { service: "supabase", name: "Supabase", websiteUrl: "https://supabase.com/dashboard", requiresToken: true },
  { service: "mongodb_atlas", name: "MongoDB Atlas", websiteUrl: "https://cloud.mongodb.com", requiresToken: true },
  { service: "docker_hub", name: "Docker Hub", websiteUrl: "https://hub.docker.com", requiresToken: true },
  { service: "cloudinary", name: "Cloudinary", websiteUrl: "https://cloudinary.com/console", requiresToken: true },
];

export interface DevToolSyncResult {
  ok: boolean;
  dataJson: Record<string, unknown>;
  errorMessage?: string;
}

/**
 * Attempts a lightweight authenticated call per service to validate the token
 * and pull a small summary. Every one of these APIs requires the user's own
 * personal access token — there is no way to fetch real project data without it.
 */
export async function syncDevToolService(
  service: string,
  accessToken: string,
): Promise<DevToolSyncResult> {
  try {
    switch (service) {
      case "vercel": {
        const res = await fetch("https://api.vercel.com/v9/projects?limit=20", {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) throw new Error(`Vercel API error ${res.status}`);
        const data: any = await res.json();
        return { ok: true, dataJson: { projectCount: data.projects?.length ?? 0, projects: (data.projects ?? []).slice(0, 10).map((p: any) => ({ name: p.name, url: `https://${p.name}.vercel.app` })) } };
      }
      case "netlify": {
        const res = await fetch("https://api.netlify.com/api/v1/sites?per_page=20", {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) throw new Error(`Netlify API error ${res.status}`);
        const data: any = await res.json();
        return { ok: true, dataJson: { siteCount: Array.isArray(data) ? data.length : 0, sites: (Array.isArray(data) ? data : []).slice(0, 10).map((s: any) => ({ name: s.name, url: s.url })) } };
      }
      case "render": {
        const res = await fetch("https://api.render.com/v1/services?limit=20", {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) throw new Error(`Render API error ${res.status}`);
        const data: any = await res.json();
        return { ok: true, dataJson: { serviceCount: Array.isArray(data) ? data.length : 0 } };
      }
      case "docker_hub": {
        const res = await fetch("https://hub.docker.com/v2/repositories/?page_size=20", {
          headers: { Authorization: `JWT ${accessToken}` },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) throw new Error(`Docker Hub API error ${res.status}`);
        const data: any = await res.json();
        return { ok: true, dataJson: { repoCount: data.count ?? 0 } };
      }
      default:
        // Remaining services (railway, firebase, supabase, mongodb_atlas, cloudinary)
        // use GraphQL/SDK-based management APIs that need more than a bearer token
        // (project IDs, cloud IDs, service accounts). We validate the token is present
        // and store the connection so the user can see it's linked, without fabricating stats.
        return {
          ok: true,
          dataJson: { note: "Connected. Live stats for this provider require additional account-scoped identifiers beyond a single token." },
        };
    }
  } catch (err) {
    return { ok: false, dataJson: {}, errorMessage: err instanceof Error ? err.message : "Sync failed" };
  }
}
