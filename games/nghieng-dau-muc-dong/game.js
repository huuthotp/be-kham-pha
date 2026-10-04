import {
  FaceLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm";

(() => {
  "use strict";

  const CONTENT = window.TILT_CONTENT;
  const QUESTIONS = CONTENT.questions;

  const TILT_THRESHOLD = 14; // degrees of head roll
  const HOLD_MS = 900;
  const MODEL_URL =
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
  const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

  // MediaPipe face mesh indices
  const LEFT_EYE_OUTER = 33;
  const RIGHT_EYE_OUTER = 263;

  const FEMALE_VI_HINTS = [
    /hoaimy/i,
    /hoài\s*my/i,
    /my\s*an/i,
    /linh/i,
    /female/i,
    /nữ/i,
    /woman/i,
    /google.*(vi|tiếng việt)/i
  ];
  const MALE_VI_HINTS = [/namminh/i, /nam\s*minh/i, /\bmale\b/i, /\bnam\b/i];

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
    labelA: document.getElementById("label-a"),
    labelB: document.getElementById("label-b"),
    feedbackEmoji: document.getElementById("feedback-emoji"),
    feedbackTitle: document.getElementById("feedback-title"),
    feedbackExplain: document.getElementById("feedback-explain"),
    resultCorrect: document.getElementById("result-correct"),
    resultTotal: document.getElementById("result-total"),
    resultMessage: document.getElementById("result-message"),
    reviewList: document.getElementById("review-list"),
    hostPlay: document.getElementById("host-play"),
    camStatus: document.getElementById("cam-status"),
    video: document.getElementById("cam-video"),
    overlay: document.getElementById("cam-overlay"),
    faceGuide: document.getElementById("face-guide"),
    tiltNeedle: document.getElementById("tilt-needle"),
    tiltHint: document.getElementById("tilt-hint"),
    tiltHold: document.getElementById("tilt-hold"),
    tiltHoldFill: document.getElementById("tilt-hold-fill")
  };

  const state = {
    index: 0,
    correct: 0,
    locked: false,
    voiceOn: true,
    audioCtx: null,
    answers: [],
    cachedVoice: null,
    ttsAudio: null,
    speakToken: 0,
    faceLandmarker: null,
    stream: null,
    rafId: 0,
    lastVideoTime: -1,
    holdChoice: null,
    holdStartedAt: 0,
    cameraReady: false,
    modelReady: false
  };

  function showScreen(name) {
    [el.start, el.play, el.result].forEach((s) => {
      s.classList.remove("is-active");
      s.hidden = true;
    });
    const target = el[name];
    target.hidden = false;
    target.classList.add("is-active");
  }

  function unlockAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return Promise.resolve(null);
    if (!state.audioCtx) state.audioCtx = new Ctx();
    const ctx = state.audioCtx;
    const resumePromise =
      ctx.state === "suspended" ? ctx.resume().catch(() => ctx) : Promise.resolve(ctx);
    return resumePromise.then(() => {
      try {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      } catch (_) {
        /* ignore */
      }
      return ctx;
    });
  }

  function ensureAudio() {
    if (!state.audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) state.audioCtx = new Ctx();
    }
    if (state.audioCtx?.state === "suspended") {
      state.audioCtx.resume().catch(() => {});
    }
    return state.audioCtx;
  }

  function tone(freq, duration, type = "sine", gain = 0.22, when = 0) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const startAt = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startAt);
    g.gain.setValueAtTime(0.0001, startAt);
    g.gain.linearRampToValueAtTime(gain, startAt + 0.015);
    g.gain.linearRampToValueAtTime(0.0001, startAt + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  }

  function playCorrectSound() {
    unlockAudio().then(() => {
      tone(523.25, 0.14, "triangle", 0.28, 0);
      tone(659.25, 0.14, "triangle", 0.28, 0.1);
      tone(783.99, 0.28, "triangle", 0.32, 0.2);
    });
  }

  function playWrongSound() {
    unlockAudio().then(() => {
      tone(320, 0.2, "sine", 0.24, 0);
      tone(240, 0.32, "sine", 0.22, 0.14);
    });
  }

  function playClickSound() {
    unlockAudio().then(() => {
      tone(880, 0.07, "square", 0.12, 0);
    });
  }

  function playWinFanfare() {
    unlockAudio().then(() => {
      [523, 659, 784, 1047].forEach((f, i) => {
        tone(f, 0.22, "triangle", 0.28, i * 0.12);
      });
    });
  }

  function stopSpeech() {
    state.speakToken += 1;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
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

  function isVietnameseVoice(voice) {
    const label = `${voice.lang} ${voice.name}`;
    return /^(vi)([-_]|$)/i.test(voice.lang) || /vietnamese|tiếng việt|viet nam|vi-vn/i.test(label);
  }

  function isFemaleVoice(voice) {
    const label = `${voice.name} ${voice.lang}`;
    if (MALE_VI_HINTS.some((re) => re.test(label))) return false;
    return FEMALE_VI_HINTS.some((re) => re.test(label)) || /wavenet-a|neural|hoài|hoai|linh|my\b/i.test(label);
  }

  function scoreVietnameseVoice(voice) {
    const label = `${voice.name} ${voice.lang}`;
    let score = 10;
    if (/vi-VN/i.test(voice.lang)) score += 20;
    if (isFemaleVoice(voice)) score += 50;
    if (MALE_VI_HINTS.some((re) => re.test(label))) score -= 80;
    if (/natural|online|neural/i.test(label)) score += 15;
    if (/microsoft/i.test(label)) score += 5;
    return score;
  }

  function pickVietnameseFemaleVoice() {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis
      .getVoices()
      .filter((v) => isVietnameseVoice(v) && isFemaleVoice(v));
    if (!voices.length) {
      state.cachedVoice = null;
      return null;
    }
    voices.sort((a, b) => scoreVietnameseVoice(b) - scoreVietnameseVoice(a));
    state.cachedVoice = voices[0];
    return state.cachedVoice;
  }

  function chunkText(text, maxLen = 160) {
    const clean = String(text).replace(/\s+/g, " ").trim();
    if (clean.length <= maxLen) return [clean];
    const parts = [];
    let rest = clean;
    while (rest.length > maxLen) {
      let cut = rest.lastIndexOf(" ", maxLen);
      if (cut < 40) cut = maxLen;
      parts.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) parts.push(rest);
    return parts;
  }

  function livelyChunks(text) {
    const raw = String(text).replace(/\s+/g, " ").trim();
    const pieces = raw.match(/[^!?]+[!?]?/g) || [raw];
    return pieces
      .map((s) => s.trim())
      .filter(Boolean)
      .flatMap((part) => (part.length <= 120 ? [part] : chunkText(part, 120)));
  }

  function setHostMood(mood) {
    if (!el.hostPlay) return;
    el.hostPlay.classList.remove("host-idle", "host-talk", "host-happy", "host-sad");
    if (mood === "happy") el.hostPlay.classList.add("host-happy");
    else if (mood === "sad") el.hostPlay.classList.add("host-sad");
    else if (mood === "talk") el.hostPlay.classList.add("host-talk", "host-idle");
    else el.hostPlay.classList.add("host-idle");
  }

  function speakWithLocalFemale(text, voice, { rate = 1.05, pitch = 1.25 } = {}, token) {
    if (!voice || !("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "vi-VN";
    utter.voice = voice;
    utter.rate = Math.min(Math.max(rate, 0.95), 1.15);
    utter.pitch = Math.min(Math.max(pitch, 1.15), 1.4);
    utter.volume = 1;
    setHostMood("talk");
    utter.onend = () => {
      if (token === state.speakToken) setHostMood("idle");
    };
    utter.onerror = () => {
      if (token === state.speakToken) speakWithProxyTts(text, token);
    };
    window.setTimeout(() => {
      if (token !== state.speakToken || !state.voiceOn) return;
      try {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        window.speechSynthesis.speak(utter);
      } catch (_) {
        speakWithProxyTts(text, token);
      }
    }, 40);
    return true;
  }

  function speakWithProxyTts(text, token) {
    const parts = livelyChunks(text);
    let i = 0;
    setHostMood("talk");
    const playNext = () => {
      if (token !== state.speakToken || !state.voiceOn) {
        setHostMood("idle");
        return;
      }
      if (i >= parts.length) {
        setHostMood("idle");
        return;
      }
      const url = `/api/tts?text=${encodeURIComponent(parts[i])}&_=${Date.now()}-${i}`;
      const audio = new Audio(url);
      audio.preload = "auto";
      audio.playbackRate = 1.02;
      if ("preservesPitch" in audio) audio.preservesPitch = true;
      state.ttsAudio = audio;
      audio.onended = () => {
        i += 1;
        window.setTimeout(playNext, 120);
      };
      audio.onerror = () => {
        i += 1;
        playNext();
      };
      const start = () => {
        window.setTimeout(() => {
          if (token !== state.speakToken) return;
          audio.play().catch(() => {
            i += 1;
            playNext();
          });
        }, 40);
      };
      if (audio.readyState >= 2) start();
      else audio.addEventListener("canplay", start, { once: true });
    };
    playNext();
  }

  function speakWithPrebaked(audioKey, token) {
    const src = window.AUDIO_MANIFEST && window.AUDIO_MANIFEST[audioKey];
    if (!src) return false;
    setHostMood("talk");
    const audio = new Audio(`${src}?v=1`);
    audio.preload = "auto";
    audio.playbackRate = 1.02;
    if ("preservesPitch" in audio) audio.preservesPitch = true;
    state.ttsAudio = audio;
    audio.onended = () => {
      if (token === state.speakToken) setHostMood("idle");
    };
    audio.onerror = () => {
      if (token === state.speakToken) setHostMood("idle");
    };
    const start = () => {
      window.setTimeout(() => {
        if (token !== state.speakToken) return;
        audio.play().catch(() => {
          if (token === state.speakToken) setHostMood("idle");
        });
      }, 60);
    };
    if (audio.readyState >= 2) start();
    else audio.addEventListener("canplay", start, { once: true });
    return true;
  }

  function speak(text, { audioKey } = {}) {
    if (!state.voiceOn) return;
    stopSpeech();
    const token = state.speakToken;
    const softText = String(text).trim();
    if (!softText && !audioKey) return;
    if (audioKey && speakWithPrebaked(audioKey, token)) return;

    const trySpeak = () => {
      if (token !== state.speakToken) return;
      const femaleVi = pickVietnameseFemaleVoice();
      if (femaleVi) {
        speakWithLocalFemale(softText, femaleVi, { rate: 1.06, pitch: 1.28 }, token);
        return;
      }
      speakWithProxyTts(softText, token);
    };

    const voicesReady =
      "speechSynthesis" in window && window.speechSynthesis.getVoices().length > 0;
    if (voicesReady) trySpeak();
    else if ("speechSynthesis" in window) {
      const onReady = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", onReady);
        trySpeak();
      };
      window.speechSynthesis.addEventListener("voiceschanged", onReady);
      window.setTimeout(() => {
        window.speechSynthesis.removeEventListener("voiceschanged", onReady);
        trySpeak();
      }, 350);
    } else {
      speakWithProxyTts(softText, token);
    }
  }

  function questionSpeech(q) {
    const a = q.options[0].label;
    const b = q.options[1].label;
    return `${q.question} A. ${a}. Hay B. ${b}?`;
  }

  function feedbackSpeech(isCorrect, explain) {
    if (isCorrect) return `Wow! Giỏi quá bé ơi! ${explain} Tuyệt vời!`;
    return `Ôi, chưa đúng đâu. Không sao nhé! ${explain} Cố lên nào!`;
  }

  function burstConfetti() {
    const colors = ["#FF7A59", "#FFD45A", "#57CC99", "#6EC6E0", "#FF8FAB", "#fff"];
    for (let i = 0; i < 42; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDuration = `${1.4 + Math.random() * 1.6}s`;
      piece.style.animationDelay = `${Math.random() * 0.25}s`;
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      el.confetti.appendChild(piece);
      setTimeout(() => piece.remove(), 3200);
    }
  }

  function updateHUD() {
    const total = QUESTIONS.length;
    const current = Math.min(state.index + 1, total);
    const pct = (state.index / total) * 100;
    el.progressFill.style.width = `${pct}%`;
    el.progressText.textContent = `Câu ${current} / ${total}`;
    const track = el.progressFill.parentElement;
    if (track) track.setAttribute("aria-valuenow", String(Math.round(pct)));
  }

  function resetTiltHold() {
    state.holdChoice = null;
    state.holdStartedAt = 0;
    el.tiltHold.hidden = true;
    el.tiltHoldFill.style.width = "0%";
    el.choiceRow.querySelectorAll(".choice-card").forEach((btn) => btn.classList.remove("is-hot"));
    el.faceGuide.classList.remove("is-tilt-a", "is-tilt-b");
  }

  function setCamStatus(msg, isError = false) {
    if (!el.camStatus) return;
    el.camStatus.textContent = msg;
    el.camStatus.classList.toggle("is-error", isError);
  }

  async function ensureFaceModel() {
    if (state.faceLandmarker) return state.faceLandmarker;
    setCamStatus("Đang tải nhận diện khuôn mặt…");
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    const options = {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numFaces: 1
    };
    try {
      state.faceLandmarker = await FaceLandmarker.createFromOptions(vision, options);
    } catch (_) {
      options.baseOptions.delegate = "CPU";
      state.faceLandmarker = await FaceLandmarker.createFromOptions(vision, options);
    }
    state.modelReady = true;
    return state.faceLandmarker;
  }

  async function startCamera() {
    if (state.stream) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Trình duyệt chưa hỗ trợ camera.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    });
    state.stream = stream;
    el.video.srcObject = stream;
    await el.video.play();
    state.cameraReady = true;
  }

  function stopCameraLoop() {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
  }

  function stopCamera() {
    stopCameraLoop();
    if (state.stream) {
      state.stream.getTracks().forEach((t) => t.stop());
      state.stream = null;
    }
    el.video.srcObject = null;
    state.cameraReady = false;
  }

  function headRollDegrees(landmarks) {
    const left = landmarks[LEFT_EYE_OUTER];
    const right = landmarks[RIGHT_EYE_OUTER];
    if (!left || !right) return 0;
    // Nghiêng đầu sang trái (tai trái hạ xuống) → roll âm → chọn A
    const dx = right.x - left.x;
    const dy = right.y - left.y;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }

  function drawFaceHint(landmarks, roll) {
    const canvas = el.overlay;
    const video = el.video;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = video.videoWidth || canvas.clientWidth;
    const h = video.videoHeight || canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!landmarks) return;

    const left = landmarks[LEFT_EYE_OUTER];
    const right = landmarks[RIGHT_EYE_OUTER];
    ctx.save();
    ctx.strokeStyle = Math.abs(roll) >= TILT_THRESHOLD ? "#FFD45A" : "#ffffff";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo((1 - left.x) * canvas.width, left.y * canvas.height);
    ctx.lineTo((1 - right.x) * canvas.width, right.y * canvas.height);
    ctx.stroke();
    ctx.restore();
  }

  function updateTiltUi(roll, hasFace) {
    const clamped = Math.max(-35, Math.min(35, roll || 0));
    const pct = (clamped / 35) * 42; // px offset on needle
    el.tiltNeedle.style.transform = `translateX(${pct}px)`;

    el.faceGuide.classList.toggle("is-found", !!hasFace);
    el.faceGuide.classList.remove("is-tilt-a", "is-tilt-b");

    const btnA = el.choiceRow.querySelector('[data-answer="A"]');
    const btnB = el.choiceRow.querySelector('[data-answer="B"]');
    btnA?.classList.remove("is-hot");
    btnB?.classList.remove("is-hot");

    if (!hasFace) {
      el.tiltHint.textContent = "Đưa mặt vào khung hình nhé";
      el.tiltHold.hidden = true;
      el.tiltHoldFill.style.width = "0%";
      return null;
    }

    if (roll <= -TILT_THRESHOLD) {
      el.tiltHint.textContent = "Đang chọn A… giữ nghiêng đầu";
      el.faceGuide.classList.add("is-tilt-a");
      btnA?.classList.add("is-hot");
      return "A";
    }
    if (roll >= TILT_THRESHOLD) {
      el.tiltHint.textContent = "Đang chọn B… giữ nghiêng đầu";
      el.faceGuide.classList.add("is-tilt-b");
      btnB?.classList.add("is-hot");
      return "B";
    }

    el.tiltHint.textContent = "Nghiêng đầu trái = A · phải = B";
    el.tiltHold.hidden = true;
    el.tiltHoldFill.style.width = "0%";
    return null;
  }

  function processHold(choice) {
    if (state.locked || !el.feedback.hidden) {
      resetTiltHold();
      return;
    }
    if (!choice) {
      resetTiltHold();
      return;
    }
    const now = performance.now();
    if (state.holdChoice !== choice) {
      state.holdChoice = choice;
      state.holdStartedAt = now;
      el.tiltHold.hidden = false;
      el.tiltHoldFill.style.width = "0%";
      return;
    }
    const elapsed = now - state.holdStartedAt;
    const pct = Math.min(100, (elapsed / HOLD_MS) * 100);
    el.tiltHold.hidden = false;
    el.tiltHoldFill.style.width = `${pct}%`;
    if (elapsed >= HOLD_MS) {
      handleAnswer(choice);
      resetTiltHold();
    }
  }

  function detectLoop() {
    if (!state.cameraReady || !state.faceLandmarker || el.play.hidden) {
      state.rafId = requestAnimationFrame(detectLoop);
      return;
    }

    const video = el.video;
    if (video.readyState >= 2 && video.currentTime !== state.lastVideoTime) {
      state.lastVideoTime = video.currentTime;
      let result = null;
      try {
        result = state.faceLandmarker.detectForVideo(video, performance.now());
      } catch (_) {
        result = null;
      }
      const landmarks = result?.faceLandmarks?.[0] || null;
      const roll = landmarks ? headRollDegrees(landmarks) : 0;
      drawFaceHint(landmarks, roll);
      const choice = updateTiltUi(roll, !!landmarks);
      processHold(choice);
    }

    state.rafId = requestAnimationFrame(detectLoop);
  }

  function renderQuestion() {
    state.locked = false;
    resetTiltHold();
    const q = QUESTIONS[state.index];
    const n = state.index + 1;
    el.questionKicker.textContent = `Câu hỏi ${n}`;
    el.statementText.textContent = q.question;
    el.labelA.textContent = q.options[0].label;
    el.labelB.textContent = q.options[1].label;
    el.statementText.parentElement.style.animation = "none";
    void el.statementText.parentElement.offsetWidth;
    el.statementText.parentElement.style.animation = "";
    el.choiceRow.querySelectorAll(".choice-card").forEach((btn) => {
      btn.disabled = false;
    });
    updateHUD();
    setHostMood("idle");
    speak(questionSpeech(q), { audioKey: `q${state.index}` });
  }

  function openFeedback(isCorrect, explain) {
    el.feedback.hidden = false;
    el.feedback.classList.toggle("is-wrong", !isCorrect);
    el.feedbackEmoji.textContent = isCorrect ? "🎉" : "💪";
    el.feedbackTitle.textContent = isCorrect ? "Giỏi quá!" : "Cố lên nhé!";
    el.feedbackExplain.textContent = explain;
    const nextIsLast = state.index >= QUESTIONS.length - 1;
    el.btnNext.textContent = nextIsLast ? "Xem tổng kết" : "Câu tiếp theo";
    const key = `fb${state.index}_${isCorrect ? "ok" : "bad"}`;
    speak(feedbackSpeech(isCorrect, explain), { audioKey: key });
  }

  function closeFeedback() {
    el.feedback.hidden = true;
    stopSpeech();
  }

  function handleAnswer(chosen) {
    if (state.locked) return;
    state.locked = true;
    playClickSound();
    const q = QUESTIONS[state.index];
    const isCorrect = chosen === q.answer;
    el.choiceRow.querySelectorAll(".choice-card").forEach((btn) => {
      btn.disabled = true;
    });
    if (isCorrect) {
      state.correct += 1;
      setHostMood("happy");
      playCorrectSound();
      burstConfetti();
    } else {
      setHostMood("sad");
      playWrongSound();
    }
    state.answers.push({ question: q.question, correct: isCorrect });
    openFeedback(isCorrect, q.explain);
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

  function resultMessage() {
    const ratio = state.correct / QUESTIONS.length;
    if (ratio === 1) return "Hoàn hảo! Bé là chuyên gia nhỏ về Lễ hội Mục Đồng!";
    if (ratio >= 0.7) return "Xuất sắc! Bé đã hiểu rất nhiều về Lễ hội Mục Đồng.";
    if (ratio >= 0.4) return "Tốt lắm! Chơi lại để khám phá thêm nhiều điều thú vị nhé!";
    return "Bé đã cố gắng rồi! Chơi lại để học thêm về Lễ hội Mục Đồng nhé!";
  }

  function showResults() {
    el.progressFill.style.width = "100%";
    el.resultCorrect.textContent = String(state.correct);
    el.resultTotal.textContent = String(QUESTIONS.length);
    el.resultMessage.textContent = resultMessage();
    el.reviewList.innerHTML = state.answers
      .map(
        (a) =>
          `<li><span class="review-mark" aria-hidden="true">${a.correct ? "✅" : "❌"}</span><span>${a.question}</span></li>`
      )
      .join("");
    showScreen("result");
    stopCameraLoop();
    playWinFanfare();
    burstConfetti();
    speak(
      `Xong rồi bé ơi! Yay! Bé đúng ${state.correct} trên ${QUESTIONS.length} câu. ${resultMessage()}`,
      { audioKey: `result_${state.correct}` }
    );
  }

  async function startGame() {
    state.index = 0;
    state.correct = 0;
    state.answers = [];
    state.voiceOn = el.toggleVoice.checked;
    closeFeedback();
    stopSpeech();
    el.btnStart.disabled = true;
    setCamStatus("Đang bật camera…");

    try {
      await ensureFaceModel();
      await startCamera();
      setCamStatus("Camera sẵn sàng! Nghiêng đầu để chọn đáp án.");
      showScreen("play");
      stopCameraLoop();
      state.rafId = requestAnimationFrame(detectLoop);
      await unlockAudio();
      playClickSound();
      renderQuestion();
    } catch (err) {
      console.error(err);
      setCamStatus(
        "Không bật được camera. Hãy cho phép camera, hoặc chơi bằng cách chạm đáp án A / B.",
        true
      );
      // Vẫn cho vào chơi với nút chạm
      showScreen("play");
      await unlockAudio().catch(() => {});
      renderQuestion();
    } finally {
      el.btnStart.disabled = false;
    }
  }

  function goHome() {
    stopSpeech();
    closeFeedback();
    stopCamera();
    showScreen("start");
  }

  el.btnStart.addEventListener("click", startGame);
  el.btnNext.addEventListener("click", nextQuestion);
  el.btnReplay.addEventListener("click", startGame);
  el.btnHome.addEventListener("click", goHome);

  el.btnSpeak.addEventListener("click", () => {
    const q = QUESTIONS[state.index];
    if (!q) return;
    state.voiceOn = true;
    el.toggleVoice.checked = true;
    unlockAudio().then(() => {
      speak(questionSpeech(q), { audioKey: `q${state.index}_replay` });
    });
  });

  el.toggleVoice.addEventListener("change", () => {
    state.voiceOn = el.toggleVoice.checked;
    if (!state.voiceOn) stopSpeech();
  });

  el.choiceRow.addEventListener("click", (e) => {
    const btn = e.target.closest(".choice-card");
    if (!btn || state.locked || !el.feedback.hidden) return;
    handleAnswer(btn.dataset.answer);
  });

  document.addEventListener("keydown", (e) => {
    if (el.play.hidden || state.locked || !el.feedback.hidden) return;
    if (e.key.toLowerCase() === "a" || e.key === "1" || e.key === "ArrowLeft") handleAnswer("A");
    if (e.key.toLowerCase() === "b" || e.key === "2" || e.key === "ArrowRight") handleAnswer("B");
  });

  const unlockOnce = () => {
    unlockAudio();
    document.removeEventListener("pointerdown", unlockOnce);
    document.removeEventListener("keydown", unlockOnce);
  };
  document.addEventListener("pointerdown", unlockOnce, { passive: true });
  document.addEventListener("keydown", unlockOnce);

  if ("speechSynthesis" in window) {
    const warmVoices = () => {
      window.speechSynthesis.getVoices();
      state.cachedVoice = null;
      pickVietnameseFemaleVoice();
    };
    warmVoices();
    window.speechSynthesis.onvoiceschanged = warmVoices;
  }

  window.addEventListener("pagehide", stopCamera);
  showScreen("start");
})();
