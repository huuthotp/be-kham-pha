window.XOE_THAI_CONTENT = {
  brand: "Xòe Thái Tây Bắc",
  title: "Bé khám phá",
  subtitle: "Xòe Thái",
  tagline: "Mình đưa bé lên Tây Bắc xem điệu Xòe Thái. Mọi người nắm tay thành vòng xòe vui lắm. Bé chọn giúp mình nhé!",
  intro: "Chào bé! Mình là Bé Sen. Hôm nay mình xem Xòe Thái, nắm tay vòng xòe và chọn câu đúng nhé!",
  closing: "Bé đã khám phá Xòe Thái. Mình cùng yêu quý và giữ gìn điệu múa này nhé!",
  badge: "Vòng xòe vui",
  zoneArts: {
    gate: "assets/zone-gate.jpg?v=1"
  },
  stages: [
    {
      id: "gate",
      name: "Chặng 1 · Tây Bắc",
      line: "Lên Tây Bắc xem Xòe Thái!"
    },
    {
      id: "dance",
      name: "Chặng 2 · Vòng xòe",
      line: "Cậu Lồng chỉ mọi người nắm tay thành vòng!"
    },
    {
      id: "keep",
      name: "Chặng 3 · Giữ gìn",
      line: "Chị Cò nhắc mình trân trọng điệu múa."
    },
  ],
  _ttsPerfect: "Hoàn hảo! Bé là chuyên gia nhỏ về nghệ thuật Xòe Thái!",
  _ttsGood: "Xuất sắc! Bé đã hiểu rất nhiều về Xòe Thái.",
  _ttsOk: "Tốt lắm! Chơi lại để múa xòe trong lòng thêm nhé!",
  _ttsLow: "Bé đã cố gắng rồi! Chơi lại để yêu quý Xòe Thái thêm nhé!",
  resultMessages(correct, total) {
    const ratio = correct / total;
    if (ratio === 1) return "Hoàn hảo! Bé là chuyên gia nhỏ về nghệ thuật Xòe Thái!";
    if (ratio >= 0.7) return "Xuất sắc! Bé đã hiểu rất nhiều về Xòe Thái.";
    if (ratio >= 0.4) return "Tốt lắm! Chơi lại để múa xòe trong lòng thêm nhé!";
    return "Bé đã cố gắng rồi! Chơi lại để yêu quý Xòe Thái thêm nhé!";
  },
  questions: [
    {
      stage: "gate",
      speaker: "sen",
      question: "Xòe Thái là điệu múa truyền thống của dân tộc nào?",
      options: [
        { key: "A", label: "Dân tộc Thái" },
        { key: "B", label: "Dân tộc Chăm" },
      ],
      answer: "A",
      explain: "Xòe Thái là điệu múa của dân tộc Thái."
    },
    {
      stage: "gate",
      speaker: "sen",
      question: "Nghệ thuật Xòe Thái nổi tiếng ở vùng nào?",
      options: [
        { key: "A", label: "Tây Nam Bộ" },
        { key: "B", label: "Vùng Tây Bắc Việt Nam" },
      ],
      answer: "B",
      explain: "Xòe Thái nổi tiếng ở vùng Tây Bắc Việt Nam."
    },
    {
      stage: "gate",
      speaker: "sen",
      question: "Khi múa Xòe Thái, mọi người thường làm gì?",
      options: [
        { key: "A", label: "Ngồi yên một chỗ" },
        { key: "B", label: "Nắm tay nhau tạo thành vòng xòe" },
      ],
      answer: "B",
      explain: "Mọi người nắm tay nhau tạo thành vòng xòe."
    },
    {
      stage: "gate",
      speaker: "sen",
      question: "Điệu Xòe Thái thường được biểu diễn trong dịp nào?",
      options: [
        { key: "A", label: "Lễ hội và sinh hoạt cộng đồng" },
        { key: "B", label: "Chỉ trong giờ học" },
      ],
      answer: "A",
      explain: "Xòe Thái thường biểu diễn trong lễ hội và sinh hoạt cộng đồng."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Điệu Xòe Thái thể hiện điều gì?",
      options: [
        { key: "A", label: "Sự xa cách, không muốn chơi cùng nhau" },
        { key: "B", label: "Niềm vui, tình đoàn kết và sự gắn bó" },
      ],
      answer: "B",
      explain: "Xòe Thái thể hiện niềm vui, tình đoàn kết và sự gắn bó."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Khi tham gia vòng xòe, bé nên làm gì?",
      options: [
        { key: "A", label: "Nắm tay bạn, cùng múa vui vẻ" },
        { key: "B", label: "Đẩy bạn ra khỏi vòng" },
      ],
      answer: "A",
      explain: "Mình nắm tay bạn, cùng múa vui vẻ."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Trang phục truyền thống của người phụ nữ Thái thường có gì?",
      options: [
        { key: "A", label: "Áo tắm và mũ bơi" },
        { key: "B", label: "Áo cóm và khăn piêu" },
      ],
      answer: "B",
      explain: "Phụ nữ Thái thường có áo cóm và khăn piêu."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Nghệ thuật Xòe Thái được UNESCO ghi danh vào năm nào?",
      say: "Nghệ thuật Xòe Thái được ghi danh vào năm nào?",
      options: [
        { key: "A", label: "Năm 2021", say: "năm hai nghìn hai mươi mốt" },
        { key: "B", label: "Năm 2005", say: "năm hai nghìn không trăm linh năm" },
      ],
      answer: "A",
      explain: "Năm hai nghìn hai mươi mốt, Xòe Thái được ghi danh."
    },
    {
      stage: "keep",
      speaker: "co",
      question: "Vì sao chúng mình nên yêu quý điệu Xòe Thái?",
      options: [
        { key: "A", label: "Vì đây chỉ là một trò chơi bình thường" },
        { key: "B", label: "Vì đây là di sản văn hóa quý báu của dân tộc" },
      ],
      answer: "B",
      explain: "Vì đây là di sản văn hóa quý báu của dân tộc."
    },
    {
      stage: "keep",
      speaker: "co",
      question: "Bé làm gì để góp phần giữ gìn nghệ thuật Xòe Thái?",
      options: [
        { key: "A", label: "Tìm hiểu, xem biểu diễn và trân trọng văn hóa dân tộc" },
        { key: "B", label: "Không quan tâm đến điệu múa" },
      ],
      answer: "A",
      explain: "Mình tìm hiểu, xem biểu diễn và trân trọng văn hóa dân tộc."
    },
  ]
};
