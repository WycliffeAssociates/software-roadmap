import {InfraDecoSvg} from "@svgs/decorative/Infra";

export function InfraSectionContent() {
  return (
    <>
      <p class="infraCopy" data-js="specialCopy">
        These are some of the core pieces of our infrastructure that underpin
        all of our operations.
      </p>
      <div class="infra-container infraGrid" data-js="infraGrid">
        <div data-tool-name="wacs" data-js="step-tool" class="infrGridCard">
          WACS
        </div>
        <div
          data-tool-name="audioBiel"
          data-js="step-tool"
          class="infrGridCard"
        >
          Audio Biel
        </div>
        <div
          data-js="step-tool"
          data-tool-name="publicDataApi"
          class="infrGridCard"
        >
          Public Data API
        </div>
        <div data-js="step-tool" data-tool-name="srp" class="infrGridCard">
          Scripture Rendering Pipeline
        </div>
        <div
          data-js="step-tool"
          data-tool-name="brightcove"
          class="infrGridCard"
        >
          Brightcove (3rd Party)
        </div>
        <div class="infraGridDeco">
          <InfraDecoSvg />
        </div>
      </div>
    </>
  );
}
