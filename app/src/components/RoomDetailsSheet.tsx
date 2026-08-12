import { useEffect, useRef, useState } from "react";
import {
  Ban,
  CalendarDays,
  Clock3,
  CloudOff,
  Crown,
  Ellipsis,
  Flag,
  Flame,
  LogOut,
  ShieldCheck,
  UserMinus,
  UsersRound,
  X,
} from "lucide-react";
import { circleStats, selectedRoom, secondsLeft } from "../data/lifecycle";
import { useRepository } from "../data/RepositoryProvider";
import { useStore } from "../data/store";
import { plural } from "../lib/text";
import { fmtElapsed, fmtTime } from "../lib/time";
import { useDialogFocus } from "../lib/useDialogFocus";
import type { Member } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";

type Confirmation =
  | { type: "remove"; member: Member }
  | { type: "transfer"; member: Member }
  | { type: "leave" }
  | null;

export function CircleProfileSheet() {
  const { state, dispatch } = useStore();
  const { repository } = useRepository();
  const room = selectedRoom(state);
  const [memberActions, setMemberActions] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const confirmationTriggerRef = useRef<HTMLElement | null>(null);
  const close = () => {
    setMemberActions(null);
    setConfirmation(null);
    dispatch({ type: "CLOSE_ROOM_DETAILS" });
  };
  const dialogRef = useDialogFocus(state.roomDetailsOpen && !confirmation, close);

  useEffect(() => {
    const sheet = dialogRef.current;
    if (!sheet) return;
    sheet.toggleAttribute("inert", Boolean(confirmation));
    if (confirmation) sheet.setAttribute("aria-hidden", "true");
    else sheet.removeAttribute("aria-hidden");
  }, [confirmation, dialogRef]);

  const circle = state.circles.find((item) => item.id === room?.circleId);
  if (!state.roomDetailsOpen || !room || !circle) return null;

  const knownMembers = new Map(
    [state.me, ...state.friends].map((member) => [member.id, member]),
  );
  const members = circle.memberIds.map((memberId) => (
    knownMembers.get(memberId) ?? { id: memberId, name: "Unknown member", avatar: "🔥" }
  ));
  const currentUserIsHost = circle.createdBy === state.me.id;
  const active = room.status === "active";
  const burningUntil = active ? state.now : room.expiresAt;
  const burningFor = fmtElapsed((burningUntil - room.createdAt) / 1000);
  const stats = circleStats(state, circle);

  const openConfirmation = (next: Confirmation) => {
    confirmationTriggerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    setConfirmation(next);
  };

  const cancelConfirmation = () => {
    const trigger = confirmationTriggerRef.current;
    confirmationTriggerRef.current = null;
    setConfirmation(null);
    window.requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus();
    });
  };

  const confirm = () => {
    if (!confirmation) return;
    const leaving = confirmation.type === "leave";
    if (confirmation.type === "remove") {
      dispatch({
        type: "REMOVE_ROOM_MEMBER",
        roomId: room.id,
        memberId: confirmation.member.id,
      });
    } else if (confirmation.type === "transfer") {
      dispatch({
        type: "TRANSFER_ROOM_OWNER",
        roomId: room.id,
        memberId: confirmation.member.id,
      });
    } else {
      dispatch({ type: "LEAVE_ROOM", roomId: room.id });
    }
    setMemberActions(null);
    setConfirmation(null);
    confirmationTriggerRef.current = null;
    if (!leaving) {
      window.requestAnimationFrame(() => {
        dialogRef.current?.querySelector<HTMLElement>(".icon-btn")?.focus();
      });
    }
  };

  const confirmationCopy = confirmation?.type === "remove"
    ? {
        title: `Remove ${confirmation.member.name}?`,
        body: "They will lose access to this local Circle and its active fires. Existing Bara stays factual.",
        confirmLabel: "Remove member",
        destructive: true,
      }
    : confirmation?.type === "transfer"
      ? {
          title: `Make ${confirmation.member.name} the host?`,
          body: "They will control member actions for this Circle. You will remain as a member.",
          confirmLabel: "Transfer host",
          destructive: false,
        }
      : {
          title: `Leave ${circle.name}?`,
          body: "This local Circle, its fires, and its Bara will disappear from this device.",
          confirmLabel: "Leave Circle",
          destructive: true,
        };

  return (
    <div
      className="room-details-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        ref={dialogRef}
        className="room-details-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="circle-profile-title"
        tabIndex={-1}
      >
        <header className="room-details-head">
          <div>
            <span className="eyebrow">Private Circle</span>
            <h1 id="circle-profile-title">{circle.name}</h1>
          </div>
          <button type="button" className="icon-btn" onClick={close} aria-label="Close Circle profile">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="room-facts" aria-label="Circle facts">
          <span><CalendarDays size={16} aria-hidden="true" /><strong>{fmtElapsed(stats.ageSeconds)}</strong><small>together</small></span>
          <span><UsersRound size={16} aria-hidden="true" /><strong>{members.length}</strong><small>{plural(members.length, "member")}</small></span>
          <span><Flame size={16} aria-hidden="true" /><strong>{stats.roomCount}</strong><small>{plural(stats.roomCount, "fire")} lit</small></span>
        </div>

        <section className="room-details-section circle-record-section" aria-labelledby="circle-records-title">
          <div className="room-details-section-head">
            <h2 id="circle-records-title">Circle records</h2>
            <span>Only members see this</span>
          </div>
          <div className="circle-records">
            <span><strong>{fmtElapsed(stats.longestBurnSeconds)}</strong><small>longest flame</small></span>
            <span><strong>{stats.extensionCount}</strong><small>{plural(stats.extensionCount, "extension")}</small></span>
            <span><strong>{stats.baraCount}</strong><small>Bara kept</small></span>
          </div>
        </section>

        <section className="room-details-section" aria-labelledby="current-flame-title">
          <div className="room-details-section-head">
            <h2 id="current-flame-title">Current flame</h2>
            <span>{active ? `${fmtTime(secondsLeft(room, state.now))} left` : "Faded"}</span>
          </div>
          <blockquote className="room-spark-quote">{room.spark}</blockquote>
          <div className="current-flame-meta">
            <Clock3 size={15} aria-hidden="true" />
            <span><strong>{burningFor}</strong><small>{active ? "burning so far" : "total burn"}</small></span>
          </div>
        </section>

        <section className="room-details-section" aria-labelledby="room-invite-title">
          <div className="room-details-section-head">
            <h2 id="room-invite-title">Invite</h2>
            <span className="local-mode-chip">Local demo</span>
          </div>
          {repository.mode === "localDemo" ? (
            <div className="room-local-notice">
              <CloudOff size={18} aria-hidden="true" />
              <span>
                <strong>No shareable link yet</strong>
                <small>Secure invites turn on only after cloud Circles pass their access tests. This Circle stays on this device.</small>
              </span>
            </div>
          ) : null}
        </section>

        <section className="room-details-section" aria-labelledby="room-members-title">
          <div className="room-details-section-head">
            <h2 id="room-members-title">Circle</h2>
            <span>{members.length} {plural(members.length, "person", "people")}</span>
          </div>
          <div className="room-member-list">
            {members.map((member) => {
              const host = member.id === circle.createdBy;
              const me = member.id === state.me.id;
              const canManage = currentUserIsHost && !me;
              const blocked = state.blockedIds.includes(member.id);
              const actionsOpen = memberActions === member.id;
              return (
                <div className="room-member-item" key={member.id}>
                  <div className="room-member-row">
                    <span className="ava sm" aria-hidden="true">{member.avatar}</span>
                    <span className="room-member-copy">
                      <strong>{member.name}</strong>
                      <small>{blocked ? "Blocked" : host ? "Host" : me ? "You" : "Member"}</small>
                    </span>
                    {host ? <Crown size={16} className="room-host-mark" aria-label="Host" /> : null}
                    {!me ? (
                      <button
                        type="button"
                        className="room-member-menu"
                        onClick={() => setMemberActions(actionsOpen ? null : member.id)}
                        aria-label={`Actions for ${member.name}`}
                        aria-expanded={actionsOpen}
                      >
                        <Ellipsis size={19} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                  {actionsOpen ? (
                    <div className="room-member-actions">
                      {canManage ? (
                        <button type="button" onClick={() => openConfirmation({ type: "transfer", member })}>
                          <Crown size={15} aria-hidden="true" /> Make host
                        </button>
                      ) : null}
                      <button type="button" onClick={() => dispatch({ type: "TOGGLE_BLOCK_MEMBER", memberId: member.id })}>
                        <Ban size={15} aria-hidden="true" /> {blocked ? "Unblock" : "Block"}
                      </button>
                      <button type="button" onClick={() => { dispatch({ type: "REPORT", targetId: member.id }); setMemberActions(null); }}>
                        <Flag size={15} aria-hidden="true" /> Report
                      </button>
                      {canManage ? (
                        <button type="button" className="danger" onClick={() => openConfirmation({ type: "remove", member })}>
                          <UserMinus size={15} aria-hidden="true" /> Remove
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="room-details-section room-membership-actions" aria-labelledby="room-membership-title">
            <h2 id="room-membership-title">Membership</h2>
            {currentUserIsHost ? (
              <div className="room-host-note">
                <ShieldCheck size={18} aria-hidden="true" />
                <span><strong>You host this Circle</strong><small>Make another member host before you leave.</small></span>
              </div>
            ) : (
              <button type="button" className="room-leave-button" onClick={() => openConfirmation({ type: "leave" })}>
                <LogOut size={17} aria-hidden="true" /> Leave Circle
              </button>
            )}
        </section>
      </section>

      {confirmation ? (
        <ConfirmDialog
          {...confirmationCopy}
          onConfirm={confirm}
          onCancel={cancelConfirmation}
        />
      ) : null}
    </div>
  );
}