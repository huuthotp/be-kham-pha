(() => {
  "use strict";

  const DATA = window.THO_CONTENT;
  const QUESTIONS = DATA.questions;
  const AUDIO_VERSION = 9;

  const el = {
    hub: document.getElementById("screen-hub"),
    start: document.getElementById("screen-start"),
    story: document.getElementById("screen-story"),
    play: document.getElementById("screen-play"),
    result: document.getElementById("screen-result"),
    feedback: document.getElementById("feedback"),
    confetti: document.getElementById("confetti"),
    introText: document.getElementById("intro-text"),
    storyVideo: document.getElementById("story-video"),
    storyHint: document.getElementById("story-hint"),
    btnHubGame1: document.getElementById("btn-hub-game1"),
    btnStart: document.getElementById("btn-start"),
    btnBackHub: document.getElementById("btn-back-hub"),
    btnStoryNext: document.getElementById("btn-story-next"),
    btnStorySkip: document.getElementById("btn-story-skip"),
    btnStorySpeak: document.getElementById("btn-story-speak"),
    btnNext: document.getElementById("btn-next"),
    btnSpeak: document.getElementById("btn-speak"),
    btnReplay: document.getElementById("btn-replay"),
    btnBackStart: document.getElementById("btn-back-start"),
    toggleVoice: document.getElementById("toggle-voice"),
    toggleVoiceHub: document.getElementById("toggle-voice-hub"),
    flowerRow: document.getElementById("flower-row"),
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
    resultFlowers: document.getElementById("result-flowers"),
    hostPlay: document.getElementById("host-play")
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
    storyDone: false
  };

  el.introText.textContent = DATA.intro;
  el.btnStart.textContent = DATA.startButton;
  el.btnStoryNext.textContent = DATA.storyButton;
  el.btnReplay.textContent = DATA.replayButton;

  function pauseStoryVideo() {
    if (!el.storyVideo) return;
    el.storyVideo.pause();
  }

  function showScreen(name) {
    if (name !== "story") pauseStoryVideo();
    [el.hub, el.start, el.story, el.play, el.result].forEach((screen) => {
      screen.classList.remove("is-active");
      screen.hidden = true;
    });
    el[name].hidden = false;
    el[name].classList.add("is-active");
  }

  function syncVoiceToggles() {
    el.toggleVoice.checked = state.voiceOn;
    if (el.toggleVoiceHub) el.toggleVoiceHub.checked = state.voiceOn;
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

  function setHostMood(mood) {
    if (!el.hostPlay) return;
    el.hostPlay.classList.remove("host-idle", "host-talk", "host-happy", "host-sad");
    const smile = el.hostPlay.querySelector(".mouth.smile");
    const sad = el.hostPlay.querySelector(".mouth.sad");
    if (mood === "happy") {
      el.hostPlay.classList.add("host-happy");
      if (smile) smile.hidden = false;
      if (sad) sad.hidden = true;
    } else if (mood === "sad") {
      el.hostPlay.classList.add("host-sad");
      if (smile) smile.hidden = true;
      if (sad) sad.hidden = false;
    } else if (mood === "talk") {
      el.hostPlay.classList.add("host-talk");
      if (smile) smile.hidden = false;
      if (sad) sad.hidden = true;
    } else {
      el.hostPlay.classList.add("host-idle");
      if (smile) smile.hidden = false;
      if (sad) sad.hidden = true;
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
    audio.playbackRate = 1;
    if ("preservesPitch" in audio) audio.preservesPitch = true;
    state.ttsAudio = audio;
    setHostMood("talk");

    const finish = () => {
      if (token !== state.speakToken) return;
      setHostMood("idle");
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

  function buildFlowerRow() {
    el.flowerRow.innerHTML = Array.from({ length: QUESTIONS.length }, (_, i) => {
      const on = i < state.correct ? " is-on" : "";
      return `<span class="flower-slot${on}" aria-hidden="true">${i < state.correct ? "🌸" : ""}</span>`;
    }).join("");
    el.progressText.textContent = `Hoa an toàn: ${state.correct} / ${QUESTIONS.length} · Câu ${Math.min(
      state.index + 1,
      QUESTIONS.length
    )}`;
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
    state.awaitingRetry = false;
    const question = QUESTIONS[state.index];
    el.questionKicker.textContent = `Câu hỏi ${state.index + 1}`;
    el.statementText.textContent = question.question;
    el.statementText.parentElement.style.animation = "none";
    void el.statementText.parentElement.offsetWidth;
    el.statementText.parentElement.style.animation = "";
    renderChoices(question);
    buildFlowerRow();
    setHostMood("idle");
    speak(`q${state.index}`);
  }

  function openFeedback(isCorrect, question) {
    el.feedback.hidden = false;
    el.feedback.classList.toggle("is-wrong", !isCorrect);
    if (isCorrect) {
      el.feedbackEmoji.textContent = "🌸";
      el.feedbackTitle.textContent = "Hoan hô!";
      el.feedbackExplain.textContent = `${DATA.feedbackOk} ${question.explain}`;
      el.btnNext.textContent = state.index >= QUESTIONS.length - 1 ? "Xem kết thúc" : "Câu tiếp theo";
      speak("fb_ok");
    } else {
      el.feedbackEmoji.textContent = "💪";
      el.feedbackTitle.textContent = "Cố lên nào!";
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
    el.choiceRow.querySelectorAll(".choice-card").forEach((button) => {
      button.disabled = true;
    });
    if (isCorrect) {
      state.correct += 1;
      state.awaitingRetry = false;
      setHostMood("happy");
      playCorrectSound();
      burstConfetti();
      buildFlowerRow();
    } else {
      state.awaitingRetry = true;
      setHostMood("sad");
      playWrongSound();
    }
    openFeedback(isCorrect, question);
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
      el.choiceRow.querySelectorAll(".choice-card").forEach((button) => {
        button.disabled = false;
      });
      setHostMood("idle");
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
    el.resultFlowers.innerHTML = Array.from({ length: QUESTIONS.length }, (_, i) => {
      const on = i < state.correct ? " is-on" : "";
      return `<span class="${on.trim()}">🌸</span>`;
    }).join("");
    showScreen("result");
    playWinFanfare();
    burstConfetti();
    speak("closing");
  }

  function finishStoryVideo() {
    state.storyDone = true;
    pauseStoryVideo();
    el.btnStoryNext.hidden = false;
    el.btnStorySkip.hidden = true;
    if (el.storyHint) el.storyHint.textContent = "Xong rồi! Bấm Tiếp tục chơi nhé!";
    burstConfetti();
  }

  function playStoryVideo() {
    if (!el.storyVideo) return;
    state.storyDone = false;
    el.btnStoryNext.hidden = true;
    el.btnStorySkip.hidden = false;
    if (el.storyHint) el.storyHint.textContent = "Xem câu chuyện của Thỏ Bông nhé!";
    el.storyVideo.currentTime = 0;
    const playPromise = el.storyVideo.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        if (el.storyHint) {
          el.storyHint.textContent = "Bấm ▶ trên video để xem câu chuyện nhé!";
        }
      });
    }
  }

  function openStory() {
    stopSpeech();
    unlockAudio();
    showScreen("story");
    playStoryVideo();
  }

  function skipStoryVideo() {
    finishStoryVideo();
  }

  function replayStory() {
    playStoryVideo();
  }

  function startQuiz() {
    state.index = 0;
    state.correct = 0;
    state.awaitingRetry = false;
    state.locked = true;
    closeFeedback();
    stopSpeech();
    pauseStoryVideo();
    unlockAudio();
    showScreen("play");
    el.questionKicker.textContent = "Thỏ Bông nói";
    el.statementText.textContent = DATA.quizIntro;
    el.choiceRow.innerHTML = "";
    buildFlowerRow();
    speak("quiz_intro", () => {
      if (!el.play.classList.contains("is-active")) return;
      renderQuestion();
    });
  }

  function enterGameFromHub() {
    state.voiceOn = el.toggleVoiceHub ? el.toggleVoiceHub.checked : true;
    syncVoiceToggles();
    unlockAudio();
    stopSpeech();
    closeFeedback();
    showScreen("start");
    // Cùng thao tác bấm mục lục → được phép phát intro
    speak("intro");
  }

  function goHub() {
    stopSpeech();
    closeFeedback();
    showScreen("hub");
  }

  function replayAll() {
    stopSpeech();
    closeFeedback();
    showScreen("start");
    speak("intro");
  }

  if (el.storyVideo) {
    el.storyVideo.addEventListener("ended", () => {
      if (!el.story.classList.contains("is-active")) return;
      finishStoryVideo();
    });
  }

  el.btnHubGame1.addEventListener("click", enterGameFromHub);
  el.btnStart.addEventListener("click", openStory);
  el.btnBackHub.addEventListener("click", goHub);
  el.btnStoryNext.addEventListener("click", startQuiz);
  el.btnStorySkip.addEventListener("click", skipStoryVideo);
  el.btnStorySpeak.addEventListener("click", replayStory);
  el.btnNext.addEventListener("click", onFeedbackButton);
  el.btnReplay.addEventListener("click", replayAll);
  el.btnBackStart.addEventListener("click", () => {
    stopSpeech();
    closeFeedback();
    showScreen("start");
  });
  el.btnSpeak.addEventListener("click", () => {
    const question = QUESTIONS[state.index];
    if (!question || state.locked) return;
    state.voiceOn = true;
    el.toggleVoice.checked = true;
    speak(`q${state.index}_replay`);
  });
  el.toggleVoice.addEventListener("change", () => {
    state.voiceOn = el.toggleVoice.checked;
    syncVoiceToggles();
    if (!state.voiceOn) stopSpeech();
  });
  if (el.toggleVoiceHub) {
    el.toggleVoiceHub.addEventListener("change", () => {
      state.voiceOn = el.toggleVoiceHub.checked;
      syncVoiceToggles();
      if (!state.voiceOn) stopSpeech();
    });
  }
  el.choiceRow.addEventListener("click", (event) => {
    const button = event.target.closest(".choice-card");
    if (!button) return;
    handleAnswer(button.dataset.answer);
  });

  document.addEventListener("keydown", (event) => {
    if (el.play.hidden || state.locked || !el.feedback.hidden) return;
    const key = event.key.toUpperCase();
    if (key === "A" || key === "B" || key === "1" || key === "2") {
      const map = { "1": "A", "2": "B" };
      handleAnswer(map[key] || key);
    }
  });

  showScreen("hub");
})();
