# Journey engine

Hành trình có hướng dẫn (guided path): bé đi qua từng khu / trạm, mỗi trạm một câu hỏi A/B/C.

## Dùng

```html
<link rel="stylesheet" href="../../shared/journey-engine/journey.css" />
<script src="content.js"></script>
<script src="audio-manifest.js"></script>
<script src="../../shared/journey-engine/journey.js"></script>
<script src="game.js"></script>
```

```js
window.createJourneyGame({
  data: window.XOAN_CONTENT,
  audioVersion: 1,
  hubHref: "../../",
  beSenSrc: "../../assets/be-sen.png?v=2",
  root: document.getElementById("journey-root")
});
```

## content.js cần có

- `brand`, `title`, `subtitle`, `tagline`, `intro`, `badge`
- `stages[]` với `id`, `name`
- `questions[]` với `stage`, `speaker` (`sen`|`long`|`co`), `options`, `answer`, `explain`
- tùy chọn `zoneArts: { [stageId]: "assets/....jpg" }`
- tùy chọn `resultMessages(correct, total)`

Không backport game 1–2 vào engine này cho đến khi game 3 được duyệt ổn.
