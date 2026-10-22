import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (p: P) => ({
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "icon",
  ...p,
});

export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
export const IconMenu = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
export const IconArrow = (p: P) => (
  <svg {...base({ className: "icon flip-rtl", ...p })}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const IconGlobe = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
);
export const IconInfo = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);
export const IconPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
export const IconPhone = (p: P) => (
  <svg {...base(p)}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" />
  </svg>
);
export const IconA11y = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="4.5" r="1.8" />
    <path d="M5 8.5c2.3.7 4.6 1 7 1s4.7-.3 7-1M12 9.5v4.5M12 14l-3 6.5M12 14l3 6.5" />
  </svg>
);
export const IconLogout = (p: P) => (
  <svg {...base({ className: "icon flip-rtl", ...p })}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);
export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </svg>
);
export const IconEdit = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
  </svg>
);
export const IconCard = (p: P) => (
  <svg {...base(p)}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </svg>
);

export const IconWhatsApp = (p: P) => (
  <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor" aria-hidden className="icon" {...p}>
    <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4ZM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8ZM12 0a12 12 0 0 0-10.3 18L0 24l6.2-1.6A12 12 0 1 0 12 0Z" />
  </svg>
);

/** Simple car silhouettes by size, used in the booking panel */
export function CarIcon({ kind }: { kind: string }) {
  const paths: Record<string, string> = {
    small: "M8 20h28M10 20v-5l5-6h12l5 6v5M15 9l-1 6h16l-2-6",
    sedan: "M4 20h36M6 20v-4l4-1 6-6h12l7 6 3 1v4M16 9l-3 6h21",
    suv: "M4 20h36M5 20v-7l4-1 4-6h18l5 6 3 1v7M13 6l-2 6h24",
    large: "M3 20h38M4 20V12l4-2 3-5h20v7h8l1 8M11 5l-2 5h22",
    van: "M3 20h38M4 20V7l3-3h26l6 8 1 8M33 4v8h6",
  };
  return (
    <svg className="car-icon" viewBox="0 0 44 28" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[kind] ?? paths.sedan} />
      <circle cx="13" cy="21" r="3" fill="var(--surface-2)" />
      <circle cx="31" cy="21" r="3" fill="var(--surface-2)" />
    </svg>
  );
}
