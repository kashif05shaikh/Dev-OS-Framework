import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Braces,
  Check,
  Clock,
  Copy,
  Fingerprint,
  Hash,
  KeyRound,
  Link2,
  Palette,
  Regex,
  Type,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tools")({
  head: () => ({
    meta: [
      { title: "Dev Tools — DevOS" },
      {
        name: "description",
        content:
          "Everyday developer utilities in one place: JSON formatter, Base64, URL encoder, JWT decoder, UUID and hash generators, timestamp and color converters, regex tester and case converter.",
      },
      { property: "og:title", content: "Dev Tools — DevOS" },
      {
        property: "og:description",
        content: "JSON, Base64, JWT, UUID, hashing, timestamps, colors, regex — all offline in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ToolsPage,
});

const TOOLS = [
  { id: "json", label: "JSON formatter", icon: Braces },
  { id: "base64", label: "Base64", icon: Fingerprint },
  { id: "url", label: "URL encoder", icon: Link2 },
  { id: "jwt", label: "JWT decoder", icon: KeyRound },
  { id: "uuid", label: "UUID generator", icon: Hash },
  { id: "hash", label: "Hash generator", icon: Hash },
  { id: "timestamp", label: "Timestamp", icon: Clock },
  { id: "color", label: "Color converter", icon: Palette },
  { id: "regex", label: "Regex tester", icon: Regex },
  { id: "case", label: "Case converter", icon: Type },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8"
      disabled={!value}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          toast.error("Clipboard is blocked by your browser.");
        }
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mb-4 text-xs text-muted-foreground">{description}</p>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function JsonTool() {
  const [input, setInput] = useState('{"hello":"world","items":[1,2,3]}');
  const result = useMemo(() => {
    if (!input.trim()) return { ok: true, output: "" };
    try {
      return { ok: true, output: JSON.stringify(JSON.parse(input), null, 2) };
    } catch (e) {
      return { ok: false, output: e instanceof Error ? e.message : "Invalid JSON" };
    }
  }, [input]);

  return (
    <Panel title="JSON formatter" description="Validate, pretty-print or minify JSON.">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={8}
        className="font-mono text-xs"
        placeholder="Paste JSON…"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className="h-8"
          disabled={!result.ok}
          onClick={() => setInput(result.output)}
        >
          Pretty print
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          disabled={!result.ok}
          onClick={() => {
            try {
              setInput(JSON.stringify(JSON.parse(input)));
            } catch {
              /* handled by validity banner */
            }
          }}
        >
          Minify
        </Button>
        <CopyButton value={result.ok ? result.output : ""} />
      </div>
      <p className={cn("text-xs", result.ok ? "text-emerald-400" : "text-destructive")}>
        {input.trim() ? (result.ok ? "Valid JSON" : result.output) : "Waiting for input"}
      </p>
      {result.ok && result.output ? (
        <pre className="max-h-72 overflow-auto rounded-lg bg-muted/40 p-3 font-mono text-xs">
          {result.output}
        </pre>
      ) : null}
    </Panel>
  );
}

function Base64Tool() {
  const [text, setText] = useState("");
  const [encoded, setEncoded] = useState("");
  const [error, setError] = useState("");

  return (
    <Panel title="Base64" description="Encode and decode Base64 with full UTF-8 support.">
      <div className="grid gap-1.5">
        <Label className="text-xs">Plain text</Label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="font-mono text-xs"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className="h-8"
          onClick={() => {
            try {
              setEncoded(btoa(String.fromCharCode(...new TextEncoder().encode(text))));
              setError("");
            } catch {
              setError("Could not encode this text.");
            }
          }}
        >
          Encode →
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={() => {
            try {
              const bytes = Uint8Array.from(atob(encoded.trim()), (c) => c.charCodeAt(0));
              setText(new TextDecoder().decode(bytes));
              setError("");
            } catch {
              setError("That is not valid Base64.");
            }
          }}
        >
          ← Decode
        </Button>
        <CopyButton value={encoded} label="Copy Base64" />
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs">Base64</Label>
        <Textarea
          value={encoded}
          onChange={(e) => setEncoded(e.target.value)}
          rows={4}
          className="font-mono text-xs"
        />
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </Panel>
  );
}

function UrlTool() {
  const [raw, setRaw] = useState("");
  const [encoded, setEncoded] = useState("");
  const [error, setError] = useState("");

  return (
    <Panel title="URL encoder" description="Percent-encode or decode URLs and query strings.">
      <Textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={3}
        className="font-mono text-xs"
        placeholder="https://example.com/search?q=hello world"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          className="h-8"
          onClick={() => {
            setEncoded(encodeURIComponent(raw));
            setError("");
          }}
        >
          Encode →
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={() => {
            try {
              setRaw(decodeURIComponent(encoded));
              setError("");
            } catch {
              setError("That string is not valid percent-encoding.");
            }
          }}
        >
          ← Decode
        </Button>
        <CopyButton value={encoded} label="Copy encoded" />
      </div>
      <Textarea
        value={encoded}
        onChange={(e) => setEncoded(e.target.value)}
        rows={3}
        className="font-mono text-xs"
        placeholder="Encoded output"
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </Panel>
  );
}

function decodeSegment(segment: string): string {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(padded + "=".repeat((4 - (padded.length % 4)) % 4)), (c) =>
    c.charCodeAt(0),
  );
  return JSON.stringify(JSON.parse(new TextDecoder().decode(bytes)), null, 2);
}

function JwtTool() {
  const [token, setToken] = useState("");
  const decoded = useMemo(() => {
    const value = token.trim();
    if (!value) return null;
    const parts = value.split(".");
    if (parts.length < 2) return { error: "A JWT needs at least a header and payload segment." };
    try {
      const header = decodeSegment(parts[0]!);
      const payload = decodeSegment(parts[1]!);
      const exp = JSON.parse(payload).exp as number | undefined;
      return {
        header,
        payload,
        expiry: exp ? new Date(exp * 1000) : null,
      };
    } catch {
      return { error: "Could not decode this token." };
    }
  }, [token]);

  return (
    <Panel
      title="JWT decoder"
      description="Decode header and payload locally. Signatures are never verified or sent anywhere."
    >
      <Textarea
        value={token}
        onChange={(e) => setToken(e.target.value)}
        rows={4}
        className="font-mono text-xs"
        placeholder="eyJhbGciOi…"
      />
      {decoded && "error" in decoded ? (
        <p className="text-xs text-destructive">{decoded.error}</p>
      ) : decoded ? (
        <div className="space-y-3">
          {decoded.expiry ? (
            <p
              className={cn(
                "text-xs",
                decoded.expiry.getTime() < Date.now() ? "text-destructive" : "text-emerald-400",
              )}
            >
              {decoded.expiry.getTime() < Date.now() ? "Expired" : "Expires"}{" "}
              {decoded.expiry.toLocaleString()}
            </p>
          ) : null}
          <div className="grid gap-1.5">
            <Label className="text-xs">Header</Label>
            <pre className="overflow-auto rounded-lg bg-muted/40 p-3 font-mono text-xs">
              {decoded.header}
            </pre>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Payload</Label>
            <pre className="max-h-72 overflow-auto rounded-lg bg-muted/40 p-3 font-mono text-xs">
              {decoded.payload}
            </pre>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

function UuidTool() {
  const [count, setCount] = useState(5);
  const [ids, setIds] = useState<string[]>([]);

  const generate = (n: number) =>
    setIds(Array.from({ length: Math.max(1, Math.min(50, n)) }, () => crypto.randomUUID()));

  useEffect(() => {
    generate(5);
  }, []);

  return (
    <Panel title="UUID generator" description="Cryptographically random v4 UUIDs.">
      <div className="flex flex-wrap items-end gap-2">
        <div className="grid gap-1.5">
          <Label className="text-xs">How many</Label>
          <Input
            type="number"
            min={1}
            max={50}
            value={String(count)}
            onChange={(e) => setCount(Number(e.target.value) || 1)}
            className="h-8 w-24 text-xs"
          />
        </div>
        <Button size="sm" className="h-8" onClick={() => generate(count)}>
          Generate
        </Button>
        <CopyButton value={ids.join("\n")} label="Copy all" />
      </div>
      <pre className="max-h-80 overflow-auto rounded-lg bg-muted/40 p-3 font-mono text-xs">
        {ids.join("\n")}
      </pre>
    </Panel>
  );
}

const HASH_ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;

function HashTool() {
  const [text, setText] = useState("");
  const [algo, setAlgo] = useState<string>("SHA-256");
  const [digest, setDigest] = useState("");

  const run = async () => {
    const buffer = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
    setDigest(
      Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
    );
  };

  return (
    <Panel title="Hash generator" description="SHA digests computed in your browser.">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="font-mono text-xs"
        placeholder="Text to hash…"
      />
      <div className="flex flex-wrap gap-2">
        {HASH_ALGOS.map((a) => (
          <Button
            key={a}
            size="sm"
            variant={algo === a ? "secondary" : "ghost"}
            className="h-8"
            onClick={() => setAlgo(a)}
          >
            {a}
          </Button>
        ))}
        <Button size="sm" className="h-8" onClick={() => void run()}>
          Hash
        </Button>
        <CopyButton value={digest} label="Copy digest" />
      </div>
      {digest ? (
        <pre className="overflow-auto break-all rounded-lg bg-muted/40 p-3 font-mono text-xs">
          {digest}
        </pre>
      ) : null}
    </Panel>
  );
}

function TimestampTool() {
  const [value, setValue] = useState(String(Math.floor(Date.now() / 1000)));
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const parsed = useMemo(() => {
    const raw = value.trim();
    if (!raw) return null;
    const numeric = Number(raw);
    const date = Number.isFinite(numeric)
      ? new Date(raw.length > 10 ? numeric : numeric * 1000)
      : new Date(raw);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }, [value]);

  return (
    <Panel
      title="Timestamp converter"
      description="Convert between Unix timestamps and human-readable dates."
    >
      <div className="flex flex-wrap items-end gap-2">
        <div className="grid flex-1 gap-1.5">
          <Label className="text-xs">Unix seconds, milliseconds or a date string</Label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-9 font-mono text-xs"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-9"
          onClick={() => setValue(String(Math.floor(Date.now() / 1000)))}
        >
          Now
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Current Unix time: <span className="font-mono">{Math.floor(now / 1000)}</span>
      </p>
      {parsed ? (
        <dl className="grid gap-1 rounded-lg bg-muted/40 p-3 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Local</dt>
            <dd className="font-mono">{parsed.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">ISO 8601</dt>
            <dd className="font-mono">{parsed.toISOString()}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Unix seconds</dt>
            <dd className="font-mono">{Math.floor(parsed.getTime() / 1000)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Unix ms</dt>
            <dd className="font-mono">{parsed.getTime()}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-xs text-destructive">Could not parse that value.</p>
      )}
    </Panel>
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.trim().replace(/^#/, "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, Math.round(l * 100)];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return [h, Math.round(s * 100), Math.round(l * 100)];
}

function ColorTool() {
  const [hex, setHex] = useState("#8b5cf6");
  const rgb = hexToRgb(hex);
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;

  return (
    <Panel title="Color converter" description="HEX to RGB and HSL, with a live swatch.">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="size-12 rounded-lg border border-border"
          style={{ backgroundColor: rgb ? hex : "transparent" }}
        />
        <Input
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          className="h-9 w-40 font-mono text-xs"
          placeholder="#8b5cf6"
        />
        <input
          type="color"
          value={rgb ? hex : "#000000"}
          onChange={(e) => setHex(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-md border border-border bg-transparent"
          aria-label="Pick a color"
        />
      </div>
      {rgb && hsl ? (
        <dl className="grid gap-1 rounded-lg bg-muted/40 p-3 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">HEX</dt>
            <dd className="font-mono">{hex.toLowerCase()}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">RGB</dt>
            <dd className="font-mono">{`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">HSL</dt>
            <dd className="font-mono">{`hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-xs text-destructive">Enter a valid 3 or 6 digit HEX color.</p>
      )}
    </Panel>
  );
}

function RegexTool() {
  const [pattern, setPattern] = useState("\\b\\w+@\\w+\\.\\w+\\b");
  const [flags, setFlags] = useState("g");
  const [sample, setSample] = useState("Contact dev@devos.app or team@example.com for access.");

  const result = useMemo(() => {
    if (!pattern) return { matches: [] as string[], error: "" };
    try {
      const re = new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`);
      return { matches: sample.match(re) ?? [], error: "" };
    } catch (e) {
      return { matches: [], error: e instanceof Error ? e.message : "Invalid pattern" };
    }
  }, [pattern, flags, sample]);

  return (
    <Panel title="Regex tester" description="Test a pattern against sample text and list matches.">
      <div className="flex flex-wrap gap-2">
        <div className="grid flex-1 gap-1.5">
          <Label className="text-xs">Pattern</Label>
          <Input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="h-9 font-mono text-xs"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Flags</Label>
          <Input
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            className="h-9 w-24 font-mono text-xs"
            placeholder="gi"
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label className="text-xs">Sample text</Label>
        <Textarea
          value={sample}
          onChange={(e) => setSample(e.target.value)}
          rows={5}
          className="font-mono text-xs"
        />
      </div>
      {result.error ? (
        <p className="text-xs text-destructive">{result.error}</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{result.matches.length} matches</p>
          {result.matches.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {result.matches.map((m, i) => (
                <li
                  key={`${m}-${i}`}
                  className="rounded-md bg-primary/15 px-2 py-0.5 font-mono text-xs text-primary"
                >
                  {m}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </Panel>
  );
}

function words(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
}

function CaseTool() {
  const [text, setText] = useState("DevOS developer operating system");
  const w = words(text);
  const rows: [string, string][] = [
    ["camelCase", w.map((x, i) => (i === 0 ? x.toLowerCase() : x[0]!.toUpperCase() + x.slice(1).toLowerCase())).join("")],
    ["PascalCase", w.map((x) => x[0]!.toUpperCase() + x.slice(1).toLowerCase()).join("")],
    ["snake_case", w.map((x) => x.toLowerCase()).join("_")],
    ["kebab-case", w.map((x) => x.toLowerCase()).join("-")],
    ["CONSTANT_CASE", w.map((x) => x.toUpperCase()).join("_")],
    ["Title Case", w.map((x) => x[0]!.toUpperCase() + x.slice(1).toLowerCase()).join(" ")],
    ["lower case", text.toLowerCase()],
    ["UPPER CASE", text.toUpperCase()],
  ];

  return (
    <Panel title="Case converter" description="Convert any string into common naming conventions.">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="text-xs"
      />
      <ul className="space-y-1.5">
        {rows.map(([label, value]) => (
          <li
            key={label}
            className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs"
          >
            <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
            <span className="min-w-0 flex-1 truncate font-mono">{value}</span>
            <CopyButton value={value} label="" />
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ToolsPage() {
  const [active, setActive] = useState<ToolId>("json");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <div className="mr-auto">
          <h1 className="text-sm font-semibold">Dev Tools</h1>
          <p className="text-xs text-muted-foreground">
            {TOOLS.length} offline utilities — nothing you paste ever leaves your browser
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-56 shrink-0 border-r border-border p-3 md:block">
          <ScrollArea className="h-full">
            <div className="space-y-1 pr-2">
              {TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setActive(tool.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors",
                    active === tool.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <tool.icon className="size-3.5" />
                  {tool.label}
                </button>
              ))}
            </div>
          </ScrollArea>
        </nav>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-4">
            <div className="mb-3 flex flex-wrap gap-1.5 md:hidden">
              {TOOLS.map((tool) => (
                <Button
                  key={tool.id}
                  size="sm"
                  variant={active === tool.id ? "secondary" : "ghost"}
                  className="h-7 text-[11px]"
                  onClick={() => setActive(tool.id)}
                >
                  {tool.label}
                </Button>
              ))}
            </div>

            {active === "json" ? <JsonTool /> : null}
            {active === "base64" ? <Base64Tool /> : null}
            {active === "url" ? <UrlTool /> : null}
            {active === "jwt" ? <JwtTool /> : null}
            {active === "uuid" ? <UuidTool /> : null}
            {active === "hash" ? <HashTool /> : null}
            {active === "timestamp" ? <TimestampTool /> : null}
            {active === "color" ? <ColorTool /> : null}
            {active === "regex" ? <RegexTool /> : null}
            {active === "case" ? <CaseTool /> : null}

            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Wrench className="size-3" />
              All tools run locally in your browser.
            </p>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
