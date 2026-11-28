window.VI_GIAM_CONTENT = {
  brand: "Ví, Giặm Nghệ Tĩnh",
  title: "Bé yêu làn điệu",
  subtitle: "Ví, Giặm",
  tagline: "Mình đưa bé về Nghệ An – Hà Tĩnh nghe Ví, Giặm ngọt ngào. Bé chọn giúp mình nhé!",
  intro: "Chào bé! Mình là Bé Sen. Hôm nay mình nghe Ví, Giặm quê Nghệ Tĩnh, chọn câu đúng nhé!",
  closing: "Bé đã khám phá Ví, Giặm ngọt ngào của quê hương Nghệ Tĩnh. Mình cùng yêu quý và giữ gìn nhé!",
  badge: "Lời ru Ví Giặm",
  zoneArts: {
    gate: "assets/zone-gate.jpg?v=1"
  },
  stages: [
    {
      id: "gate",
      name: "Chặng 1 · Quê Nghệ Tĩnh",
      line: "Về quê Nghệ Tĩnh nghe Ví, Giặm!"
    },
    {
      id: "dance",
      name: "Chặng 2 · Nghe làn điệu",
      line: "Cậu Lồng chỉ giai điệu mộc mạc ngọt ngào!"
    },
    {
      id: "keep",
      name: "Chặng 3 · Giữ gìn",
      line: "Chị Cò nhắc mình yêu quý dân ca."
    },
  ],
  _ttsPerfect: "Hoàn hảo! Bé là chuyên gia nhỏ về dân ca Ví, Giặm!",
  _ttsGood: "Xuất sắc! Bé đã hiểu rất nhiều về Ví, Giặm Nghệ Tĩnh.",
  _ttsOk: "Tốt lắm! Chơi lại để nghe Ví, Giặm thêm nhé!",
  _ttsLow: "Bé đã cố gắng rồi! Chơi lại để yêu quý Ví, Giặm thêm nhé!",
  resultMessages(correct, total) {
    const ratio = correct / total;
    if (ratio === 1) return "Hoàn hảo! Bé là chuyên gia nhỏ về dân ca Ví, Giặm!";
    if (ratio >= 0.7) return "Xuất sắc! Bé đã hiểu rất nhiều về Ví, Giặm Nghệ Tĩnh.";
    if (ratio >= 0.4) return "Tốt lắm! Chơi lại để nghe Ví, Giặm thêm nhé!";
    return "Bé đã cố gắng rồi! Chơi lại để yêu quý Ví, Giặm thêm nhé!";
  },
  questions: [
    {
      stage: "gate",
      speaker: "sen",
      question: "Dân ca Ví, Giặm là làn điệu dân ca của tỉnh nào?",
      options: [
        { key: "A", label: "Nghệ An và Hà Tĩnh" },
        { key: "B", label: "Đà Nẵng và Quảng Nam" },
      ],
      answer: "A",
      explain: "Ví, Giặm là dân ca của Nghệ An và Hà Tĩnh."
    },
    {
      stage: "gate",
      speaker: "sen",
      question: "Ví, Giặm là loại hình nghệ thuật gì?",
      options: [
        { key: "A", label: "Nghệ thuật múa" },
        { key: "B", label: "Dân ca truyền thống" },
      ],
      answer: "B",
      explain: "Ví, Giặm là dân ca truyền thống."
    },
    {
      stage: "gate",
      speaker: "sen",
      question: "Giai điệu dân ca Ví, Giặm thường như thế nào?",
      options: [
        { key: "A", label: "Ồn ào, mạnh mẽ như tiếng còi" },
        { key: "B", label: "Mộc mạc, ngọt ngào, tha thiết" },
      ],
      answer: "B",
      explain: "Giai điệu Ví, Giặm mộc mạc, ngọt ngào, tha thiết."
    },
    {
      stage: "gate",
      speaker: "sen",
      question: "Dân ca Ví, Giặm thể hiện tình cảm gì?",
      options: [
        { key: "A", label: "Tình yêu quê hương, gia đình và con người" },
        { key: "B", label: "Sự giận dữ, ghét bỏ" },
      ],
      answer: "A",
      explain: "Ví, Giặm thể hiện tình yêu quê hương, gia đình và con người."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Người dân thường hát Ví, Giặm trong những hoạt động nào?",
      options: [
        { key: "A", label: "Chỉ khi đi ngủ" },
        { key: "B", label: "Lao động, sinh hoạt và ru con" },
      ],
      answer: "B",
      explain: "Người dân hát khi lao động, sinh hoạt và ru con."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Khi nghe nghệ nhân hát Ví, Giặm, bé nên làm gì?",
      options: [
        { key: "A", label: "Lắng nghe và thưởng thức làn điệu dân ca" },
        { key: "B", label: "Nói chuyện thật to" },
      ],
      answer: "A",
      explain: "Mình lắng nghe và thưởng thức làn điệu."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Dân ca Ví, Giặm được UNESCO ghi danh vào năm nào?",
      say: "Dân ca Ví, Giặm được ghi danh vào năm nào?",
      options: [
        { key: "A", label: "Năm 2000", say: "năm hai nghìn" },
        { key: "B", label: "Năm 2014", say: "năm hai nghìn mười bốn" },
      ],
      answer: "B",
      explain: "Năm hai nghìn mười bốn, Ví, Giặm được ghi danh."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Vì sao chúng mình nên yêu quý dân ca Ví, Giặm?",
      options: [
        { key: "A", label: "Vì đó là làn điệu dân ca truyền thống quý báu" },
        { key: "B", label: "Vì đó là bài hát mới xuất hiện" },
      ],
      answer: "A",
      explain: "Vì đó là làn điệu dân ca truyền thống quý báu."
    },
    {
      stage: "keep",
      speaker: "co",
      question: "Bé nên làm gì để góp phần giữ gìn dân ca Ví, Giặm?",
      options: [
        { key: "A", label: "Không nghe và không tìm hiểu" },
        { key: "B", label: "Nghe hát, học hát và giới thiệu cho người thân" },
      ],
      answer: "B",
      explain: "Mình nghe hát, học hát và giới thiệu cho người thân."
    },
    {
      stage: "keep",
      speaker: "co",
      question: "Khi nghe một làn điệu dân ca truyền thống của Việt Nam, bé cảm thấy như thế nào?",
      options: [
        { key: "A", label: "Yêu quý và tự hào về văn hóa dân tộc" },
        { key: "B", label: "Không cần quan tâm" },
      ],
      answer: "A",
      explain: "Mình yêu quý và tự hào về văn hóa dân tộc."
    },
  ]
};
