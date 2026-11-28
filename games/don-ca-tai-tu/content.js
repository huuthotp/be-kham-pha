window.DON_CA_CONTENT = {
  brand: "Đờn ca tài tử Nam Bộ",
  title: "Bé khám phá",
  subtitle: "Đờn ca tài tử",
  tagline: "Mình đưa bé về Nam Bộ nghe đờn ca tài tử. Tiếng đàn kìm và lời ca sâu lắng lắm. Bé chọn giúp mình nhé!",
  intro: "Chào bé! Mình là Bé Sen. Hôm nay mình nghe đờn ca tài tử Nam Bộ và chọn câu đúng nhé!",
  closing: "Bé đã khám phá Đờn ca tài tử. Mình cùng yêu quý và giữ gìn nhé!",
  badge: "Đàn kìm nhỏ",
  zoneArts: {
    gate: "assets/zone-gate.jpg?v=1"
  },
  stages: [
    {
      id: "gate",
      name: "Chặng 1 · Nam Bộ",
      line: "Về Nam Bộ nghe đờn ca tài tử!"
    },
    {
      id: "dance",
      name: "Chặng 2 · Nghe đàn ca",
      line: "Cậu Lồng chỉ tiếng đàn kìm sâu lắng!"
    },
    {
      id: "keep",
      name: "Chặng 3 · Giữ gìn",
      line: "Chị Cò nhắc mình trân trọng di sản."
    },
  ],
  _ttsPerfect: "Hoàn hảo! Bé là chuyên gia nhỏ về Đờn ca tài tử Nam Bộ!",
  _ttsGood: "Xuất sắc! Bé đã hiểu rất nhiều về Đờn ca tài tử.",
  _ttsOk: "Tốt lắm! Chơi lại để nghe đàn ca thêm nhé!",
  _ttsLow: "Bé đã cố gắng rồi! Chơi lại để yêu quý Đờn ca tài tử thêm nhé!",
  resultMessages(correct, total) {
    const ratio = correct / total;
    if (ratio === 1) return "Hoàn hảo! Bé là chuyên gia nhỏ về Đờn ca tài tử Nam Bộ!";
    if (ratio >= 0.7) return "Xuất sắc! Bé đã hiểu rất nhiều về Đờn ca tài tử.";
    if (ratio >= 0.4) return "Tốt lắm! Chơi lại để nghe đàn ca thêm nhé!";
    return "Bé đã cố gắng rồi! Chơi lại để yêu quý Đờn ca tài tử thêm nhé!";
  },
  questions: [
    {
      stage: "gate",
      speaker: "sen",
      question: "Đờn ca tài tử là loại hình nghệ thuật truyền thống của vùng nào?",
      options: [
        { key: "A", label: "Tây Bắc" },
        { key: "B", label: "Nam Bộ" },
      ],
      answer: "B",
      explain: "Đờn ca tài tử là nghệ thuật truyền thống Nam Bộ."
    },
    {
      stage: "gate",
      speaker: "sen",
      question: "Đờn ca tài tử gồm những hoạt động nào?",
      options: [
        { key: "A", label: "Đàn nhạc và ca hát" },
        { key: "B", label: "Chỉ có múa" },
      ],
      answer: "A",
      explain: "Đờn ca tài tử gồm đàn nhạc và ca hát."
    },
    {
      stage: "gate",
      speaker: "sen",
      question: "Đờn ca tài tử thường được biểu diễn ở đâu?",
      options: [
        { key: "A", label: "Chỉ ở sân trường" },
        { key: "B", label: "Trong sinh hoạt, giao lưu và các dịp lễ hội" },
      ],
      answer: "B",
      explain: "Thường biểu diễn trong sinh hoạt, giao lưu và lễ hội."
    },
    {
      stage: "gate",
      speaker: "sen",
      question: "Đâu là nhạc cụ thường có trong Đờn ca tài tử?",
      options: [
        { key: "A", label: "Đàn kìm" },
        { key: "B", label: "Trống trường" },
      ],
      answer: "A",
      explain: "Trong Đờn ca tài tử thường có đàn kìm."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Đờn ca tài tử thường có giai điệu như thế nào?",
      options: [
        { key: "A", label: "Chỉ có tiếng động mạnh" },
        { key: "B", label: "Mềm mại, sâu lắng, giàu tình cảm" },
      ],
      answer: "B",
      explain: "Giai điệu mềm mại, sâu lắng, giàu tình cảm."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Đờn ca tài tử thể hiện tình cảm gì?",
      options: [
        { key: "A", label: "Tình yêu quê hương, cuộc sống và con người" },
        { key: "B", label: "Sự giận dữ và xa cách" },
      ],
      answer: "A",
      explain: "Thể hiện tình yêu quê hương, cuộc sống và con người."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Khi nghe Đờn ca tài tử, bé nên làm gì?",
      options: [
        { key: "A", label: "Nói chuyện thật to" },
        { key: "B", label: "Lắng nghe và cảm nhận giai điệu" },
      ],
      answer: "B",
      explain: "Mình lắng nghe và cảm nhận giai điệu."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Đờn ca tài tử Nam Bộ được UNESCO ghi danh năm nào?",
      say: "Đờn ca tài tử Nam Bộ được ghi danh năm nào?",
      options: [
        { key: "A", label: "Năm 2013", say: "năm hai nghìn mười ba" },
        { key: "B", label: "Năm 2005", say: "năm hai nghìn không trăm linh năm" },
      ],
      answer: "A",
      explain: "Năm hai nghìn mười ba, Đờn ca tài tử được ghi danh."
    },
    {
      stage: "keep",
      speaker: "co",
      question: "Vì sao chúng mình nên yêu quý Đờn ca tài tử?",
      options: [
        { key: "A", label: "Vì đây là một trò chơi điện tử" },
        { key: "B", label: "Vì đây là di sản văn hóa quý báu của Việt Nam" },
      ],
      answer: "B",
      explain: "Vì đây là di sản văn hóa quý báu của Việt Nam."
    },
    {
      stage: "keep",
      speaker: "co",
      question: "Bé làm gì để góp phần giữ gìn Đờn ca tài tử?",
      options: [
        { key: "A", label: "Nghe hát, xem biểu diễn và trân trọng di sản" },
        { key: "B", label: "Không tìm hiểu về âm nhạc truyền thống" },
      ],
      answer: "A",
      explain: "Mình nghe hát, xem biểu diễn và trân trọng di sản."
    },
  ]
};
