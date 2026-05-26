// Paddock Parts — custom monoline icons. 22-24px on dark backgrounds.

import type { SVGProps } from "react";

type Props = Omit<SVGProps<SVGSVGElement>, "stroke"> & { size?: number; strokeW?: number };

const I = ({ size = 22, strokeW = 1.7, children, ...rest }: Props & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeW}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...rest}
  >
    {children}
  </svg>
);

// Tab icons
export const IconGarage = (p: Props) => (
  <I {...p}>
    <path d="M3 11 L12 4 L21 11 V20 H3 Z" />
    <path d="M6 20 V13 H18 V20" />
    <path d="M6 16 H18" />
  </I>
);
export const IconSpares = (p: Props) => (
  <I {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M4.9 4.9 L7 7 M17 17 L19.1 19.1 M4.9 19.1 L7 17 M17 7 L19.1 4.9" />
  </I>
);
export const IconTrack = (p: Props) => (
  <I {...p}>
    <path d="M4 17 C 4 11, 9 8, 12 8 C 16 8, 20 11, 20 14 C 20 17, 17 18, 14 18 C 11 18, 9 16, 9 14 C 9 12, 11 11, 12 11" />
    <circle cx="12" cy="11" r="0.6" fill="currentColor" />
  </I>
);
export const IconEmergency = (p: Props) => (
  <I {...p}>
    <path d="M12 3 L21 19 H3 Z" />
    <path d="M12 10 V14" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" />
  </I>
);

// Misc
export const IconSearch = (p: Props) => (
  <I {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16 L20.5 20.5" />
  </I>
);
export const IconPlus = (p: Props) => (
  <I {...p}>
    <path d="M12 5 V19 M5 12 H19" />
  </I>
);
export const IconChevron = (p: Props) => (
  <I {...p}>
    <path d="M9 6 L15 12 L9 18" />
  </I>
);
export const IconBack = (p: Props) => (
  <I {...p}>
    <path d="M15 6 L9 12 L15 18" />
  </I>
);
export const IconClose = (p: Props) => (
  <I {...p}>
    <path d="M6 6 L18 18 M18 6 L6 18" />
  </I>
);
export const IconCheck = (p: Props) => (
  <I {...p}>
    <path d="M5 12 L10 17 L20 7" />
  </I>
);
export const IconMore = (p: Props) => (
  <I {...p}>
    <circle cx="5" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="19" cy="12" r="1" fill="currentColor" />
  </I>
);
export const IconBell = (p: Props) => (
  <I {...p}>
    <path d="M6 16 V11 C6 8 8 6 12 6 C16 6 18 8 18 11 V16 L20 18 H4 Z" />
    <path d="M10 18 C10 19.1 10.9 20 12 20 C13.1 20 14 19.1 14 18" />
  </I>
);
export const IconCamera = (p: Props) => (
  <I {...p}>
    <path d="M4 8 H8 L9.5 6 H14.5 L16 8 H20 V18 H4 Z" />
    <circle cx="12" cy="13" r="3" />
  </I>
);
export const IconBolt = (p: Props) => (
  <I {...p}>
    <path d="M13 3 L5 14 H11 L10 21 L18 10 H12 Z" />
  </I>
);
export const IconTools = (p: Props) => (
  <I {...p}>
    <path d="M14 5 A4 4 0 0 0 19 10 L13.5 15.5 L8 21 L5 18 L10.5 12.5 L16 7 A4 4 0 0 0 14 5 Z" />
  </I>
);
export const IconMsg = (p: Props) => (
  <I {...p}>
    <path d="M4 5 H20 V16 H13 L9 20 V16 H4 Z" />
  </I>
);
export const IconNoRide = (p: Props) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M5.6 5.6 L18.4 18.4" />
  </I>
);
export const IconQR = (p: Props) => (
  <I {...p}>
    <rect x="4" y="4" width="6" height="6" />
    <rect x="14" y="4" width="6" height="6" />
    <rect x="4" y="14" width="6" height="6" />
    <path d="M14 14 H16 V16 M18 14 V16 H20 M14 18 H16 V20 M18 18 V20 H20" />
  </I>
);
export const IconShield = (p: Props) => (
  <I {...p}>
    <path d="M12 3 L20 6 V12 C20 17 16 20 12 21 C8 20 4 17 4 12 V6 Z" />
  </I>
);
export const IconArrowRight = (p: Props) => (
  <I {...p}>
    <path d="M5 12 H19 M14 6 L20 12 L14 18" />
  </I>
);
export const IconClock = (p: Props) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7 V12 L15.5 14" />
  </I>
);
