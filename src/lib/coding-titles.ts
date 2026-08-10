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
