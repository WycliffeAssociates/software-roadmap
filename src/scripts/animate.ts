import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { CSSPlugin } from "gsap/CSSPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { Flip } from "gsap/Flip";
// import {content, type ToolType} from "./content";
import { GSDevTools } from "gsap/GSDevTools";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { content, type ToolType, audioFileToStepMap } from "@src/content";
import { computeStepProgresses, animateAudioAt30FPS } from "./utils";
import { pauseAudioPath, playAudioPath } from "../icons.ts";

gsap.registerPlugin(
  ScrollTrigger,
  DrawSVGPlugin,
  CSSPlugin,
  MorphSVGPlugin,
  Flip,
  GSDevTools,
  ScrollToPlugin,
);
window.gsap = gsap; // for devtools
// opt in to non intrusive js thread scroll jacking
// ScrollTrigger.normalizeScroll(true);

// global state:
let globalSectionStarts: {
  [key: number]: number;
} | null = null;
let globalInfraEllipse: SVGEllipseElement | null | undefined = null;
const noTranslation = {
  translateX: 0,
  translateY: 0,
} as const;
const sections = dataJsQuerySelector(
  "section",
  true,
) as NodeListOf<HTMLElement>;
let globalLastUpdateTime = 0;
const UPDATE_THROTTLE_MS = 33; // ~30fps
let globalRoadSvgEl = dataJsQuerySelector("road-svg") as SVGSVGElement;
let globalRoadMaskPath = dataJsQuerySelector("maskPath") as SVGPathElement;
const heroMaskPath = dataJsQuerySelector("heroMaskPath") as SVGSVGElement;
const sectionBgs = dataJsQuerySelector(
  "section-bg",
  true,
) as NodeListOf<HTMLElement>;
const roadPath = dataJsQuerySelector("roadPath") as SVGSVGElement;
const allRoadmapSections = dataJsQuerySelector(
  "section",
  true,
) as NodeListOf<HTMLElement>;
const stepDotEls: Array<SVGCircleElement> = [];
let totalProgress = 0;
const totalLength = globalRoadMaskPath.getTotalLength();
const svgViewBoxHeight = globalRoadSvgEl.viewBox.baseVal.height;
const lvhCheckEl = document.querySelector(".lvhCheck") as HTMLElement;
const lvhHeight = lvhCheckEl.getBoundingClientRect().height;
const windowInnerHeight = lvhHeight;
let fullVhUnitInSvgTerms = windowInnerHeight / svgViewBoxHeight;
const initialTail = fullVhUnitInSvgTerms * 5; //i.e. 3%
const translateYMagicNumber = 0.3;
let globalCurrentTocItemsHighlighted: {
  sectionIdx: number;
  stepIdx: number;
  els: {
    section: HTMLElement | null;
    step: HTMLElement | null;
  };
} = { sectionIdx: -1, stepIdx: -1, els: { section: null, step: null } };

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

function initAllAnimations() {
  const { sectionStarts, svgRoadHeight } = initialJsGsapSets();
  // Adjust some thing
  fullVhUnitInSvgTerms = windowInnerHeight / svgRoadHeight;
  globalSectionStarts = sectionStarts;
  const infraEllipse = drawEllipseAroundInfra();
  globalInfraEllipse = infraEllipse;
  // reselect after editing viewbox;
  globalRoadSvgEl = dataJsQuerySelector("road-svg") as SVGSVGElement;
  globalRoadMaskPath = dataJsQuerySelector("maskPath") as SVGPathElement;

  //
  initToc();
  smoothScrollGetStarted();
  wireUpAudioTour();
  initHeroRoad();
  ScrollTriggerSections();
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

        gsap.to(window, {
          scrollTo: `${asPx + 8}`, //little bit of extra padding into step
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
  const hero = dataJsQuerySelector("hero") as HTMLElement;
  const heroHeight = hero.getBoundingClientRect().height;

  const specialCopy = dataJsQuerySelector("specialCopy", true);
  if (specialCopy) {
    gsap.set(specialCopy, {
      autoAlpha: 0,
      translateY: "-20px",
    });
  }

  gsap.set([globalRoadMaskPath], { drawSVG: `${initialTail}%` });

  gsap.set(dataJs("step-header"), {
    autoAlpha: "0",
    translateY: "-20px",
  });
  gsap.set(dataJs("step-description"), {
    autoAlpha: "0",
    translateX: "-20px",
  });
  gsap.set(dataJs("step-tool"), { autoAlpha: 0, translateX: "10px" });

  let totalTop = 0;
  let sectionStarts: { [key: number]: number } = {};
  sectionBgs.forEach((sectionBg, idx) => {
    sectionBg.style.top = `${totalTop}px`;
    const steps = sectionBg.dataset.steps;
    if (!steps) return;
    const height = getSectionEndPx(parseInt(steps)) + windowInnerHeight;
    sectionBg.style.height = height + "px";
    sectionStarts[idx] = totalTop + heroHeight + 1;
    totalTop += height;
  });
  let heightTilLastSection = sectionStarts[sectionBgs.length - 1];
  gsap.set(".road-svg", {
    height: heightTilLastSection + "px",
  });
  globalRoadSvgEl.setAttribute("viewBox", `0 0 89 ${heightTilLastSection}`);

  return { sectionStarts, svgRoadHeight: heightTilLastSection };
}

function ScrollTriggerSections() {
  sections.forEach((section, index) => {
    const steps = parseInt(section.dataset.steps || "1");
    // closure state
    const header = section.querySelector(".step-header") as HTMLElement;
    let trackedStep = 1;

    const stepDots = computeStepProgresses({
      pathLength: totalLength,
      steps,
      path: globalRoadMaskPath,
      sectionIdx: index,
      sectionsLengths: sections.length,
      svgViewBoxHeight,
      windowInnerHeight,
    });

    const end = `${steps * getSectionHeightMultiplier() * 100}%`;
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end, // Each step adds 100vh to the scroll length for this section
      pin: true,
      // scrub: 1,
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

        // noop the last section
        if (index == sections.length - 1) {
          return;
        }
        const progress = getSectionProgress(self, index, sections.length);
        const doDrawRoad = progress.asPercentOfTotalRoad > totalProgress;
        // Only draw forwards
        if (progress.asPercentOfTotalRoad > totalProgress) {
          totalProgress = progress.asPercentOfTotalRoad;
        }
        // Draw the road as needed:
        // This logic determines how much of the main path is visible within the mask
        const currentTotalProgress = (self.progress + index) / sections.length;
        const currentDrawnLength = currentTotalProgress * totalLength;
        const drawPercent = (currentDrawnLength / totalLength) * 100;
        const ratio = (windowInnerHeight * sections.length) / svgViewBoxHeight;
        const asRatioOfWindowHeight = drawPercent * ratio;

        // Check if a step dot should be drawn at this progress point
        const step = stepDots.find(
          (s) => Math.abs(s.percent - progress.floored) < 2,
        );
        if (step && !step.drawn && doDrawRoad) {
          drawCircleOnRoad(step);
        }

        // Update ui:
        // Update the section header text to show current step
        const currentStep = Math.min(
          steps,
          Math.floor(progress.progressInSection * steps) + 1,
        );
        console.log({ index, currentStep });
        updateCurrentTocHighlighted(index, currentStep);
        if (header && trackedStep !== currentStep) {
          const step = content[index]!.steps[currentStep];
          trackedStep = currentStep;
          // Batch DOM updates
          updateTitle(section, step.title, step.description);
          updateTools(section, step.tools);
        }

        if (doDrawRoad) {
          gsap.to(globalRoadMaskPath, {
            drawSVG: `0 ${Math.max(asRatioOfWindowHeight, initialTail)}%`,
            overwrite: true, // Prevent conflicts if multiple tweens try to control drawSVG
          });
        }

        // Animate the vertical position of the entire `roadSvg`
        if (progress.outOf100 > 70 && index < sections.length - 1) {
          const indexAdjustSvgToVhPct = fullVhUnitInSvgTerms * 100 * index;
          const sectionProgressContribution =
            progress.progressInSection * translateYMagicNumber; //.3 is arbitrary / magic number to make it look good
          const targetRoadYPct =
            indexAdjustSvgToVhPct + sectionProgressContribution;
          gsap.to(globalRoadSvgEl, {
            y: `-${targetRoadYPct}%`, // Apply negative Y to move the SVG upwards
            overwrite: true,
          });
        }
      },
      onLeaveBack: () => {
        if (index == 0) {
          gsap.set(".road-svg", {
            position: "static",
          });
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
          gsap.set(".road-svg", {
            position: "fixed",
          });
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
            dataContrast,
          );
          let dTl = gsap.timeline();
          dTl.to(roadPath, {
            stroke: dataContrast,
            duration: 0.5,
          });
          if (stepDotEls.length) {
            dTl.to(
              stepDotEls,
              {
                stroke: dataContrast,
                duration: 0.5,
                onComplete: () => {
                  document.documentElement.style.setProperty(
                    "--circle-stroke",
                    dataContrast,
                  );
                },
              },
              "<",
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
            dataContrast,
          );
          gsap
            .timeline()
            .to(roadPath, {
              stroke: dataContrast,
              duration: 0.5,
            })
            .to(
              stepDotEls,
              {
                stroke: dataContrast,
                duration: 0.5,
                onComplete: () => {
                  document.documentElement.style.setProperty(
                    "--circle-stroke",
                    dataContrast,
                  );
                },
              },
              "<",
            );
        }
      },
    });

    if (index < sections.length - 1) {
      ScrollTrigger.create({
        trigger: section,
        start: "center+=10% center",
        end: `bottom top+=${10 + index * 1.8}%`,

        onUpdate: (self) => {
          // the prev section end will be
          const start =
            fullVhUnitInSvgTerms * 100 * index * -1 - translateYMagicNumber; //.3 is magic number
          // const start = gsap.getProperty(roadSvg, "y");
          //  the question is, I know where I'm starting, and how much more do I need to shift up so the svg is only about current section + initial showing?
          // i.e. slide up about 100vh totally with respect to svgViewBoxHeight
          const indexAdjustVh = fullVhUnitInSvgTerms * 100 * (index + 1); //+1 cause this is still in index of prev section but we are really between sections
          const endYWithTailShowing = indexAdjustVh * -1 + initialTail;

          const interpolatedYPct = gsap.utils.interpolate(
            Number(start),
            endYWithTailShowing,
            self.progress,
          );
          gsap.to(globalRoadSvgEl, {
            y: `${interpolatedYPct}%`,
            ease: "steps(40)",
          });
        },
      });
    }
  });
}

function getSectionProgress(
  self: globalThis.ScrollTrigger,
  index: number,
  sectionLength: number,
) {
  const progressInSection = self.progress;
  const outOf100 = progressInSection * 100;
  const floored = Math.floor(outOf100);
  const minForThisSectionIndex = index * (100 / sectionLength);
  const asPercentOfTotalRoad =
    minForThisSectionIndex + outOf100 / sections.length;

  return {
    progressInSection,
    outOf100,
    floored,
    minForThisSectionIndex,
    asPercentOfTotalRoad,
  };
}

function drawCircleOnRoad(step: { point: DOMPoint; drawn: boolean }) {
  const { dot } = getSvgCircle({
    cx: step.point.x.toString(),
    cy: step.point.y.toString(),
  });
  globalRoadSvgEl.appendChild(dot);
  stepDotEls.push(dot);
  step.drawn = true;
  gsap.to([dot], {
    duration: 0.5,
    scale: 1.5,
    opacity: "1",
    ease: "bounce.out",
    translateX: "-=25%",
  });
}

type SvgCircArgs = {
  cx: string;
  cy: string;
};
function getSvgCircle({ cx, cy }: SvgCircArgs) {
  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");

  dot.setAttribute("cy", cy);
  dot.setAttribute("cx", cx);
  dot.setAttribute("r", "10");
  return { dot };
}

export function updateTitle(
  sectionEl: HTMLElement,
  newText: string,
  newDesc: string,
) {
  const textNode = sectionEl.querySelector(
    ".section-step-text-node",
  ) as HTMLElement;
  const descNode = sectionEl.querySelector(
    ".section-step-desc-node",
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
  const { keep, remove } = currentTools.reduce(
    (acc: { keep: Array<HTMLElement>; remove: Array<HTMLElement> }, tool) => {
      const toolName = tool.getAttribute("data-tool-name");
      if (newTools.find((tool) => tool.dataName === toolName)) {
        acc.keep.push(tool);
      } else {
        acc.remove.push(tool);
      }
      return acc;
    },
    { keep: [], remove: [] },
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
    ".2",
  );

  let newToolGroup: Array<HTMLElement> = [];
  newTools.forEach((tool) => {
    if (!keep.find((t) => t.getAttribute("data-tool-name") === tool.dataName)) {
      const newTool = getNewStepTool(
        tool.icon,
        tool.title,
        tool.dataName,
        tool.inProgress,
      );
      tl.set(newTool, { x: "20px", opacity: "0" }, "0");

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
) {
  const newLiTool = document.createElement("li");
  newLiTool.setAttribute("class", "step-tool");
  newLiTool.setAttribute("data-tool-name", toolDataName);
  newLiTool.setAttribute("data-js", "step-tool");
  newLiTool.innerHTML = `
    <div class="step-tool-inner ${inProgress ? "inProgress" : ""}">
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
      "<",
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
      "<",
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
      "<",
    );
  }

  const stepTools = [...sectionEl.querySelectorAll(dataJs("step-tool"))];

  if (stepTools) {
    sectionEnterTimeline.to(
      stepTools,
      {
        autoAlpha: 1,
        ...noTranslation,
        duration: 0.3,
        stagger: 0.1,
      },
      "<",
    );
  }

  const specialCopy = sectionEl.querySelector(dataJs("specialCopy"));
  if (specialCopy) {
    sectionEnterTimeline.to(
      specialCopy,
      {
        autoAlpha: 1,
        ...noTranslation,
        duration: 0.3,
      },
      "<",
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
  `,
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
  `,
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

function wireUpAudioTour() {
  const audioBtn = document.querySelector(
    ".hero [data-js='audioStart']",
  ) as HTMLAnchorElement;
  const audioToggleBtn = document.querySelector(
    "[data-js='togglePauseAudio']",
  ) as HTMLButtonElement;
  const audio = document.querySelector("audio");
  if (!audioBtn || !audio || !audioToggleBtn) return;
  audioBtn?.addEventListener("click", (e) => {
    gsap
      .timeline({
        onComplete: () => {
          gsap.to(audioToggleBtn, {
            duration: 0.3,
            autoAlpha: 1,
          });
          audioTour(audioToggleBtn);
        },
      })
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
        ">",
      );
  });
}
function smoothScrollGetStarted() {
  const getStartedBtn = document.querySelector(
    ".hero [data-js='seeMore']",
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
        ">",
      );
  });
}

function audioTour(audioToggleBtn: HTMLButtonElement) {
  const audio = document.querySelector("audio");
  const toggleSvg = audioToggleBtn?.querySelector(
    "[data-js='audioTogglePath']",
  );
  if (!audio) return;
  audioToggleBtn.addEventListener("click", () => {
    if (audio.paused) {
      gsap.to(toggleSvg, {
        duration: 0.3,
        morphSVG: pauseAudioPath,
      });
      audio.play();
      animateAudioAt30FPS(audio, tickAudio);
    } else {
      gsap.to(toggleSvg, {
        duration: 0.3,
        morphSVG: playAudioPath,
      });
      audio.pause();
    }
  });
  const audioProgressToScroll = getAudioToScrollMap();
  audio.play();
  // setTimeout(() => {
  //   gsap.to(window, {
  //     scrollTo: audioProgressToScroll![10],
  //     duration: 1,
  //   });
  // }, 1000);
  function findStepBounds(currentTime: number) {
    const keys = Object.keys(audioProgressToScroll!);
    const nextLargest = keys.findIndex((k) => Number(k) >= currentTime);
    if (nextLargest === 0) {
      return {}; //noop
      // const progressVal = getLinearProgress(currentTime, 0, firstStep);

      // return [0, firstStep];
    }
    const prevStep = nextLargest - 1;
    if (!keys[prevStep]) {
      return {}; //noop
    }
    const cur = audioProgressToScroll![keys[prevStep]];
    const next = audioProgressToScroll![keys[nextLargest]];
    const progressVal = getLinearProgress(
      currentTime,
      Number(keys[prevStep]),
      Number(keys[nextLargest]),
    );
    const scroll1Val = cur;
    const scroll2Val = next;

    return {
      progressVal,
      scroll1Val,
      scroll2Val,
    };
  }
  function tickAudio(time: number) {
    // const floored = Math.floor(time);
    // const nextStep = audioProgressToScroll?.[floored];
    // if (!nextStep) {
    const { progressVal, scroll1Val, scroll2Val } = findStepBounds(time);
    console.log({ progressVal, scroll1Val, scroll2Val });
    if (!progressVal || !scroll1Val || !scroll2Val) return;
    const interpolated = gsap.utils.interpolate(
      scroll1Val,
      scroll2Val,
      progressVal,
    );
    gsap.to(window, {
      scrollTo: interpolated,
      // duration: 0.01,
    });
    // } else {
    //   gsap.to(window, {
    //     scrollTo: nextStep,
    //     duration: 0.2,
    //   });
    // }
  }
  animateAudioAt30FPS(audio, tickAudio);
  // audio.addEventListener("timeupdate", () => {
  // });
}
function getAudioToScrollMap() {
  if (!globalSectionStarts) return;
  const audioProgressToScroll = Object.entries(audioFileToStepMap).reduce(
    (acc: Record<string, string>, [time, { section, step }]) => {
      const sectY = globalSectionStarts![section];
      const mult = getSectionHeightMultiplier();
      const vhSection = mult * windowInnerHeight;
      const stepYPx = vhSection * step;
      const totalY = sectY + stepYPx - 8;
      acc[time] = String(totalY);
      // acc[time] = { section, step };
      return acc;
    },
    {},
  );
  console.log({ audioProgressToScroll });
  return audioProgressToScroll;
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
  let tl = gsap.timeline({ paused: true });
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
  console.log({ isNewSection, isNewStep, sectionIdx, stepIdx });
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
function getLinearProgress(x: number, start: number, end: number): number {
  return (x - start) / (end - start);
}

export { initAllAnimations };
