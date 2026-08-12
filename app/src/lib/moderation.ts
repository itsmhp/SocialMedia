// Minimal client-side filter for clearly objectionable language, satisfying the
// "method for filtering objectionable material" requirement (Apple 1.2 / UGC policy).
// Report, block, and delete still handle everything this list does not catch.

const BLOCKED_TERMS = [
  // English slurs and extreme sexual/violent terms
  "nigger", "nigga", "faggot", "retard", "chink", "spic", "kike", "tranny", "coon", "wetback",
  "cunt", "rape", "rapist", "pedophile", "paedophile", "molester",
  // Indonesian slurs and strong profanity
  "kontol", "memek", "ngentot", "ngentod", "pepek", "colmek", "jancok", "jancuk",
  "bangsat", "bajingan", "pelacur", "lonte", "bencong",
];

const LEET: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s",
};

/** Lowercase, map common leetspeak to letters, and drop anything that is not a letter or space. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[013457@$]/g, (char) => LEET[char] ?? char)
    .replace(/[^a-z\s]/g, " ");
}

const BLOCKED = new Set(BLOCKED_TERMS.map(normalize));

export const MODERATION_NOTICE = "That may break the Community Guidelines. Please rephrase.";

/** True when the text contains a blocked term as a whole word (avoids false positives like "grape"). */
export function isBlockedText(value: string): boolean {
  const tokens = normalize(value).split(/\s+/).filter(Boolean);
  return tokens.some((token) => BLOCKED.has(token));
}
