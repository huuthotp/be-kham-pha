# Bé Khám Phá

Project mini game giáo dục cho trẻ mẫu giáo — **tách biệt** khỏi ECC.

## Thế giới

**Làng Xanh Vui** — ngôi làng nhỏ xinh, có đình cổ, cánh đồng, đèn lồng và những người bạn ngộ nghĩnh dẫn bé đi khám phá.

## Nhân vật chính

| Nhân vật | Vai trò | Tính cách |
|----------|---------|-----------|
| **Bé Sen** | MC / người dẫn | Vui vẻ, cổ vũ, nói chậm rõ |
| **Cậu Lồng** | Trợ lý ánh sáng | Tò mò, hay “bật sáng” ý hay |
| **Chị Cò** | Người dẫn đường | Nhẹ nhàng, chỉ đường, nhắc giữ gìn |

Chi tiết thiết kế: `docs/CHARACTERS.md`

## Cấu trúc

```
be-kham-pha/
  index.html          ← cổng vào (hub)
  shared/             ← theme, nhân vật dùng chung
  assets/
  games/
    dinh-lo-giang/       ← mini game Đúng/Sai
    cho-phien-hoa-xuan/  ← hành trình khám phá chợ phiên
  docs/
```

## Chạy local

Mở `index.html` bằng trình duyệt, hoặc:

```bash
npx --yes serve .
```

## Online (gửi phụ huynh)

**https://bekhampha.netlify.app**

Mini game Đình Lỗ Giáng: https://bekhampha.netlify.app/games/dinh-lo-giang/

> Miễn phí, hosting Netlify. Bản GitHub Pages cũ vẫn còn nhưng nên dùng link Netlify cho dễ gửi phụ huynh.
