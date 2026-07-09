// Lightweight, deterministic ATS-style keyword match analysis — no external
// LLM call is needed for this and keeps the feature free to use offline.
const STOPWORDS = new Set([
  "the", "and", "a", "an", "to", "of", "in", "on", "for", "with", "is", "are",
  "as", "at", "by", "be", "this", "that", "or", "will", "we", "you", "your",
  "our", "have", "has", "from", "it", "into", "using", "used", "use", "who",
  "years", "year", "experience", "strong", "ability", "including", "etc",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export interface ResumeAnalysis {
  atsScore: number;
  keywordAnalysis: {
    matchedKeywords: string[];
    missingKeywords: string[];
    matchPercent: number;
  };
}

export function analyzeResumeAgainstJob(
  resumeText: string,
  skills: string[],
  jobDescription: string,
): ResumeAnalysis {
  const jobTokens = new Set(tokenize(jobDescription));
  const resumeTokens = new Set([
    ...tokenize(resumeText || ""),
    ...skills.flatMap((s) => tokenize(s)),
  ]);

  const jobKeywords = [...jobTokens];
  const matched = jobKeywords.filter((k) => resumeTokens.has(k));
  const missing = jobKeywords.filter((k) => !resumeTokens.has(k));

  const matchPercent = jobKeywords.length > 0 ? Math.round((matched.length / jobKeywords.length) * 100) : 0;

  // Weight: keyword coverage (70%) + baseline structure completeness (30%: has content + has skills)
  const structureScore = (resumeText?.length > 200 ? 15 : 5) + (skills.length >= 5 ? 15 : skills.length * 3);
  const atsScore = Math.min(100, Math.round(matchPercent * 0.7 + structureScore));

  return {
    atsScore,
    keywordAnalysis: {
      matchedKeywords: matched.slice(0, 40),
      missingKeywords: missing.slice(0, 40),
      matchPercent,
    },
  };
}
