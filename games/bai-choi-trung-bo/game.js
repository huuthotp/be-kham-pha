(() => {
  "use strict";
  window.createJourneyGame({
    data: window.BAI_CHOI_CONTENT,
    audioVersion: 1,
    hubHref: "../../",
    beSenSrc: "../../assets/be-sen.png?v=2",
    root: document.getElementById("journey-root")
  });
})();
