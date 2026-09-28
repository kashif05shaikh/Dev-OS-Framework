/** Official rank/colour bands for coding platforms — derived, never hardcoded per user. */

const CODEFORCES_BANDS: { min: number; title: string; color: string }[] = [
  { min: 3000, title: "Legendary Grandmaster", color: "#ff0000" },
  { min: 2600, title: "International Grandmaster", color: "#ff0000" },
  { min: 2400, title: "Grandmaster", color: "#ff0000" },
  { min: 2300, title: "International Master", color: "#ff8c00" },
  { min: 2100, title: "Master", color: "#ff8c00" },
  { min: 1900, title: "Candidate Master", color: "#aa00aa" },
  { min: 1600, title: "Expert", color: "#0000ff" },
  { min: 1400, title: "Specialist", color: "#03a89e" },
  { min: 1200, title: "Pupil", color: "#008000" },
  { min: 0, title: "Newbie", color: "#808080" },
];

export function codeforcesBand(rating: number | null) {
  if (rating === null) return null;
  return CODEFORCES_BANDS.find((b) => rating >= b.min) ?? null;
}

const ATCODER_BANDS: { min: number; name: string; color: string }[] = [
  { min: 2800, name: "Red", color: "#ff0000" },
  { min: 2400, name: "Orange", color: "#ff8000" },
  { min: 2000, name: "Yellow", color: "#c0c000" },
  { min: 1600, name: "Blue", color: "#0000ff" },
  { min: 1200, name: "Cyan", color: "#00c0c0" },
  { min: 800, name: "Green", color: "#008000" },
  { min: 400, name: "Brown", color: "#804000" },
  { min: 0, name: "Gray", color: "#808080" },
];

export function atcoderBand(rating: number | null) {
  if (rating === null) return null;
  return ATCODER_BANDS.find((b) => rating >= b.min) ?? null;
}

/** LeetCode contest tiers (official rating bands). */
const LEETCODE_BANDS: { min: number; title: string; color: string }[] = [
  { min: 2200, title: "Guardian", color: "#ff8c00" },
  { min: 1850, title: "Knight", color: "#c084fc" },
  { min: 1600, title: "Contestant", color: "#38bdf8" },
  { min: 0, title: "Newbie", color: "#9ca3af" },
];

export function leetcodeBand(rating: number | null) {
  if (rating === null) return null;
  return LEETCODE_BANDS.find((b) => rating >= b.min) ?? null;
}

/** CodeChef star count derived from rating. */
export function codechefStars(rating: number | null) {
  if (rating === null) return 0;
  if (rating >= 2500) return 7;
  if (rating >= 2200) return 6;
  if (rating >= 2000) return 5;
  if (rating >= 1800) return 4;
  if (rating >= 1600) return 3;
  if (rating >= 1400) return 2;
  return 1;
}
