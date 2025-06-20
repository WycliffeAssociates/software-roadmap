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
  description?: string;
  linkOut?: string;
};

export const tools = {
  writer: {
    title: "BTT Writer",
    icon: writerIcon,
    dataName: "writer",
    description:
      "Writer is a cross-platform desktop and Android application for translating the Bible offline.",
    linkOut: "https://bibleineverylanguage.org/software/writer/",
  },
  recorder: {
    title: "BTT Recorder",
    icon: recorderIcon,
    dataName: "recorder",
    description:
      "Recorder provides an intuitive solution for using Android devices to begin orally translating the Bible into a heart language for people who are not comfortable with technology.",
    linkOut: "https://bibleineverylanguage.org/software/recorder/",
  },
  orature: {
    title: "Orature",
    icon: oratureIcon,
    dataName: "orature",
    description:
      "Orature is a desktop application that provides an accessible way for the Global Church to produce church-owned oral and audio Scripture. It streamlines the translation and narration process for tech-hesitant translators.",
    linkOut: "https://bibleineverylanguage.org/software/orature/",
  },
  vmast: {
    title: "V-MAST",
    icon: vmastIcon,
    dataName: "vmast",
    description:
      "V-MAST is a virtual online program that allows a translator to collaborate with others to draft and check their translation using the MAST methodology.",
    linkOut: "https://bibleineverylanguage.org/software/v-mast/",
  },
  doc: {
    title: "DOC",
    icon: docIcon,
    dataName: "doc",
    description:
      "This tool allows you to download Scripture in one or two languages, optionally combined with resources such as Translation Notes used in the translation checking process (described on Resources page).",
    linkOut: "https://doc.bibleineverylanguage.org/languages",
  },
  nllb: {
    title: "No Language Left Behind",
    icon: yieldIcon,
    dataName: "nllb",
    inProgress: true,
    description: "",
    linkOut: "",
  },
  greekWords: {
    title: "Greek Words for Translators",
    icon: greekWordsIcon,
    dataName: "gwt",
    description:
      "This is a simple English/Greek lexicon. It gives translators information about the meaning of words in the original language of the New Testament.",
    linkOut: "https://gwt.bibleineverylanguage.org/",
  },
  rag: {
    title: "Retrieval-Augmented Generation",
    icon: yieldIcon,
    dataName: "rag",
    inProgress: true,
    description:
      "We are exploring how RAG (Retrieval-Augmented Generation) can be used to augment the resources available to translators during the translation process.",
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
    description:
      "Bible In Every Language (BIEL) is our site for finding the various software, learning about our processes, and finding resources either for translations or final products of translations.",
    linkOut: "https://bibleineverylanguage.org",
  },
  liveReader: {
    title: "Live Reader",
    dataName: "reader",
    description:
      "During the translation process, it's sometimes helpful to be able to read the current work in progress as a whole, so this site provides a view of a translation project as it currently stands in a readable format.",
  },
  srp: {
    title: "Scripture Rendering Pipeline",
    dataName: "srp",
    description:
      "As written projects are worked on, we need a way to render the text into various formats for publication. The Scripture Rendering Pipeline (SRP) is a tool that converts the USFM files into various formats for consumption.",
  },
  brightcove: {
    title: "Brightcove",
    dataName: "brightcove",
    description:
      "Brightcove is a third-party service we use to host our video content. It provides a way to stream our sign language videos and other video content.",
  },
  port: {
    title: "PORT",
    dataName: "port",
    description: "PORT is a tool we use to manage our translation projects.",
  },
  sab: {
    title: "Scripture App Builder",
    dataName: "sab",
    description:
      "Scripture App Builder is a tool that allows us to create Android applications for offline reading of finished translations.",
  },
  wacs: {
    title: "WACS",
    dataName: "wacs",
    description:
      "Wycliffe Associates Content Service is our cloud storage for keeping translation work in progress backed up and broadly accessible.",
    linkOut: "https://content.bibletranslationtools.org/",
  },
  ptxPrint: {
    title: "PTXprint",
    dataName: "ptxPrint",
    description:
      "PTXprint is a tool that facilitates the typesetting and formatting of finished translations for printing and distribution.",
  },
  usfmConverter: {
    title: "USFM Converter",
    dataName: "usfmConverter",
    icon: usfmConverterIcon,
    description:
      "Most scripture is written in a markup language called United Standard Format Markers (USFM).  USFM Converter is a tool that allows us to convert between USFM and other formats.",
    linkOut: "https://bibleineverylanguage.org/software/usfm-converter/",
  },
  usfmLinter: {
    title: "USFM Linter",
    dataName: "usfmLinter",
    description:
      "USFM Linter is a tool that allows us to check USFM for common errors, such as missing or incorrect markup, or for missing or incorrect text.",
  },
  audioBiel: {
    title: "Audio BIEL",
    dataName: "audioBiel",
    description:
      "Audio BIEL (Bible In Every Language) houses our audio used as source material in oral translation projects as well as some finished translations.",
    linkOut: "https://audio.bibleineverylanguage.org/",
  },
  dotApp: {
    title: "DOT App",
    dataName: "dotApp",
    description:
      "This is our app for consuming the translations produced by our Deaf Owned Translation (DOT) process.  It's available for iOS and Android as Sign Language Bible. It allows for saving videos for offline watching.",
    linkOut:
      "https://play.google.com/store/apps/details?id=com.slbible.dotapp&hl=en_US",
  },
  dotWeb: {
    title: "DOT Website",
    dataName: "dotWeb",
    description:
      "This is our website for consuming the translations produced by our Deaf Owned Translation (DOT) process.",
    linkOut: "https://slbible.com/",
  },
  textToSpeechGen: {
    title: "Text-to-Speech Generator",
    dataName: "ttsGen",
  },
  handwritingRecognition: {
    title: "Handwriting Text Recognition",
    dataName: "handwritingRecognition",
    icon: yieldIcon,
    description:
      "Translation work is sometimes still done via hand where technology is not available or conducive to use. We are experimenting with ways to digitize this handwritten text to speed up the production process as well as have the translation data available for safe keeping.",
  },
  publicDataApi: {
    title: "Public Data API",
    dataName: "publicDataApi",
    description:
      "We surface information concerning languages, translations, and resources through our Public Data API. This allows for easy access to our data for developers and other interested parties.",
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
        description:
          "We consolidate individual book repositories from BBT-Writer into a single USFM repo containing all the books. We also standardize usfm markers and file information.",
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
        description:
          "We run an automated process to identify possible versification, punctuation, and other editorial issues. The publication team collaborates with the field teams to resolve as many issues as possible.",
        tools: [
          tools.ptxPrint,
          tools.sab,
          tools.usfmConverter,
          tools.usfmLinter,
        ],
      },
      3: {
        title: "Step 3: <br /> Publication",
        description:
          "Most completed translations are available on Bible in Every Language and DOC. Once refined, Scripture products can be published in the format(s) desired by the language community. Formats include printed copies, text and/or audio apps, and sign language videos.",
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

// 205 seconds of audio in this file
export const audioFileToStepMap = {
  3: {
    section: 0,
    step: 1,
  },
  10: {
    section: 0,
    step: 2,
  },
  19: {
    section: 0,
    step: 3,
  },
  32: {
    section: 0,
    step: 4,
  },
  35: {
    section: 0,
    step: 5,
  },
  43: {
    section: 0,
    step: 6,
  },
  50: {
    section: 0,
    step: 7,
  },
  58: {
    section: 0,
    step: 8,
  },
  64: {
    section: 1,
    step: 1,
  },
  75: {
    section: 2,
    step: 1,
  },
  82: {
    section: 2,
    step: 2,
  },
  91: {
    section: 2,
    step: 3,
  },
  100: {
    section: 2,
    step: 4,
  },
  109: {
    section: 3,
    step: 1,
  },
  122: {
    section: 3,
    step: 2,
  },
  149: {
    section: 3,
    step: 3,
  },
  159: {
    section: 4,
    step: 1,
  },
};

export { content };
