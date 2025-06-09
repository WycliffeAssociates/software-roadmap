import {gsap} from "gsap";
import {initToc} from "./animate";
import {CSSPlugin} from "gsap/CSSPlugin";
gsap.registerPlugin(CSSPlugin);
const tocButton = document.querySelector('[data-js="mobile-menu-toggle"]');

let listenersAttached = false;

export function initMobileMenu() {
  if (!tocButton) return;

  const toc = document.querySelector('[data-js="toc-mobile-wrapper"]');
  if (!toc) return;

  tocButton.addEventListener("click", () => {
    const isOpen = toc.classList.contains("open");
    const mobileTocClose = document.querySelector(
      '[data-js="mobile-toc-close"]'
    );
    const closeFxn = gsap.to(toc, {
      duration: 0.3,
      opacity: 0,
      display: "none",
      paused: true,
      onComplete: () => {
        gsap.set(document.body, {
          overflow: "auto",
        });
        toc.classList.remove("open");
      },
    });
    if (mobileTocClose) {
      mobileTocClose.addEventListener(
        "click",
        () => {
          closeFxn.play();
          closeFxn.seek(0);
        },
        {
          once: true,
        }
      );
    }

    let timeline = gsap.timeline({
      paused: true,
      // onComplete: () => { },
    });
    if (!isOpen) {
      timeline
        .set(toc, {
          opacity: 0,
          display: "block",
        })
        .set(document.body, {
          overflow: "hidden",
        });
    }
    if (!listenersAttached) {
      initToc(closeFxn);
      listenersAttached = true;
    }

    timeline
      .set(toc, {
        opacity: 0,
        display: "block",
      })
      .set(document.body, {
        overflow: "hidden",
      })
      .to(toc, {
        opacity: 1,
        duration: 0.3,
        onComplete: () => {},
      })
      .play();
  });
}
