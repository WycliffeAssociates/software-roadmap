import {InfraDecoSvg} from "@svgs/decorative/Infra";

export function InfraSectionContent() {
  return (
    <div class="infra-container infraGrid">
      <div class="infrGridCard">WACS</div>
      <div class="infrGridCard">Audio Biel</div>
      <div class="infrGridCard">Public Data API</div>
      <div class="infrGridCard">Scripture Rendering Pipeline</div>
      <div class="infrGridCard">Brightcove (3rd Party)</div>
      <div class="infraGridDeco">
        <InfraDecoSvg />
      </div>
      <svg
        class="infraRoadSvg"
        viewBox="0 0 849 355"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse
          cx="424.5"
          cy="177.5"
          rx="421.5"
          ry="174.5"
          stroke="#38383E"
          stroke-width="5"
          stroke-linecap="round"
          stroke-dasharray="1 15"
        />
      </svg>
    </div>
  );
}
