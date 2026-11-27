window.XOAN_CONTENT = {
  brand: "Hát Xoan Phú Thọ",
  title: "Bé về miền",
  subtitle: "Đất Tổ",
  tagline:
    "Mình đưa bé về Phú Thọ, thăm đất Tổ và nghe Hát Xoan. Mỗi khu một câu hỏi, bé chọn giúp mình nhé!",
  intro:
    "Chào bé! Mình là Bé Sen. Hôm nay mình về miền đất Tổ, đi từ đình làng tới sân hội nghe Hát Xoan nhé!",
  closing:
    "Bé đã về miền đất Tổ nghe Hát Xoan. Mình cùng nhớ và yêu quý làn điệu này nhé!",
  badge: "Trống Xoan",
  zoneArts: {
    gate: "assets/zone-dinh.jpg?v=2",
    dance: "assets/zone-san-hoi.jpg?v=1",
    keep: "assets/zone-giu-gin.jpg?v=2"
  },
  stages: [
    {
      id: "gate",
      name: "Chặng 1 · Đình làng",
      line: "Tới đình làng đất Tổ. Mình biết Hát Xoan là gì nhé!"
    },
    {
      id: "dance",
      name: "Chặng 2 · Sân hội",
      line: "Cậu Lồng dẫn ra sân hội xem hát, múa và trống phách!"
    },
    {
      id: "keep",
      name: "Chặng 3 · Giữ gìn",
      line: "Chị Cò nhắc mình yêu quý và giữ gìn Hát Xoan nhé."
    }
  ],
  resultMessages(correct, total) {
    const ratio = correct / total;
    if (ratio === 1) return "Hoàn hảo! Bé là chuyên gia nhỏ về Hát Xoan Phú Thọ!";
    if (ratio >= 0.7) return "Xuất sắc! Bé đã hiểu rất nhiều về Hát Xoan.";
    if (ratio >= 0.4) return "Tốt lắm! Chơi lại để đi thêm vài khu nữa nhé!";
    return "Bé đã cố gắng rồi! Chơi lại để về đất Tổ thêm nhé!";
  },
  questions: [
    {
      stage: "gate",
      speaker: "sen",
      question: "Hát Xoan là làn điệu dân ca nổi tiếng của tỉnh nào?",
      options: [
        { key: "A", label: "Quảng Nam" },
        { key: "B", label: "Phú Thọ" },
        { key: "C", label: "Cần Thơ" }
      ],
      answer: "B",
      explain: "Hát Xoan nổi tiếng ở tỉnh Phú Thọ."
    },
    {
      stage: "gate",
      speaker: "sen",
      question: "Hát Xoan thường được biểu diễn vào dịp nào?",
      options: [
        { key: "A", label: "Mùa hè" },
        { key: "B", label: "Mùa đông" },
        { key: "C", label: "Mùa xuân" }
      ],
      answer: "C",
      explain: "Hát Xoan thường biểu diễn vào mùa xuân."
    },
    {
      stage: "gate",
      speaker: "sen",
      question: "Hát Xoan còn được gọi là gì?",
      options: [
        { key: "A", label: "Hát cửa đình" },
        { key: "B", label: "Hát ru em" },
        { key: "C", label: "Hát đồng dao" }
      ],
      answer: "A",
      explain: "Hát Xoan còn được gọi là hát cửa đình."
    },
    {
      stage: "gate",
      speaker: "sen",
      question: "Hát Xoan thường gắn với tín ngưỡng thờ ai?",
      options: [
        { key: "A", label: "Các vị vua nước ngoài" },
        { key: "B", label: "Các nhân vật trong truyện cổ tích" },
        { key: "C", label: "Các Vua Hùng" }
      ],
      answer: "C",
      explain: "Hát Xoan gắn với tín ngưỡng thờ các Vua Hùng."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Khi biểu diễn Hát Xoan, các nghệ nhân thường kết hợp những gì?",
      options: [
        { key: "A", label: "Chỉ nói chuyện" },
        { key: "B", label: "Hát, múa và nhạc cụ" },
        { key: "C", label: "Chỉ đánh trống" }
      ],
      answer: "B",
      explain: "Nghệ nhân kết hợp hát, múa và nhạc cụ."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Nhạc cụ nào thường được sử dụng trong Hát Xoan?",
      options: [
        { key: "A", label: "Trống và phách" },
        { key: "B", label: "Đàn piano" },
        { key: "C", label: "Đàn guitar điện" }
      ],
      answer: "A",
      explain: "Trong Hát Xoan thường có trống và phách."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Những người cùng học và biểu diễn Hát Xoan trong một nhóm truyền thống được gọi là gì?",
      options: [
        { key: "A", label: "Đội bóng" },
        { key: "B", label: "Đoàn xiếc" },
        { key: "C", label: "Phường Xoan" }
      ],
      answer: "C",
      explain: "Nhóm truyền thống đó gọi là Phường Xoan."
    },
    {
      stage: "dance",
      speaker: "long",
      question: "Hát Xoan thường được biểu diễn ở đâu?",
      options: [
        { key: "A", label: "Trong siêu thị" },
        { key: "B", label: "Đình làng, miếu hoặc không gian lễ hội truyền thống" },
        { key: "C", label: "Trong sân vận động bóng đá" }
      ],
      answer: "B",
      explain: "Hát Xoan thường ở đình làng, miếu hoặc lễ hội truyền thống."
    },
    {
      stage: "keep",
      speaker: "co",
      question: "Hát Xoan Phú Thọ được UNESCO ghi danh lần đầu vào năm nào?",
      say: "Hát Xoan Phú Thọ được ghi danh lần đầu vào năm nào?",
      options: [
        { key: "A", label: "Năm 2000", say: "năm hai nghìn" },
        { key: "B", label: "Năm 2020", say: "năm hai nghìn hai mươi" },
        { key: "C", label: "Năm 2011", say: "năm hai nghìn không trăm mười một" }
      ],
      answer: "C",
      explain: "Năm hai nghìn không trăm mười một, Hát Xoan được ghi danh."
    },
    {
      stage: "keep",
      speaker: "co",
      question: "Bé nên làm gì để góp phần giữ gìn Hát Xoan?",
      options: [
        { key: "A", label: "Không quan tâm đến dân ca" },
        { key: "B", label: "Tìm hiểu, lắng nghe và yêu quý làn điệu Hát Xoan" },
        { key: "C", label: "Chê bai những bài hát truyền thống" }
      ],
      answer: "B",
      explain: "Mình tìm hiểu, lắng nghe và yêu quý làn điệu Hát Xoan."
    }
  ]
};
