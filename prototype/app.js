// Unggun — interactive prototype. 100% static, no build, no internet.
(function () {
  "use strict";

  const state = {
    streak: 5,
    you: { name: "You", avatar: "🦊" },
    friends: [
      { name: "Dinda", avatar: "🌸" },
      { name: "Raka", avatar: "🎧" },
      { name: "Sasa", avatar: "🐱" },
      { name: "Bagas", avatar: "⚡" },
      { name: "Nadia", avatar: "🌙" },
    ],
    moments: [
      { id: "m1", who: "Dinda", avatar: "🌸", mood: "😌", time: "1h ago",
        text: "Found an amazing iced latte near campus, you have to try it ☕",
        reactions: { "❤️": 3, "😂": 0, "🔥": 2, "🙌": 0 }, mine: [] },
      { id: "m2", who: "Raka", avatar: "🎧", mood: "🎶", time: "2h ago",
        text: "Playing my sad-boy playlist, anyone want to keep me company? lol",
        reactions: { "❤️": 2, "😂": 1, "🔥": 0, "🙌": 0 }, mine: [] },
      { id: "m3", who: "Sasa", avatar: "🐱", mood: "🥰", time: "3h ago",
        text: "The campus cat keeps getting chubbier because I keep feeding it 🐈",
        reactions: { "❤️": 4, "😂": 0, "🔥": 0, "🙌": 1 }, mine: [] },
      { id: "m4", who: "Bagas", avatar: "⚡", mood: "😮‍💨", time: "5h ago",
        text: "Finished my assignment at 3am. Someone please invite me out so I stay sane 😭",
        reactions: { "❤️": 1, "😂": 2, "🔥": 1, "🙌": 0 }, mine: [] },
    ],
    game: {
      prompts: [
        "be late to morning class ⏰",
        "treat everyone when they've got some cash 💸",
        "fall asleep during a movie night 😴",
        "spontaneously plan a hangout ✨",
      ],
      idx: 0,
      votes: { You: 0, Dinda: 2, Raka: 1, Sasa: 0, Bagas: 3, Nadia: 1 },
      mine: null,
    },
    meetup: {
      title: "Coffee + a chill chat ☕",
      place: "📍 Dusk Coffee — near the back gate",
      options: [
        { id: "a", label: "Fri 16:00", voters: ["🌸", "🎧"] },
        { id: "b", label: "Sat 10:00", voters: ["🐱", "⚡", "🌙"] },
        { id: "c", label: "Sat 19:00", voters: [] },
      ],
      mine: null,
      locked: false,
      chosen: null,
    },
  };

  const REACTIONS = ["❤️", "😂", "🔥", "🙌"];
  let currentMood = "😊";

  const $ = (sel, root = document) => root.querySelector(sel);
  const allMembers = () => [state.you, ...state.friends];
  const escapeHtml = (s) =>
    s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === "screen-" + name));
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.screen === name));
    $(".scroll").scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderFeed() {
    $("#feed").innerHTML = state.moments
      .map((m) => `
        <article class="card" data-id="${m.id}">
          <div class="card-top">
            <span class="ava">${m.avatar}</span>
            <div>
              <div class="who">${m.who} <span class="mood">${m.mood}</span></div>
              <div class="time">${m.time}</div>
            </div>
          </div>
          <div class="text">${escapeHtml(m.text)}</div>
          <div class="reacts">
            ${REACTIONS.map((e) => {
              const c = m.reactions[e] || 0;
              const mine = m.mine.includes(e);
              return `<button class="react ${mine ? "active" : ""}" data-id="${m.id}" data-emoji="${e}">${e} <b>${c}</b></button>`;
            }).join("")}
          </div>
        </article>`)
      .join("");
  }

  function toggleReaction(id, e) {
    const m = state.moments.find((x) => x.id === id);
    if (!m) return;
    if (m.mine.includes(e)) {
      m.mine = m.mine.filter((x) => x !== e);
      m.reactions[e] = Math.max(0, (m.reactions[e] || 0) - 1);
    } else {
      m.mine.push(e);
      m.reactions[e] = (m.reactions[e] || 0) + 1;
    }
    renderFeed();
  }

  function addMoment(text) {
    state.moments.unshift({
      id: "u" + Date.now(),
      who: "You",
      avatar: state.you.avatar,
      mood: currentMood,
      time: "just now",
      text,
      reactions: { "❤️": 0, "😂": 0, "🔥": 0, "🙌": 0 },
      mine: [],
    });
    renderFeed();
    const first = $("#feed .card");
    if (first) first.classList.add("pop");
    bumpStreak();
    toast("Moment shared with your circle ✨");
  }

  function renderGame() {
    $("#game-prompt").textContent = state.game.prompts[state.game.idx];
    const total = Object.values(state.game.votes).reduce((a, b) => a + b, 0);
    $("#game-options").innerHTML = allMembers()
      .map((m) => {
        const v = state.game.votes[m.name] || 0;
        const pct = total ? Math.round((v / total) * 100) : 0;
        const mine = state.game.mine === m.name;
        return `<button class="gopt ${mine ? "mine" : ""}" data-name="${m.name}">
            <span class="ava sm">${m.avatar}</span>
            <span class="gname">${m.name}</span>
            <span class="gbar"><i style="width:${pct}%"></i></span>
            <span class="gpct">${pct}%</span>
          </button>`;
      })
      .join("");
  }

  function voteGame(name) {
    if (state.game.mine === name) return;
    if (state.game.mine) state.game.votes[state.game.mine] = Math.max(0, (state.game.votes[state.game.mine] || 0) - 1);
    state.game.votes[name] = (state.game.votes[name] || 0) + 1;
    state.game.mine = name;
    renderGame();
  }

  function nextGame() {
    state.game.idx = (state.game.idx + 1) % state.game.prompts.length;
    allMembers().forEach((m) => (state.game.votes[m.name] = 0));
    state.game.mine = null;
    renderGame();
  }

  function renderMeetup() {
    $("#meetup-title").textContent = state.meetup.title;
    $("#meetup-place").textContent = state.meetup.place;
    $("#meetup-options").innerHTML = state.meetup.options
      .map((o) => {
        const mine = state.meetup.mine === o.id;
        const chosen = state.meetup.locked && state.meetup.chosen === o.id;
        const count = o.voters.length + (mine ? 1 : 0);
        return `<button class="mopt ${mine ? "mine" : ""} ${chosen ? "chosen" : ""}" data-id="${o.id}" ${state.meetup.locked ? "disabled" : ""}>
            <span class="mlabel">${o.label}${chosen ? " · locked ✅" : ""}</span>
            <span class="mvoters">${o.voters.map((a) => `<i>${a}</i>`).join("")}${mine ? `<i class="me">${state.you.avatar}</i>` : ""}</span>
            <span class="mcount">${count}</span>
          </button>`;
      })
      .join("");

    const st = $("#meetup-status");
    const lockBtn = $("#meetup-lock");
    if (state.meetup.locked) {
      const o = state.meetup.options.find((x) => x.id === state.meetup.chosen);
      st.innerHTML = `<div class="locked">🎉 It's on! <b>${o.label}</b> at Dusk Coffee.<br/>Auto reminders sent 1 day &amp; 2 hours before ⏰</div>`;
      lockBtn.disabled = true;
      lockBtn.textContent = "Locked in ✅";
    } else if (state.meetup.mine) {
      const o = state.meetup.options.find((x) => x.id === state.meetup.mine);
      st.innerHTML = `<div class="picked">You picked <b>${o.label}</b> ✅</div>`;
    } else {
      st.innerHTML = "";
    }
  }

  function voteMeetup(id) {
    if (state.meetup.locked) return;
    state.meetup.mine = id;
    renderMeetup();
  }

  function lockMeetup() {
    if (state.meetup.locked) return;
    if (!state.meetup.mine) { toast("Pick a time first 🙂"); return; }
    state.meetup.locked = true;
    state.meetup.chosen = state.meetup.mine;
    renderMeetup();
    toast("Time locked! Notifying your circle… 📣");
  }

  function bumpStreak() {
    state.streak += 1;
    $("#streak-num").textContent = state.streak;
    const s2 = $("#streak-num2");
    if (s2) s2.textContent = state.streak;
  }

  let toastT;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), 2200);
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderFeed();
    renderGame();
    renderMeetup();

    document.querySelectorAll(".nav-btn").forEach((b) => b.addEventListener("click", () => showScreen(b.dataset.screen)));

    document.querySelectorAll(".mood").forEach((b) =>
      b.addEventListener("click", () => {
        document.querySelectorAll(".mood").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        currentMood = b.dataset.mood;
      })
    );

    $("#compose-btn").addEventListener("click", () => {
      const ta = $("#compose-text");
      const text = ta.value.trim();
      if (!text) { toast("Write your moment first 🙂"); return; }
      addMoment(text);
      ta.value = "";
    });

    $("#feed").addEventListener("click", (e) => {
      const b = e.target.closest(".react");
      if (b) toggleReaction(b.dataset.id, b.dataset.emoji);
    });
    $("#game-options").addEventListener("click", (e) => {
      const b = e.target.closest(".gopt");
      if (b) voteGame(b.dataset.name);
    });
    $("#game-next").addEventListener("click", nextGame);
    $("#meetup-options").addEventListener("click", (e) => {
      const b = e.target.closest(".mopt");
      if (b) voteMeetup(b.dataset.id);
    });
    $("#meetup-lock").addEventListener("click", lockMeetup);
  });
})();
