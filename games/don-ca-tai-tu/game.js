(() => {
  "use strict";
  window.createJourneyGame({
    data: window.DON_CA_CONTENT,
    audioVersion: 1,
    hubHref: "../../",
    beSenSrc: "../../assets/be-sen.png?v=2",
    root: document.getElementById("journey-root")
  });
})();
