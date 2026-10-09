/** Unified Record mark: one source SVG for the shell and browser tab. */
export const platformMarkUrl = "/iop-mark.svg?v=unified-record";

export function PlatformMark() {
  return (
    <img src={platformMarkUrl} width="32" height="32" alt="" aria-hidden="true" />
  );
}
