import {tools} from "@src/content";
import {yieldIcon} from "@src/icons";
export function Section2Tools() {
  return (
    <>
      <p class="sect2ToolsCopy" data-js="specialCopy">
        When a translation has been completed, we make it available for
        consumption in a variety of places, but there is no specific order for
        the final product ending up in these respective places.
      </p>
      <div class="sect2ToolsSpecial">
        <div
          class="step-tool"
          data-js="step-tool"
          data-tool-name={tools.handwritingRecognition.dataName}
        >
          <div class="step-tool-inner inProgress">
            <span innerHTML={yieldIcon} class="step-tool-icon" />
            {tools.handwritingRecognition.title}
          </div>
        </div>
        <div
          class="step-tool"
          data-js="step-tool"
          data-tool-name={tools.wacs.dataName}
        >
          <div class="step-tool-inner">
            <span class="step-tool-text"> {tools.wacs.title} </span>
          </div>
        </div>
        <div class="sect2ToolsStaggered">
          <div
            class="step-tool"
            data-js="step-tool"
            data-tool-name={tools.biel.dataName}
          >
            <span class="step-tool-text">{tools.biel.title}</span>
          </div>
          <div
            class="step-tool"
            data-js="step-tool"
            data-tool-name={tools.doc.dataName}
          >
            <span class="step-tool-text">{tools.doc.title}</span>
          </div>
          <div
            class="step-tool"
            data-js="step-tool"
            data-tool-name={tools.liveReader.dataName}
          >
            <span class="step-tool-text">{tools.liveReader.title}</span>
          </div>
        </div>
      </div>
    </>
  );
}
