(() => {
  "use strict";

  const SPEAKERS = {
    sen: { name: "Bé Sen", praise: "Giỏi quá bé ơi!" },
    long: { name: "Cậu Lồng", praise: "Ý hay đây!" },
    co: { name: "Chị Cò", praise: "Nhẹ nhàng quá!" }
  };

  const LONG_SVG = `
    <svg class="journey-mascot-svg mascot-long" viewBox="0 0 120 140" aria-hidden="true">
      <ellipse cx="60" cy="128" rx="28" ry="7" fill="rgba(31,58,46,.15)" />
      <line x1="60" y1="18" x2="60" y2="34" stroke="#3d5c4a" stroke-width="3" stroke-linecap="round" />
      <rect x="34" y="34" width="52" height="62" rx="16" fill="#FF5A4A" />
      <rect x="40" y="42" width="40" height="34" rx="10" fill="#FFD45A" opacity=".9" />
      <circle cx="48" cy="56" r="5" fill="#1F3A2E" />
      <circle cx="72" cy="56" r="5" fill="#1F3A2E" />
      <path d="M50 68 Q60 76 70 68" fill="none" stroke="#C94334" stroke-width="3" stroke-linecap="round" />
      <rect x="44" y="96" width="8" height="16" rx="4" fill="#FFD45A" />
      <rect x="68" y="96" width="8" height="16" rx="4" fill="#FFD45A" />
    </svg>`;

  const CO_SVG = `
    <svg class="journey-mascot-svg mascot-co" viewBox="0 0 120 140" aria-hidden="true">
      <ellipse cx="60" cy="128" rx="28" ry="7" fill="rgba(31,58,46,.15)" />
      <ellipse cx="60" cy="88" rx="28" ry="34" fill="#FFFDF8" />
      <circle cx="60" cy="48" r="24" fill="#FFFDF8" />
      <path d="M82 48 L108 42 L86 56 Z" fill="#FFD45A" />
      <circle cx="54" cy="46" r="5" fill="#1F3A2E" />
      <path d="M48 58 Q58 64 66 56" fill="none" stroke="#C94334" stroke-width="2.8" stroke-linecap="round" />
      <path d="M58 118 L58 132" stroke="#FFD45A" stroke-width="5" stroke-linecap="round" />
      <path d="M58 132 L48 138" stroke="#FFD45A" stroke-width="4" stroke-linecap="round" />
    </svg>`;

  function stageIndexOf(data, stageId) {
    const idx = data.stages.findIndex((s) => s.id === stageId);
    return idx < 0 ? 0 : idx;
  }

  function createJourneyGame(options) {
    const DATA = options.data;
    const QUESTIONS = DATA.questions;
    const AUDIO_VERSION = options.audioVersion || 1;
    const HUB_HREF = options.hubHref || "../../";
    const SEN_SRC = options.beSenSrc || "../../assets/be-sen.png?v=2";
    const root = options.root || document.getElementById("journey-root");
    if (!root || !DATA) {
      throw new Error("Journey engine needs root + data");
    }

    root.innerHTML = `
      <div id="j-confetti" class="journey-confetti" aria-hidden="true"></div>

      <section id="j-start" class="journey-screen journey-screen-start is-active" aria-label="Bắt đầu">
        <div class="journey-start-card">
          <a class="journey-back" href="${HUB_HREF}">← Bé Khám Phá</a>
          <p class="journey-brand">${DATA.brand}</p>
          <h1 class="journey-title">
            <span class="journey-title-line">${DATA.title}</span>
            <span class="journey-title-sub">${DATA.subtitle}</span>
          </h1>
          <p class="journey-tagline">${DATA.tagline}</p>
          <div class="journey-host-wrap" aria-hidden="true">
            <img src="${SEN_SRC}" alt="Bé Sen" />
            <p class="journey-bubble">${DATA.intro}</p>
          </div>
          <button type="button" id="j-btn-start" class="journey-btn journey-btn-primary journey-btn-xl">Cùng đi nào</button>
          <label class="journey-voice-toggle">
            <input type="checkbox" id="j-toggle-voice" checked />
            <span>Nghe giọng đọc câu hỏi</span>
          </label>
        </div>
      </section>

      <section id="j-play" class="journey-screen journey-screen-play" hidden aria-label="Hành trình">
        <header class="journey-play-bar">
          <a class="journey-back mini" href="${HUB_HREF}">←</a>
          <div>
            <div class="journey-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
              <div id="j-progress-fill" class="journey-progress-fill"></div>
            </div>
            <p id="j-progress-text" class="journey-progress-text">Câu 1 / ${QUESTIONS.length}</p>
          </div>
          <button type="button" id="j-btn-speak" class="journey-btn journey-btn-icon" aria-label="Đọc lại">🔊</button>
        </header>
        <p id="j-stage-chip" class="journey-stage-chip"></p>
        <div class="journey-viewport" id="j-viewport">
          <div class="journey-camera" id="j-camera">
            <div class="journey-track" id="j-track"></div>
          </div>
          <div class="journey-path" aria-hidden="true"></div>
          <div class="journey-stops" id="j-stops"></div>
          <div class="journey-avatar" id="j-avatar" data-host="sen">
            <img src="${SEN_SRC}" alt="" />
            ${LONG_SVG}
            ${CO_SVG}
          </div>
          <p id="j-moving" class="journey-moving-banner">Đang đi tới trạm tiếp theo…</p>
        </div>
        <div class="journey-qa">
          <article class="journey-board">
            <p class="journey-kicker" id="j-kicker">Câu hỏi 1</p>
            <p class="journey-question" id="j-question"></p>
          </article>
          <div class="journey-choices" id="j-choices"></div>
        </div>
      </section>

      <div id="j-feedback" class="journey-feedback" hidden role="dialog" aria-modal="true">
        <div class="journey-feedback-card">
          <div id="j-fb-emoji" class="journey-feedback-emoji" aria-hidden="true">🎉</div>
          <h2 id="j-fb-title" class="journey-feedback-title">Giỏi quá!</h2>
          <p id="j-fb-explain" class="journey-feedback-explain"></p>
          <button type="button" id="j-btn-next" class="journey-btn journey-btn-primary journey-btn-lg">Đi tiếp</button>
        </div>
      </div>

      <section id="j-result" class="journey-screen journey-screen-result" hidden aria-label="Tổng kết">
        <div class="journey-result-card">
          <p class="journey-brand">${DATA.brand}</p>
          <h2 class="journey-result-title">Bé thật tuyệt vời!</h2>
          <div class="journey-badge" aria-hidden="true"></div>
          <p class="journey-badge-name">Huy hiệu ${DATA.badge}</p>
          <div class="journey-stats">
            <div class="journey-stat">
              <span class="journey-stat-value" id="j-result-correct">0</span>
              <span class="journey-stat-label">Câu đúng</span>
            </div>
            <div class="journey-stat">
              <span class="journey-stat-value" id="j-result-total">${QUESTIONS.length}</span>
              <span class="journey-stat-label">Tổng câu</span>
            </div>
          </div>
          <p id="j-result-message" class="journey-result-message"></p>
          <ul id="j-review" class="journey-review"></ul>
          <div class="journey-result-actions">
            <button type="button" id="j-btn-replay" class="journey-btn journey-btn-primary journey-btn-xl">Chơi lại</button>
            <button type="button" id="j-btn-home" class="journey-btn journey-btn-secondary journey-btn-lg">Về trang đầu</button>
          </div>
        </div>
      </section>
    `;

    const el = {
      start: root.querySelector("#j-start"),
      play: root.querySelector("#j-play"),
      result: root.querySelector("#j-result"),
      feedback: root.querySelector("#j-feedback"),
      confetti: root.querySelector("#j-confetti"),
      btnStart: root.querySelector("#j-btn-start"),
      btnNext: root.querySelector("#j-btn-next"),
      btnSpeak: root.querySelector("#j-btn-speak"),
      btnReplay: root.querySelector("#j-btn-replay"),
      btnHome: root.querySelector("#j-btn-home"),
      toggleVoice: root.querySelector("#j-toggle-voice"),
      progressFill: root.querySelector("#j-progress-fill"),
      progressText: root.querySelector("#j-progress-text"),
      stageChip: root.querySelector("#j-stage-chip"),
      camera: root.querySelector("#j-camera"),
      track: root.querySelector("#j-track"),
      stops: root.querySelector("#j-stops"),
      avatar: root.querySelector("#j-avatar"),
      moving: root.querySelector("#j-moving"),
      kicker: root.querySelector("#j-kicker"),
      question: root.querySelector("#j-question"),
      choices: root.querySelector("#j-choices"),
      fbEmoji: root.querySelector("#j-fb-emoji"),
      fbTitle: root.querySelector("#j-fb-title"),
      fbExplain: root.querySelector("#j-fb-explain"),
      resultCorrect: root.querySelector("#j-result-correct"),
      resultTotal: root.querySelector("#j-result-total"),
      resultMessage: root.querySelector("#j-result-message"),
      review: root.querySelector("#j-review")
    };

    const state = {
      index: 0,
      correct: 0,
      locked: false,
      voiceOn: true,
      answers: [],
      audioCtx: null,
      speakToken: 0,
      ttsAudio: null,
      stopPercents: []
    };

    function buildWorld() {
      const zoneCount = Math.max(DATA.stages.length, 1);
      el.camera.style.width = `${zoneCount * 100}%`;
      el.track.style.width = "100%";
      el.track.innerHTML = DATA.stages
        .map((stage) => {
          const art = (DATA.zoneArts && DATA.zoneArts[stage.id]) || "";
          const artAttr = art
            ? `style="background-image:url('${art}')"`
            : `data-fallback="${stage.id}"`;
          return `
            <div class="journey-zone" data-zone="${stage.id}" style="width:${100 / zoneCount}%">
              <div class="journey-zone-art" ${artAttr}></div>
              <div class="journey-zone-veil"></div>
              <p class="journey-zone-label">${stage.name}</p>
            </div>`;
        })
        .join("");

      // Fallback gradients when no photo
      root.querySelectorAll(".journey-zone-art[data-fallback]").forEach((node) => {
        const id = node.getAttribute("data-fallback");
        const map = {
          gate: "linear-gradient(180deg,#7ec8e3 0%,#ffe8a8 55%,#c8e87a 100%)",
          dance: "linear-gradient(180deg,#8fd4ea 0%,#ffd0dc 50%,#d7ef9a 100%)",
          keep: "linear-gradient(180deg,#9ad0e8 0%,#fff3c4 50%,#b7e36a 100%)"
        };
        node.style.background = map[id] || map.gate;
      });

      state.stopPercents = QUESTIONS.map((question, index) => {
        const peers = QUESTIONS.map((q, i) => ({ q, i })).filter((row) => row.q.stage === question.stage);
        const local = peers.findIndex((row) => row.i === index);
        const t = peers.length <= 1 ? 0.5 : local / (peers.length - 1);
        return 14 + t * 72;
      });
    }

    function showScreen(name) {
      [el.start, el.play, el.result].forEach((screen) => {
        screen.classList.remove("is-active");
        screen.hidden = true;
      });
      el[name].hidden = false;
      el[name].classList.add("is-active");
    }

    function unlockAudio() {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!state.audioCtx) state.audioCtx = new Ctx();
      if (state.audioCtx.state === "suspended") state.audioCtx.resume().catch(() => {});
    }

    function tone(freq, duration, when = 0) {
      const ctx = state.audioCtx;
      if (!ctx) return;
      const startAt = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.linearRampToValueAtTime(0.22, startAt + 0.02);
      gain.gain.linearRampToValueAtTime(0.0001, startAt + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + duration + 0.02);
    }

    function playCorrectSound() {
      tone(523, 0.12, 0);
      tone(659, 0.12, 0.1);
      tone(784, 0.22, 0.2);
    }

    function playWrongSound() {
      tone(320, 0.16, 0);
      tone(240, 0.22, 0.12);
    }

    function playWinFanfare() {
      [523, 659, 784, 1047].forEach((freq, i) => tone(freq, 0.18, i * 0.12));
    }

    function stopSpeech() {
      state.speakToken += 1;
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

    function speak(audioKey) {
      if (!state.voiceOn) return;
      stopSpeech();
      const token = state.speakToken;
      const src = window.AUDIO_MANIFEST && window.AUDIO_MANIFEST[audioKey];
      if (!src) return;
      const audio = new Audio(`${src}?v=${AUDIO_VERSION}`);
      audio.preload = "auto";
      state.ttsAudio = audio;
      const start = () => {
        window.setTimeout(() => {
          if (token !== state.speakToken) return;
          audio.play().catch(() => {});
        }, 60);
      };
      if (audio.readyState >= 2) start();
      else audio.addEventListener("canplay", start, { once: true });
    }

    function burstConfetti() {
      const colors = ["#FF7A59", "#FFD45A", "#2F8F5B", "#FF8FAB", "#fff", "#FF5A4A"];
      for (let i = 0; i < 36; i += 1) {
        const piece = document.createElement("span");
        piece.className = "journey-confetti-piece";
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.background = colors[i % colors.length];
        piece.style.animationDuration = `${1.3 + Math.random() * 1.4}s`;
        el.confetti.appendChild(piece);
        window.setTimeout(() => piece.remove(), 3000);
      }
    }

    function paintStops(activeIndex) {
      const stageId = QUESTIONS[activeIndex].stage;
      const peers = QUESTIONS.map((q, i) => ({ q, i })).filter((row) => row.q.stage === stageId);
      el.stops.innerHTML = peers
        .map(({ i }) => {
          const pct = state.stopPercents[i];
          const current = i === activeIndex ? " is-current" : "";
          const done = i < activeIndex ? " is-done" : "";
          return `<span class="journey-stop${current}${done}" data-stop="${i}" style="left:${pct}%"></span>`;
        })
        .join("");
    }

    function moveToStop(index, { announce = false } = {}) {
      const question = QUESTIONS[index];
      const zoneIdx = stageIndexOf(DATA, question.stage);
      const zoneCount = Math.max(DATA.stages.length, 1);
      const prevStage =
        index > 0 ? stageIndexOf(DATA, QUESTIONS[index - 1].stage) : zoneIdx;

      el.camera.style.width = `${zoneCount * 100}%`;
      el.camera.style.transform = `translateX(${(-zoneIdx / zoneCount) * 100}%)`;

      root.querySelectorAll(".journey-zone").forEach((zone, i) => {
        zone.classList.toggle("is-dim", i !== zoneIdx);
      });

      paintStops(index);

      const pct = state.stopPercents[index];
      el.avatar.classList.add("is-walking");
      el.avatar.style.left = `${pct}%`;
      el.avatar.dataset.host = question.speaker || "sen";

      if (announce) {
        el.moving.classList.add("is-on");
        el.moving.textContent =
          zoneIdx !== prevStage
            ? `Sang ${DATA.stages[zoneIdx].name}!`
            : "Đang đi tới trạm tiếp theo…";
      }

      return new Promise((resolve) => {
        window.setTimeout(() => {
          el.avatar.classList.remove("is-walking");
          el.moving.classList.remove("is-on");
          paintStops(index);
          resolve();
        }, announce ? 900 : 50);
      });
    }

    function updateHUD() {
      const total = QUESTIONS.length;
      const pct = (state.index / total) * 100;
      el.progressFill.style.width = `${pct}%`;
      el.progressText.textContent = `Câu ${Math.min(state.index + 1, total)} / ${total}`;
    }

    function renderChoices(question) {
      const two = question.options.length === 2;
      el.choices.classList.toggle("is-two", two);
      el.choices.innerHTML = question.options
        .map(
          (option) => `
          <button type="button" class="journey-choice journey-choice-${option.key.toLowerCase()}" data-answer="${option.key}">
            <span class="journey-choice-key">${option.key}</span>
            <span class="journey-choice-label">${option.label}</span>
          </button>`
        )
        .join("");
    }

    async function renderQuestion({ travel = false } = {}) {
      state.locked = true;
      const question = QUESTIONS[state.index];
      const stage = DATA.stages.find((s) => s.id === question.stage) || DATA.stages[0];
      el.stageChip.textContent = stage.name;
      el.kicker.textContent = `Câu hỏi ${state.index + 1} · ${SPEAKERS[question.speaker]?.name || "Bé Sen"}`;
      el.question.textContent = question.question;
      renderChoices(question);
      updateHUD();

      // Hide choices while traveling
      el.choices.style.visibility = travel ? "hidden" : "visible";
      await moveToStop(state.index, { announce: travel });
      el.choices.style.visibility = "visible";
      state.locked = false;
      speak(`q${state.index}`);
    }

    function openFeedback(isCorrect, question) {
      el.feedback.hidden = false;
      el.feedback.classList.toggle("is-wrong", !isCorrect);
      el.fbEmoji.textContent = isCorrect ? "🎉" : "💪";
      el.fbTitle.textContent = isCorrect ? "Giỏi quá!" : "Cố lên nhé!";
      el.fbExplain.textContent = question.explain;
      el.btnNext.textContent =
        state.index >= QUESTIONS.length - 1 ? "Xem tổng kết" : "Đi tiếp";
      speak(`fb${state.index}_${isCorrect ? "ok" : "bad"}`);
    }

    function handleAnswer(chosen) {
      if (state.locked || !el.feedback.hidden) return;
      state.locked = true;
      unlockAudio();
      const question = QUESTIONS[state.index];
      const isCorrect = chosen === question.answer;
      el.choices.querySelectorAll(".journey-choice").forEach((button) => {
        button.disabled = true;
      });
      if (isCorrect) {
        state.correct += 1;
        playCorrectSound();
        burstConfetti();
      } else {
        playWrongSound();
      }
      state.answers.push({ question: question.question, correct: isCorrect });
      openFeedback(isCorrect, question);
    }

    function resultMessage() {
      if (typeof DATA.resultMessages === "function") {
        return DATA.resultMessages(state.correct, QUESTIONS.length);
      }
      const ratio = state.correct / QUESTIONS.length;
      if (ratio === 1) return `Hoàn hảo! Bé là chuyên gia nhỏ về ${DATA.brand}!`;
      if (ratio >= 0.7) return `Xuất sắc! Bé đã hiểu rất nhiều về ${DATA.brand}.`;
      if (ratio >= 0.4) return "Tốt lắm! Chơi lại để khám phá thêm nhiều điều thú vị nhé!";
      return "Bé đã cố gắng rồi! Chơi lại để đi tiếp hành trình nhé!";
    }

    function showResults() {
      el.progressFill.style.width = "100%";
      el.resultCorrect.textContent = String(state.correct);
      el.resultTotal.textContent = String(QUESTIONS.length);
      el.resultMessage.textContent = resultMessage();
      el.review.innerHTML = state.answers
        .map(
          (answer) =>
            `<li><span aria-hidden="true">${answer.correct ? "✅" : "💪"}</span><span>${answer.question}</span></li>`
        )
        .join("");
      showScreen("result");
      playWinFanfare();
      burstConfetti();
      speak(`result_${state.correct}`);
    }

    function closeFeedback() {
      el.feedback.hidden = true;
      stopSpeech();
    }

    async function nextQuestion() {
      closeFeedback();
      state.index += 1;
      if (state.index >= QUESTIONS.length) {
        showResults();
        return;
      }
      await renderQuestion({ travel: true });
    }

    async function startGame() {
      state.index = 0;
      state.correct = 0;
      state.answers = [];
      state.voiceOn = el.toggleVoice.checked;
      closeFeedback();
      stopSpeech();
      unlockAudio();
      buildWorld();
      showScreen("play");
      await renderQuestion({ travel: true });
    }

    function goHome() {
      stopSpeech();
      closeFeedback();
      showScreen("start");
    }

    el.btnStart.addEventListener("click", startGame);
    el.btnNext.addEventListener("click", nextQuestion);
    el.btnReplay.addEventListener("click", startGame);
    el.btnHome.addEventListener("click", goHome);
    el.btnSpeak.addEventListener("click", () => {
      if (!QUESTIONS[state.index]) return;
      state.voiceOn = true;
      el.toggleVoice.checked = true;
      speak(`q${state.index}_replay`);
    });
    el.toggleVoice.addEventListener("change", () => {
      state.voiceOn = el.toggleVoice.checked;
      if (!state.voiceOn) stopSpeech();
    });
    el.choices.addEventListener("click", (event) => {
      const button = event.target.closest(".journey-choice");
      if (!button) return;
      handleAnswer(button.dataset.answer);
    });

    document.addEventListener("keydown", (event) => {
      if (el.play.hidden || state.locked || !el.feedback.hidden) return;
      const key = event.key.toUpperCase();
      if (key === "A" || key === "B" || key === "C" || key === "1" || key === "2" || key === "3") {
        const map = { "1": "A", "2": "B", "3": "C" };
        handleAnswer(map[key] || key);
      }
    });

    showScreen("start");
    return { startGame, goHome };
  }

  window.createJourneyGame = createJourneyGame;
})();
