import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import { PlatformMark } from "../design/components/PlatformMark";
import { t } from "../localization/i18n";

export type IntroModule = "analysis" | "maintenance" | "workforce";

function resetTilt(element: HTMLDivElement) {
  element.style.setProperty("--intro-tilt-x", "0deg");
  element.style.setProperty("--intro-tilt-y", "0deg");
}

/** Decorative CSS geometry; accessible module selection lives outside the scene. */
export function IntroScene({ active, paused }: { active: IntroModule; paused: boolean }) {
  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const reset = () => {
      if (scene.current) resetTilt(scene.current);
    };
    if (paused || preference?.matches) reset();
    preference?.addEventListener("change", reset);
    return () => preference?.removeEventListener("change", reset);
  }, [paused]);
  const tilt = (event: PointerEvent<HTMLDivElement>) => {
    if (paused || event.pointerType !== "mouse" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty("--intro-tilt-x", `${-y * 10}deg`);
    event.currentTarget.style.setProperty("--intro-tilt-y", `${x * 12}deg`);
  };
  return (
    <div ref={scene} className="intro-scene" aria-hidden="true"
      style={{ "--intro-tilt-x": "0deg", "--intro-tilt-y": "0deg" } as CSSProperties}
      onPointerMove={tilt} onPointerLeave={(event) => resetTilt(event.currentTarget)}>
      <div className="intro-scene-depth">
        <div className="intro-scene-ring intro-scene-ring--outer" />
        <div className="intro-scene-ring intro-scene-ring--inner" />
        <svg className="intro-scene-links" viewBox="0 0 600 540" fill="none">
          <path d="M170 150 300 260 480 245M300 260 200 400" />
          <circle cx="170" cy="150" r="4" /><circle cx="480" cy="245" r="4" /><circle cx="200" cy="400" r="4" />
        </svg>

        <div className="intro-core-float intro-scene-float">
          <div className="intro-core">
            <div className="intro-core-face intro-core-face--front"><PlatformMark /><span>IOP</span></div>
            <div className="intro-core-face intro-core-face--right" />
            <div className="intro-core-face intro-core-face--top" />
            <div className="intro-core-face intro-core-face--back" />
            <div className="intro-core-face intro-core-face--bottom" />
            <div className="intro-core-face intro-core-face--left" />
          </div>
        </div>

        <div className="intro-scene-float intro-scene-float--analysis">
          <div className="intro-scene-card" data-active={active === "analysis"}>
            <span className="intro-card-label"><span className="intro-card-dot" />{t("Data Analysis")}</span>
            <svg className="intro-chart" viewBox="0 0 180 82" fill="none">
              <path className="intro-chart-grid" d="M0 20h180M0 45h180M0 70h180" />
              <path className="intro-chart-bar" d="M15 70V48m25 22V37m25 33V48m25 22V25m25 45V35m25 35V15m25 55V27" />
              <path className="intro-chart-line" d="m10 46 28-10 26 9 26-24 27 11 25-22 28 12" />
            </svg>
          </div>
        </div>

        <div className="intro-scene-float intro-scene-float--maintenance">
          <div className="intro-scene-card" data-active={active === "maintenance"}>
            <span className="intro-card-label"><span className="intro-card-dot" />{t("Maintenance")}</span>
            <div className="intro-maintenance-graphic">
              <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m34 8 12 0 3 9 8 4 9-2 6 10-6 7v9l6 7-6 10-9-2-8 4-3 9H34l-3-9-8-4-9 2-6-10 6-7v-9l-6-7 6-10 9 2 8-4Z" />
                <circle cx="40" cy="40" r="14" /><path d="m33 40 5 5 10-11" />
              </svg>
              <div className="intro-maintenance-lines"><span /><span /><span /></div>
            </div>
          </div>
        </div>

        <div className="intro-scene-float intro-scene-float--workforce">
          <div className="intro-scene-card" data-active={active === "workforce"}>
            <span className="intro-card-label"><span className="intro-card-dot" />{t("Workforce")}</span>
            <svg className="intro-people" viewBox="0 0 180 76" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="5" y="7" width="48" height="60" rx="8" /><rect x="66" y="2" width="48" height="60" rx="8" /><rect x="127" y="7" width="48" height="60" rx="8" />
              <circle cx="29" cy="27" r="7" /><circle cx="90" cy="22" r="7" /><circle cx="151" cy="27" r="7" />
              <path d="M17 52v-4a12 12 0 0 1 24 0v4M78 47v-4a12 12 0 0 1 24 0v4M139 52v-4a12 12 0 0 1 24 0v4" />
            </svg>
          </div>
        </div>
        <span className="intro-scene-point intro-scene-point--one" />
        <span className="intro-scene-point intro-scene-point--two" />
      </div>
    </div>
  );
}
