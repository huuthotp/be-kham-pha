(() => {
  "use strict";

  const QUESTIONS = [
    {
      question: "Đình làng Lỗ Giáng có nằm ở phường Hoà Xuân không?",
      answer: true,
      explain: "Có chứ! Đình làng Lỗ Giáng nằm ở phường Hoà Xuân đó."
    },
    {
      question: "Đình làng có chỉ dùng để vui chơi thôi không?",
      answer: false,
      explain: "Không phải vậy đâu. Đình còn là nơi thờ cúng và giữ gìn văn hóa làng nữa."
    },
    {
      question: "Chúng ta có được vẽ lên tường đình không?",
      answer: false,
      explain: "Không được đâu bé! Phải yêu quý và bảo vệ tường đình nhé."
    },
    {
      question: "Đình làng có phải là nơi lưu giữ những giá trị văn hóa truyền thống không?",
      answer: true,
      explain: "Đúng rồi! Đình lưu giữ nhiều giá trị văn hóa truyền thống của làng."
    },
    {
      question: "Khi tham quan đình, chúng ta có cần giữ gìn vệ sinh không?",
      answer: true,
      explain: "Có chứ! Tham quan đình phải giữ vệ sinh, sạch sẽ và trật tự."
    }
  ];

  const NUM_WORDS = ["một", "hai", "ba", "bốn", "năm"];

  // Ưu tiên giọng nữ tiếng Việt (Windows Edge/Chrome thường có Hoài My)
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
    feedbackEmoji: document.getElementById("feedback-emoji"),
    feedbackTitle: document.getElementById("feedback-title"),
    feedbackExplain: document.getElementById("feedback-explain"),
    resultCorrect: document.getElementById("result-correct"),
    resultTotal: document.getElementById("result-total"),
    resultMessage: document.getElementById("result-message"),
    reviewList: document.getElementById("review-list"),
    hostPlay: document.getElementById("host-play")
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
    speakToken: 0
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

  /** Mở khóa AudioContext sau thao tác người dùng (bắt buộc trên Chrome/Edge). */
  function unlockAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return Promise.resolve(null);

    if (!state.audioCtx) {
      state.audioCtx = new Ctx();
    }

    const ctx = state.audioCtx;
    const resumePromise =
      ctx.state === "suspended" ? ctx.resume().catch(() => ctx) : Promise.resolve(ctx);

    // Warm-up: phát 1 buffer im lặng để “mở cửa” audio trên một số máy
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
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
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

  /** Chỉ lấy giọng Việt nữ. Không bao giờ trả về giọng Anh/nam nước ngoài. */
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

  function speakWithLocalFemale(text, voice, { rate = 1.05, pitch = 1.25 } = {}, token) {
    if (!voice || !("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "vi-VN";
    utter.voice = voice;
    // Nhanh nhẹ + pitch cao hơn → nghe vui, gần giọng dẫn chương trình thiếu nhi
    utter.rate = Math.min(Math.max(rate, 0.95), 1.15);
    utter.pitch = Math.min(Math.max(pitch, 1.15), 1.4);
    utter.volume = 1;
    setHostMood("talk");

    utter.onend = () => {
      if (token === state.speakToken) setHostMood("idle");
    };
    utter.onerror = () => {
      if (token === state.speakToken) {
        speakWithProxyTts(text, token);
      }
    };

    window.setTimeout(() => {
      if (token !== state.speakToken || !state.voiceOn) return;
      try {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        window.speechSynthesis.speak(utter);
        window.setTimeout(() => {
          if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        }, 120);
      } catch (_) {
        speakWithProxyTts(text, token);
      }
    }, 40);

    return true;
  }

  /** Chia lời dẫn thành đoạn ngắn để có nhịp nhấn nhá, không đọc một mạch. */
  function livelyChunks(text) {
    const raw = String(text).replace(/\s+/g, " ").trim();
    const pieces = raw.match(/[^!?]+[!?]?/g) || [raw];
    return pieces
      .map((s) => s.trim())
      .filter(Boolean)
      .flatMap((part) => (part.length <= 120 ? [part] : chunkText(part, 120)));
  }

  /** TTS tiếng Việt qua proxy, phát nhanh hơn một chút để nghe tươi vui. */
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
      // Nhanh + không giữ pitch → giọng sáng, vui hơn kiểu MC thiếu nhi
      audio.playbackRate = 1.14;
      if ("preservesPitch" in audio) audio.preservesPitch = false;
      state.ttsAudio = audio;

      audio.onended = () => {
        i += 1;
        // Nghỉ cực ngắn giữa các đoạn để có nhịp nhấn nhá
        window.setTimeout(playNext, 90);
      };
      audio.onerror = () => {
        console.warn("[TTS] Không phát được đoạn", i, parts[i]);
        i += 1;
        playNext();
      };
      audio.play().catch(() => {
        i += 1;
        playNext();
      });
    };

    playNext();
  }

  /** Phát file mp3 có sẵn (deploy static) — ổn định trên GitHub Pages. */
  function speakWithPrebaked(audioKey, token) {
    const src = window.AUDIO_MANIFEST && window.AUDIO_MANIFEST[audioKey];
    if (!src) return false;

    setHostMood("talk");
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.playbackRate = 1.12;
    if ("preservesPitch" in audio) audio.preservesPitch = false;
    state.ttsAudio = audio;

    audio.onended = () => {
      if (token === state.speakToken) setHostMood("idle");
    };
    audio.onerror = () => {
      if (token === state.speakToken) setHostMood("idle");
    };
    audio.play().catch(() => {
      if (token === state.speakToken) setHostMood("idle");
    });
    return true;
  }

  function speak(text, { audioKey } = {}) {
    if (!state.voiceOn) return;
    stopSpeech();
    const token = state.speakToken;
    const softText = String(text).trim();
    if (!softText && !audioKey) return;

    // 1) File âm thanh dựng sẵn (ưu tiên khi publish)
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

    if (voicesReady) {
      trySpeak();
    } else if ("speechSynthesis" in window) {
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

  function questionSpeech(index, question) {
    const n = NUM_WORDS[index] || String(index + 1);
    const openers = [
      `Nào! Câu hỏi số ${n} đây!`,
      `Tí ta tí tiếp! Câu hỏi số ${n} nào!`,
      `Bé ơi, cùng đến câu hỏi số ${n} nhé!`,
      `Ui, câu hỏi số ${n} thú vị lắm!`,
      `Câu hỏi cuối số ${n} rồi đây!`
    ];
    const opener = openers[Math.min(index, openers.length - 1)];
    return `${opener} ${question} Bé chọn Đúng, hay Sai nào?`;
  }

  function feedbackSpeech(isCorrect, explain) {
    if (isCorrect) {
      return `Wow! Giỏi quá bé ơi! ${explain} Tuyệt vời!`;
    }
    return `Ôi, chưa đúng đâu. Không sao nhé! ${explain} Cố lên nào!`;
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
      el.hostPlay.classList.add("host-talk", "host-idle");
      if (smile) smile.hidden = false;
      if (sad) sad.hidden = true;
    } else {
      el.hostPlay.classList.add("host-idle");
      if (smile) smile.hidden = false;
      if (sad) sad.hidden = true;
    }
  }

  function burstConfetti() {
    const colors = ["#FF6B4A", "#FFD166", "#1FA7A0", "#57CC99", "#FF8FAB", "#fff"];
    const count = 42;
    for (let i = 0; i < count; i += 1) {
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

  function renderQuestion() {
    state.locked = false;
    const q = QUESTIONS[state.index];
    const n = state.index + 1;
    if (el.questionKicker) el.questionKicker.textContent = `Câu hỏi ${n}`;
    el.statementText.textContent = q.question;
    el.statementText.parentElement.style.animation = "none";
    void el.statementText.parentElement.offsetWidth;
    el.statementText.parentElement.style.animation = "";

    el.choiceRow.querySelectorAll(".choice-card").forEach((btn) => {
      btn.disabled = false;
    });

    updateHUD();
    setHostMood("idle");
    speak(questionSpeech(state.index, q.question), { audioKey: `q${state.index}` });
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

    state.answers.push({
      question: q.question,
      correct: isCorrect
    });

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
    if (ratio === 1) return "Hoàn hảo! Bé là chuyên gia nhỏ về Đình làng Lỗ Giáng!";
    if (ratio >= 0.7) return "Xuất sắc! Bé đã hiểu rất nhiều về ngôi đình quê hương.";
    if (ratio >= 0.4) return "Tốt lắm! Chơi lại để khám phá thêm nhiều điều thú vị nhé!";
    return "Bé đã cố gắng rồi! Chơi lại để học thêm về Đình Lỗ Giáng nhé!";
  }

  function showResults() {
    el.progressFill.style.width = "100%";
    el.resultCorrect.textContent = String(state.correct);
    el.resultTotal.textContent = String(QUESTIONS.length);
    el.resultMessage.textContent = resultMessage();
    if (el.reviewList) {
      el.reviewList.innerHTML = state.answers
        .map(
          (a) =>
            `<li><span class="review-mark" aria-hidden="true">${a.correct ? "✅" : "❌"}</span><span>${a.question}</span></li>`
        )
        .join("");
    }
    showScreen("result");
    playWinFanfare();
    burstConfetti();
    speak(
      `Xong rồi bé ơi! Yay! Bé đúng ${state.correct} trên ${QUESTIONS.length} câu. ${resultMessage()}`,
      { audioKey: `result_${state.correct}` }
    );
  }

  function startGame() {
    state.index = 0;
    state.correct = 0;
    state.answers = [];
    state.voiceOn = el.toggleVoice.checked;
    closeFeedback();
    stopSpeech();
    showScreen("play");

    unlockAudio()
      .then(() => {
        playClickSound();
        renderQuestion();
      })
      .catch(() => {
        renderQuestion();
      });
  }

  function goHome() {
    stopSpeech();
    closeFeedback();
    showScreen("start");
  }

  // Events
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
      speak(`Bé nghe kỹ này nhé! ${q.question} Chọn Đúng, hay Sai nào?`, {
        audioKey: `q${state.index}_replay`
      });
    });
  });

  el.toggleVoice.addEventListener("change", () => {
    state.voiceOn = el.toggleVoice.checked;
    if (!state.voiceOn) stopSpeech();
  });

  el.choiceRow.addEventListener("click", (e) => {
    const btn = e.target.closest(".choice-card");
    if (!btn) return;
    const value = btn.dataset.answer === "true";
    handleAnswer(value);
  });

  // Keyboard support
  document.addEventListener("keydown", (e) => {
    if (el.play.hidden || state.locked || !el.feedback.hidden) return;
    if (e.key === "1" || e.key.toLowerCase() === "d") handleAnswer(true);
    if (e.key === "2" || e.key.toLowerCase() === "s") handleAnswer(false);
  });

  // Mở khóa audio sớm khi user chạm lần đầu
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

  // Boot
  showScreen("start");
})();
