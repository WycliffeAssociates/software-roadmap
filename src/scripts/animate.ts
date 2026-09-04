import {gsap} from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {DrawSVGPlugin} from "gsap/DrawSVGPlugin";
import {CSSPlugin} from "gsap/CSSPlugin";
import {Flip} from "gsap/Flip";
// import {content, type ToolType} from "./content";
import {GSDevTools} from "gsap/GSDevTools";
import {ScrollToPlugin} from "gsap/ScrollToPlugin";
import {content, type ToolType} from "@src/content";
import {initProceduralRoad} from "./road";

gsap.registerPlugin(
  ScrollTrigger,
  DrawSVGPlugin,
  CSSPlugin,
  Flip,
  GSDevTools,
  ScrollToPlugin
);
window.gsap = gsap; // for devtools
// opt in to non intrusive js thread scroll jacking
// ScrollTrigger.normalizeScroll(true);
// We handle resize ourselves (see handleResize below) so our own pixel-based
// layout stays in sync with the pin-spacer sizes GSAP recalculates on refresh.
ScrollTrigger.config({autoRefreshEvents: "visibilitychange,DOMContentLoaded,load"});

// global state:
let globalSectionStarts: {
  [key: number]: number;
} | null = null;
let globalCalcSvgRoadHeight = 0;
let globalInfraEllipse: SVGEllipseElement | null | undefined = null;
const noTranslation = {
  translateX: 0,
  translateY: 0,
} as const;
const sections = dataJsQuerySelector(
  "section",
  true
) as NodeListOf<HTMLElement>;
let globalLastUpdateTime = 0;
const UPDATE_THROTTLE_MS = 33; // ~30fps
let globalRoadSvgEl = dataJsQuerySelector("road-svg") as SVGSVGElement;
const heroMaskPath = dataJsQuerySelector("heroMaskPath") as SVGSVGElement;
const sectionBgs = dataJsQuerySelector(
  "section-bg",
  true
) as NodeListOf<HTMLElement>;
const roadPath = dataJsQuerySelector("roadPath") as SVGPathElement;
const allRoadmapSections = dataJsQuerySelector(
  "section",
  true
) as NodeListOf<HTMLElement>;
const lvhCheckEl = document.querySelector(".lvhCheck") as HTMLElement;
const lvhHeight = lvhCheckEl.getBoundingClientRect().height;
let windowInnerHeight = lvhHeight;
const roadController = initProceduralRoad({
  window: document.querySelector(".road-svg-window") as HTMLElement,
  svg: globalRoadSvgEl,
  maskRect: dataJsQuerySelector("maskRect") as SVGRectElement,
  roadPath,
});
let globalCurrentTocItemsHighlighted: {
  sectionIdx: number;
  stepIdx: number;
  els: {
    section: HTMLElement | null;
    step: HTMLElement | null;
  };
} = {sectionIdx: -1, stepIdx: -1, els: {section: null, step: null}};

const getSectionHeightMultiplier = () => {
  const hasMouseOrPointer = !ScrollTrigger.isTouch;
  if (window.innerWidth > 1024) {
    return hasMouseOrPointer ? 1 : 0.7; //long touch sections are a little weird;
  } else if (window.innerWidth > 768) {
    return hasMouseOrPointer ? 0.6 : 0.4;
  } else {
    return hasMouseOrPointer ? 0.3 : 0.2;
  }
};
const getSectionEndPx = (steps: number) => {
  const multiplier = getSectionHeightMultiplier();
  const pxVal = steps * windowInnerHeight * multiplier;
  return pxVal;
};

// Describes, in page pixels, where each section pins and releases. road.ts
// turns this into one viewport of road per section — see the comment there for
// why the road's clock is not the page's clock.
function computeRoadLayout(sectionStarts: {[key: number]: number}) {
  const roadSections = [];
  // The last section is Infrastructure, which has no steps and no road.
  for (let index = 0; index < sections.length - 1; index++) {
    const steps = parseInt(sections[index].dataset.steps || "1", 10);
    const pinStart = sectionStarts[index];
    roadSections.push({
      pinStart,
      // Matches the ScrollTrigger `end` for this section's pin.
      pinEnd: pinStart + getSectionEndPx(steps),
      gapEnd: sectionStarts[index + 1],
      steps,
    });
  }
  return {
    roadStartY: sectionStarts[0],
    viewportPx: windowInnerHeight,
    sections: roadSections,
  };
}

function initAllAnimations() {
  const {sectionStarts, svgRoadHeight} = initialJsGsapSets();
  globalSectionStarts = sectionStarts;
  globalCalcSvgRoadHeight = svgRoadHeight;
  roadController.setLayout(computeRoadLayout(sectionStarts));
  const infraEllipse = drawEllipseAroundInfra();
  globalInfraEllipse = infraEllipse;

  //
  initToc();
  smoothScrollGetStarted();
  initHeroRoad();
  ScrollTriggerSections();
  window.addEventListener("resize", handleResize);
}

// Moving the window between screens of different sizes (e.g. unplugging an
// external monitor) fires a resize mid-scroll. Our section backgrounds and
// road-svg height/viewBox are plain inline pixel styles computed from the old
// viewport size, so without this they go stale: the pin-spacers GSAP resizes
// on refresh no longer line up with the scroll position the page is sitting
// at, and the pinned section (and the road's draw progress) appears to go
// blank. Recompute the layout for the new size, restore scroll to the
// equivalent step, then refresh.
let resizeTimeout: ReturnType<typeof setTimeout>;
function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const {sectionIdx, stepIdx} = globalCurrentTocItemsHighlighted;

    windowInnerHeight = lvhCheckEl.getBoundingClientRect().height;
    const {sectionStarts, svgRoadHeight} = recalcSectionLayout();
    globalSectionStarts = sectionStarts;
    globalCalcSvgRoadHeight = svgRoadHeight;
    roadController.setLayout(computeRoadLayout(sectionStarts));

    if (sectionIdx >= 0 && globalSectionStarts) {
      const sectionY = globalSectionStarts[sectionIdx];
      const stepYPx = getSectionHeightMultiplier() * windowInnerHeight * Math.max(stepIdx - 1, 0);
      window.scrollTo(0, sectionY + stepYPx);
    }

    ScrollTrigger.refresh();
  }, 200);
}

export function initToc(tween?: gsap.core.Tween) {
  if (!globalSectionStarts || (window.innerWidth < 1200 && !tween)) return;
  const topLevelTocLi = tween
    ? document.querySelectorAll(".mobile-menu-wrapper .toc li")
    : document.querySelectorAll(".roadMap-info .toc li");
  if (!allRoadmapSections || !topLevelTocLi || !globalSectionStarts) return;

  topLevelTocLi.forEach((li, topIdx) => {
    const subLinks = li.querySelectorAll("ol button");
    const topLink = li.querySelector("a") as HTMLAnchorElement;
    topLink.addEventListener("click", (e) => {
      if (!globalSectionStarts) return;
      const sectionParent = allRoadmapSections[topIdx] as HTMLElement;
      if (!sectionParent) return;

      gsap.to(window, {
        scrollTo: `#section${topIdx + 1}`,
        onComplete: () => {
          // If tween is provided, play it

          if (tween) {
            tween.play();
            tween.seek(0); // reset to start
          }
        },
      });
    });
    subLinks.forEach((subLink, subIdx) => {
      subLink.addEventListener("click", () => {
        if (!globalSectionStarts) return;
        const sectionParent = allRoadmapSections[topIdx] as HTMLElement;
        if (!sectionParent) return;
        const sectionY = globalSectionStarts[topIdx]; //a vh value:
        const mult = getSectionHeightMultiplier();
        const vhSection = mult * windowInnerHeight;
        const stepYPx = vhSection * subIdx;
        const totalY = sectionY + stepYPx;
        const asPx = totalY;
        const hero = dataJsQuerySelector("hero") as HTMLElement;
        // todo: debug
        gsap.to(window, {
          scrollTo: `${asPx + 20}`, //little bit of extra padding into step. I don't know why this is the amoutn needed though
          duration: 0.2,
          onComplete: () => {
            // If tween is provided, play it
            if (tween) {
              tween.play();
              tween.seek(0); // reset to start
            }
          },
        });
      });
    });
  });
}

function initHeroRoad() {
  gsap.set(heroMaskPath, {
    drawSVG: "0%",
  });
  ScrollTrigger.create({
    trigger: "[data-js='hero']",
    start: "1%",
    markers: import.meta.env.DEV,
    onEnter: () => {
      gsap.to(heroMaskPath, {
        drawSVG: "100%",
        duration: 1,
        ease: "power1.inOut",
      });
    },
  });
}

function initialJsGsapSets() {
  gsap.set(dataJs("step-header"), {
    autoAlpha: "0",
    translateY: "-20px",
  });
  gsap.set(dataJs("step-description"), {
    autoAlpha: "0",
    translateX: "-20px",
  });
  gsap.set(dataJs("step-tool"), {autoAlpha: 0, translateX: "10px"});
  gsap.set(dataJs("specialCopy"), {
    autoAlpha: "0",
    translateY: "-20px",
  });

  return recalcSectionLayout();
}

// Pixel-based layout (section backgrounds + road svg height/viewBox) baked
// from the current viewport size. Re-run on resize, since these are plain
// inline styles that don't update on their own the way CSS vh units would.
function recalcSectionLayout() {
  const hero = dataJsQuerySelector("hero") as HTMLElement;
  const heroHeight = hero.getBoundingClientRect().height;

  let totalTop = 0;
  let sectionStarts: {[key: number]: number} = {};
  sectionBgs.forEach((sectionBg, idx) => {
    sectionBg.style.top = `${totalTop}px`;
    const steps = sectionBg.dataset.steps;
    if (!steps) return;
    const height = getSectionEndPx(parseInt(steps)) + windowInnerHeight;
    sectionBg.style.height = height + "px";
    sectionStarts[idx] = totalTop + heroHeight + 1;
    totalTop += height;
  });
  // road-svg's own height/viewBox is owned by road.ts (see computeRoadLayout /
  // roadController.setLayout), not set here.
  let heightTilLastSection = sectionStarts[sectionBgs.length - 1];

  return {sectionStarts, svgRoadHeight: heightTilLastSection};
}

function ScrollTriggerSections() {
  sections.forEach((section, index) => {
    const steps = parseInt(section.dataset.steps || "1");
    // closure state
    const header = section.querySelector(".step-header") as HTMLElement;
    let trackedStep = 1;

    const end = `${steps * getSectionHeightMultiplier() * 100}%`;
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end, // Each step adds 100vh to the scroll length for this section
      pin: true,
      fastScrollEnd: true,
      invalidateOnRefresh: true,
      preventOverlaps: true,
      markers: import.meta.env.DEV,
      onUpdate: (self) => {
        // throttle
        const now = Date.now();
        if (now - globalLastUpdateTime < UPDATE_THROTTLE_MS) {
          return;
        }
        globalLastUpdateTime = now;

        // noop the last section — no steps/road here (see computeRoadLayout)
        if (index == sections.length - 1) {
          return;
        }

        // Update the section header text to show current step. The road
        // itself (reveal + dots + camera) is driven independently off real
        // scroll position — see road.ts.
        const currentStep = Math.min(
          steps,
          Math.floor(self.progress * steps) + 1
        );
        updateCurrentTocHighlighted(index, currentStep);
        if (header && trackedStep !== currentStep) {
          const step = content[index]!.steps[currentStep];
          trackedStep = currentStep;
          // Batch DOM updates
          updateTitle(section, step.title, step.description);
          updateTools(section, step.tools);
        }
      },
      onLeaveBack: () => {
        if (index == 0) {
          // The road is not pinned or repositioned here — it's a static
          // document element that scrolls with the page (see road.ts).
          gsap.set(".roadMap-info", {
            position: "absolute",
            top: "16px",
          });
          gsap.set(".mobile-menu-wrapper", {
            position: "absolute",
            top: "4px",
            right: "4px",
          });
        }
      },
      onEnter: () => {
        if (index == 0) {
          gsap.set(".roadMap-info", {
            top: "16px",
            position: "fixed",
          });
          if (window.innerWidth < 1200) {
            gsap.set(".mobile-menu-wrapper", {
              position: "fixed",
              top: "4px",
              right: "4px",
            });
          }
        }
        if (index == sections.length - 1 && globalInfraEllipse) {
          gsap.to(globalInfraEllipse, {
            drawSVG: "100%",
            duration: 1,
            ease: "power1.inOut",
          });
        }

        const dataContrast = section.getAttribute("data-contrast");
        if (dataContrast) {
          // set it as root variable
          document.documentElement.style.setProperty(
            "--global-data-contrast",
            dataContrast
          );
          let dTl = gsap.timeline();
          dTl.to(roadPath, {
            stroke: dataContrast,
            duration: 0.5,
          });
          const drawnDots = roadController.getDots();
          if (drawnDots.length) {
            dTl.to(
              drawnDots,
              {
                stroke: dataContrast,
                duration: 0.5,
                onComplete: () => {
                  document.documentElement.style.setProperty(
                    "--circle-stroke",
                    dataContrast
                  );
                },
              },
              "<"
            );
          }
        }

        updateCurrentTocHighlighted(index, 0);
        sectionEntranceAnimations(section);
      },
      onEnterBack: () => {
        const dataContrast = section.getAttribute("data-contrast");
        if (dataContrast) {
          document.documentElement.style.setProperty(
            "--global-data-contrast",
            dataContrast
          );
          gsap
            .timeline()
            .to(roadPath, {
              stroke: dataContrast,
              duration: 0.5,
            })
            .to(
              roadController.getDots(),
              {
                stroke: dataContrast,
                duration: 0.5,
                onComplete: () => {
                  document.documentElement.style.setProperty(
                    "--circle-stroke",
                    dataContrast
                  );
                },
              },
              "<"
            );
        }
      },
    });
  });
}

export function updateTitle(
  sectionEl: HTMLElement,
  newText: string,
  newDesc: string
) {
  const textNode = sectionEl.querySelector(
    ".section-step-text-node"
  ) as HTMLElement;
  const descNode = sectionEl.querySelector(
    ".section-step-desc-node"
  ) as HTMLElement;

  if (!textNode || !descNode) return;
  const dur = 0.3;
  // gsap.to(textNode, {opacity: 0, duration: dur});

  descNode.innerHTML = newDesc;

  // opacity out, html, opacity in
  gsap
    .timeline()
    .to([textNode, descNode], {
      opacity: "0",
      duration: dur,
      // stagger: 0.1,
      onComplete: () => {
        textNode.innerHTML = newText;
        descNode.innerHTML = newDesc;
      },
    })
    .to([textNode, descNode], {
      opacity: "1",
      duration: dur,
    });
}

export function updateTools(sectionEl: HTMLElement, newTools: Array<ToolType>) {
  // flip from old tools to new tools:
  // For each new tools,
  const stepToolsContainer = sectionEl.querySelector(".step-tools");
  if (!stepToolsContainer) return;
  const currentTools = [
    ...sectionEl.querySelectorAll(".step-tool"),
  ] as Array<HTMLElement>;
  const {keep, remove} = currentTools.reduce(
    (acc: {keep: Array<HTMLElement>; remove: Array<HTMLElement>}, tool) => {
      const toolName = tool.getAttribute("data-tool-name");
      if (newTools.find((tool) => tool.dataName === toolName)) {
        acc.keep.push(tool);
      } else {
        acc.remove.push(tool);
      }
      return acc;
    },
    {keep: [], remove: []}
  );
  const initial = Flip.getState(stepToolsContainer);

  let tl = Flip.from(initial, {
    duration: 0.25,
    ease: "power2.out",
    absolute: true,
    paused: true,
    overwrite: true,
  });

  tl.to(
    remove,
    {
      opacity: "0",
      x: "10px",
      duration: 0.25,
      onComplete: () => {
        remove.forEach((tool) => {
          tool.remove();
        });
      },
    },
    ".2"
  );

  let newToolGroup: Array<HTMLElement> = [];
  newTools.forEach((tool) => {
    if (!keep.find((t) => t.getAttribute("data-tool-name") === tool.dataName)) {
      const newTool = getNewStepTool(
        tool.icon,
        tool.title,
        tool.dataName,
        tool.inProgress,
        tool.external
      );
      tl.set(newTool, {x: "20px", opacity: "0"}, "0");

      stepToolsContainer.appendChild(newTool);
      newToolGroup.push(newTool);
    }
  });
  if (newToolGroup.length) {
    tl.to(newToolGroup, {
      x: "0px",
      autoAlpha: 1,
      duration: 0.25,
    });
  }
  tl.play();
}

function getNewStepTool(
  icon: string | null | undefined,
  toolName: string,
  toolDataName: string,
  inProgress: boolean = false,
  external: boolean = false
) {
  const newLiTool = document.createElement("li");
  newLiTool.setAttribute("class", "step-tool");
  newLiTool.setAttribute("data-tool-name", toolDataName);
  newLiTool.setAttribute("data-js", "step-tool");
  newLiTool.innerHTML = `
    <div class="step-tool-inner ${inProgress ? "inProgress" : ""} ${
    external ? "external" : ""
  }">
  <span class="step-tool-icon">
                  ${icon || ""}
                </span>
                <span class="step-tool-text">${toolName}</span>
            </div>
  `;
  return newLiTool;
}

function sectionEntranceAnimations(sectionEl: HTMLElement) {
  const sectionDecoration = sectionEl.querySelector(".section-decorative");
  let sectionEnterTimeline = gsap.timeline({
    paused: true,
  });
  if (sectionDecoration) {
    sectionEnterTimeline.to(sectionDecoration, {
      autoAlpha: 1,
      ...noTranslation,
      duration: 0.3,
    });
  }

  const sectionTitle = sectionEl.querySelector(".section-title");
  if (sectionTitle) {
    sectionEnterTimeline.to(
      sectionTitle,
      {
        autoAlpha: 1,
        ...noTranslation,
        duration: 0.3,
      },
      "<"
    );
  }

  const stepHeader = sectionEl.querySelector(".step-header");
  if (stepHeader) {
    sectionEnterTimeline.to(
      stepHeader,
      {
        autoAlpha: 1,
        ...noTranslation,
        duration: 0.3,
      },
      "<"
    );
  }

  const stepDesc = sectionEl.querySelector(".step-description");
  if (stepDesc) {
    sectionEnterTimeline.to(
      stepDesc,
      {
        autoAlpha: 1,
        ...noTranslation,
        duration: 0.3,
      },
      "<"
    );
  }

  const stepTools = [...sectionEl.querySelectorAll(dataJs("step-tool"))];

  const specialCopy = sectionEl.querySelector(dataJs("specialCopy"));
  if (specialCopy) {
    sectionEnterTimeline.to(
      specialCopy,
      {
        autoAlpha: 1,
        ...noTranslation,
        duration: 0.3,
      },
      "<"
    );
  }

  if (stepTools) {
    sectionEnterTimeline.to(
      stepTools,
      {
        autoAlpha: 1,
        ...noTranslation,
        duration: 0.3,
        stagger: 0.1,
      },
      "<"
    );
  }
  sectionEnterTimeline.play();
}

function drawEllipseAroundInfra() {
  const el = dataJsQuerySelector("infraGrid") as HTMLElement;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const svgNS = "http://www.w3.org/2000/svg";

  // Create SVG
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute(
    "style",
    `
    position: absolute;
    top: 0;
    left: 0;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: visible;
    stroke-dasharray: 1 15;
    z-index: -1;
    stroke-linecap: round;
  `
  );

  // Create Ellipse
  const ellipse = document.createElementNS(svgNS, "ellipse");
  const rx = rect.width / 2;
  const ry = rect.height / 2;

  ellipse.setAttribute("rx", rx.toString());
  ellipse.setAttribute("ry", ry.toString());
  ellipse.setAttribute("stroke", "#38383E");
  ellipse.setAttribute("stroke-width", "7");
  ellipse.setAttribute("fill", "none");

  const defs = document.createElementNS(svgNS, "defs");
  const mask = document.createElementNS(svgNS, "mask");
  mask.setAttribute("id", "ellipseMask");
  const clone = ellipse.cloneNode(true) as HTMLElement;
  // do no transform the mask
  ellipse.setAttribute(
    "style",
    `
    transform: translateX(50%) translateY(50%);
  `
  );
  clone.setAttribute("stroke", "white");
  mask.appendChild(clone);
  defs.appendChild(mask);
  svg.appendChild(defs);
  svg.appendChild(ellipse);
  el.appendChild(svg);
  ellipse.setAttribute("mask", "url(#ellipseMask)");

  gsap.set(ellipse, {
    drawSVG: "0%",
  });
  return ellipse;
}

function smoothScrollGetStarted() {
  const getStartedBtn = document.querySelector(
    ".hero .seeMore"
  ) as HTMLAnchorElement;
  if (!getStartedBtn) return;
  getStartedBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    gsap
      .timeline()
      .to(window, {
        scrollTo: "#section1",
        duration: 0.3,
      })
      .to(
        window,
        {
          scrollTo: () => {
            return {
              y: `${window.scrollY + 1}`,
            };
          },
        },
        ">"
      );
  });
}
function dataJsQuerySelector(selector: string, all?: boolean) {
  if (all) {
    return document.querySelectorAll(`[data-js="${selector}"]`);
  }
  return document.querySelector(`[data-js="${selector}"]`);
}
function dataJs(s: string) {
  return `[data-js="${s}"]`;
}

function updateCurrentTocHighlighted(sectionIdx: number, stepIdx: number) {
  let tl = gsap.timeline({paused: true});
  let tocLis = document.querySelectorAll(".toc li");
  let section = tocLis[sectionIdx];
  if (!section) return;
  let sectionHeader = section.querySelector("a");
  let tocSteps = section.querySelectorAll("ol button");
  const tocStep = tocSteps[stepIdx - 1];
  let rmStyle = {
    color: "#656478",
    duration: 0.2,
    fontWeight: "400",
  };

  const isNewSection =
    sectionIdx !== globalCurrentTocItemsHighlighted.sectionIdx;
  const isNewStep =
    stepIdx !== globalCurrentTocItemsHighlighted.stepIdx || isNewSection;
  if (!isNewSection && !isNewStep) {
    // nothing to do
    return;
  }

  isNewSection &&
    globalCurrentTocItemsHighlighted.els.section &&
    globalCurrentTocItemsHighlighted.els.section.classList.remove("active");
  isNewStep &&
    globalCurrentTocItemsHighlighted.els.step &&
    globalCurrentTocItemsHighlighted.els.step.classList.remove("active");

  isNewSection && sectionHeader?.classList.add("active");
  isNewStep && tocStep?.classList.add("active");

  globalCurrentTocItemsHighlighted = {
    sectionIdx,
    stepIdx,
    els: {
      section: sectionHeader as HTMLElement,
      step: tocStep as HTMLElement,
    },
  };
  tl.play();
}

export {initAllAnimations};
