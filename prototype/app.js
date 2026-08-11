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
    chat: {
      messages: [
        { id: "c1", who: "Dinda", avatar: "🌸", text: "ok who else is NOT sleeping rn 😭", time: "20:14", reactions: { "😂": 2, "❤️": 0, "🔥": 0 }, mine: [] },
        { id: "c2", who: "Raka", avatar: "🎧", text: "me. third coffee. send help ☕", time: "20:15", reactions: { "😂": 3, "❤️": 1, "🔥": 0 }, mine: [] },
        { id: "c3", who: "Sasa", avatar: "🐱", text: "just saw a cat that looks EXACTLY like Bagas lmaooo", time: "20:16", reactions: { "😂": 4, "❤️": 0, "🔥": 2 }, mine: [] },
        { id: "c4", who: "Bagas", avatar: "⚡", text: "excuse me i am far more handsome 💅", time: "20:16", reactions: { "😂": 5, "❤️": 1, "🔥": 0 }, mine: [] },
        { id: "c5", who: "Nadia", avatar: "🌙", text: "this room fades tomorrow and i already miss the chaos 🥲", time: "20:18", reactions: { "😂": 1, "❤️": 3, "🔥": 0 }, mine: [] },
      ],
      remaining: 5 * 3600 + 59 * 60 + 41,
    },
  };

  const REACTIONS = ["❤️", "😂", "🔥", "🙌"];
  const CHAT_REACTIONS = ["😂", "❤️", "🔥"];
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

  function renderChat() {
    const box = $("#chat");
    box.innerHTML = state.chat.messages
      .map((m) => {
        const mine = m.who === "You";
        return `<div class="msg ${mine ? "mine" : ""}" data-id="${m.id}">
            <div class="who">${mine ? "You" : m.avatar + " " + m.who}<span class="t">${m.time}</span></div>
            <div class="body">${escapeHtml(m.text)}</div>
            <div class="mreacts">
              ${CHAT_REACTIONS.map((e) => {
                const c = m.reactions[e] || 0;
                const on = m.mine.includes(e);
                if (!c && !on) return `<button class="mreact" data-id="${m.id}" data-emoji="${e}">${e}</button>`;
                return `<button class="mreact ${on ? "active" : ""}" data-id="${m.id}" data-emoji="${e}">${e} <b>${c}</b></button>`;
              }).join("")}
            </div>
          </div>`;
      })
      .join("");
  }

  function reactMessage(id, e) {
    const m = state.chat.messages.find((x) => x.id === id);
    if (!m) return;
    if (m.mine.includes(e)) {
      m.mine = m.mine.filter((x) => x !== e);
      m.reactions[e] = Math.max(0, (m.reactions[e] || 0) - 1);
    } else {
      m.mine.push(e);
      m.reactions[e] = (m.reactions[e] || 0) + 1;
    }
    renderChat();
  }

  function sendMessage(text) {
    state.chat.messages.push({
      id: "u" + Date.now(),
      who: "You",
      avatar: state.you.avatar,
      text,
      time: "now",
      reactions: { "😂": 0, "❤️": 0, "🔥": 0 },
      mine: [],
    });
    renderChat();
    $(".scroll").scrollTo({ top: 999999, behavior: "smooth" });
  }

  function fmtTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const p = (n) => String(n).padStart(2, "0");
    return `${p(h)}:${p(m)}:${p(s)}`;
  }

  function tickCountdown() {
    if (state.chat.remaining > 0) state.chat.remaining -= 1;
    const el = $("#countdown");
    if (el) el.textContent = fmtTime(state.chat.remaining);
  }

  function bumpStreak() {
    state.streak += 1;
    const s1 = $("#streak-num");
    if (s1) s1.textContent = state.streak;
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
    renderChat();
    tickCountdown();
    setInterval(tickCountdown, 1000);

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

    $("#chat").addEventListener("click", (e) => {
      const b = e.target.closest(".mreact");
      if (b) reactMessage(b.dataset.id, b.dataset.emoji);
    });
    const sendChat = () => {
      const inp = $("#chat-text");
      const text = inp.value.trim();
      if (!text) return;
      sendMessage(text);
      inp.value = "";
      inp.focus();
    };
    $("#chat-send").addEventListener("click", sendChat);
    $("#chat-text").addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); sendChat(); }
    });
  });
})();
