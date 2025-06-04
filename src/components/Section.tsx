import type {SectionVarType} from "@src/htmlVars";
import {Index, Show} from "solid-js";
import {Dynamic} from "solid-js/web";
type SectionProps = {
  index: string;
  sectionVars: SectionVarType;
};
export function Section(props: SectionProps) {
  return (
    <section
      class="section"
      data-js="section"
      id={`section${props.index}`}
      data-steps={props.sectionVars.numSteps}
      data-color={props.sectionVars.colorRgbVals}
      data-contrast={props.sectionVars.contrastHex}
      data-accent={props.sectionVars.accentHex}
      style={`--data-color: ${props.sectionVars.colorRgbVals};
              --data-contrast: ${props.sectionVars.contrastHex};
              --data-accent: ${props.sectionVars.accentHex};`}
    >
      <h2 class="section-title">{props.sectionVars.title}</h2>
      <Show when={props.sectionVars.decorativeSvg}>
        <div class="section-decorative">
          <Dynamic component={props.sectionVars.decorativeSvg} />
        </div>
      </Show>
      {/* step based */}
      <Show
        when={
          props.sectionVars.initialContent && !props.sectionVars.customComponent
        }
      >
        <div class="step-header" data-js="step-header">
          <span
            class="section-step-text-node"
            innerHTML={props.sectionVars.initialContent?.title}
          />
        </div>

        <div class="step-description" data-js="step-description">
          <span class="section-step-desc-node">
            {props.sectionVars.initialContent?.description}
          </span>
        </div>

        <ul class="step-tools">
          <Index each={props.sectionVars.initialContent?.tools}>
            {(item, index) => (
              <li
                class="step-tool"
                data-js="step-tool"
                data-tool-name={item().dataName}
              >
                <div
                  class={`step-tool-inner ${
                    item().inProgress ? "inProgress" : ""
                  }`}
                >
                  <span class="step-tool-icon" innerHTML={item().icon || ""} />
                  <span class="step-tool-text">{item().title}</span>
                </div>
              </li>
            )}
          </Index>
        </ul>
      </Show>
      <Show when={props.sectionVars.customComponent}>
        {/* custom */}
        <Dynamic component={props.sectionVars.customComponent} />
      </Show>
    </section>
  );
}
