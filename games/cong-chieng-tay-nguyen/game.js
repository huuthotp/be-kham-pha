(() => {
  "use strict";
  window.createJourneyGame({
    data: window.CONG_CHIENG_CONTENT,
    audioVersion: 1,
    hubHref: "../../",
    beSenSrc: "../../assets/be-sen.png?v=2",
    root: document.getElementById("journey-root")
  });
})();
