import {InfraDecoSvg} from "@svgs/decorative/Infra";

export function InfraSectionContent() {
  return (
    <div class="infra-container infraGrid" data-js="infraGrid">
      <div class="infrGridCard">WACS</div>
      <div class="infrGridCard">Audio Biel</div>
      <div class="infrGridCard">Public Data API</div>
      <div class="infrGridCard">Scripture Rendering Pipeline</div>
      <div class="infrGridCard">Brightcove (3rd Party)</div>
      <div class="infraGridDeco">
        <InfraDecoSvg />
      </div>
    </div>
  );
}
