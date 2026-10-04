(() => {
  "use strict";

  const content = window.MARKET_CONTENT;
  const questions = content.questions;

  const LOOK = {
    gate: {},
    enter: {},
    browse: { crowd: 1, seller: 1, wave: 1 },
    goods: { crowd: 1, seller: 1, goods: 1, spark: 1 },
    kitchen: { seller: 1 },
    feast: { crowd: 1, seller: 1, foods: 1, spark: 1, happy: 1 },
    lively: { crowd: 1, seller: 1, foods: 1, wave: 1 },
    named: { crowd: 1, seller: 1, goods: 1, sign: 1, spark: 1 },
    litter: { crowd: 1, seller: 1, mess: 1 },
    clean: { crowd: 1, seller: 1, spark: 1 },
    hometown: { crowd: 1, seller: 1, teacher: 1, home: 1 },
    pick: { crowd: 1, seller: 1, teacher: 1 },
    gather: { crowd: 1, seller: 1, teacher: 1 },
    together: { crowd: 1, seller: 1, teacher: 1, wave: 1 },
    stray: { crowd: 1, seller: 1, teacher: 1 },
    safe: { crowd: 1, seller: 1, teacher: 1, happy: 1 },
    panorama: {
      crowd: 1,
      seller: 1,
      teacher: 1,
      goods: 1,
      foods: 1,
      sign: 1,
      home: 1,
      wave: 1,
      spark: 1,
      happy: 1
    }
  };

  const FLAGS = ["crowd", "seller", "teacher", "wave", "spark", "happy", "goods", "foods", "sign", "mess", "home"];

  const ui = {
    start: document.getElementById("screen-start"),
    play: document.getElementById("screen-play"),
    finish: document.getElementById("screen-finish"),
    btnStart: document.getElementById("btn-start"),
    btnSpeak: document.getElementById("btn-speak"),
    btnNext: document.getElementById("btn-next"),
    btnZone: document.getElementById("btn-zone"),
    btnDrop: document.getElementById("btn-drop"),
    btnReplay: document.getElementById("btn-replay"),
    toggleVoice: document.getElementById("toggle-voice"),
    toggleMusic: document.getElementById("toggle-music"),
    path: document.getElementById("path"),
    tray: document.getElementById("badge-tray"),
    diorama: document.getElementById("diorama"),
    bubble: document.getElementById("bubble"),
    question: document.getElementById("question"),
    options: document.getElementById("options"),
    coach: document.getElementById("coach"),
    exploreRow: document.getElementById("explore-row"),
    trashActions: document.getElementById("trash-actions"),
    trashPlay: document.getElementById("trash-play"),
    feedback: document.getElementById("feedback"),
    zoneCard: document.getElementById("zone-card"),
    zoneKicker: document.getElementById("zone-kicker"),
    zoneEmoji: document.getElementById("zone-emoji"),
    zoneTitle: document.getElementById("zone-title"),
    zoneBlurb: document.getElementById("zone-blurb"),
    host: document.getElementById("host-play"),
    toast: document.getElementById("toast"),
    scrap: document.getElementById("scrap"),
    bin: document.getElementById("bin"),
    confetti: document.getElementById("confetti"),
    finishBadges: document.getElementById("finish-badges")
  };

  const state = {
    index: 0,
    phase: "ask",
    locked: false,
    voiceOn: true,
    musicOn: true,
    badges: new Set(),
    audioCtx: null,
    musicTimer: 0,
    musicStep: 0,
    speakToken: 0,
    ttsAudio: null,
    drag: null,
    trashDone: false
  };

  function showScreen(name) {
    [ui.start, ui.play, ui.finish].forEach((screen) => {
      screen.hidden = true;
      screen.classList.remove("is-active");
    });
    const target = ui[name];
    target.hidden = false;
    target.classList.add("is-active");
  }

  function zoneById(id) {
    return content.zones.find((zone) => zone.id === id);
  }

  function currentQuestion() {
    return questions[state.index];
  }

  function renderChrome() {
    ui.path.replaceChildren();
    content.zones.forEach((zone) => {
      const li = document.createElement("li");
      li.dataset.zone = zone.id;
      const emoji = document.createElement("span");
      emoji.className = "path-emoji";
      emoji.textContent = zone.emoji;
      const name = document.createElement("span");
      name.className = "path-name";
      name.textContent = zone.name;
      li.append(emoji, name);
      ui.path.append(li);
    });

    ui.tray.replaceChildren();
    content.zones.forEach((zone) => {
      const reward = content.rewards[zone.reward];
      const li = document.createElement("li");
      li.dataset.badge = zone.reward;
      li.textContent = reward.emoji;
      li.title = reward.name;
      li.setAttribute("aria-label", reward.name);
      ui.tray.append(li);
    });
  }

  function markPath(zoneId) {
    const order = content.zones.map((zone) => zone.id);
    const at = order.indexOf(zoneId);
    ui.path.querySelectorAll("li").forEach((li) => {
      const index = order.indexOf(li.dataset.zone);
      li.classList.toggle("is-now", li.dataset.zone === zoneId);
      li.classList.toggle("is-done", index < at);
      if (li.dataset.zone === zoneId) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
    });
  }

  function applyLook(name) {
    const meta = LOOK[name] || {};
    ui.diorama.dataset.look = name;
    FLAGS.forEach((flag) => {
      ui.diorama.dataset[flag] = meta[flag] ? "1" : "0";
    });
    const picking = name === "pick";
    ui.diorama.querySelectorAll(".stall").forEach((stall) => {
      stall.tabIndex = picking ? 0 : -1;
      stall.setAttribute("aria-hidden", picking ? "false" : "true");
    });
  }

  function clearStallOpen() {
    ui.diorama.querySelectorAll(".stall").forEach((stall) => stall.classList.remove("is-open"));
  }

  function resetScrap() {
    state.trashDone = false;
    state.drag = null;
    ui.scrap.classList.remove("is-dragging", "is-in");
    ui.bin.classList.remove("is-yum");
    ui.scrap.style.left = "";
    ui.scrap.style.top = "";
    ui.scrap.style.bottom = "";
    ui.scrap.style.transform = "";
    ui.scrap.style.opacity = "";
  }

  function setAsking(q) {
    state.phase = "ask";
    state.locked = false;
    ui.coach.hidden = true;
    ui.exploreRow.hidden = true;
    ui.trashActions.hidden = true;
    ui.trashPlay.hidden = true;
    ui.feedback.hidden = true;
    ui.btnNext.hidden = true;
    ui.options.hidden = false;
    ui.toast.hidden = true;
    ui.bubble.textContent = q.bubble;
    ui.question.textContent = q.question;
    ui.host.classList.remove("is-talk");
    clearStallOpen();
    resetScrap();
    renderOptions(q);
  }

  function renderOptions(q) {
    ui.options.replaceChildren();
    q.options.forEach((opt, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.dataset.correct = opt.correct ? "true" : "false";

      const emoji = document.createElement("span");
      emoji.className = "choice-emoji";
      emoji.textContent = opt.emoji;

      const label = document.createElement("span");
      label.className = "choice-label";
      const key = document.createElement("span");
      key.className = "choice-key";
      key.textContent = index === 0 ? "A" : "B";
      label.append(key, document.createTextNode(opt.label));

      btn.append(emoji, label);
      btn.addEventListener("click", () => onChoose(opt, btn));
      ui.options.append(btn);
    });
  }

  function speechFor(q) {
    return [q.question, `Một. ${q.options[0].label}`, `Hai. ${q.options[1].label}`];
  }

  function unlockAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!state.audioCtx) state.audioCtx = new Ctx();
    if (state.audioCtx.state === "suspended") state.audioCtx.resume().catch(() => {});
  }

  function tone(freq, duration, type, gain, when) {
    const ctx = state.audioCtx;
    if (!ctx) return;
    const startAt = ctx.currentTime + (when || 0);
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, startAt);
    amp.gain.setValueAtTime(0.0001, startAt);
    amp.gain.linearRampToValueAtTime(gain, startAt + 0.02);
    amp.gain.linearRampToValueAtTime(0.0001, startAt + duration);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  }

  function playClick() {
    tone(740, 0.06, "triangle", 0.08, 0);
  }
  function playCorrect() {
    tone(523, 0.12, "triangle", 0.12, 0);
    tone(659, 0.12, "triangle", 0.12, 0.1);
    tone(784, 0.22, "triangle", 0.14, 0.2);
  }
  function playSoft() {
    tone(392, 0.16, "sine", 0.06, 0);
    tone(330, 0.2, "sine", 0.05, 0.1);
  }
  function playBadge() {
    tone(880, 0.1, "triangle", 0.1, 0);
    tone(1175, 0.18, "triangle", 0.1, 0.1);
  }
  function playWin() {
    [523, 659, 784, 1047].forEach((freq, index) => {
      tone(freq, 0.2, "triangle", 0.12, index * 0.12);
    });
  }

  function loopMusic() {
    if (!state.musicOn || !state.audioCtx) return;
    const notes = [392, 440, 494, 523, 494, 440, 392, 349];
    tone(notes[state.musicStep % notes.length], 0.4, "sine", 0.025, 0);
    state.musicStep += 1;
    state.musicTimer = window.setTimeout(loopMusic, 560);
  }

  function setMusic(on) {
    state.musicOn = on;
    window.clearTimeout(state.musicTimer);
    if (on) loopMusic();
  }

  function stopSpeech() {
    state.speakToken += 1;
    ui.host.classList.remove("is-talk");
    if (state.ttsAudio) {
      try {
        state.ttsAudio.pause();
        state.ttsAudio.removeAttribute("src");
        state.ttsAudio.load();
      } catch (_) {
        /* ignore */
      }
      state.ttsAudio = null;
    }
  }

  function normSpeech(text) {
    return String(text).replace(/\s+/g, " ").trim();
  }

  function clipSrc(text) {
    const map = window.AUDIO_MANIFEST || {};
    return map[normSpeech(text)] || null;
  }

  function speak(textOrParts) {
    const parts = (Array.isArray(textOrParts) ? textOrParts : [textOrParts])
      .map(normSpeech)
      .filter(Boolean);
    if (!state.voiceOn || !parts.length) return;
    stopSpeech();
    const token = state.speakToken;
    const clips = parts.map(clipSrc).filter(Boolean);
    if (!clips.length) return;

    ui.host.classList.add("is-talk");
    let index = 0;
    const playNext = () => {
      if (token !== state.speakToken || !state.voiceOn) return;
      if (index >= clips.length) {
        ui.host.classList.remove("is-talk");
        return;
      }
      const audio = new Audio(clips[index]);
      audio.preload = "auto";
      state.ttsAudio = audio;
      let settled = false;
      const advance = (gap) => {
        if (settled || token !== state.speakToken) return;
        settled = true;
        index += 1;
        window.setTimeout(playNext, gap);
      };
      audio.onended = () => advance(80);
      audio.onerror = () => advance(0);
      audio.play().catch(() => advance(0));
    };
    playNext();
  }

  function grant(id) {
    if (!id || state.badges.has(id)) return;
    state.badges.add(id);
    const slot = ui.tray.querySelector(`[data-badge="${id}"]`);
    if (!slot) return;
    slot.classList.remove("pop");
    void slot.offsetWidth;
    slot.classList.add("got", "pop");
    const reward = content.rewards[id];
    ui.toast.hidden = false;
    ui.toast.textContent = `${reward.emoji} ${reward.name}`;
    playBadge();
  }

  function showSuccess(q) {
    state.phase = "result";
    state.locked = true;
    ui.coach.hidden = true;
    ui.exploreRow.hidden = true;
    ui.trashActions.hidden = true;
    ui.trashPlay.hidden = true;
    ui.options.hidden = false;
    ui.feedback.hidden = false;
    ui.feedback.className = "feedback is-ok";
    ui.feedback.textContent = q.success;
    ui.btnNext.hidden = false;
    ui.btnNext.textContent = q.nextLabel || "Đi tiếp";
    if (q.reward) grant(q.reward);
    speak(q.success);
    ui.btnNext.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function onChoose(opt, btn) {
    if (state.phase !== "ask" || state.locked) return;
    const q = currentQuestion();
    playClick();

    ui.feedback.hidden = true;

    if (!opt.correct) {
      state.locked = true;
      btn.classList.add("is-retry");
      ui.feedback.hidden = false;
      ui.feedback.className = "feedback is-retry";
      ui.feedback.textContent = q.retry;
      playSoft();
      speak(q.retry);
      window.setTimeout(() => {
        btn.classList.remove("is-retry");
        state.locked = false;
      }, 450);
      return;
    }

    state.locked = true;
    ui.options.querySelectorAll(".choice").forEach((choice) => {
      choice.disabled = true;
    });
    btn.classList.add("is-yes");
    playCorrect();

    if (q.act === "trash") {
      enterTrash(q);
      return;
    }
    if (q.act === "stalls") {
      enterExplore(q);
      return;
    }

    applyLook(q.lookDone);
    showSuccess(q);
  }

  function enterTrash(q) {
    state.phase = "trash";
    state.locked = false;
    resetScrap();
    ui.options.hidden = true;
    ui.feedback.hidden = true;
    ui.trashPlay.hidden = false;
    ui.trashActions.hidden = false;
    ui.coach.hidden = false;
    ui.coach.textContent = q.prompt;
    speak(q.prompt);
  }

  function overlaps(a, b) {
    const boxA = a.getBoundingClientRect();
    const boxB = b.getBoundingClientRect();
    return boxA.left < boxB.right && boxA.right > boxB.left && boxA.top < boxB.bottom && boxA.bottom > boxB.top;
  }

  function completeTrash() {
    if (state.phase !== "trash" || state.trashDone) return;
    state.trashDone = true;
    const scene = ui.diorama.getBoundingClientRect();
    const binBox = ui.bin.getBoundingClientRect();
    ui.scrap.style.bottom = "auto";
    ui.scrap.style.left = `${binBox.left - scene.left + 8}px`;
    ui.scrap.style.top = `${binBox.top - scene.top + 24}px`;
    ui.scrap.classList.add("is-in");
    ui.bin.classList.add("is-yum");
    playCorrect();
    window.setTimeout(() => {
      applyLook("clean");
      showSuccess(currentQuestion());
    }, 420);
  }

  function enterExplore(q) {
    state.phase = "explore";
    state.locked = false;
    applyLook("pick");
    ui.options.hidden = true;
    ui.feedback.hidden = true;
    ui.exploreRow.hidden = false;
    ui.coach.hidden = false;
    ui.coach.textContent = q.prompt;
    ui.exploreRow.replaceChildren();
    content.stalls.forEach((stall) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "explore-btn";
      const emoji = document.createElement("span");
      emoji.textContent = stall.emoji;
      const label = document.createElement("span");
      label.textContent = stall.label;
      btn.append(emoji, label);
      btn.addEventListener("click", () => chooseStall(stall.id));
      ui.exploreRow.append(btn);
    });
    speak(q.prompt);
  }

  function chooseStall(id) {
    if (state.phase !== "explore" || state.locked) return;
    state.locked = true;
    const stall = content.stalls.find((item) => item.id === id);
    clearStallOpen();
    const card = ui.diorama.querySelector(`.stall[data-stall="${id}"]`);
    if (card) card.classList.add("is-open");
    ui.coach.textContent = stall.line;
    playCorrect();
    speak(stall.line);
    window.setTimeout(() => {
      showSuccess(currentQuestion());
    }, 1100);
  }

  function openZone(index) {
    const q = questions[index];
    const zone = zoneById(q.zone);
    state.index = index;
    markPath(zone.id);
    applyLook(zone.preview);
    ui.diorama.setAttribute("aria-label", zone.name);
    ui.zoneKicker.textContent = zone.kicker;
    ui.zoneEmoji.textContent = zone.emoji;
    ui.zoneTitle.textContent = zone.name;
    ui.zoneBlurb.textContent = zone.blurb;
    ui.zoneCard.hidden = false;
    ui.question.textContent = "";
    ui.bubble.textContent = zone.blurb;
    ui.options.replaceChildren();
    ui.feedback.hidden = true;
    ui.btnNext.hidden = true;
    ui.coach.hidden = true;
    ui.exploreRow.hidden = true;
    ui.trashPlay.hidden = true;
    speak([zone.kicker, zone.name, zone.blurb]);
  }

  function renderQuestion() {
    const q = currentQuestion();
    const zone = zoneById(q.zone);
    ui.zoneCard.hidden = true;
    markPath(q.zone);
    ui.diorama.setAttribute("aria-label", zone.name);
    applyLook(q.lookIdle);
    setAsking(q);
    speak(speechFor(q));
  }

  function goNext() {
    stopSpeech();
    playClick();
    const next = state.index + 1;
    if (next >= questions.length) {
      showFinish();
      return;
    }
    if (questions[next].zone !== questions[state.index].zone) {
      openZone(next);
      return;
    }
    state.index = next;
    renderQuestion();
  }

  function burst() {
    ui.confetti.replaceChildren();
    const colors = ["#FFD45A", "#FF7A59", "#FF8FAB", "#5ECF7B", "#6EC6E0", "#FF5A4A"];
    for (let i = 0; i < 42; i += 1) {
      const bit = document.createElement("i");
      bit.style.left = `${Math.random() * 100}%`;
      bit.style.background = colors[i % colors.length];
      bit.style.animationDelay = `${Math.random() * 0.35}s`;
      ui.confetti.append(bit);
    }
  }

  function showFinish() {
    ui.finishBadges.replaceChildren();
    content.zones.forEach((zone) => {
      const reward = content.rewards[zone.reward];
      const li = document.createElement("li");
      const icon = document.createElement("strong");
      icon.textContent = reward.emoji;
      li.append(icon, document.createTextNode(reward.finish));
      ui.finishBadges.append(li);
    });
    showScreen("finish");
    burst();
    playWin();
    speak([
      "Chúc mừng bé!",
      "Bé đã hoàn thành chuyến khám phá Chợ phiên Làng trong phố Hòa Xuân.",
      "Hòa Xuân, quê hương của những điều thân thương!"
    ]);
  }

  function resetGame() {
    stopSpeech();
    state.index = 0;
    state.phase = "ask";
    state.locked = false;
    state.badges.clear();
    ui.tray.querySelectorAll("li").forEach((li) => li.classList.remove("got", "pop"));
    ui.confetti.replaceChildren();
    ui.zoneCard.hidden = true;
    ui.toast.hidden = true;
    clearStallOpen();
    resetScrap();
    applyLook("gate");
    showScreen("start");
  }

  ui.btnStart.addEventListener("click", () => {
    unlockAudio();
    setMusic(ui.toggleMusic.checked);
    state.voiceOn = ui.toggleVoice.checked;
    showScreen("play");
    openZone(0);
  });

  ui.btnZone.addEventListener("click", () => {
    playClick();
    renderQuestion();
  });

  ui.btnNext.addEventListener("click", goNext);
  ui.btnDrop.addEventListener("click", completeTrash);
  ui.bin.addEventListener("click", completeTrash);
  ui.btnReplay.addEventListener("click", () => {
    playClick();
    resetGame();
  });

  ui.btnSpeak.addEventListener("click", () => {
    unlockAudio();
    const q = currentQuestion();
    if (!q) return;
    if (state.phase === "trash" || state.phase === "explore") speak(q.prompt);
    else if (state.phase === "result") speak(q.success);
    else speak(speechFor(q));
  });

  ui.toggleVoice.addEventListener("change", () => {
    state.voiceOn = ui.toggleVoice.checked;
    if (!state.voiceOn) stopSpeech();
  });

  ui.toggleMusic.addEventListener("change", () => {
    unlockAudio();
    setMusic(ui.toggleMusic.checked);
  });

  ui.diorama.querySelectorAll(".stall").forEach((stall) => {
    stall.addEventListener("click", () => chooseStall(stall.dataset.stall));
  });

  ui.scrap.addEventListener("pointerdown", (event) => {
    if (state.phase !== "trash" || state.trashDone) return;
    state.drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false
    };
    ui.scrap.setPointerCapture(event.pointerId);
    ui.scrap.classList.add("is-dragging");
  });

  ui.scrap.addEventListener("pointermove", (event) => {
    if (!state.drag || state.drag.id !== event.pointerId) return;
    const scene = ui.diorama.getBoundingClientRect();
    if (Math.abs(event.clientX - state.drag.x) + Math.abs(event.clientY - state.drag.y) > 8) {
      state.drag.moved = true;
    }
    ui.scrap.style.bottom = "auto";
    ui.scrap.style.left = `${event.clientX - scene.left - ui.scrap.offsetWidth / 2}px`;
    ui.scrap.style.top = `${event.clientY - scene.top - ui.scrap.offsetHeight / 2}px`;
  });

  ui.scrap.addEventListener("pointerup", (event) => {
    if (!state.drag || state.drag.id !== event.pointerId) return;
    const moved = state.drag.moved;
    state.drag = null;
    ui.scrap.classList.remove("is-dragging");
    if (moved && overlaps(ui.scrap, ui.bin)) completeTrash();
    else if (moved) {
      ui.scrap.style.left = "";
      ui.scrap.style.top = "";
      ui.scrap.style.bottom = "";
    }
  });

  renderChrome();
  applyLook("gate");
})();
