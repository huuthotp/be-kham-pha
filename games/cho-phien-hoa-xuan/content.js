/* Nội dung game — sửa câu hỏi, đáp án, lời thoại tại file này. */
window.MARKET_CONTENT = {
  zones: [
    {
      id: "stalls",
      kicker: "Khu 1",
      emoji: "🛍️",
      name: "Gian hàng",
      blurb: "Cổng chợ phiên đây rồi. Bên trong có rất nhiều gian hàng!",
      preview: "gate",
      reward: "star"
    },
    {
      id: "food",
      kicker: "Khu 2",
      emoji: "🍜",
      name: "Món ngon quê mình",
      blurb: "Đi tiếp tới gian món ăn. Quê mình có nhiều món thơm ngon lắm!",
      preview: "kitchen",
      reward: "bag"
    },
    {
      id: "community",
      kicker: "Khu 3",
      emoji: "🤝",
      name: "Chợ vui, người vui",
      blurb: "Chợ không chỉ để mua bán. Mọi người còn gặp gỡ và chơi cùng nhau.",
      preview: "clean",
      reward: "heart"
    },
    {
      id: "manners",
      kicker: "Khu 4",
      emoji: "🌱",
      name: "Bé văn minh",
      blurb: "Đi cùng cô và các bạn. Giữ gìn chợ sạch, vui và an toàn nhé!",
      preview: "gather",
      reward: "sprout"
    }
  ],

  rewards: {
    star: { emoji: "⭐", name: "Ngôi sao khám phá", finish: "Khám phá chợ phiên" },
    bag: { emoji: "🛍️", name: "Huy hiệu Chợ phiên", finish: "Hiểu về chợ phiên" },
    heart: { emoji: "❤️", name: "Trái tim yêu quê hương", finish: "Yêu quê hương" },
    sprout: { emoji: "🌱", name: "Huy hiệu bé văn minh", finish: "Bé văn minh" }
  },

  stalls: [
    {
      id: "food",
      emoji: "🍜",
      label: "Món ăn",
      line: "Gian món ăn mở ra. Có bánh, chè và món quê thơm ngon!"
    },
    {
      id: "gift",
      emoji: "🎁",
      label: "Sản phẩm",
      line: "Gian sản phẩm mở ra. Có quà và sản vật quê hương!"
    },
    {
      id: "show",
      emoji: "🎪",
      label: "Hoạt động",
      line: "Gian hoạt động mở ra. Mọi người đang chơi và giao lưu!"
    }
  ],

  questions: [
    {
      id: 1,
      zone: "stalls",
      lookIdle: "gate",
      lookDone: "enter",
      bubble: "Bé đứng trước rất nhiều gian hàng.",
      question: "Các con nhìn xem! Đây là nơi có rất nhiều gian hàng. Theo con, đây là nơi nào?",
      options: [
        { emoji: "🎪", label: "Chợ phiên", correct: true },
        { emoji: "🏥", label: "Bệnh viện", correct: false }
      ],
      retry: "Mình thử lại nhé!",
      success: "Đúng rồi! Đây là chợ phiên!"
    },
    {
      id: 2,
      zone: "stalls",
      lookIdle: "enter",
      lookDone: "browse",
      bubble: "Nhìn mọi người trong chợ kìa!",
      question: "Khi tham gia Chợ phiên Làng trong phố, mọi người thường làm gì?",
      options: [
        { emoji: "🛍️", label: "Tham quan, mua sắm và giao lưu với nhau.", correct: true },
        { emoji: "📚", label: "Ngồi trong lớp học và làm bài.", correct: false }
      ],
      retry: "Bé suy nghĩ thêm một chút nhé!",
      success: "Đúng rồi! Mọi người đang tham quan, mua sắm và chào nhau."
    },
    {
      id: 3,
      zone: "stalls",
      lookIdle: "browse",
      lookDone: "goods",
      bubble: "Các gian hàng đang bày đồ đó.",
      question: "Tại các gian hàng của chợ phiên, các con có thể nhìn thấy những gì?",
      options: [
        { emoji: "🎁", label: "Các món ăn, sản phẩm và sản vật quê hương.", correct: true },
        { emoji: "📖", label: "Chỉ có sách vở và đồ dùng học tập.", correct: false }
      ],
      retry: "Mình thử lại nhé!",
      success: "Đúng rồi! Bé nhận được ngôi sao khám phá.",
      reward: "star"
    },
    {
      id: 4,
      zone: "food",
      lookIdle: "kitchen",
      lookDone: "feast",
      bubble: "Hương món ăn thơm quá!",
      question: "Khi đến chợ phiên, các con có thể được thưởng thức điều gì?",
      options: [
        { emoji: "🍜", label: "Những món ăn được giới thiệu tại các gian hàng.", correct: true },
        { emoji: "💊", label: "Những món đồ dùng trong bệnh viện.", correct: false }
      ],
      retry: "Bé suy nghĩ thêm một chút nhé!",
      success: "Ngon quá! Các món ăn hiện ra rồi."
    },
    {
      id: 5,
      zone: "food",
      lookIdle: "feast",
      lookDone: "lively",
      bubble: "Chợ đang đông vui.",
      question: "Vì sao Chợ phiên Làng trong phố lại có không khí vui vẻ và đông vui?",
      options: [
        { emoji: "👋", label: "Vì có nhiều người cùng tham quan, mua bán và giao lưu.", correct: true },
        { emoji: "😴", label: "Vì mọi người đến đây để ngủ và nghỉ ngơi.", correct: false }
      ],
      retry: "Mình thử lại nhé!",
      success: "Đúng rồi! Mọi người cùng vẫy tay chào nhau."
    },
    {
      id: 6,
      zone: "food",
      lookIdle: "lively",
      lookDone: "named",
      bubble: "Nhìn bảng tên của chợ xem!",
      question: "Nếu nhìn thấy nhiều gian hàng đang bày bán các sản phẩm khác nhau, con có thể đoán đây là nơi nào?",
      options: [
        { emoji: "🎪", label: "Chợ phiên.", correct: true },
        { emoji: "🏥", label: "Bệnh viện.", correct: false }
      ],
      retry: "Bé suy nghĩ thêm một chút nhé!",
      success: "Đúng rồi! Đây là Chợ phiên Làng trong phố.",
      reward: "bag"
    },
    {
      id: 7,
      zone: "community",
      lookIdle: "litter",
      lookDone: "litter",
      bubble: "Bạn nhỏ vừa ăn xong, tay còn mẩu giấy.",
      question: "Bạn nhỏ nên làm gì với mẩu rác này?",
      options: [
        { emoji: "🗑️", label: "Bỏ rác đúng nơi quy định.", correct: true },
        { emoji: "🚮", label: "Vứt rác xuống đường.", correct: false }
      ],
      retry: "Mình cùng bỏ rác vào thùng nhé!",
      prompt: "Kéo mẩu giấy vào thùng, hoặc chạm thùng rác nhé!",
      success: "Giỏi quá! Bé đã giúp chợ phiên sạch đẹp!",
      act: "trash"
    },
    {
      id: 8,
      zone: "community",
      lookIdle: "clean",
      lookDone: "hometown",
      bubble: "Quê mình có nhiều điều hay.",
      question: "Những sản phẩm và hoạt động tại Chợ phiên Làng trong phố giúp các con hiểu thêm điều gì?",
      options: [
        { emoji: "🏡", label: "Hiểu thêm về quê hương và cuộc sống của mọi người.", correct: true },
        { emoji: "✈️", label: "Học cách điều khiển máy bay.", correct: false }
      ],
      retry: "Mình thử lại nhé!",
      success: "Đúng rồi! Bé hiểu thêm về quê hương Hòa Xuân."
    },
    {
      id: 9,
      zone: "community",
      lookIdle: "hometown",
      lookDone: "pick",
      bubble: "Bé muốn xem thêm gian hàng nào?",
      question: "Nếu được đến Chợ phiên Làng trong phố, con muốn khám phá điều gì?",
      options: [
        { emoji: "🍜", label: "Các món ăn, sản phẩm và những hoạt động ở chợ phiên.", correct: true },
        { emoji: "🏫", label: "Các phòng học và bàn ghế trong trường.", correct: false }
      ],
      retry: "Bé suy nghĩ thêm một chút nhé!",
      prompt: "Con muốn khám phá gian hàng nào?",
      success: "Bé nhận được trái tim yêu quê hương.",
      act: "stalls",
      reward: "heart"
    },
    {
      id: 10,
      zone: "manners",
      lookIdle: "gather",
      lookDone: "together",
      bubble: "Mọi người đang tụ họp.",
      question: "Chợ phiên Làng trong phố không chỉ có hoạt động mua bán mà còn là nơi mọi người cùng làm gì?",
      options: [
        { emoji: "🤝", label: "Giao lưu, tham quan và tham gia các hoạt động cộng đồng.", correct: true },
        { emoji: "😶", label: "Chỉ ngồi một mình và không trò chuyện với nhau.", correct: false }
      ],
      retry: "Mình thử lại nhé!",
      success: "Đúng rồi! Mọi người cùng vỗ tay và vẫy tay."
    },
    {
      id: 11,
      zone: "manners",
      lookIdle: "stray",
      lookDone: "safe",
      bubble: "Một bạn thấy gian hàng hay và định chạy xa cô.",
      question: "Khi đến chợ phiên cùng cô và các bạn, con nên làm gì?",
      options: [
        { emoji: "👩‍🏫", label: "Đi cùng cô, quan sát và giữ gìn trật tự.", correct: true },
        { emoji: "🏃", label: "Tự ý chạy đi xa khỏi cô và các bạn.", correct: false }
      ],
      retry: "Bé nhớ đi cùng cô và các bạn để luôn an toàn nhé!",
      success: "Đúng rồi! Đi cùng cô sẽ an toàn hơn."
    },
    {
      id: 12,
      zone: "manners",
      lookIdle: "panorama",
      lookDone: "panorama",
      bubble: "Nhìn toàn cảnh chợ phiên nào!",
      question: "Chợ phiên Làng trong phố giúp các con cảm nhận điều gì về quê hương Hòa Xuân?",
      options: [
        { emoji: "🌸", label: "Quê hương có nhiều nét đẹp và hoạt động cộng đồng gần gũi.", correct: true },
        { emoji: "🏢", label: "Quê hương chỉ có những tòa nhà và đường phố.", correct: false }
      ],
      retry: "Bé suy nghĩ thêm một chút nhé!",
      success: "Đúng rồi! Hòa Xuân có nhiều nét đẹp rất gần gũi.",
      reward: "sprout",
      nextLabel: "Nhận huy hiệu"
    }
  ]
};
