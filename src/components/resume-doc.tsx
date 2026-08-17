import { useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CodingProfile, Resume, ResumeEntry, ResumeSection } from "@/lib/devos-types";
import { PROFILE_URL_TEMPLATE } from "@/lib/devos-types";
import { cn } from "@/lib/utils";

/** Sections this document renders, in fixed print order. */
export const DOC_SECTIONS = [
  { kind: "education", title: "Education" },
  { kind: "projects", title: "Projects" },
  { kind: "skills", title: "Technical Skills" },
  { kind: "achievements", title: "Achievements" },
] as const;

export type DocKind = (typeof DOC_SECTIONS)[number]["kind"];

/* ------------------------------------------------------------------ */
/* Inline editing primitives                                           */
/* ------------------------------------------------------------------ */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** `**bold**` markers become <strong> so inline emphasis survives round-trips. */
function toHtml(text: string): string {
  return escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function serialize(root: HTMLElement): string {
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    const el = node as HTMLElement;
    const inner = Array.from(el.childNodes).map(walk).join("");
    if (el.tagName === "BR") return " ";
    if (el.tagName === "B" || el.tagName === "STRONG")
      return inner.trim() ? `**${inner.trim()}**` : inner;
    return inner;
  };
  return Array.from(root.childNodes)
    .map(walk)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export function Editable({
  value,
  onCommit,
  placeholder,
  className,
  rich = false,
}: {
  value: string;
  onCommit: (next: string) => void;
  placeholder?: string;
  className?: string;
  rich?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    const html = rich ? toHtml(value) : escapeHtml(value);
    if (el.innerHTML !== html) el.innerHTML = html;
  }, [value, rich]);

  return (
    <span
      ref={ref}
      role="textbox"
      tabIndex={0}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      className={cn("rd-edit", className)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
        if (rich && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
          e.preventDefault();
          document.execCommand("bold");
        }
      }}
      onPaste={(e) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain").replace(/\s+/g, " ");
        document.execCommand("insertText", false, text);
      }}
      onBlur={(e) => {
        const next = rich
          ? serialize(e.currentTarget)
          : (e.currentTarget.textContent ?? "").replace(/\s+/g, " ").trim();
        if (next !== value) onCommit(next);
        e.currentTarget.innerHTML = rich ? toHtml(next) : escapeHtml(next);
      }}
    />
  );
}

function RowActions({ onDelete, label }: { onDelete: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onDelete}
      className="rd-remove"
      title={label}
    >
      <Trash2 className="size-3" />
    </button>
  );
}

function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rd-add">
      <Plus className="size-3" />
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Document                                                            */
/* ------------------------------------------------------------------ */

export type EntryPatch = Partial<{
  title: string;
  organization: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  bullets: string[];
}>;

export function ResumeDocument({
  resume,
  sections,
  entries,
  codingProfiles,
  onPatchResume,
  onPatchEntry,
  onAddEntry,
  onDeleteEntry,
  onToggleSection,
}: {
  resume: Resume;
  sections: ResumeSection[];
  entries: ResumeEntry[];
  codingProfiles: CodingProfile[];
  onPatchResume: (patch: Partial<Resume>) => void;
  onPatchEntry: (id: string, patch: EntryPatch) => void;
  onAddEntry: (sectionId: string, kind: string) => void;
  onDeleteEntry: (entry: ResumeEntry) => void;
  onToggleSection: (kind: DocKind, title: string, enabled: boolean) => void;
}) {
  const byKind = new Map(sections.map((s) => [s.kind, s]));
  const codingLink = (platform: string): string | null => {
    const row = codingProfiles.find((p) => p.platform === platform);
    if (!row) return null;
    return row.profile_url ?? PROFILE_URL_TEMPLATE[platform]?.(row.username) ?? null;
  };

  const links: { label: string; href: string | null; key: keyof Resume | null }[] = [
    { label: "LinkedIn", href: resume.linkedin_url, key: "linkedin_url" },
    { label: "GitHub", href: resume.github_url, key: "github_url" },
    { label: "LeetCode", href: codingLink("leetcode"), key: null },
    { label: "Codeforces", href: codingLink("codeforces"), key: null },
    { label: "CodeChef", href: codingLink("codechef"), key: null },
    { label: "Codolio", href: resume.website_url, key: "website_url" },
  ];

  return (
    <div className="resume-paper">
      {/* section toggles — screen only */}
      <div className="rd-toggles no-print">
        {DOC_SECTIONS.map((s) => {
          const on = byKind.has(s.kind);
          return (
            <label key={s.kind} className="rd-toggle">
              <input
                type="checkbox"
                checked={on}
                onChange={() => onToggleSection(s.kind, s.title, !on)}
              />
              {s.title}
            </label>
          );
        })}
      </div>

      <header className="rd-header">
        <h1 className="rd-name">
          <Editable
            value={resume.full_name ?? ""}
            placeholder="Your Full Name"
            onCommit={(full_name) => onPatchResume({ full_name: full_name || null })}
          />
        </h1>
        <p className="rd-contact">
          <Editable
            value={resume.phone ?? ""}
            placeholder="+91 00000 00000"
            onCommit={(phone) => onPatchResume({ phone: phone || null })}
          />
          <span className="rd-pipe">|</span>
          <Editable
            className="rd-link"
            value={resume.email ?? ""}
            placeholder="you@example.com"
            onCommit={(email) => onPatchResume({ email: email || null })}
          />
          {links.map((link) => (
            <span key={link.label} className="contents">
              <span className="rd-pipe">|</span>
              {link.key ? (
                <span className="rd-link-slot">
                  {link.href ? (
                    <a
                      className="rd-link"
                      href={link.href}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <span className="rd-link rd-muted">{link.label}</span>
                  )}
                  <Editable
                    className="rd-url no-print"
                    value={(resume[link.key] as string | null) ?? ""}
                    placeholder="paste url"
                    onCommit={(url) =>
                      onPatchResume({ [link.key as string]: url || null } as Partial<Resume>)
                    }
                  />
                </span>
              ) : link.href ? (
                <a className="rd-link" href={link.href} target="_blank" rel="noreferrer noopener">
                  {link.label}
                </a>
              ) : (
                <span className="rd-link rd-muted">{link.label}</span>
              )}
            </span>
          ))}
        </p>
      </header>

      {DOC_SECTIONS.map((meta) => {
        const section = byKind.get(meta.kind);
        if (!section) return null;
        const rows = entries
          .filter((e) => e.section_id === section.id)
          .sort((a, b) => a.position - b.position);
        return (
          <section key={meta.kind} className="rd-section">
            <h2 className="rd-heading">{section.title || meta.title}</h2>
            {meta.kind === "education"
              ? rows.map((entry) => (
                  <EducationRow
                    key={entry.id}
                    entry={entry}
                    onPatch={onPatchEntry}
                    onDelete={() => onDeleteEntry(entry)}
                  />
                ))
              : meta.kind === "projects"
                ? rows.map((entry) => (
                    <ProjectRow
                      key={entry.id}
                      entry={entry}
                      onPatch={onPatchEntry}
                      onDelete={() => onDeleteEntry(entry)}
                    />
                  ))
                : meta.kind === "skills"
                  ? rows.map((entry) => (
                      <SkillRow
                        key={entry.id}
                        entry={entry}
                        onPatch={onPatchEntry}
                        onDelete={() => onDeleteEntry(entry)}
                      />
                    ))
                  : rows.map((entry) => (
                      <AchievementRow
                        key={entry.id}
                        entry={entry}
                        onPatch={onPatchEntry}
                        onDelete={() => onDeleteEntry(entry)}
                      />
                    ))}
            <div className="no-print">
              <AddRow
                label={`Add ${meta.kind === "skills" ? "category" : meta.kind === "achievements" ? "achievement" : meta.kind === "projects" ? "project" : "education"}`}
                onClick={() => onAddEntry(section.id, meta.kind)}
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Entry rows                                                          */
/* ------------------------------------------------------------------ */

function Bullets({
  entry,
  onPatch,
  placeholder,
}: {
  entry: ResumeEntry;
  onPatch: (id: string, patch: EntryPatch) => void;
  placeholder: string;
}) {
  const bullets = entry.bullets ?? [];
  const setBullets = (next: string[]) => onPatch(entry.id, { bullets: next.filter(Boolean) });
  return (
    <>
      <ul className="rd-bullets">
        {bullets.map((bullet, index) => (
          <li key={index} className="rd-bullet">
            <Editable
              rich
              value={bullet}
              placeholder={placeholder}
              onCommit={(text) => {
                const next = [...bullets];
                next[index] = text;
                setBullets(next);
              }}
            />
            <RowActions
              label="Remove bullet"
              onDelete={() => setBullets(bullets.filter((_, i) => i !== index))}
            />
          </li>
        ))}
      </ul>
      <div className="no-print">
        <AddRow label="Add bullet" onClick={() => onPatch(entry.id, { bullets: [...bullets, ""] })} />
      </div>
    </>
  );
}

function EducationRow({
  entry,
  onPatch,
  onDelete,
}: {
  entry: ResumeEntry;
  onPatch: (id: string, patch: EntryPatch) => void;
  onDelete: () => void;
}) {
  return (
    <article className="rd-entry">
      <div className="rd-row">
        <span className="rd-strong">
          <Editable
            value={entry.title}
            placeholder="Institute name"
            onCommit={(title) => onPatch(entry.id, { title })}
          />
          <span className="rd-sep"> — </span>
          <Editable
            value={entry.organization ?? ""}
            placeholder="University"
            onCommit={(organization) => onPatch(entry.id, { organization: organization || null })}
          />
        </span>
        <span className="rd-right rd-strong">
          <Editable
            value={entry.location ?? ""}
            placeholder="CGPA: 0.00"
            onCommit={(location) => onPatch(entry.id, { location: location || null })}
          />
        </span>
        <RowActions label="Remove education entry" onDelete={onDelete} />
      </div>
      <div className="rd-row">
        <span className="rd-italic">
          <Editable
            value={entry.description ?? ""}
            placeholder="Bachelor of Engineering, Branch"
            onCommit={(description) => onPatch(entry.id, { description: description || null })}
          />
        </span>
        <span className="rd-right rd-italic">
          <Editable
            value={entry.start_date ?? ""}
            placeholder="2024"
            onCommit={(start_date) => onPatch(entry.id, { start_date: start_date || null })}
          />
          <span className="rd-sep"> – </span>
          <Editable
            value={entry.end_date ?? ""}
            placeholder="2028"
            onCommit={(end_date) => onPatch(entry.id, { end_date: end_date || null })}
          />
        </span>
      </div>
      <Bullets entry={entry} onPatch={onPatch} placeholder="SSC Class X: 89% | HSC Class XII: 89%" />
    </article>
  );
}

function ProjectRow({
  entry,
  onPatch,
  onDelete,
}: {
  entry: ResumeEntry;
  onPatch: (id: string, patch: EntryPatch) => void;
  onDelete: () => void;
}) {
  return (
    <article className="rd-entry">
      <div className="rd-row">
        <span>
          <span className="rd-strong">
            <Editable
              value={entry.title}
              placeholder="Project name"
              onCommit={(title) => onPatch(entry.id, { title })}
            />
          </span>
          <span className="rd-sep"> | </span>
          <span className="rd-italic">
            <Editable
              value={entry.description ?? ""}
              placeholder="React, Node.js, MongoDB"
              onCommit={(description) => onPatch(entry.id, { description: description || null })}
            />
          </span>
        </span>
        <span className="rd-right">
          <ProjectLink
            label="Live"
            url={entry.organization ?? ""}
            onCommit={(url) => onPatch(entry.id, { organization: url || null })}
          />
          <span className="rd-sep"> · </span>
          <ProjectLink
            label="GitHub"
            url={entry.location ?? ""}
            onCommit={(url) => onPatch(entry.id, { location: url || null })}
          />
        </span>
        <RowActions label="Remove project" onDelete={onDelete} />
      </div>
      <Bullets
        entry={entry}
        onPatch={onPatch}
        placeholder="Built X using **Tech** to achieve Y"
      />
    </article>
  );
}

function ProjectLink({
  label,
  url,
  onCommit,
}: {
  label: string;
  url: string;
  onCommit: (next: string) => void;
}) {
  return (
    <span className="rd-link-slot">
      {url ? (
        <a className="rd-link" href={url} target="_blank" rel="noreferrer noopener">
          {label}
        </a>
      ) : (
        <span className="rd-link rd-muted">{label}</span>
      )}
      <Editable className="rd-url no-print" value={url} placeholder="url" onCommit={onCommit} />
    </span>
  );
}

function SkillRow({
  entry,
  onPatch,
  onDelete,
}: {
  entry: ResumeEntry;
  onPatch: (id: string, patch: EntryPatch) => void;
  onDelete: () => void;
}) {
  return (
    <div className="rd-row rd-skill">
      <span>
        <span className="rd-strong">
          <Editable
            value={entry.title}
            placeholder="Languages"
            onCommit={(title) => onPatch(entry.id, { title })}
          />
        </span>
        <span className="rd-sep">: </span>
        <Editable
          value={entry.description ?? ""}
          placeholder="C++, JavaScript, TypeScript"
          onCommit={(description) => onPatch(entry.id, { description: description || null })}
        />
      </span>
      <RowActions label="Remove skill category" onDelete={onDelete} />
    </div>
  );
}

function AchievementRow({
  entry,
  onPatch,
  onDelete,
}: {
  entry: ResumeEntry;
  onPatch: (id: string, patch: EntryPatch) => void;
  onDelete: () => void;
}) {
  return (
    <ul className="rd-bullets rd-dots">
      <li className="rd-bullet">
        <Editable
          rich
          value={entry.title}
          placeholder="Achieved **Specialist** on Codeforces (Max Rating: **1470**)"
          onCommit={(title) => onPatch(entry.id, { title })}
        />
        <RowActions label="Remove achievement" onDelete={onDelete} />
      </li>
    </ul>
  );
}