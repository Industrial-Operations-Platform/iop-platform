import type { ReactNode } from "react";

const shapes: Record<string, ReactNode> = {
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
    </>
  ),
  logout: <path d="M9 4H4v16h5M14 8l4 4-4 4M9 12h11" />,
  chevron: <path d="m8 10 4 4 4-4" />,
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
};
export function ActionIcon({
  name,
}: {
  name: "user" | "logout" | "chevron" | "bell" | "search" | "arrow";
}) {
  return (
    <svg
      className="iop-toolbar-glyph"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {shapes[name]}
    </svg>
  );
}
