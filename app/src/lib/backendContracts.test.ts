import { afterEach, describe, expect, it, vi } from "vitest";
import schema from "../../supabase/schema.sql?raw";
import { normalizeAuthEmail } from "./auth";
import {
  captureInviteTokenFromAddressBar,
  createInviteUrl,
  inviteTokenFromUrl,
  normalizeInviteToken,
} from "./invite";

const TOKEN = "a".repeat(48);

afterEach(() => vi.unstubAllGlobals());

describe("auth and invite contracts", () => {
  it("normalizes valid email without accepting malformed input", () => {
    expect(normalizeAuthEmail("  Test.User@Example.COM ")).toBe("test.user@example.com");
    expect(() => normalizeAuthEmail("not-an-email")).toThrow("valid email");
  });

  it("accepts only 24-byte lowercase hex invite tokens", () => {
    expect(normalizeInviteToken(TOKEN.toUpperCase())).toBe(TOKEN);
    expect(normalizeInviteToken("a".repeat(47))).toBeNull();
    expect(normalizeInviteToken(`${"a".repeat(47)}z`)).toBeNull();
  });

  it("creates and reads an invite URL without preserving a hash fragment", () => {
    const url = createInviteUrl(TOKEN, "https://example.com/SocialMedia/?tab=chat#message");
    expect(url).toBe(`https://example.com/SocialMedia/?tab=chat#invite=${TOKEN}`);
    expect(inviteTokenFromUrl(url)).toBe(TOKEN);
    expect(inviteTokenFromUrl("https://example.com/#invite=bad")).toBeNull();
  });

  it("scrubs the invite fragment even when session storage is unavailable", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: { href: `https://example.com/app/#invite=${TOKEN}` },
      history: { replaceState },
    });
    vi.stubGlobal("sessionStorage", {
      setItem: () => { throw new Error("storage blocked"); },
      getItem: () => null,
      removeItem: vi.fn(),
    });

    expect(captureInviteTokenFromAddressBar()).toBe(TOKEN);
    expect(String(replaceState.mock.calls[0][2])).toBe("https://example.com/app/");
  });
});

describe("Supabase schema security contract", () => {
  it("sets an empty search path on every security-definer function", () => {
    const definers = schema.match(/security\s+definer/gi) ?? [];
    const safeDefiners = schema.match(
      /security\s+definer\s+set\s+search_path\s*=\s*''\s+as\s+\$\$/gis,
    ) ?? [];
    expect(definers.length).toBeGreaterThan(0);
    expect(safeDefiners).toHaveLength(definers.length);
  });

  it("does not permit direct membership or extension-vote writes", () => {
    expect(schema).not.toMatch(/create\s+table\s+if\s+not\s+exists/i);
    expect(schema).not.toMatch(/create\s+policy[^;]+on\s+(public\.)?room_members\s+for\s+insert/is);
    expect(schema).not.toMatch(/create\s+policy[^;]+on\s+(public\.)?extend_votes\s+for\s+(insert|update)/is);
    expect(schema).not.toMatch(/create\s+policy[^;]+on\s+(public\.)?rooms\s+for\s+insert/is);
    expect(schema).not.toMatch(/create\s+policy[^;]+on\s+(public\.)?room_invites\s+for\s+insert/is);
  });

  it("stores only invite hashes and exposes the required atomic RPCs", () => {
    expect(schema).toContain("token_hash bytea not null unique");
    expect(schema).toContain("extensions.digest(p_token, 'sha256')");
    for (const name of [
      "create_room",
      "create_room_invite",
      "preview_room_invite",
      "join_room_by_invite",
      "revoke_room_invite",
      "leave_room",
      "remove_room_member",
      "cast_extend_vote",
      "report_room_content",
      "delete_account",
      "finalize_expired_rooms",
    ]) {
      expect(schema).toMatch(new RegExp(`function\\s+(public\\.|private\\.)?${name}`));
    }
    expect(schema).toContain("message_body_snapshot");
    expect(schema).toContain("reporter_id_snapshot");
    expect(schema).toContain("reported_user_id_snapshot");
    expect(schema).toContain("create table user_blocks");
    expect(schema).toContain("create table reports");
    expect(schema).toContain("private.users_blocked");
    expect(schema).toMatch(/from public\.extend_votes vote\s+join public\.room_members member/is);
    expect(schema).toContain("active boolean not null default true");
    expect(schema).not.toMatch(/on\s+reactions\s+for\s+delete/is);
    expect(schema).not.toMatch(/on\s+messages\s+for\s+delete/is);
    expect(schema).toMatch(/members read Bara highlights[\s\S]+private\.users_blocked/is);
    expect(schema).toContain("alter publication supabase_realtime set (publish = 'insert, update')");
    expect(schema).toContain("private.users_blocked(auth.uid(), reactions.user_id)");
  });
});