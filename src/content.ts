import {
  oratureIcon,
  recorderIcon,
  writerIcon,
  vmastIcon,
  yieldIcon,
  docIcon,
  greekWordsIcon,
  stetIcon,
  usfmConverterIcon,
} from "./icons";

const defaultLorem =
  "Lorem ipsum dolor sit amet consectetur. In sed eleifend leo nulla. Pulvinar faucibus nunc bibendum sed non sollicitudin risus ornare. Iaculis mollis in at maecenas adipiscing. Aliquam quis vel proin mauris volutpat ultrices.";
const shorterLorem =
  "Praesent suscipit finibus erat a accumsan. Etiam purus odio, placerat quis tristique in, elementum in mi. Integer malesuada placerat neque.";
const longLorem =
  "Curabitur non sapien consectetur, sagittis nulla semper, posuere erat. Donec ut lobortis eros, in tincidunt elit. Quisque pellentesque justo quis velit pulvinar, sodales bibendum ante consequat. Nulla suscipit massa vel posuere ullamcorper. Morbi maximus felis et sollicitudin tincidunt. Vestibulum vel";

export type ToolType = {
  title: string;
  icon?: string | null;
  dataName: string;
  inProgress?: boolean | undefined;
};

export const tools = {
  writer: {
    title: "BTT Writer",
    icon: writerIcon,
    dataName: "writer",
  },
  recorder: {
    title: "BTT Recorder",
    icon: recorderIcon,
    dataName: "recorder",
  },
  orature: {
    title: "Orature",
    icon: oratureIcon,
    dataName: "orature",
  },
  vmast: {
    title: "V-MAST",
    icon: vmastIcon,
    dataName: "vmast",
  },
  doc: {
    title: "DOC",
    icon: docIcon,
    dataName: "doc",
  },
  nllb: {
    title: "No Language Left Behind",
    icon: yieldIcon,
    dataName: "nllb",
    inProgress: true,
  },
  greekWords: {
    title: "Greek Words for Translators",
    icon: greekWordsIcon,
    dataName: "gwt",
  },
  rag: {
    title: "Retrieval-Augmented Generation",
    icon: yieldIcon,
    dataName: "rag",
    inProgress: true,
  },
  collab: {
    title: "Collaborative Refinement Tool",
    icon: yieldIcon,
    dataName: "collab",
    inProgress: true,
  },
  passages: {
    title: "Passages",
    icon: yieldIcon,
    dataName: "passages",
    inProgress: true,
  },
  stet: {
    title: "Spiritual Terms Evaluation Tool",
    icon: stetIcon,
    dataName: "stet",
  },
  wordAnalysis: {
    title: "Word Analysis Tool",
    icon: yieldIcon,
    dataName: "wat",
    inProgress: true,
  },
  biel: {
    title: "Bible In Every Language",
    dataName: "biel",
  },
  liveReader: {
    title: "Live Reader",
    dataName: "reader",
  },
  port: {
    title: "PORT",
    dataName: "port",
  },
  sab: {
    title: "Scripture App Builder",
    dataName: "sab",
  },
  wacs: {
    title: "WACS",
    dataName: "wacs",
  },
  ptxPrint: {
    title: "PTXprint",
    dataName: "ptxPrint",
  },
  usfmConverter: {
    title: "USFM Converter",
    dataName: "usfmConverter",
    icon: usfmConverterIcon,
  },
  usfmLinter: {
    title: "USFM Linter",
    dataName: "usfmLinter",
  },
  audioBiel: {
    title: "Audio BIEL",
    dataName: "audioBiel",
  },
  dotApp: {
    title: "DOT App",
    dataName: "dotApp",
  },
  dotWeb: {
    title: "DOT Website",
    dataName: "dotWeb",
  },
  textToSpeechGen: {
    title: "Text-to-Speech Generator",
    dataName: "ttsGen",
  },
  handwritingRecognition: {
    title: "Handwriting Text Recognition",
    dataName: "handwritingRecognition",
    icon: yieldIcon,
  },
};

type ContentType = {
  [key: number]: {
    steps: {
      [key: number]: {
        title: string;
        description: string;
        tools: Array<ToolType>;
      };
    };
  };
};
const content: ContentType = {
  0: {
    steps: {
      1: {
        title: "Step 1: <br /> Consume",
        description:
          "The translator will read or listen to the entire chapter, aiming to grasp its meaning and main point.",
        tools: [tools.recorder, tools.writer, tools.orature, tools.vmast],
      },
      2: {
        title: "Step 2: <br /> Verbalize",
        description:
          "The translator will verbally summarize the main people, events, and ideas of a chapter in their native language.",
        tools: [tools.writer, tools.orature, tools.vmast],
      },
      3: {
        title: "Step 3:<br /> Chunk",
        description:
          "Chunking involves dividing a chapter of Scripture into smaller, easily memorable parts.",
        tools: [tools.orature, tools.vmast],
      },
      4: {
        title: "Step 4:<br /> Blind Draft",
        description:
          "The translator will read or listen to the first chunk of chapter. Without referencing the source material, the translator will record the chunk in their mother-tongue using natural language (whether through writing or in a sound recording).",
        tools: [tools.recorder, tools.writer, tools.orature, tools.vmast],
      },
      5: {
        title: "Step 5:<br /> Self Edit",
        description:
          "The translator will look at (or listen to) the source text again and compare it to what was written (or recorded).",
        tools: [tools.writer, tools.orature, tools.vmast],
      },
      6: {
        title: "Step 6:<br /> Peer Edit",
        description:
          "A team member will carefully review the blind draft translation. This person will compare it to the source material, asking questions and suggesting edits to ensure the intended meaning of the biblical author is effectively communicated.",
        tools: [tools.writer, tools.nllb, tools.orature, tools.vmast],
      },
      7: {
        title: "Step 7:<br /> Keyword Check",
        description:
          "A translator and a partner must identify key words* and important concepts in each verse of the source text.",
        tools: [tools.recorder, tools.writer, tools.orature, tools.vmast],
      },
      8: {
        title: "Step 8:<br /> Verse-by-Verse Check",
        description:
          "Two additional individuals, apart from the translator, are involved. The translator reads their translation chunk by chunk in the mother tongue. One partner verbally translates each chunk into the source language while the other compares it to the source text, suggesting edits as needed.",
        tools: [tools.writer, tools.doc, tools.orature, tools.vmast],
      },
    },
  },
  // This section is it's own thing with just the singular "step". Nothing ordered to this part:
  1: {
    steps: {
      1: {
        title: "",
        description: "",
        tools: [],
      },
    },
  },
  2: {
    steps: {
      1: {
        title: "Step 1: <br /> Quality Assessment Guide",
        description:
          "The QAG serves as a rubric by which the translation team evaluates each chapter for specific qualities, such as accuracy, faithfulness, historical appropriateness, clarity, naturalness, correct style, grammar, and spelling. ",
        tools: [tools.greekWords, tools.rag, tools.collab],
      },
      2: {
        title: "Step 2: <br /> Reviewer's Guide",
        description:
          "The Reviewers’ Guide introduces community checking. Each passage is accompanied by background information and a set of comprehension questions.  Participants’ answers guide further revision.",
        tools: [tools.doc, tools.passages],
      },
      3: {
        title: "Step 3: <br /> Spiritual Terms Evaluation Tools",
        description:
          "The STET focuses on theological consistency. It includes approximately 100 core spiritual terms drawn from our open-source Greek lexicon, with examples of their usage across the New Testament. The goal is to maintain doctrinal integrity and semantic precision throughout the translation with these terms.",
        tools: [tools.stet, tools.doc],
      },
      4: {
        title: "Step 4: <br /> Proofreading",
        description:
          "The final step in the refinement process is a detailed checklist featuring a chapter-by-chapter review of capitalization, punctuation, formatting, grammar, and layout, especially useful when typing has been done later in the process.",
        tools: [tools.wordAnalysis],
      },
    },
  },
  3: {
    steps: {
      1: {
        title: "Step 1: <br /> Repo Consolidation",
        description: shorterLorem,
        tools: [
          tools.biel,
          tools.doc,
          tools.liveReader,
          tools.port,
          tools.wacs,
        ],
      },
      2: {
        title: "Step 2: <br /> Pre-Publication Refinement",
        description: defaultLorem,
        tools: [
          tools.ptxPrint,
          tools.sab,
          tools.usfmConverter,
          tools.usfmLinter,
        ],
      },
      3: {
        title: "Step 3: <br /> Publication",
        description: shorterLorem,
        tools: [
          tools.audioBiel,
          tools.dotApp,
          tools.dotWeb,
          tools.ptxPrint,
          tools.textToSpeechGen,
        ],
      },
    },
  },
} as const;

export {content};
