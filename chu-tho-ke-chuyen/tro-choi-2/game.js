(() => {
  "use strict";

  const DATA = window.EYES_CONTENT;
  const QUESTIONS = DATA.questions;
  const AUDIO_VERSION = 1;

  const el = {
    start: document.getElementById("screen-start"),
    guide: document.getElementById("screen-guide"),
    play: document.getElementById("screen-play"),
    result: document.getElementById("screen-result"),
    feedback: document.getElementById("feedback"),
    confetti: document.getElementById("confetti"),
    introText: document.getElementById("intro-text"),
    guideText: document.getElementById("guide-text"),
    btnStart: document.getElementById("btn-start"),
    btnGuideNext: document.getElementById("btn-guide-next"),
    btnNext: document.getElementById("btn-next"),
    btnSpeak: document.getElementById("btn-speak"),
    btnReplay: document.getElementById("btn-replay"),
    toggleVoice: document.getElementById("toggle-voice"),
    starRow: document.getElementById("star-row"),
    progressText: document.getElementById("progress-text"),
    promptLine: document.getElementById("prompt-line"),
    picsRow: document.getElementById("pics-row"),
    questionKicker: document.getElementById("question-kicker"),
    statementText: document.getElementById("statement-text"),
    choiceRow: document.getElementById("choice-row"),
    feedbackEmoji: document.getElementById("feedback-emoji"),
    feedbackTitle: document.getElementById("feedback-title"),
    feedbackExplain: document.getElementById("feedback-explain"),
    resultCorrect: document.getElementById("result-correct"),
    resultTotal: document.getElementById("result-total"),
    resultMessage: document.getElementById("result-message"),
    resultCollage: document.getElementById("result-collage")
  };

  const state = {
    index: 0,
    correct: 0,
    locked: false,
    voiceOn: true,
    audioCtx: null,
    speakToken: 0,
    ttsAudio: null,
    awaitingRetry: false,
    safeScenes: []
  };

  el.introText.textContent = DATA.intro;
  el.guideText.textContent = DATA.guide;
  el.btnStart.textContent = DATA.startButton;
  el.btnGuideNext.textContent = DATA.guideButton;
  el.btnReplay.textContent = DATA.replayButton;
  el.promptLine.textContent = DATA.prompt;

  function showScreen(name) {
    [el.start, el.guide, el.play, el.result].forEach((screen) => {
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
    unlockAudio();
    tone(523, 0.12, 0);
    tone(659, 0.12, 0.1);
    tone(784, 0.22, 0.2);
  }

  function playWrongSound() {
    unlockAudio();
    tone(320, 0.16, 0);
    tone(240, 0.22, 0.12);
  }

  function playWinFanfare() {
    unlockAudio();
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

  function speak(audioKey, onEnded) {
    if (!state.voiceOn) {
      if (onEnded) onEnded();
      return;
    }
    stopSpeech();
    const token = state.speakToken;
    const src = window.AUDIO_MANIFEST && window.AUDIO_MANIFEST[audioKey];
    if (!src) {
      if (onEnded) onEnded();
      return;
    }
    const audio = new Audio(`${src}?v=${AUDIO_VERSION}`);
    audio.preload = "auto";
    if ("preservesPitch" in audio) audio.preservesPitch = true;
    state.ttsAudio = audio;
    const finish = () => {
      if (token !== state.speakToken) return;
      if (onEnded) onEnded();
    };
    audio.onended = finish;
    audio.onerror = finish;
    const start = () => {
      window.setTimeout(() => {
        if (token !== state.speakToken) return;
        audio.play().catch(finish);
      }, 60);
    };
    if (audio.readyState >= 2) start();
    else audio.addEventListener("canplay", start, { once: true });
  }

  function burstConfetti() {
    const colors = ["#FF7A59", "#FFD45A", "#2F8F5B", "#FF8FAB", "#fff", "#57CC99"];
    for (let i = 0; i < 36; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDuration = `${1.3 + Math.random() * 1.4}s`;
      el.confetti.appendChild(piece);
      window.setTimeout(() => piece.remove(), 3000);
    }
  }

  function buildStars() {
    el.starRow.innerHTML = Array.from({ length: QUESTIONS.length }, (_, i) => {
      const on = i < state.correct ? " is-on" : "";
      return `<span class="star-slot${on}">${i < state.correct ? "⭐" : ""}</span>`;
    }).join("");
    el.progressText.textContent = `Sao: ${state.correct} / ${QUESTIONS.length} · Câu ${Math.min(
      state.index + 1,
      QUESTIONS.length
    )}`;
  }

  function shortLabel(label) {
    return label.length > 42 ? `${label.slice(0, 40)}…` : label;
  }

  function renderQuestion() {
    state.locked = false;
    state.awaitingRetry = false;
    const question = QUESTIONS[state.index];
    el.questionKicker.textContent = `Câu hỏi ${state.index + 1}`;
    el.statementText.textContent = question.question;
    buildStars();

    el.picsRow.innerHTML = question.options
      .map(
        (option) => `
        <button type="button" class="pic-frame" data-answer="${option.key}" aria-label="Chọn tranh ${option.key}">
          <span class="pic-key">${option.key}</span>
          <div class="pic-scene ${option.scene}"></div>
          <p class="pic-caption">${shortLabel(option.label)}</p>
        </button>`
      )
      .join("");

    el.choiceRow.innerHTML = question.options
      .map(
        (option) => `
        <button type="button" class="choice-card choice-${option.key.toLowerCase()}" data-answer="${option.key}">
          ${option.key}
        </button>`
      )
      .join("");

    speak(`q${state.index}`);
  }

  function openFeedback(isCorrect) {
    el.feedback.hidden = false;
    el.feedback.classList.toggle("is-wrong", !isCorrect);
    if (isCorrect) {
      el.feedbackEmoji.textContent = "⭐";
      el.feedbackTitle.textContent = "Đúng rồi!";
      el.feedbackExplain.textContent = DATA.feedbackOk;
      el.btnNext.textContent = state.index >= QUESTIONS.length - 1 ? "Xem kết thúc" : "Câu tiếp theo";
      speak("fb_ok");
    } else {
      el.feedbackEmoji.textContent = "👀";
      el.feedbackTitle.textContent = "Nhìn lại nhé!";
      el.feedbackExplain.textContent = DATA.feedbackBad;
      el.btnNext.textContent = "Chọn lại";
      speak("fb_bad");
    }
  }

  function handleAnswer(chosen) {
    if (state.locked) return;
    state.locked = true;
    unlockAudio();
    const question = QUESTIONS[state.index];
    const isCorrect = chosen === question.answer;
    el.picsRow.querySelectorAll(".pic-frame").forEach((btn) => {
      btn.disabled = true;
      if (btn.dataset.answer === chosen && isCorrect) btn.classList.add("is-glow");
    });
    el.choiceRow.querySelectorAll(".choice-card").forEach((btn) => {
      btn.disabled = true;
    });

    if (isCorrect) {
      state.correct += 1;
      const safe = question.options.find((o) => o.key === question.answer);
      if (safe) state.safeScenes.push(safe.scene);
      playCorrectSound();
      burstConfetti();
      buildStars();
      state.awaitingRetry = false;
    } else {
      playWrongSound();
      state.awaitingRetry = true;
    }
    openFeedback(isCorrect);
  }

  function closeFeedback() {
    el.feedback.hidden = true;
    stopSpeech();
  }

  function onFeedbackButton() {
    if (state.awaitingRetry) {
      closeFeedback();
      state.locked = false;
      state.awaitingRetry = false;
      el.picsRow.querySelectorAll(".pic-frame").forEach((btn) => {
        btn.disabled = false;
        btn.classList.remove("is-glow");
      });
      el.choiceRow.querySelectorAll(".choice-card").forEach((btn) => {
        btn.disabled = false;
      });
      return;
    }
    closeFeedback();
    state.index += 1;
    if (state.index >= QUESTIONS.length) {
      showResults();
      return;
    }
    renderQuestion();
  }

  function showResults() {
    el.resultCorrect.textContent = String(state.correct);
    el.resultTotal.textContent = String(QUESTIONS.length);
    el.resultMessage.textContent = DATA.closing;
    el.resultCollage.innerHTML = Array.from({ length: QUESTIONS.length }, (_, i) => {
      const on = i < state.correct ? " is-on" : "";
      return `<span class="${on.trim()}">${i < state.correct ? "🖼️" : "⬜"}</span>`;
    }).join("");
    showScreen("result");
    playWinFanfare();
    burstConfetti();
    speak("closing");
  }

  function openGuide() {
    state.voiceOn = el.toggleVoice.checked;
    unlockAudio();
    stopSpeech();
    // Đọc intro trước (cùng cú bấm), rồi sang hướng dẫn
    speak("intro", () => {
      if (!el.start.classList.contains("is-active") && !el.guide.classList.contains("is-active")) return;
      showScreen("guide");
      speak("guide");
    });
    // Hiện guide ngay để khỏi chờ hết intro nếu muốn nhanh — giữ start đến khi intro xong
  }

  function startPlay() {
    state.index = 0;
    state.correct = 0;
    state.safeScenes = [];
    state.awaitingRetry = false;
    closeFeedback();
    stopSpeech();
    unlockAudio();
    showScreen("play");
    renderQuestion();
  }

  function replayAll() {
    stopSpeech();
    closeFeedback();
    showScreen("start");
  }

  el.btnStart.addEventListener("click", openGuide);
  el.btnGuideNext.addEventListener("click", startPlay);
  el.btnNext.addEventListener("click", onFeedbackButton);
  el.btnReplay.addEventListener("click", replayAll);
  el.btnSpeak.addEventListener("click", () => {
    if (state.locked) return;
    state.voiceOn = true;
    el.toggleVoice.checked = true;
    speak(`q${state.index}_replay`);
  });
  el.toggleVoice.addEventListener("change", () => {
    state.voiceOn = el.toggleVoice.checked;
    if (!state.voiceOn) stopSpeech();
  });

  function onPick(event) {
    const target = event.target.closest("[data-answer]");
    if (!target) return;
    handleAnswer(target.dataset.answer);
  }
  el.picsRow.addEventListener("click", onPick);
  el.choiceRow.addEventListener("click", onPick);

  document.addEventListener("keydown", (event) => {
    if (el.play.hidden || state.locked || !el.feedback.hidden) return;
    const key = event.key.toUpperCase();
    if (key === "A" || key === "B" || key === "1" || key === "2") {
      const map = { "1": "A", "2": "B" };
      handleAnswer(map[key] || key);
    }
  });

  showScreen("start");
})();
