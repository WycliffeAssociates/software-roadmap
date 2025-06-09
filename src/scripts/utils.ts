function trimCubicPathAtY(pathStr: string, maxY: number): string {
  const tokens = pathStr.match(/[MLC][^MLC]+/g);
  if (!tokens || tokens.length === 0) return pathStr;

  const result: string[] = [];
  result.push(tokens[0]); // Keep initial `M`

  for (let i = 1; i < tokens.length; i++) {
    const cmd = tokens[i];
    const values = cmd
      .slice(1)
      .trim()
      .split(/[\s,]+/)
      .map(Number);

    const endY = values[5]; // C x1 y1 x2 y2 x y → y is index 5
    if (endY <= maxY) {
      result.push(cmd);
    } else {
      break;
    }
  }

  return result.join(" ");
}
function computeStepPercents(steps: number, start = 10, end = 90): number[] {
  if (steps === 1) {
    return [(start + end) / 2];
  }

  const range = end - start;
  return Array.from(
    {length: steps},
    (_, i) => start + (i / (steps - 1)) * range
  );
}

type ComputeStepProgressArg = {
  pathLength: number;
  path: SVGPathElement;
  steps: number;
  start?: number;
  end?: number;
  sectionIdx: number;
  sectionsLengths: number;
  windowInnerHeight: number;
  svgViewBoxHeight: number;
};
function computeStepProgresses({
  pathLength,
  path,
  steps,
  start = 10,
  end = 90,
  sectionIdx,
  sectionsLengths,
  windowInnerHeight,
  svgViewBoxHeight,
}: ComputeStepProgressArg): {
  percent: number;
  length: number;
  point: DOMPoint;
  drawn: boolean;
}[] {
  const totalLength = pathLength;
  if (totalLength === 0) {
    return [];
  }

  const percents = computeStepPercents(steps, start, end);
  let computed = percents.map((percent) => {
    const asPctTotalProgress = (percent / 100 + sectionIdx) / sectionsLengths;
    const len = asPctTotalProgress * totalLength;
    const ratio = (windowInnerHeight * sectionsLengths) / svgViewBoxHeight;
    const asRatioOfWindowHeight = len * ratio;

    return {
      percent: Math.floor(percent),
      length: ((percent / 100 + sectionIdx) / sectionsLengths) * totalLength,
      point: path.getPointAtLength(asRatioOfWindowHeight),
      drawn: false,
    };
  });
  return computed;
}

export {trimCubicPathAtY, computeStepPercents, computeStepProgresses};
