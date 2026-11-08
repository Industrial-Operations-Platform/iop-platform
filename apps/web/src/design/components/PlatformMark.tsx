/** Owner-supplied artwork shared by the introduction, workspace and browser tab. */
export const platformMarkUrl = "/iop-logo.png?v=gear-pulse-transparent-v1";

export function PlatformMark() {
  return (
    <img className="iop-platform-logo" src={platformMarkUrl} width="144" height="48" alt="" aria-hidden="true" />
  );
}
