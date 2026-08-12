import { describe, expect, it } from "vitest";
import { isBlockedText, MODERATION_NOTICE } from "./moderation";

describe("message moderation", () => {
  it("allows ordinary messages", () => {
    for (const text of ["Good morning circle!", "Let's meet at 5pm", "I love this song 🔥", "grape juice", "my therapist is great"]) {
      expect(isBlockedText(text)).toBe(false);
    }
  });

  it("blocks clearly objectionable slurs as whole words", () => {
    expect(isBlockedText("you are a faggot")).toBe(true);
    expect(isBlockedText("kontol")).toBe(true);
  });

  it("catches simple leetspeak and punctuation obfuscation", () => {
    expect(isBlockedText("f4ggot")).toBe(true);
    expect(isBlockedText("k0nt0l!!!")).toBe(true);
  });

  it("does not flag substrings inside safe words", () => {
    expect(isBlockedText("grapes and therapists")).toBe(false);
  });

  it("exposes a user-facing notice", () => {
    expect(MODERATION_NOTICE.length).toBeGreaterThan(0);
  });
});
