import { createServerFn } from "@tanstack/react-start";

export const fetchCodingStats = createServerFn({ method: "POST" })
  .inputValidator((input: { platform: string; username: string }) => {
    const platform = String(input?.platform ?? "").trim();
    const username = String(input?.username ?? "").trim();
    if (!platform) throw new Error("Platform is required.");
    if (!username) throw new Error("Username is required.");
    if (username.length > 100) throw new Error("Username looks invalid.");
    return { platform, username };
  })
  .handler(async ({ data }) => {
    const { fetchPlatformStats } = await import("./coding-profiles.server");
    return fetchPlatformStats(data.platform, data.username);
  });
