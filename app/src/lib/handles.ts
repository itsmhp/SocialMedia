const HANDLE_PREFIXES = [
  "glowing",
  "campfire",
  "cozy",
  "dusk",
  "ember",
  "midnight",
  "moonlit",
  "quiet",
  "soft",
  "spark",
  "starlit",
  "warm",
] as const;

const HANDLE_SUFFIXES = [
  "bee",
  "cat",
  "fox",
  "frog",
  "moth",
  "owl",
  "panda",
  "penguin",
  "turtle",
] as const;

export function randomHandle(current = "", random: () => number = Math.random): string {
  const total = HANDLE_PREFIXES.length * HANDLE_SUFFIXES.length;
  let index = Math.min(total - 1, Math.max(0, Math.floor(random() * total)));
  let handle = `${HANDLE_PREFIXES[Math.floor(index / HANDLE_SUFFIXES.length)]}_${HANDLE_SUFFIXES[index % HANDLE_SUFFIXES.length]}`;

  if (handle === current.toLowerCase()) {
    index = (index + 1) % total;
    handle = `${HANDLE_PREFIXES[Math.floor(index / HANDLE_SUFFIXES.length)]}_${HANDLE_SUFFIXES[index % HANDLE_SUFFIXES.length]}`;
  }

  return handle;
}