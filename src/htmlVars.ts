import type {JSX} from "solid-js";
import {
  DecoCompletedTasks,
  DecoPublication,
  DecorativeTranslateSvg,
  DecorativeTranslationComplete,
} from "./svgs/decorative";
import {type ToolType, content} from "./content";
import {Section2Tools} from "@components/special/TranslationComplete";
import {InfraSectionContent} from "@components/special/Infrastructure";

export type SectionVarType = {
  colorRgbVals: string;
  numSteps: string;
  contrastHex: string;
  accentHex: string;
  decorativeSvg?: () => JSX.Element;
  title: string;
  initialContent?: {
    title: string;
    description: string;
    tools: Array<ToolType>;
  };
  sectionClasses?: string;
  customComponent?: () => JSX.Element;
};

export const htmlVars: Record<number, SectionVarType> = {
  1: {
    colorRgbVals: "211, 232, 255",
    numSteps: "8",
    contrastHex: "#2d709d",
    accentHex: "#77bbf4",
    title: "Translation",
    decorativeSvg: DecorativeTranslateSvg,
    initialContent: content[0].steps[1],
  },
  2: {
    colorRgbVals: "219, 219, 255",
    numSteps: "1",
    contrastHex: "#4c40d6",
    accentHex: "#948ef3",
    title: "Translation Complete",
    decorativeSvg: DecorativeTranslationComplete,
    customComponent: Section2Tools,
  },
  3: {
    colorRgbVals: "255, 210, 196",
    numSteps: "4",
    contrastHex: "#823620",
    accentHex: "#f06e46",
    title: "Refinement",
    decorativeSvg: DecoCompletedTasks,
    initialContent: content[2].steps[1],
  },
  4: {
    colorRgbVals: "203, 235, 230",
    numSteps: "3",
    contrastHex: "#2E736C",
    accentHex: "#429a91",
    title: "Publication",
    decorativeSvg: DecoPublication,
    initialContent: content[3].steps[1],
  },
  5: {
    colorRgbVals: "197, 197, 204",
    numSteps: "1",
    title: "Infrastructure",
    contrastHex: "#777586",
    accentHex: "#777586",
    customComponent: InfraSectionContent,
  },
} as const;
