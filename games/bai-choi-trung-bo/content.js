window.BAI_CHOI_CONTENT = {
  brand: "Bài chòi Trung Bộ",
  title: "Bé vui hội",
  subtitle: "Bài chòi",
  tagline: "Mình đưa bé vào hội Bài chòi miền Trung. Có anh Hiệu hô câu hát, có chòi xinh để ngồi chơi. Bé chọn giúp mình nhé!",
  intro: "Chào bé! Mình là Bé Sen. Hôm nay mình đi hội Bài chòi, nghe anh Hiệu hô bài và chọn câu đúng nhé!",
  closing: "Bé đã vui hội Bài chòi. Mình cùng yêu quý nghệ thuật dân gian miền Trung nhé!",
  badge: "Chiếc chòi xinh",
  zoneArts: {
    gate: "assets/zone-gate.jpg?v=1"
  },
  stages: [
    {
      id: "gate",
      name: "Chặng 1 · Vào hội",
      line: "Mở hội Bài chòi rồi!"
    },
    {
      id: "dance",
      name: "Chặng 2 · Nghe hô",
      line: "Cậu Lồng chỉ anh Hiệu hô câu hát!"
    },
    {
      id: "keep",
      name: "Chặng 3 · Giữ gìn",
      line: "Chị Cò nhắc mình nghe và yêu Bài chòi."
    },
  ],
  _ttsPerfect: "Hoàn hảo! Bé là chuyên gia nhỏ về Bài chòi Trung Bộ!",
  _ttsGood: "Xuất sắc! Bé đã hiểu rất nhiều về Bài chòi.",
  _ttsOk: "Tốt lắm! Chơi lại để vui hội Bài chòi thêm nhé!",
  _ttsLow: "Bé đã cố gắng rồi! Chơi lại để nghe anh Hiệu hô bài thêm nhé!",
  resultMessages(correct, total) {
    const ratio = correct / total;
    if (ratio === 1) return "Hoàn hảo! Bé là chuyên gia nhỏ về Bài chòi Trung Bộ!";
    if (ratio >= 0.7) return "Xuất sắc! Bé đã hiểu rất nhiều về Bài chòi.";
    if (ratio >= 0.4) return "Tốt lắm! Chơi lại để vui hội Bài chòi thêm nhé!";
    return "Bé đã cố gắng rồi! Chơi lại để nghe anh Hiệu hô bài thêm nhé!";
  },
  questions: [
    {
      stage: "gate",
      speaker: "sen",
      question: "Bài chòi là nghệ thuật dân gian của vùng nào?",
      options: [
        { key: "A", label: "Miền núi phía Bắc" },
        { key: "B", label: "Miền Trung" },
      ],
      answer: "B",
      explain: "Bài chòi là nghệ thuật dân gian miền Trung."
    },
    {
      stage: "gate",
      speaker: "sen",
      question: "Bài chòi thường có những hoạt động nào?",
      options: [
        { key: "A", label: "Hát, chơi bài và diễn xướng" },
        { key: "B", label: "Chỉ đọc sách" },
      ],
      answer: "A",
      explain: "Bài chòi có hát, chơi bài và diễn xướng."
    },
    {
      stage: "gate",
      speaker: "sen",
      question: "Người dẫn dắt trò chơi Bài chòi thường được gọi là gì?",
      options: [
        { key: "A", label: "Người bán hàng" },
        { key: "B", label: "Anh Hiệu hoặc chị Hiệu" },
      ],
      answer: "B",
      explain: "Người dẫn dắt gọi là anh Hiệu hoặc chị Hiệu."
    },
    {
      stage: "gate",
      speaker: "sen",
      question: "Anh Hiệu làm gì trong hội Bài chòi?",
      options: [
        { key: "A", label: "Hô câu hát gợi tên con bài" },
        { key: "B", label: "Ngủ trong chòi" },
      ],
      answer: "A",
      explain: "Anh Hiệu hô câu hát gợi tên con bài."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Người chơi Bài chòi thường ngồi ở đâu?",
      options: [
        { key: "A", label: "Trên thuyền" },
        { key: "B", label: "Trong những chiếc chòi" },
      ],
      answer: "B",
      explain: "Người chơi ngồi trong những chiếc chòi."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Bài chòi thường kết hợp với loại hình nghệ thuật nào?",
      options: [
        { key: "A", label: "Âm nhạc, thơ ca và diễn xuất" },
        { key: "B", label: "Chỉ có múa" },
      ],
      answer: "A",
      explain: "Bài chòi kết hợp âm nhạc, thơ ca và diễn xuất."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Hội Bài chòi thường được tổ chức vào dịp nào?",
      options: [
        { key: "A", label: "Chỉ vào ngày khai giảng" },
        { key: "B", label: "Dịp Tết và lễ hội" },
      ],
      answer: "B",
      explain: "Hội Bài chòi thường vào dịp Tết và lễ hội."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Bài chòi Trung Bộ được UNESCO ghi danh năm nào?",
      say: "Bài chòi Trung Bộ được ghi danh năm nào?",
      options: [
        { key: "A", label: "Năm 2017", say: "năm hai nghìn mười bảy" },
        { key: "B", label: "Năm 2003", say: "năm hai nghìn không trăm linh ba" },
      ],
      answer: "A",
      explain: "Năm hai nghìn mười bảy, Bài chòi được ghi danh."
    },
    {
      stage: "keep",
      speaker: "co",
      question: "Khi xem biểu diễn Bài chòi, bé nên làm gì?",
      options: [
        { key: "A", label: "Nói chuyện thật to, làm ồn" },
        { key: "B", label: "Chú ý lắng nghe và cổ vũ" },
      ],
      answer: "B",
      explain: "Mình chú ý lắng nghe và cổ vũ."
    },
    {
      stage: "keep",
      speaker: "co",
      question: "Bé làm gì để góp phần giữ gìn nghệ thuật Bài chòi?",
      options: [
        { key: "A", label: "Cùng cô tìm hiểu, xem và yêu thích Bài chòi" },
        { key: "B", label: "Không quan tâm đến Bài chòi" },
      ],
      answer: "A",
      explain: "Mình cùng tìm hiểu, xem và yêu thích Bài chòi."
    },
  ]
};
