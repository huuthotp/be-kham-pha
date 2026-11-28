(() => {
  "use strict";

  const DATA = window.EYES_CONTENT;
  const QUESTIONS = DATA.questions;
  const AUDIO_VERSION = 4;

  const el = {
    start: document.getElementById("screen-start"),
    play: document.getElementById("screen-play"),
    result: document.getElementById("screen-result"),
    feedback: document.getElementById("feedback"),
    confetti: document.getElementById("confetti"),
    introText: document.getElementById("intro-text"),
    btnStart: document.getElementById("btn-start"),
    btnNext: document.getElementById("btn-next"),
    btnSpeak: document.getElementById("btn-speak"),
    btnReplay: document.getElementById("btn-replay"),
    toggleVoice: document.getElementById("toggle-voice"),
    progressFill: document.getElementById("progress-fill"),
    progressText: document.getElementById("progress-text"),
    questionKicker: document.getElementById("question-kicker"),
    statementText: document.getElementById("statement-text"),
    picsRow: document.getElementById("pics-row"),
    feedbackTitle: document.getElementById("feedback-title"),
    feedbackExplain: document.getElementById("feedback-explain"),
    rewardScene: document.getElementById("reward-scene"),
    rewardCaption: document.getElementById("reward-caption"),
    rewardBloom: document.getElementById("reward-bloom"),
    journeyStops: document.getElementById("journey-stops"),
    journeyBee: document.getElementById("journey-bee"),
    resultCorrect: document.getElementById("result-correct"),
    resultTotal: document.getElementById("result-total"),
    resultMessage: document.getElementById("result-message"),
    finaleScene: document.getElementById("finale-scene"),
    finaleCaption: document.querySelector("#finale-scene .finale-caption")
  };

  const state = {
    index: 0,
    correct: 0,
    locked: false,
    voiceOn: true,
    audioCtx: null,
    speakToken: 0,
    ttsAudio: null,
    awaitingRetry: false
  };

  el.introText.textContent = DATA.intro;
  el.btnStart.textContent = DATA.startButton;
  el.btnReplay.textContent = DATA.replayButton;

  function showScreen(name) {
    [el.start, el.play, el.result].forEach((s) => {
      s.classList.remove("is-active");
      s.hidden = true;
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
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.02);
    g.gain.linearRampToValueAtTime(0.0001, t + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
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
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, i * 0.12));
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

  function speak(key, onEnded) {
    if (!state.voiceOn) {
      if (onEnded) onEnded();
      return;
    }
    stopSpeech();
    const token = state.speakToken;
    const src = window.AUDIO_MANIFEST && window.AUDIO_MANIFEST[key];
    if (!src) {
      if (onEnded) onEnded();
      return;
    }
    const audio = new Audio(`${src}?v=${AUDIO_VERSION}`);
    state.ttsAudio = audio;
    const done = () => {
      if (token !== state.speakToken) return;
      if (onEnded) onEnded();
    };
    audio.onended = done;
    audio.onerror = done;
    const start = () => {
      window.setTimeout(() => {
        if (token !== state.speakToken) return;
        audio.play().catch(done);
      }, 60);
    };
    if (audio.readyState >= 2) start();
    else audio.addEventListener("canplay", start, { once: true });
  }

  function burstConfetti() {
    const colors = ["#FF7A59", "#FFD45A", "#2F8F5B", "#FF8FAB", "#fff"];
    for (let i = 0; i < 30; i += 1) {
      const p = document.createElement("span");
      p.className = "confetti-piece";
      p.style.left = `${Math.random() * 100}%`;
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = `${1.2 + Math.random()}s`;
      el.confetti.appendChild(p);
      window.setTimeout(() => p.remove(), 2800);
    }
  }

  function beePercent(step) {
    const total = QUESTIONS.length;
    if (total <= 0) return 0;
    if (step <= 0) return 0;
    if (step >= total) return 100;
    return (step / total) * 100;
  }

  function buildJourneyStops() {
    if (!el.journeyStops) return;
    el.journeyStops.innerHTML = QUESTIONS.map(
      () => `<span class="journey-stop" aria-hidden="true"></span>`
    ).join("");
  }

  function updateJourney() {
    if (el.journeyBee) {
      el.journeyBee.style.left = `${beePercent(state.correct)}%`;
    }
    if (el.journeyStops) {
      el.journeyStops.querySelectorAll(".journey-stop").forEach((stop, i) => {
        stop.classList.toggle("is-done", i < state.correct);
      });
    }
  }

  function updateHUD() {
    const total = QUESTIONS.length;
    el.progressFill.style.width = `${(state.index / total) * 100}%`;
    el.progressText.textContent = `Câu ${Math.min(state.index + 1, total)} / ${total}`;
    updateJourney();
  }

  function playRewardScene(step) {
    if (!el.rewardScene) return;
    el.rewardScene.hidden = false;
    el.rewardScene.setAttribute("aria-hidden", "false");
    el.rewardScene.classList.remove("is-play");
    if (el.rewardBloom) {
      el.rewardBloom.style.left = `${Math.min(18 + step * 6.5, 72)}%`;
    }
    if (el.rewardCaption) {
      el.rewardCaption.textContent =
        step >= QUESTIONS.length
          ? "Ong con sắp về tổ rồi!"
          : "Ong con có thêm 1 bông hoa an toàn!";
    }
    void el.rewardScene.offsetWidth;
    el.rewardScene.classList.add("is-play");
  }

  function hideRewardScene() {
    if (!el.rewardScene) return;
    el.rewardScene.classList.remove("is-play");
    el.rewardScene.hidden = true;
    el.rewardScene.setAttribute("aria-hidden", "true");
  }

  function renderQuestion() {
    state.locked = false;
    state.awaitingRetry = false;
    const q = QUESTIONS[state.index];
    el.questionKicker.textContent = `Câu hỏi ${state.index + 1}`;
    el.statementText.textContent = q.question;
    updateHUD();
    el.picsRow.innerHTML = q.options
      .map(
        (o) => `
        <button type="button" class="pic-card" data-answer="${o.key}" aria-label="Chọn ${o.key}">
          <img src="${o.image}" alt="" loading="eager" />
          <div class="pic-meta">
            <span class="pic-key">${o.key}</span>
            <span class="pic-label">${o.label}</span>
          </div>
        </button>`
      )
      .join("");
    speak(`q${state.index}`);
  }

  function openFeedback(ok) {
    el.feedback.hidden = false;
    el.feedback.classList.toggle("is-wrong", !ok);
    if (ok) {
      playRewardScene(state.correct);
      el.feedbackTitle.textContent = "Đúng rồi!";
      el.feedbackExplain.textContent = DATA.feedbackOk;
      el.btnNext.textContent =
        state.index >= QUESTIONS.length - 1 ? "Xem kết quả" : "Câu tiếp theo";
      speak("fb_ok");
    } else {
      hideRewardScene();
      el.feedbackTitle.textContent = "Chọn lại nhé!";
      el.feedbackExplain.textContent = DATA.feedbackBad;
      el.btnNext.textContent = "Chọn lại";
      speak("fb_bad");
    }
  }

  function handleAnswer(chosen) {
    if (state.locked) return;
    state.locked = true;
    unlockAudio();
    const q = QUESTIONS[state.index];
    const ok = chosen === q.answer;
    el.picsRow.querySelectorAll(".pic-card").forEach((btn) => {
      btn.disabled = true;
      if (ok && btn.dataset.answer === chosen) btn.classList.add("is-glow");
    });
    if (ok) {
      state.correct += 1;
      state.awaitingRetry = false;
      updateJourney();
      playCorrectSound();
      burstConfetti();
    } else {
      state.awaitingRetry = true;
      playWrongSound();
    }
    openFeedback(ok);
  }

  function closeFeedback() {
    el.feedback.hidden = true;
    hideRewardScene();
    stopSpeech();
  }

  function onNext() {
    if (state.awaitingRetry) {
      closeFeedback();
      state.locked = false;
      state.awaitingRetry = false;
      el.picsRow.querySelectorAll(".pic-card").forEach((btn) => {
        btn.disabled = false;
        btn.classList.remove("is-glow");
      });
      return;
    }
    closeFeedback();
    state.index += 1;
    if (state.index >= QUESTIONS.length) {
      el.progressFill.style.width = "100%";
      el.resultCorrect.textContent = String(state.correct);
      el.resultTotal.textContent = String(QUESTIONS.length);
      el.resultMessage.textContent = DATA.closing;
      showScreen("result");
      playFinale(state.correct >= QUESTIONS.length);
      playWinFanfare();
      burstConfetti();
      speak("closing");
      return;
    }
    renderQuestion();
  }

  function playFinale(perfect) {
    if (!el.finaleScene) return;
    el.finaleScene.classList.remove("is-play");
    if (!perfect) return;
    if (el.finaleCaption) el.finaleCaption.textContent = "Ong con đang bay về tổ…";
    void el.finaleScene.offsetWidth;
    el.finaleScene.classList.add("is-play");
    window.setTimeout(() => {
      if (!el.result.hidden && el.finaleCaption) {
        el.finaleCaption.textContent = "Ong con đã về tổ rồi!";
      }
    }, 3000);
  }

  function startGame() {
    state.index = 0;
    state.correct = 0;
    state.awaitingRetry = false;
    state.voiceOn = el.toggleVoice.checked;
    closeFeedback();
    stopSpeech();
    if (el.finaleScene) el.finaleScene.classList.remove("is-play");
    buildJourneyStops();
    updateJourney();
    unlockAudio();
    showScreen("play");
    renderQuestion();
  }

  el.btnStart.addEventListener("click", startGame);
  el.btnNext.addEventListener("click", onNext);
  el.btnReplay.addEventListener("click", startGame);
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
  el.picsRow.addEventListener("click", (e) => {
    const btn = e.target.closest(".pic-card");
    if (!btn) return;
    handleAnswer(btn.dataset.answer);
  });
  document.addEventListener("keydown", (e) => {
    if (el.play.hidden || state.locked || !el.feedback.hidden) return;
    const k = e.key.toUpperCase();
    if (k === "A" || k === "B" || k === "1" || k === "2") {
      handleAnswer({ "1": "A", "2": "B" }[k] || k);
    }
  });

  showScreen("start");
})();
