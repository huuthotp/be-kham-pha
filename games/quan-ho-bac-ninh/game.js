(() => {
  "use strict";

  const DATA = window.QUAN_HO_CONTENT;
  const QUESTIONS = DATA.questions;
  const SPEAKERS = {
    sen: { name: "Bé Sen", praise: "Giỏi quá bé ơi!" },
    long: { name: "Cậu Lồng", praise: "Ý hay đây!" },
    co: { name: "Chị Cò", praise: "Nhẹ nhàng quá!" }
  };

  const el = {
    start: document.getElementById("screen-start"),
    play: document.getElementById("screen-play"),
    result: document.getElementById("screen-result"),
    feedback: document.getElementById("feedback"),
    confetti: document.getElementById("confetti"),
    btnStart: document.getElementById("btn-start"),
    btnNext: document.getElementById("btn-next"),
    btnSpeak: document.getElementById("btn-speak"),
    btnReplay: document.getElementById("btn-replay"),
    btnHome: document.getElementById("btn-home"),
    toggleVoice: document.getElementById("toggle-voice"),
    progressFill: document.getElementById("progress-fill"),
    progressText: document.getElementById("progress-text"),
    questionKicker: document.getElementById("question-kicker"),
    statementText: document.getElementById("statement-text"),
    choiceRow: document.getElementById("choice-row"),
    feedbackEmoji: document.getElementById("feedback-emoji"),
    feedbackTitle: document.getElementById("feedback-title"),
    feedbackExplain: document.getElementById("feedback-explain"),
    resultCorrect: document.getElementById("result-correct"),
    resultTotal: document.getElementById("result-total"),
    resultMessage: document.getElementById("result-message"),
    reviewList: document.getElementById("review-list"),
    stageScene: document.getElementById("stage-scene"),
    stageName: document.getElementById("stage-name"),
    speakerName: document.getElementById("speaker-name"),
    hostSen: document.getElementById("host-sen"),
    hostLong: document.getElementById("host-long"),
    hostCo: document.getElementById("host-co")
  };

  const state = {
    index: 0,
    correct: 0,
    locked: false,
    voiceOn: true,
    answers: [],
    audioCtx: null,
    speakToken: 0,
    ttsAudio: null
  };

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

  /** Phát file giọng Việt dựng sẵn, cùng nguồn với các game trước. */
  function speak(audioKey) {
    if (!state.voiceOn) return;
    stopSpeech();
    const token = state.speakToken;
    const src = window.AUDIO_MANIFEST && window.AUDIO_MANIFEST[audioKey];
    if (!src) return;

    const audio = new Audio(`${src}?v=2`);
    audio.preload = "auto";
    audio.playbackRate = 1;
    if ("preservesPitch" in audio) audio.preservesPitch = true;
    state.ttsAudio = audio;

    audio.onended = () => {
      if (token === state.speakToken) {
        [el.hostSen, el.hostLong, el.hostCo].forEach((node) => node.classList.remove("host-talk"));
      }
    };

    const start = () => {
      window.setTimeout(() => {
        if (token !== state.speakToken) return;
        audio.play().catch(() => {});
      }, 60);
    };

    if (audio.readyState >= 2) start();
    else audio.addEventListener("canplay", start, { once: true });
  }

  function stageOf(id) {
    return DATA.stages.find((stage) => stage.id === id) || DATA.stages[0];
  }

  function showSpeaker(id) {
    const speaker = SPEAKERS[id] || SPEAKERS.sen;
    el.speakerName.textContent = speaker.name;
    el.hostSen.classList.toggle("is-on", id === "sen");
    el.hostLong.classList.toggle("is-on", id === "long");
    el.hostCo.classList.toggle("is-on", id === "co");
    [el.hostSen, el.hostLong, el.hostCo].forEach((node) => node.classList.remove("host-happy", "host-talk"));
    const current = id === "long" ? el.hostLong : id === "co" ? el.hostCo : el.hostSen;
    current.classList.add("host-talk");
  }

  function burstConfetti() {
    const colors = ["#FF7A59", "#FFD45A", "#2F8F5B", "#FF8FAB", "#fff", "#FF5A4A"];
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

  function updateHUD() {
    const total = QUESTIONS.length;
    const pct = (state.index / total) * 100;
    el.progressFill.style.width = `${pct}%`;
    el.progressText.textContent = `Câu ${Math.min(state.index + 1, total)} / ${total}`;
  }

  function renderChoices(question) {
    el.choiceRow.innerHTML = question.options
      .map(
        (option) => `
        <button type="button" class="choice-card choice-${option.key.toLowerCase()}" data-answer="${option.key}">
          <span class="choice-key">${option.key}</span>
          <span class="choice-label">${option.label}</span>
        </button>`
      )
      .join("");
  }

  function renderQuestion() {
    state.locked = false;
    const question = QUESTIONS[state.index];
    const stage = stageOf(question.stage);
    el.stageScene.dataset.scene = stage.id;
    el.stageName.textContent = stage.name;
    el.questionKicker.textContent = `Câu hỏi ${state.index + 1}`;
    el.statementText.textContent = question.question;
    showSpeaker(question.speaker);
    renderChoices(question);
    updateHUD();
    speak(`q${state.index}`);
  }

  function openFeedback(isCorrect, question) {
    el.feedback.hidden = false;
    el.feedback.classList.toggle("is-wrong", !isCorrect);
    el.feedbackEmoji.textContent = isCorrect ? "🎉" : "💪";
    el.feedbackTitle.textContent = isCorrect ? "Giỏi quá!" : "Cố lên nhé!";
    el.feedbackExplain.textContent = question.explain;
    el.btnNext.textContent = state.index >= QUESTIONS.length - 1 ? "Xem tổng kết" : "Câu tiếp theo";
    speak(`fb${state.index}_${isCorrect ? "ok" : "bad"}`);
  }

  function handleAnswer(chosen) {
    if (state.locked) return;
    state.locked = true;
    unlockAudio();
    const question = QUESTIONS[state.index];
    const isCorrect = chosen === question.answer;
    el.choiceRow.querySelectorAll(".choice-card").forEach((button) => {
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
    const ratio = state.correct / QUESTIONS.length;
    if (ratio === 1) return "Hoàn hảo! Bé là chuyên gia nhỏ về dân ca Quan họ Bắc Ninh!";
    if (ratio >= 0.7) return "Xuất sắc! Bé đã hiểu rất nhiều về Quan họ Bắc Ninh.";
    if (ratio >= 0.4) return "Tốt lắm! Chơi lại để khám phá thêm miền Quan họ nhé!";
    return "Bé đã cố gắng rồi! Chơi lại để nghe Quan họ thêm nhé!";
  }

  function showResults() {
    el.progressFill.style.width = "100%";
    el.resultCorrect.textContent = String(state.correct);
    el.resultTotal.textContent = String(QUESTIONS.length);
    el.resultMessage.textContent = resultMessage();
    el.reviewList.innerHTML = state.answers
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

  function nextQuestion() {
    closeFeedback();
    state.index += 1;
    if (state.index >= QUESTIONS.length) {
      showResults();
      return;
    }
    renderQuestion();
  }

  function startGame() {
    state.index = 0;
    state.correct = 0;
    state.answers = [];
    state.voiceOn = el.toggleVoice.checked;
    closeFeedback();
    stopSpeech();
    unlockAudio();
    showScreen("play");
    renderQuestion();
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
    const question = QUESTIONS[state.index];
    if (!question) return;
    state.voiceOn = true;
    el.toggleVoice.checked = true;
    speak(`q${state.index}_replay`);
  });
  el.toggleVoice.addEventListener("change", () => {
    state.voiceOn = el.toggleVoice.checked;
    if (!state.voiceOn) stopSpeech();
  });
  el.choiceRow.addEventListener("click", (event) => {
    const button = event.target.closest(".choice-card");
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
})();
