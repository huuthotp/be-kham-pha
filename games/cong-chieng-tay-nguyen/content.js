window.CONG_CHIENG_CONTENT = {
  brand: "Cồng chiêng Tây Nguyên",
  title: "Bé khám phá",
  subtitle: "Cồng chiêng",
  tagline: "Mình đưa bé lên Tây Nguyên nghe tiếng cồng chiêng vang ngân. Bé chọn giúp mình nhé!",
  intro: "Chào bé! Mình là Bé Sen. Hôm nay mình lên Tây Nguyên nghe cồng chiêng và chọn câu đúng nhé!",
  closing: "Bé đã khám phá Cồng chiêng Tây Nguyên. Mình cùng yêu quý và giữ gìn nhé!",
  badge: "Chiếc chiêng vàng",
  zoneArts: {
    gate: "assets/zone-gate.jpg?v=1"
  },
  stages: [
    {
      id: "gate",
      name: "Chặng 1 · Tây Nguyên",
      line: "Lên Tây Nguyên nghe cồng chiêng!"
    },
    {
      id: "dance",
      name: "Chặng 2 · Nghe chiêng",
      line: "Cậu Lồng chỉ tiếng chiêng rộn ràng!"
    },
    {
      id: "keep",
      name: "Chặng 3 · Giữ gìn",
      line: "Chị Cò nhắc mình trân trọng di sản."
    },
  ],
  _ttsPerfect: "Hoàn hảo! Bé là chuyên gia nhỏ về Cồng chiêng Tây Nguyên!",
  _ttsGood: "Xuất sắc! Bé đã hiểu rất nhiều về Cồng chiêng.",
  _ttsOk: "Tốt lắm! Chơi lại để nghe tiếng chiêng thêm nhé!",
  _ttsLow: "Bé đã cố gắng rồi! Chơi lại để yêu quý Cồng chiêng thêm nhé!",
  resultMessages(correct, total) {
    const ratio = correct / total;
    if (ratio === 1) return "Hoàn hảo! Bé là chuyên gia nhỏ về Cồng chiêng Tây Nguyên!";
    if (ratio >= 0.7) return "Xuất sắc! Bé đã hiểu rất nhiều về Cồng chiêng.";
    if (ratio >= 0.4) return "Tốt lắm! Chơi lại để nghe tiếng chiêng thêm nhé!";
    return "Bé đã cố gắng rồi! Chơi lại để yêu quý Cồng chiêng thêm nhé!";
  },
  questions: [
    {
      stage: "gate",
      speaker: "sen",
      question: "Không gian văn hóa Cồng chiêng thuộc vùng nào của Việt Nam?",
      options: [
        { key: "A", label: "Đồng bằng Bắc Bộ" },
        { key: "B", label: "Tây Nguyên" },
      ],
      answer: "B",
      explain: "Cồng chiêng thuộc vùng Tây Nguyên."
    },
    {
      stage: "gate",
      speaker: "sen",
      question: "Cồng chiêng là loại nhạc cụ gì?",
      options: [
        { key: "A", label: "Nhạc cụ bằng đồng" },
        { key: "B", label: "Nhạc cụ dây" },
      ],
      answer: "A",
      explain: "Cồng chiêng là nhạc cụ bằng đồng."
    },
    {
      stage: "gate",
      speaker: "sen",
      question: "Cồng chiêng thường được sử dụng trong những dịp nào?",
      options: [
        { key: "A", label: "Chỉ dùng để trang trí" },
        { key: "B", label: "Lễ hội, sinh hoạt cộng đồng" },
      ],
      answer: "B",
      explain: "Cồng chiêng dùng trong lễ hội và sinh hoạt cộng đồng."
    },
    {
      stage: "gate",
      speaker: "sen",
      question: "Khi cồng chiêng vang lên, chúng ta thường nghe thấy âm thanh như thế nào?",
      options: [
        { key: "A", label: "Âm thanh vang ngân, rộn ràng" },
        { key: "B", label: "Âm thanh trong trẻo của tiếng chim" },
      ],
      answer: "A",
      explain: "Tiếng cồng chiêng vang ngân, rộn ràng."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Ai thường biểu diễn cồng chiêng trong các lễ hội Tây Nguyên?",
      options: [
        { key: "A", label: "Chỉ có khách du lịch" },
        { key: "B", label: "Người dân trong cộng đồng" },
      ],
      answer: "B",
      explain: "Người dân trong cộng đồng biểu diễn cồng chiêng."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Cồng chiêng có ý nghĩa gì đối với người dân Tây Nguyên?",
      options: [
        { key: "A", label: "Gắn bó với đời sống và văn hóa cộng đồng" },
        { key: "B", label: "Chỉ là đồ chơi" },
      ],
      answer: "A",
      explain: "Cồng chiêng gắn bó với đời sống và văn hóa cộng đồng."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Không gian văn hóa Cồng chiêng Tây Nguyên được UNESCO ghi danh năm nào?",
      say: "Không gian văn hóa Cồng chiêng Tây Nguyên được ghi danh năm nào?",
      options: [
        { key: "A", label: "Năm 2017", say: "năm hai nghìn mười bảy" },
        { key: "B", label: "Năm 2005", say: "năm hai nghìn không trăm linh năm" },
      ],
      answer: "B",
      explain: "Năm hai nghìn không trăm linh năm, Cồng chiêng được ghi danh."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Khi xem biểu diễn cồng chiêng, bé nên làm gì?",
      options: [
        { key: "A", label: "Lắng nghe, quan sát và cổ vũ" },
        { key: "B", label: "Chạy nhảy làm ồn" },
      ],
      answer: "A",
      explain: "Mình lắng nghe, quan sát và cổ vũ."
    },
    {
      stage: "keep",
      speaker: "co",
      question: "Vì sao chúng mình cần yêu quý văn hóa Cồng chiêng Tây Nguyên?",
      options: [
        { key: "A", label: "Vì đây chỉ là trò chơi thông thường" },
        { key: "B", label: "Vì đây là di sản văn hóa quý báu của dân tộc" },
      ],
      answer: "B",
      explain: "Vì đây là di sản văn hóa quý báu của dân tộc."
    },
    {
      stage: "keep",
      speaker: "co",
      question: "Bé có thể làm gì để góp phần giữ gìn văn hóa Cồng chiêng?",
      options: [
        { key: "A", label: "Cùng cô tìm hiểu, nghe nhạc và trân trọng văn hóa Tây Nguyên" },
        { key: "B", label: "Không tìm hiểu về cồng chiêng" },
      ],
      answer: "A",
      explain: "Mình cùng tìm hiểu, nghe nhạc và trân trọng văn hóa Tây Nguyên."
    },
  ]
};
