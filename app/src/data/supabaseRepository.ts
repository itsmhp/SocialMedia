import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { requireSupabase } from "../lib/supabase";

export interface RemoteRoom {
  id: string;
  name: string;
  spark: string;
  created_by: string;
  created_at: string;
  expires_at: string;
  duration_hours: 12 | 24;
  status: "active" | "faded";
  extension_cycle: number;
  extension_count: number;
  max_extensions: number;
  member_limit: number;
  faded_at: string | null;
}

export interface InvitePreview {
  room_id: string;
  room_name: string;
  spark: string;
  member_count: number;
  member_limit: number;
  expires_at: string;
}

export interface CreatedInvite {
  token: string;
  expires_at: string;
  max_uses: number;
}

export interface ExtendVoteResult {
  extended: boolean;
  keep_count: number;
  member_count: number;
  cycle: number;
  expires_at: string;
}

export type ReportReason = "harassment" | "spam" | "privacy" | "other";

function first<T>(data: unknown, operation: string): T {
  if (!Array.isArray(data) || data.length !== 1) {
    throw new Error(`${operation} returned an unexpected response.`);
  }
  return data[0] as T;
}

export async function updateRemoteProfile(handle: string, avatar: string): Promise<void> {
  const client = await requireSupabase();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Authentication required.");
  const { error } = await client
    .from("profiles")
    .update({ handle: handle.trim(), avatar, updated_at: new Date().toISOString() })
    .eq("id", userData.user.id);
  if (error) throw error;
}

export async function createRemoteRoom(input: {
  name: string;
  spark: string;
  durationHours: 12 | 24;
  memberLimit?: number;
}): Promise<RemoteRoom> {
  const client = await requireSupabase();
  const { data, error } = await client.rpc("create_room", {
    p_name: input.name,
    p_spark: input.spark,
    p_duration_hours: input.durationHours,
    p_member_limit: input.memberLimit ?? 12,
  });
  if (error) throw error;
  return (Array.isArray(data) ? data[0] : data) as RemoteRoom;
}

export async function createRemoteInvite(
  roomId: string,
  expiresInHours = 24,
  maxUses = 12,
): Promise<CreatedInvite> {
  const client = await requireSupabase();
  const { data, error } = await client.rpc("create_room_invite", {
    p_room_id: roomId,
    p_expires_in_hours: expiresInHours,
    p_max_uses: maxUses,
  });
  if (error) throw error;
  return first<CreatedInvite>(data, "create_room_invite");
}

export async function previewRemoteInvite(token: string): Promise<InvitePreview | null> {
  const client = await requireSupabase();
  const { data, error } = await client.rpc("preview_room_invite", { p_token: token });
  if (error) throw error;
  if (!Array.isArray(data) || data.length === 0) return null;
  return data[0] as InvitePreview;
}

export async function joinRemoteRoom(token: string): Promise<string> {
  const client = await requireSupabase();
  const { data, error } = await client.rpc("join_room_by_invite", { p_token: token });
  if (error) throw error;
  if (typeof data !== "string") throw new Error("join_room_by_invite returned an unexpected response.");
  return data;
}

export async function revokeRemoteInvite(inviteId: string): Promise<void> {
  const client = await requireSupabase();
  const { error } = await client.rpc("revoke_room_invite", { p_invite_id: inviteId });
  if (error) throw error;
}

export async function leaveRemoteRoom(roomId: string): Promise<void> {
  const client = await requireSupabase();
  const { error } = await client.rpc("leave_room", { p_room_id: roomId });
  if (error) throw error;
}

export async function removeRemoteMember(roomId: string, userId: string): Promise<void> {
  const client = await requireSupabase();
  const { error } = await client.rpc("remove_room_member", {
    p_room_id: roomId,
    p_user_id: userId,
  });
  if (error) throw error;
}

export async function castRemoteExtendVote(
  roomId: string,
  choice: "keep" | "fade",
): Promise<ExtendVoteResult> {
  const client = await requireSupabase();
  const { data, error } = await client.rpc("cast_extend_vote", {
    p_room_id: roomId,
    p_choice: choice,
  });
  if (error) throw error;
  return first<ExtendVoteResult>(data, "cast_extend_vote");
}

export async function reportRemoteContent(input: {
  roomId: string;
  messageId?: string;
  reportedUserId?: string;
  reason: ReportReason;
  details?: string;
}): Promise<string> {
  const client = await requireSupabase();
  const { data, error } = await client.rpc("report_room_content", {
    p_room_id: input.roomId,
    p_message_id: input.messageId ?? null,
    p_reported_user_id: input.reportedUserId ?? null,
    p_reason: input.reason,
    p_details: input.details ?? "",
  });
  if (error) throw error;
  if (typeof data !== "string") throw new Error("report_room_content returned an unexpected response.");
  return data;
}

export async function setRemoteBlock(blockedUserId: string, active: boolean): Promise<void> {
  const client = await requireSupabase();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Authentication required.");
  const query = client.from("user_blocks");
  const { error } = active
    ? await query.insert({ blocker_id: userData.user.id, blocked_id: blockedUserId })
    : await query.delete().eq("blocker_id", userData.user.id).eq("blocked_id", blockedUserId);
  if (error) throw error;
}

export async function sendRemoteMessage(roomId: string, body: string): Promise<string> {
  const client = await requireSupabase();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Authentication required.");
  const { data, error } = await client
    .from("messages")
    .insert({ room_id: roomId, user_id: userData.user.id, body: body.trim(), system: false })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function setRemoteReaction(
  roomId: string,
  messageId: string,
  emoji: "😂" | "❤️" | "🔥",
  active: boolean,
): Promise<void> {
  const client = await requireSupabase();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Authentication required.");
  const { error } = await client.from("reactions").upsert(
    {
      room_id: roomId,
      message_id: messageId,
      user_id: userData.user.id,
      emoji,
      active,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "message_id,user_id,emoji" },
  );
  if (error) throw error;
}

export async function subscribeToRemoteRoom(
  roomId: string,
  onChange: () => void,
): Promise<() => void> {
  const client: SupabaseClient = await requireSupabase();
  await client.realtime.setAuth();
  const channel: RealtimeChannel = client
    .channel(`room:${roomId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` }, onChange)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` }, onChange)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "reactions", filter: `room_id=eq.${roomId}` }, onChange)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "reactions", filter: `room_id=eq.${roomId}` }, onChange)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "extend_votes", filter: `room_id=eq.${roomId}` }, onChange)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "extend_votes", filter: `room_id=eq.${roomId}` }, onChange)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, onChange)
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}