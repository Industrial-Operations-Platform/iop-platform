import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";

export type IntroModule = "analysis" | "maintenance" | "workforce";
type Capability = "signals" | "distribution" | "equipment" | "people" | "planning" | "history";

const capabilities: readonly { id: Capability; x: number; y: number; modules: readonly IntroModule[] }[] = [
  { id: "signals", x: 126, y: 122, modules: ["analysis"] },
  { id: "distribution", x: 300, y: 64, modules: ["analysis"] },
  { id: "people", x: 474, y: 122, modules: ["workforce"] },
  { id: "planning", x: 474, y: 382, modules: ["maintenance", "workforce"] },
  { id: "history", x: 300, y: 440, modules: ["analysis", "maintenance", "workforce"] },
  { id: "equipment", x: 126, y: 382, modules: ["maintenance"] },
];
const gearContour = Array.from({ length: 32 }, (_, index) => {
  const angle = index * Math.PI / 16;
  const radius = index % 4 === 1 || index % 4 === 2 ? 28 : 22;
  return `${(Math.cos(angle) * radius).toFixed(2)},${(Math.sin(angle) * radius).toFixed(2)}`;
}).join(" ");

function CapabilityGlyph({ feature }: { feature: Capability }) {
  switch (feature) {
    case "signals":
      return <path d="M-28 8h10l8-22L0 23 10-9l8 17h10" />;
    case "distribution":
      return <><path d="M-26 25h52" /><rect x="-24" y="-2" width="10" height="20" rx="2" /><rect x="-5" y="-24" width="10" height="42" rx="2" /><rect x="14" y="-12" width="10" height="30" rx="2" /></>;
    case "people":
      return <><circle cx="0" cy="-15" r="7" /><circle cx="-20" cy="-9" r="5" /><circle cx="20" cy="-9" r="5" /><path d="M-12 23v-9a12 12 0 0 1 24 0v9M-31 19v-5a11 11 0 0 1 13-11M31 19v-5A11 11 0 0 0 18 3" /></>;
    case "planning":
      return <><rect x="-25" y="-22" width="50" height="48" rx="6" /><path d="M-13-28v12M13-28v12M-25-7h50M-13 5h6M7 5h6M-13 16h6M7 16h6" /></>;
    case "history":
      return <><path d="M-27-9a27 27 0 1 1 0 18M-27-23v14h14" /><path d="M0-15V0l12 8" /></>;
    case "equipment":
      return <><polygon points={gearContour} /><circle r="10" /></>;
  }
}

function resetParallax(element: HTMLDivElement) {
  element.style.setProperty("--intro-offset-x", "0px");
  element.style.setProperty("--intro-offset-y", "0px");
}

/** Decorative capability associations; module buttons provide accessible selection. */
export function IntroScene({ active, paused }: { active: IntroModule; paused: boolean }) {
  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const reset = () => {
      if (scene.current) resetParallax(scene.current);
    };
    if (paused || preference?.matches) reset();
    preference?.addEventListener("change", reset);
    return () => preference?.removeEventListener("change", reset);
  }, [paused]);
  const parallax = (event: PointerEvent<HTMLDivElement>) => {
    if (paused || event.pointerType !== "mouse" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty("--intro-offset-x", `${x * 12}px`);
    event.currentTarget.style.setProperty("--intro-offset-y", `${y * 10}px`);
  };
  return (
    <div ref={scene} className="intro-scene" aria-hidden="true"
      style={{ "--intro-offset-x": "0px", "--intro-offset-y": "0px" } as CSSProperties}
      onPointerMove={parallax} onPointerLeave={(event) => resetParallax(event.currentTarget)}>
      <div className="intro-scene-depth">
        <svg className="intro-capability-map" viewBox="0 -16 600 536" fill="none">
          <circle className="intro-map-orbit" cx="300" cy="252" r="192" />
          <circle className="intro-map-orbit intro-map-orbit--inner" cx="300" cy="252" r="125" />
          {capabilities.map((capability) => {
            const illuminated = capability.modules.includes(active);
            return (
              <path key={capability.id} className="intro-connection"
                data-feature={capability.id} data-illuminated={illuminated}
                d={`M300 252L${capability.x} ${capability.y}`} />
            );
          })}
          <g className="intro-hub">
            <circle className="intro-hub-halo" cx="300" cy="252" r="82" />
            <circle className="intro-hub-rim" cx="300" cy="252" r="70" />
            <circle className="intro-hub-surface" cx="300" cy="252" r="62" />
            <image className="intro-hub-mark" href="/iop-mark.svg" x="262" y="214" width="76" height="76" />
          </g>
          {capabilities.map((capability, index) => (
            <g key={capability.id} className="intro-capability"
              data-feature={capability.id} data-illuminated={capability.modules.includes(active)}
              transform={`translate(${capability.x} ${capability.y})`}>
              <g className="intro-scene-float" style={{ animationDelay: `${index * -1.3}s` }}>
                <circle className="intro-capability-halo" r="56" />
                <circle className="intro-capability-rim" r="49" />
                <circle className="intro-capability-surface" r="44" />
                <g className="intro-capability-glyph"><CapabilityGlyph feature={capability.id} /></g>
                <circle className="intro-capability-indicator" cx="35" cy="-35" r="3" />
              </g>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
