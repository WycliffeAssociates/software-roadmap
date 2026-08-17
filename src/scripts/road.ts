import {gsap} from "gsap";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Procedurally generates the same zigzag S-curve the designer's SVG used, but
// at whatever height we ask for. Their asset was a fixed ~23800px graphic that
// had to be force-fit to the page with magic numbers; generating it means the
// road is simply built to the exact size the content needs.
//
// The defaults reproduce the original's geometry exactly: half-wave every
// 238.48px, control points 54 either side of centre (which puts the curve's
// actual extreme at 40.5, since a cubic only reaches 3/4 of the way to its
// control points), bounded in X as the original was.
export function buildZigzagPath(
  totalHeight: number,
  {centerX = 44.5, amplitude = 54, segmentHeight = 238.48} = {}
): string {
  let d = `M${centerX} 0`;
  let y = 0;
  let side = 1; // 1 = bulge right, -1 = bulge left
  while (y < totalHeight) {
    const extremeX = centerX + side * amplitude;
    const c1y = y + segmentHeight / 3;
    const c2y = y + (segmentHeight * 2) / 3;
    const endY = y + segmentHeight;
    d += ` C${extremeX} ${c1y} ${extremeX} ${c2y} ${centerX} ${endY}`;
    y = endY;
    side *= -1;
  }
  return d;
}

export type RoadSection = {
  // page px where this section pins and where the pin releases
  pinStart: number;
  pinEnd: number;
  // page px where the next section pins (the unpinned gap in between)
  gapEnd: number;
  steps: number;
};

export type RoadLayout = {
  // page px where the road begins (just past the hero)
  roadStartY: number;
  // one viewport in px — the amount of road one section gets
  viewportPx: number;
  sections: RoadSection[];
};

// How much road is already showing when a section starts, as a fraction of the
// viewport. Gives the section's first dot something to sit on instead of having
// it appear out of nowhere at the very top edge.
const TAIL_FRACTION = 0.05;
// The designer's viewBox was `0 0 89 …`. We widen it symmetrically so a step
// dot at the curve's extreme (cx 85, r 10) isn't clipped by the SVG viewport,
// while keeping the same centre — so the road sits exactly where it always did.
const VIEWBOX_X = -8;
const VIEWBOX_WIDTH = 105;
// Slack around the mask window so the road's stroke isn't clipped at the edges
// of the visible area.
const MASK_MARGIN = 32;

// A zigzag covers more arc length than vertical height (it travels sideways
// too), so "halfway down the road" and "half the path's arc length" are
// different points. getPointAtLength works in arc length, but a dot's position
// is known as a vertical Y. This converts one to the other.
function buildYToLengthTable(path: SVGPathElement, sampleCount: number) {
  const total = path.getTotalLength();
  const table: {y: number; length: number}[] = [];
  for (let i = 0; i <= sampleCount; i++) {
    const length = (i / sampleCount) * total;
    table.push({y: path.getPointAtLength(length).y, length});
  }
  return table;
}

function lengthForY(table: {y: number; length: number}[], targetY: number) {
  if (targetY <= table[0].y) return table[0].length;
  const last = table[table.length - 1];
  if (targetY >= last.y) return last.length;
  // table.y is monotonically increasing (the path only moves downward), so a
  // binary search plus interpolation between the bracketing samples is exact
  // enough without needing every point on the curve.
  let lo = 0;
  let hi = table.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (table[mid].y <= targetY) lo = mid;
    else hi = mid;
  }
  const a = table[lo];
  const b = table[hi];
  const t = b.y === a.y ? 0 : (targetY - a.y) / (b.y - a.y);
  return a.length + t * (b.length - a.length);
}

// Each section gets exactly ONE VIEWPORT of road, however long it is pinned
// for. Translation is pinned across 8 viewports of scrolling, but its road
// still spans a single screen — so all eight of its dots are visible together,
// which is the point of the thing. The road draws from 5% to 105% of the
// viewport over the section's pin, then the camera pans one viewport to the
// next section's stretch while the page scrolls through the unpinned gap.
//
// So there are two clocks, not one: page scroll (long) and road travel (one
// screen per section). Earlier versions tied the road to page scroll directly,
// which stretched a section's road across its whole 8-viewport pin and left the
// dots a full screen apart — only ever one visible at a time.
export function initProceduralRoad(els: {
  window: HTMLElement;
  svg: SVGSVGElement;
  maskRect: SVGRectElement;
  roadPath: SVGPathElement;
}) {
  const {window: roadWindow, svg, maskRect, roadPath} = els;
  const mask = svg.querySelector("mask");
  let layout: RoadLayout = {roadStartY: 0, viewportPx: 1, sections: []};
  let roadHeightPx = 1;
  let tailPx = 0;
  let yToLength: {y: number; length: number}[] = [];
  const dots: SVGCircleElement[] = [];
  const dotShown: boolean[] = [];
  // Road-space Y of each dot, so revealing one is a plain comparison against
  // how far the road has been drawn.
  const dotRoadYs: number[] = [];

  // Never leave the road in its authored (fully drawn) state — if anything
  // downstream throws before the first setLayout, a blank road is a much less
  // broken-looking failure than the whole thing appearing at once.
  maskRect.setAttribute("height", "0");

  // Road-space Y that section `index` has drawn to at `progress` through its
  // pin. This is the one place the two clocks are related, so dots and the
  // drawing tip cannot disagree: both are placed with this function.
  function roadYAt(index: number, progress: number) {
    return tailPx + (index + progress) * layout.viewportPx;
  }

  // camera = the road-space Y sitting at the top of the viewport.
  function roadState(scrollY: number) {
    const seg = layout.viewportPx;
    const secs = layout.sections;
    // Above the roadmap the road just sits at its page position and scrolls
    // normally. At scrollY === roadStartY this reaches 0, so it joins the
    // pinned behaviour below without a jump.
    if (!secs.length || scrollY <= layout.roadStartY) {
      return {camera: scrollY - layout.roadStartY, drawY: tailPx};
    }
    for (let i = 0; i < secs.length; i++) {
      const s = secs[i];
      if (scrollY <= s.pinEnd) {
        // Pinned: the camera holds still and the road draws down the screen.
        const pinLen = Math.max(s.pinEnd - s.pinStart, 1);
        const p = clamp((scrollY - s.pinStart) / pinLen, 0, 1);
        return {camera: i * seg, drawY: roadYAt(i, p)};
      }
      if (scrollY <= s.gapEnd) {
        // Unpinned gap: drawing is done for this section, and the camera pans
        // one viewport so the road travels with the page as it scrolls away.
        const gapLen = Math.max(s.gapEnd - s.pinEnd, 1);
        const g = clamp((scrollY - s.pinEnd) / gapLen, 0, 1);
        return {camera: (i + g) * seg, drawY: roadYAt(i, 1)};
      }
    }
    // Past the last step section: fully drawn, scrolling away with the page.
    const last = secs[secs.length - 1];
    return {
      camera: secs.length * seg + (scrollY - last.gapEnd),
      drawY: roadHeightPx,
    };
  }

  function update() {
    const {camera, drawY} = roadState(window.scrollY);
    // Pan the viewBox rather than moving the element. The element stays exactly
    // one viewport tall, so the masked region the browser has to rasterise is
    // always a single screen. A full-road-height element makes the mask raster
    // grow with the content and with the display's pixel ratio, and browsers
    // quietly give up past their texture limit — which is why the road drew
    // only partway on a retina display while rendering fine on a 1x monitor.
    svg.setAttribute(
      "viewBox",
      `${VIEWBOX_X} ${camera} ${VIEWBOX_WIDTH} ${layout.viewportPx}`
    );
    // Follow the mask region along with the camera. Everything outside is
    // offscreen anyway, so masking it out costs nothing and keeps the surface
    // the browser has to rasterise at one screen instead of the whole road.
    if (mask) {
      mask.setAttribute("x", String(VIEWBOX_X - MASK_MARGIN));
      mask.setAttribute("y", String(camera - MASK_MARGIN));
      mask.setAttribute("width", String(VIEWBOX_WIDTH + MASK_MARGIN * 2));
      mask.setAttribute(
        "height",
        String(layout.viewportPx + MASK_MARGIN * 2)
      );
    }
    maskRect.setAttribute("height", String(clamp(drawY, 0, roadHeightPx)));

    // Dots live permanently in the DOM at their fixed spot on the path and are
    // only faded in and out. Reveal has to be reversible: scrolling back up
    // un-draws the road, and a dot that stayed put would be left stranded on a
    // stretch of road that is no longer there.
    dotRoadYs.forEach((dotY, i) => {
      const reached = drawY >= dotY;
      if (reached === dotShown[i]) return;
      dotShown[i] = reached;
      gsap.to(dots[i], {
        scale: reached ? 1 : 0,
        opacity: reached ? 1 : 0,
        transformOrigin: "50% 50%",
        duration: reached ? 0.4 : 0.2,
        ease: reached ? "back.out(2)" : "power1.in",
      });
    });
  }

  function setLayout(next: RoadLayout) {
    layout = next;
    tailPx = layout.viewportPx * TAIL_FRACTION;
    // One viewport per section, plus the leading tail.
    roadHeightPx = layout.sections.length * layout.viewportPx + tailPx;

    roadPath.setAttribute("d", buildZigzagPath(roadHeightPx));
    // Element height must equal the viewBox height so the road renders at 1:1
    // scale — the curve's geometry (238.48px per half-wave) is in real pixels.
    gsap.set(svg, {height: layout.viewportPx, y: 0});
    // Fixed to the viewport: during a pinned section the road has to hold still
    // on screen while the page scrolls underneath it.
    gsap.set(roadWindow, {position: "fixed", top: 0, height: "100vh"});

    // Only used to place the dots on the curve, once per layout — never per
    // frame, and never to decide how much road is showing.
    yToLength = buildYToLengthTable(roadPath, 1000);

    dots.forEach((dot) => dot.remove());
    dots.length = 0;
    dotShown.length = 0;
    dotRoadYs.length = 0;
    layout.sections.forEach((section, index) => {
      for (let k = 0; k < section.steps; k++) {
        // A step owns progress [k/steps, (k+1)/steps). Place its dot a quarter
        // of the way in, so it lands while that step's content is on screen.
        const dotY = roadYAt(index, (k + 0.25) / section.steps);
        const point = roadPath.getPointAtLength(lengthForY(yToLength, dotY));
        const dot = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );
        dot.setAttribute("cx", String(point.x));
        dot.setAttribute("cy", String(point.y));
        dot.setAttribute("r", "10");
        svg.appendChild(dot);
        gsap.set(dot, {scale: 0, opacity: 0, transformOrigin: "50% 50%"});
        dots.push(dot);
        dotShown.push(false);
        dotRoadYs.push(dotY);
      }
    });

    update();
  }

  // Driven off the frame ticker rather than the scroll event alone: while a
  // section is pinned, scroll events get coalesced, which leaves the road a
  // frame or more behind the content it is tracking.
  let lastScrollY = -1;
  let lastHeight = -1;
  gsap.ticker.add(() => {
    if (window.scrollY === lastScrollY && window.innerHeight === lastHeight) {
      return;
    }
    lastScrollY = window.scrollY;
    lastHeight = window.innerHeight;
    update();
  });

  return {
    setLayout,
    update,
    getDots: () => dots.filter((_, i) => dotShown[i]),
  };
}
