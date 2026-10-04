(() => {
  "use strict";

  const STEPS_TO_WIN = 4;

  const QUESTIONS = [
    {
      question: "Lễ hội truyền thống của làng mình có tên là gì nhỉ?",
      optionA: "Lễ hội Nghinh thủy (Đón nước)",
      optionB: "Lễ hội Đua voi",
      answer: "A",
      explain: "Lễ hội của làng mình tên là Lễ hội Nghinh thủy, nghĩa là lễ đón nước."
    },
    {
      question: "Đình làng Cẩm Chánh – nơi tổ chức lễ hội – nằm ở phường nào của chúng mình?",
      optionA: "Phường Hòa Xuân",
      optionB: "Phường Hòa Hải",
      answer: "A",
      explain: "Đình làng Cẩm Chánh nằm ở phường Hòa Xuân."
    },
    {
      question: "Mọi người ra dòng sông nào gần làng để làm lễ đón nước vậy các con?",
      optionA: "Sông Cẩm Lệ",
      optionB: "Sông Hàn",
      answer: "A",
      explain: "Mọi người ra sông Cẩm Lệ để làm lễ đón nước."
    },
    {
      question: "Khi ra dòng sông, mọi người đã thả những bông hoa lấp lánh gì xuống nước nhỉ?",
      optionA: "Thả hoa hồng",
      optionB: "Thả hoa đăng (đèn hoa)",
      answer: "B",
      explain: "Mọi người thả hoa đăng, là những đèn hoa lấp lánh, xuống nước."
    },
    {
      question: "Trong ngày hội, hoạt động thể thao nào trên sông làm cho mọi người hò reo vui nhất?",
      optionA: "Đua thuyền gieo chèo",
      optionB: "Đá bóng trên bờ",
      answer: "A",
      explain: "Đua thuyền gieo chèo làm mọi người hò reo vui nhất."
    },
    {
      question: "Các cô chú, các bác tham gia diễu hành mặc trang phục gì rất đẹp?",
      optionA: "Quần áo tắm biển",
      optionB: "Áo dài truyền thống",
      answer: "B",
      explain: "Các cô chú mặc áo dài truyền thống rất đẹp."
    },
    {
      question: "Mọi người làm lễ Nghinh thủy để cầu mong điều gì cho gia đình chúng mình?",
      optionA: "Cầu mong trời mưa thuận gió hòa, nhà nhà bình an khỏe mạnh",
      optionB: "Cầu mong được đi mua nhiều đồ chơi mới",
      answer: "A",
      explain: "Mọi người cầu mong mưa thuận gió hòa, nhà nhà bình an khỏe mạnh."
    },
    {
      question: "Sau khi xem lễ hội của quê hương mình, các con cảm thấy thế nào?",
      optionA: "Rất vui và tự hào về làng mình",
      optionB: "Thấy buồn chán không thích",
      answer: "A",
      explain: "Xem lễ hội xong, các con vui và tự hào về làng mình."
    }
  ];

  const TEAMS = [
    { id: "a", name: "Đội Xanh", short: "Xanh", bannerClass: "" },
    { id: "b", name: "Đội Đỏ", short: "Đỏ", bannerClass: "team-b" }
  ];

  // Cùng quy tắc giọng với game Đình làng Lỗ Giáng: chỉ giọng nữ tiếng Việt.
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
    feedbackCard: document.getElementById("feedback-card"),
    feedbackEmoji: document.getElementById("feedback-emoji"),
    feedbackTitle: document.getElementById("feedback-title"),
    feedbackExplain: document.getElementById("feedback-explain"),
    btnStart: document.getElementById("btn-start"),
    btnA: document.getElementById("btn-a"),
    btnB: document.getElementById("btn-b"),
    optA: document.getElementById("opt-a"),
    optB: document.getElementById("opt-b"),
    btnNext: document.getElementById("btn-next"),
    btnReplay: document.getElementById("btn-replay"),
    btnSpeak: document.getElementById("btn-speak"),
    toggleVoice: document.getElementById("toggle-voice"),
    turnBanner: document.getElementById("turn-banner"),
    qKicker: document.getElementById("q-kicker"),
    qText: document.getElementById("q-text"),
    boatA: document.getElementById("boat-a"),
    boatB: document.getElementById("boat-b"),
    resultTitle: document.getElementById("result-title"),
    resultSub: document.getElementById("result-sub"),
    scoreA: document.getElementById("score-a"),
    scoreB: document.getElementById("score-b"),
    introText: document.getElementById("intro-text")
  };

  const state = {
    progress: { a: 0, b: 0 },
    turn: 0, // 0 = Xanh, 1 = Đỏ
    locked: false,
    voiceOn: true,
    audioCtx: null,
    finished: { a: false, b: false },
    asked: { a: 0, b: 0 },
    used: { a: 0, b: 0 },
    decks: { a: [], b: [] },
    cursor: { a: 0, b: 0 },
    currentQ: null,
    cachedVoice: null,
    ttsAudio: null,
    speakToken: 0
  };

  function showScreen(name) {
    [el.start, el.play, el.result].forEach((s) => {
      s.classList.remove("active");
      s.hidden = true;
    });
    const target = el[name];
    target.hidden = false;
    target.classList.add("active");
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function unlockAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!state.audioCtx) state.audioCtx = new Ctx();
    if (state.audioCtx.state === "suspended") state.audioCtx.resume();
  }

  function tone(freq, dur, type = "sine", gain = 0.12) {
    if (!state.audioCtx) return;
    const ctx = state.audioCtx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  }

  function playCorrect() {
    tone(523, 0.1, "triangle", 0.14);
    setTimeout(() => tone(784, 0.18, "triangle", 0.16), 90);
  }

  function playWrong() {
    tone(280, 0.2, "sine", 0.1);
  }

  function playWin() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, "triangle", 0.14), i * 100));
  }

  function stopSpeak() {
    state.speakToken += 1;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
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
    if (!window.speechSynthesis) return null;
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

  function speakWithLocalFemale(text, voice, token) {
    if (!voice || !window.speechSynthesis) return false;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "vi-VN";
    utter.voice = voice;
    utter.rate = 1.06;
    utter.pitch = 1.28;
    utter.volume = 1;
    window.setTimeout(() => {
      if (token !== state.speakToken || !state.voiceOn) return;
      try {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        window.speechSynthesis.speak(utter);
      } catch (_) {
        /* máy không có giọng Việt nữ */
      }
    }, 40);
    return true;
  }

  function normSpeech(text) {
    return String(text).replace(/\s+/g, " ").trim();
  }

  function clipSrc(text) {
    const key = normSpeech(text);
    const map = window.AUDIO_MANIFEST || {};
    return map[key] || null;
  }

  function speakParts(parts, onDone) {
    const lines = parts.map(normSpeech).filter(Boolean);
    if (!state.voiceOn) {
      if (onDone) onDone();
      return;
    }
    stopSpeak();
    const token = state.speakToken;
    const clips = lines.map(clipSrc).filter(Boolean);

    const finish = () => {
      if (token !== state.speakToken) return;
      if (onDone) onDone();
    };

    if (!clips.length) {
      const femaleVi = pickVietnameseFemaleVoice();
      if (femaleVi) speakWithLocalFemale(lines.join(" "), femaleVi, token);
      finish();
      return;
    }

    let i = 0;
    const playNext = () => {
      if (token !== state.speakToken || !state.voiceOn) return;
      if (i >= clips.length) {
        finish();
        return;
      }
      const audio = new Audio(clips[i]);
      audio.preload = "auto";
      state.ttsAudio = audio;
      let settled = false;
      const advance = (gap) => {
        if (settled || token !== state.speakToken) return;
        settled = true;
        i += 1;
        window.setTimeout(playNext, gap);
      };
      audio.onended = () => advance(80);
      audio.onerror = () => advance(0);
      audio.play().catch(() => advance(0));
    };
    playNext();
  }

  function currentTeam() {
    return TEAMS[state.turn];
  }

  function updateBoats() {
    el.boatA.style.setProperty("--step", String(state.progress.a));
    el.boatB.style.setProperty("--step", String(state.progress.b));
  }

  function pulseBoat(teamId) {
    const boat = teamId === "a" ? el.boatA : el.boatB;
    boat.classList.remove("is-rowing");
    void boat.offsetWidth;
    boat.classList.add("is-rowing");
    setTimeout(() => boat.classList.remove("is-rowing"), 600);
  }

  function updateTurnBanner() {
    const team = currentTeam();
    el.turnBanner.textContent = `Lượt ${team.name}`;
    el.turnBanner.classList.toggle("team-b", team.id === "b");
  }

  function otherTeam(team) {
    return TEAMS.find((item) => item.id !== team.id);
  }

  function bothFinished() {
    return state.finished.a && state.finished.b;
  }

  function dealQuestions() {
    const deck = shuffle(QUESTIONS);
    const half = Math.floor(deck.length / 2);
    state.decks = {
      a: deck.slice(0, half),
      b: deck.slice(half, half * 2)
    };
    state.cursor = { a: 0, b: 0 };
  }

  function takeQuestion(teamId) {
    let deck = state.decks[teamId];
    if (!deck.length) {
      state.decks[teamId] = shuffle(QUESTIONS);
      deck = state.decks[teamId];
    }
    if (state.cursor[teamId] >= deck.length) {
      state.decks[teamId] = shuffle(deck);
      state.cursor[teamId] = 0;
      deck = state.decks[teamId];
    }
    const question = deck[state.cursor[teamId]];
    state.cursor[teamId] += 1;
    state.currentQ = question;
    return question;
  }

  function currentQuestion() {
    return state.currentQ;
  }

  function renderQuestion() {
    state.locked = false;
    const team = currentTeam();
    const q = takeQuestion(team.id);
    el.qKicker.textContent = `${team.name} trả lời`;
    el.qText.textContent = q.question;
    el.optA.textContent = q.optionA;
    el.optB.textContent = q.optionB;
    el.btnA.disabled = false;
    el.btnB.disabled = false;
    updateTurnBanner();
    updateBoats();
    speakParts([`${team.name} ơi!`, q.question, `A. ${q.optionA}`, `B. ${q.optionB}`]);
  }

  function openFeedback(isCorrect, explain, advanced, justFinished) {
    const team = currentTeam();
    const other = otherTeam(team);
    el.feedback.hidden = false;
    el.feedbackCard.classList.toggle("is-wrong", !isCorrect);
    el.feedbackEmoji.textContent = justFinished ? "🏁" : isCorrect ? (advanced ? "🐉" : "🎉") : "💪";

    if (justFinished && bothFinished()) {
      el.feedbackTitle.textContent = "Cả hai đội đã về đích!";
      el.feedbackExplain.textContent = `${explain} Giỏi quá các thủy thủ nhí!`;
      el.btnNext.textContent = "Xem kết quả";
    } else if (justFinished) {
      el.feedbackTitle.textContent = `${team.name} tới đích!`;
      el.feedbackExplain.textContent = `${explain} ${other.name} vẫn được trả lời tiếp nhé!`;
      el.btnNext.textContent = `Lượt ${other.name}`;
    } else if (isCorrect) {
      el.feedbackTitle.textContent = advanced ? "Thuyền rồng tiến lên!" : "Giỏi quá!";
      el.feedbackExplain.textContent = `${explain} ${advanced ? "Chèo tiếp nào!" : ""}`;
      el.btnNext.textContent = "Lượt tiếp theo";
    } else {
      el.feedbackTitle.textContent = "Chưa đúng!";
      el.feedbackExplain.textContent = `${explain} Thuyền chưa tiến, cố lên nhé!`;
      el.btnNext.textContent = "Lượt tiếp theo";
    }

    speakParts([el.feedbackTitle.textContent, explain].concat(
      justFinished && bothFinished()
        ? ["Giỏi quá các thủy thủ nhí!"]
        : justFinished
          ? [`${other.name} vẫn được trả lời tiếp nhé!`]
          : isCorrect && advanced
            ? ["Chèo tiếp nào!"]
            : isCorrect
              ? []
              : ["Thuyền chưa tiến, cố lên nhé!"]
    ));
  }

  function closeFeedback() {
    el.feedback.hidden = true;
    stopSpeak();
  }

  function answer(choice) {
    if (state.locked) return;
    state.locked = true;
    unlockAudio();
    el.btnA.disabled = true;
    el.btnB.disabled = true;

    const q = currentQuestion();
    const team = currentTeam();
    const isCorrect = choice === q.answer;
    let advanced = false;
    let justFinished = false;

    state.asked[team.id] += 1;

    if (isCorrect && state.progress[team.id] < STEPS_TO_WIN) {
      playCorrect();
      state.progress[team.id] += 1;
      advanced = true;
      updateBoats();
      pulseBoat(team.id);
      if (state.progress[team.id] >= STEPS_TO_WIN) {
        state.finished[team.id] = true;
        state.used[team.id] = state.asked[team.id];
        justFinished = true;
      }
    } else if (!isCorrect) {
      playWrong();
    }

    openFeedback(isCorrect, q.explain, advanced, justFinished);
  }

  function nextTurn() {
    closeFeedback();
    if (bothFinished()) {
      showResult();
      return;
    }
    const other = state.turn === 0 ? 1 : 0;
    state.turn = state.finished[TEAMS[other].id] ? state.turn : other;
    renderQuestion();
  }

  function showResult() {
    stopSpeak();
    playWin();
    const usedA = state.used.a;
    const usedB = state.used.b;
    let title;
    let sub;
    let speech;
    if (usedA === usedB) {
      title = "Hai đội cùng về đích!";
      sub = "Đội Xanh và Đội Đỏ chèo đều nhau. Giỏi quá!";
      speech = "Tuyệt vời! Hai đội cùng về đích!";
    } else if (usedA < usedB) {
      title = "Đội Xanh về đích nhanh hơn!";
      sub = "Đội Đỏ cũng đã về đích. Cả hai đội đều hoàn thành cuộc đua!";
      speech = "Tuyệt vời! Đội Xanh về đích nhanh hơn, và Đội Đỏ cũng đã về đích!";
    } else {
      title = "Đội Đỏ về đích nhanh hơn!";
      sub = "Đội Xanh cũng đã về đích. Cả hai đội đều hoàn thành cuộc đua!";
      speech = "Tuyệt vời! Đội Đỏ về đích nhanh hơn, và Đội Xanh cũng đã về đích!";
    }
    el.resultTitle.textContent = title;
    el.resultSub.textContent = sub;
    el.scoreA.textContent = String(state.progress.a);
    el.scoreB.textContent = String(state.progress.b);
    showScreen("result");
    speakParts([speech]);
  }

  function startGame() {
    unlockAudio();
    state.progress = { a: 0, b: 0 };
    state.finished = { a: false, b: false };
    state.asked = { a: 0, b: 0 };
    state.used = { a: 0, b: 0 };
    state.turn = 0;
    state.locked = false;
    state.currentQ = null;
    dealQuestions();
    state.voiceOn = el.toggleVoice.checked;
    closeFeedback();
    stopSpeak();
    showScreen("play");
    if (state.voiceOn) {
      speakParts([el.introText.textContent], () => renderQuestion());
    } else {
      renderQuestion();
    }
  }

  function replay() {
    startGame();
  }

  el.btnStart.addEventListener("click", startGame);
  el.btnA.addEventListener("click", () => answer("A"));
  el.btnB.addEventListener("click", () => answer("B"));
  el.btnNext.addEventListener("click", nextTurn);
  el.btnReplay.addEventListener("click", replay);
  el.btnSpeak.addEventListener("click", () => {
    state.voiceOn = true;
    el.toggleVoice.checked = true;
    const q = currentQuestion();
    const team = currentTeam();
    speakParts([`${team.name} ơi!`, q.question, `A. ${q.optionA}`, `B. ${q.optionB}`]);
  });
  el.toggleVoice.addEventListener("change", () => {
    state.voiceOn = el.toggleVoice.checked;
    if (!state.voiceOn) stopSpeak();
  });

  if (window.speechSynthesis) {
    const warmVoices = () => {
      window.speechSynthesis.getVoices();
      state.cachedVoice = null;
      pickVietnameseFemaleVoice();
    };
    warmVoices();
    window.speechSynthesis.onvoiceschanged = warmVoices;
  }

  document.documentElement.style.setProperty("--steps", String(STEPS_TO_WIN));
  showScreen("start");
})();
