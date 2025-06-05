import {FloatingPanel} from "@ark-ui/solid/floating-panel";
import {createSignal, Show} from "solid-js";
import {DocumentEventListener} from "@solid-primitives/event-listener";
import {Portal} from "solid-js/web";
import {tools} from "@src/content";

export function ToolDetail() {
  const [scrollToolXY, setToolXY] = createSignal({
    x: 0,
    y: 0,
  });
  const [toolDetailSize, setToolDetailSize] = createSignal({
    width: 225,
    height: 240,
  });
  const [toolDetails, setToolDetails] = createSignal({
    title: "",
    description: "",
    link: "",
  });
  const [openTool, setOpenTool] = createSignal<HTMLElement | null>();
  const [scrollWhenOpened, setScrollWhenOpened] = createSignal(0);

  function closeTool() {
    openTool()?.classList.remove("open");
    setOpenTool(null);
  }
  function closeOnEscape(e: KeyboardEvent) {
    if (e.key === "Escape") {
      closeTool();
    }
  }
  function closeOnDeltaScrollGreaterThan(e: Event) {
    const winScroll = window.scrollY;
    if (Math.abs(winScroll - scrollWhenOpened()) > 150) {
      closeTool();
    }
  }

  function checkToolClick(e: MouseEvent) {
    const tgt = e.target as HTMLElement;
    const target = tgt.closest('[data-js="step-tool"]');
    if (!target) {
      if (openTool()) {
        openTool()?.classList.remove("open");
        setOpenTool(null);
      }
      return;
    }

    let currentToolOpen = openTool();
    currentToolOpen && currentToolOpen.classList.remove("open");
    const nearestSection = tgt.closest('[data-js="section"]');
    const toolName = target.getAttribute("data-tool-name");
    const matchingTool = Object.values(tools).find(
      (tool) => tool.dataName === toolName
    );
    if (!matchingTool) {
      return;
    }
    setScrollWhenOpened(window.scrollY);
    setToolDetails({
      title: matchingTool.title,
      // @ts-ignore
      description: matchingTool.description || "",
      // @ts-ignore
      link: matchingTool.linkOut || "",
    });
    const dataContrast = nearestSection?.getAttribute("data-contrast");
    console.log({dataContrast});

    target.classList.add("open");
    document.documentElement.style.setProperty(
      "--tool-detail-contrast",
      dataContrast || ""
    );
    // set the --data-contrast  on root:
    setOpenTool(target as HTMLElement);
    const elRect = target.getBoundingClientRect();
    // just el y cause will use as pos fixed

    // set the x and y to the fat side of the window;
    // debugger;
    const windowWidth = window.innerWidth;

    const edgeRightSpace = windowWidth - elRect.right;
    if (window.innerWidth < 500) {
      // just center it in the window:
      setToolDetailSize({
        width: Math.min(window.innerWidth / 1.5, 180),
        height: Math.min(window.innerHeight / 1.5, 220),
      });
      setToolXY({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
    } else {
      // if there is bottom overflow we need to bring it up by the difference - 16; top shouldn't be a problem cause we anchor from the top cornernes I think;

      const bottomOverflow =
        window.innerHeight -
        elRect.y -
        toolDetailSize().height +
        0.5 * toolDetailSize().height; //the  .5 is cause there is a -50% transform on the panel for center
      // debugger;
      let y = elRect.y;
      if (bottomOverflow < 0) {
        y = elRect.y + bottomOverflow - 32; //+ bottomOverflow cause it is negative
      }
      if (edgeRightSpace > 350) {
        // use the top right corner
        setToolXY({
          x: elRect.right + 16 + 0.5 * toolDetailSize().width,
          y,
        });
      } else {
        // use the top left corner
        setToolXY({
          x: elRect.left - 16 - 0.5 * toolDetailSize().width,
          y,
        });
      }
      setOpenTool(target as HTMLElement);
    }
  }

  return (
    <>
      <FloatingPanel.Root
        id="toolDetail"
        closeOnEscape={true}
        draggable={false}
        position={scrollToolXY()}
        resizable={false}
        open={!!openTool()}
        size={toolDetailSize()}
      >
        <Portal>
          <FloatingPanel.Positioner class="tool-popup-positioner">
            <FloatingPanel.Content class={`tool-popup`}>
              <FloatingPanel.Body class="tool-popup-body">
                <h3>{toolDetails().title}</h3>
                <Show when={toolDetails().description}>
                  <p>{toolDetails().description}</p>
                </Show>
                <Show when={toolDetails().link}>
                  <a target="_blank" href={toolDetails().link}>
                    Learn More
                  </a>
                </Show>
              </FloatingPanel.Body>
            </FloatingPanel.Content>
          </FloatingPanel.Positioner>
        </Portal>
      </FloatingPanel.Root>
      {/* <FloatingPanel class="tool-detail" position="right">
      <div>Tool Detail</div>
    </FloatingPanel> */}
      <DocumentEventListener
        onClick={checkToolClick}
        onKeydown={closeOnEscape}
        onScroll={closeOnDeltaScrollGreaterThan}
      />
      ;
    </>
  );
}
