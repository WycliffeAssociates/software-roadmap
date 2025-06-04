import {gsap} from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {DrawSVGPlugin} from "gsap/DrawSVGPlugin";
import {CSSPlugin} from "gsap/CSSPlugin";
import {Flip} from "gsap/Flip";
// import {content, type ToolType} from "./content";
import {GSDevTools} from "gsap/GSDevTools";
import {ScrollToPlugin} from "gsap/ScrollToPlugin";
import {content, type ToolType} from "@src/content";

gsap.registerPlugin(
  ScrollTrigger,
  DrawSVGPlugin,
  CSSPlugin,
  Flip,
  GSDevTools,
  ScrollToPlugin
);
function dataJsQuerySelector(selector: string, all?: boolean) {
  if (all) {
    return document.querySelectorAll(`[data-js="${selector}"]`);
  }
  return document.querySelector(`[data-js="${selector}"]`);
}
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
  true
) as NodeListOf<HTMLElement>;
const roadSvg = dataJsQuerySelector("road-svg") as SVGSVGElement;
const maskPath = dataJsQuerySelector("maskPath") as SVGPathElement;
const roadPath = dataJsQuerySelector("roadPath") as SVGSVGElement;
const stepDotEls: Array<SVGCircleElement> = [];
let totalProgress = 0;
const totalLength = maskPath.getTotalLength();
const svgViewBoxHeight = roadSvg.viewBox.baseVal.height;
const fullVhUnitInSvgTerms = window.innerHeight / svgViewBoxHeight;
const initialTail = fullVhUnitInSvgTerms * 5; //i.e. 3%
const translateYMagicNumber = 0.3;

function initAllAnimations() {
  const {sectionStarts} = initialJsGsapSets();
  globalSectionStarts = sectionStarts;
  const infraEllipse = drawEllipseAroundInfra();
  globalInfraEllipse = infraEllipse;
  initToc();
  smoothScrollGetStarted();
  initHeroRoad();
  ScrollTriggerSections();
}

function dataJs(s: string) {
  return `[data-js="${s}"]`;
}
function initToc() {
  if (!globalSectionStarts) return;
  const topLevelTocLi = document.querySelectorAll(".toc li");
  const allSections = dataJsQuerySelector(
    "section",
    true
  ) as NodeListOf<HTMLElement>;
  const hero = dataJsQuerySelector("hero") as HTMLElement;
  if (!allSections || !topLevelTocLi || !hero || !globalSectionStarts) return;
  const heroHeight = hero.getBoundingClientRect().height;
  topLevelTocLi.forEach((li, topIdx) => {
    const subLinks = li.querySelectorAll("ol button");
    const topLink = li.querySelector("a") as HTMLAnchorElement;
    topLink.addEventListener("click", (e) => {
      if (!globalSectionStarts) return;
      const sectionParent = allSections[topIdx] as HTMLElement;
      if (!sectionParent) return;
      const sectionY = globalSectionStarts[topIdx]; //a vh value:
      const stepY = 0 * 100;
      const totalY = sectionY + stepY;
      const asPx = (totalY / 100) * window.innerHeight + heroHeight + 1;
      gsap.to(window, {
        scrollTo: `${asPx}`,
        // duration: 0.3,
      });
    });
    subLinks.forEach((subLink, subIdx) => {
      subLink.addEventListener("click", () => {
        if (!globalSectionStarts) return;
        const sectionParent = allSections[topIdx] as HTMLElement;
        if (!sectionParent) return;
        const sectionY = globalSectionStarts[topIdx]; //a vh value:
        const stepY = subIdx * 100;
        const totalY = sectionY + stepY;
        const asPx = (totalY / 100) * window.innerHeight + heroHeight + 1;
        gsap.to(window, {
          scrollTo: `${asPx}`,
          duration: 0.1,
        });
      });
    });
  });
}

function initHeroRoad() {
  const heroPath = dataJsQuerySelector("heroMaskPath") as SVGSVGElement;
  gsap.set(heroPath, {
    drawSVG: "0%",
  });
  ScrollTrigger.create({
    trigger: "[data-js='hero']",
    start: "1%",
    markers: import.meta.env.DEV,
    onEnter: () => {
      gsap.to(heroPath, {
        drawSVG: "100%",
        duration: 1,
        ease: "power1.inOut",
      });
    },
  });
}

function initialJsGsapSets() {
  gsap.set([maskPath], {drawSVG: `${initialTail}%`});

  gsap.set(dataJs("step-header"), {
    autoAlpha: "0",
    translateY: "-20px",
  });
  gsap.set(dataJs("step-description"), {
    autoAlpha: "0",
    translateX: "-20px",
  });
  gsap.set(dataJs("step-tool"), {autoAlpha: 0, translateX: "10px"});

  let totalTop = 0;
  let sectionStarts: {[key: number]: number} = {};
  const sectionBgs = dataJsQuerySelector(
    "section-bg",
    true
  ) as NodeListOf<HTMLElement>;
  sectionBgs.forEach((sectionBg, idx) => {
    sectionBg.style.top = `${totalTop}vh`;
    const steps = sectionBg.dataset.steps;
    if (!steps) return;
    sectionStarts[idx] = totalTop;
    totalTop += parseInt(steps) * 100 + 100;
  });
  return {sectionStarts};
}

function ScrollTriggerSections() {
  sections.forEach((section, index) => {
    const steps = parseInt(section.dataset.steps || "1");
    // closure state
    const header = section.querySelector(".step-header") as HTMLElement;
    let trackedStep = 1;

    const stepPct = 90 / steps;
    const stepDots: {[key: number]: {drawn: boolean}} = {};
    for (let i = 0; i < steps; i++) {
      const stepVal = Math.floor((i + 1) * stepPct);
      stepDots[stepVal] = {drawn: false};
    }
    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: `${steps * 100}%`, // Each step adds 100px to the scroll length for this section
      pin: true,
      scrub: 0.1,
      onUpdate: (self) => {
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
        // Check if a step dot should be drawn at this progress point
        const step = stepDots[progress.floored];
        if (step && !step.drawn && doDrawRoad) {
          drawCircleOnRoad(step);
        }

        // Update ui:
        // Update the section header text to show current step
        const currentStep = Math.min(
          steps,
          Math.floor(progress.progressInSection * steps) + 1
        );
        if (header && trackedStep !== currentStep) {
          const step = content[index]!.steps[currentStep];
          trackedStep = currentStep;
          updateTitle(section, step.title, step.description);
          updateTools(section, step.tools);
        }

        // Draw the road as needed:
        // This logic determines how much of the main path is visible within the mask
        const currentTotalProgress = (self.progress + index) / sections.length;
        const targetPathLength = currentTotalProgress * totalLength;
        const drawPercent = (targetPathLength / totalLength) * 100;
        const ratio = (window.innerHeight * sections.length) / svgViewBoxHeight;
        const asRatioOfWindowHeight = drawPercent * ratio;

        if (doDrawRoad) {
          gsap.to(maskPath, {
            drawSVG: `0 ${Math.max(asRatioOfWindowHeight, initialTail)}%`,
            overwrite: true, // Prevent conflicts if multiple tweens try to control drawSVG
          });
        }

        // Animate the vertical position of the entire `roadSvg`
        if (progress.outOf100 > 70 && index < sections.length - 1) {
          const indexAdjustSvgToVhPct =
            (window.innerHeight / svgViewBoxHeight) * 100 * index;
          const sectionProgressContribution =
            progress.progressInSection * translateYMagicNumber; //.3 is arbitrary / magic number to make it look good
          const targetRoadYPct =
            indexAdjustSvgToVhPct + sectionProgressContribution;
          gsap.to(roadSvg, {
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
                    dataContrast
                  );
                },
              },
              "<"
            );
        }

        sectionEntranceAnimations(section);
      },
      onEnterBack: () => {
        const dataContrast = section.getAttribute("data-contrast");
        if (dataContrast) {
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
                    dataContrast
                  );
                },
              },
              "<"
            );
        }
      },
    });

    if (index < sections.length - 1) {
      ScrollTrigger.create({
        trigger: section,
        start: "center+=10% center",
        end: `bottom top+=${10 + index * 1.8}%`,
        scrub: 0.1,
        // markers: import.meta.env.DEV && {
        //   endColor: getColor(index),
        //   indent: 100,
        //   startColor: "red",
        //   fontSize: "26px",
        // },
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
            self.progress
          );
          gsap.to(roadSvg, {
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
  sectionLength: number
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

function drawCircleOnRoad(step: {drawn: boolean}) {
  const curDashArray = gsap.getProperty(maskPath, "strokeDasharray", "px");
  const split = String(curDashArray).split(",");
  const [start] = split;
  const point = maskPath.getPointAtLength(Number(start.replace("px", "")));
  const {dot} = getSvgCircle({
    cx: point.x.toString(),
    cy: point.y.toString(),
  });
  console.log(dot, roadSvg);
  roadSvg.appendChild(dot);
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
function getSvgCircle({cx, cy}: SvgCircArgs) {
  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");

  dot.setAttribute("cy", cy);
  dot.setAttribute("cx", cx);
  dot.setAttribute("r", "10");
  return {dot};
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
  // debugger;
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
        tool.inProgress
      );
      tl.set(newTool, {x: "20px", opacity: "0"}, "0");

      stepToolsContainer.appendChild(newTool);
      newToolGroup.push(newTool);
    }
  });

  tl.to(newToolGroup, {
    x: "0px",
    autoAlpha: 1,
    duration: 0.25,
  });

  tl.play();
}

function getNewStepTool(
  icon: string | null | undefined,
  toolName: string,
  toolDataName: string,
  inProgress: boolean = false
) {
  const newLiTool = document.createElement("li");
  newLiTool.setAttribute("class", "step-tool");
  newLiTool.setAttribute("data-tool-name", toolDataName);
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

  const stepTools = sectionEl.querySelectorAll(".step-tool");
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

export {initAllAnimations};
