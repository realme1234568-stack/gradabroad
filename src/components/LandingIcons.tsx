import type { SVGProps } from "react";
type Props = SVGProps<SVGSVGElement>;
function Icon({ children, ...props }: Props) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}
export const ArrowUpRight = (p: Props) => (
  <Icon {...p}>
    <path d="M6 18 18 6M6 6h12v12" />
  </Icon>
);
export const ArrowRight = (p: Props) => (
  <Icon {...p}>
    <path d="M4 12h16m-6-6 6 6-6 6" />
  </Icon>
);
export const Check = (p: Props) => (
  <Icon {...p}>
    <path d="m5 12 4 4L19 6" />
  </Icon>
);
export const Plus = (p: Props) => (
  <Icon {...p}>
    <path d="M5 12h14M12 5v14" />
  </Icon>
);
export const Bookmark = (p: Props) => (
  <Icon {...p}>
    <path d="M6 4h12v17l-6-4-6 4V4Z" />
  </Icon>
);
export const ListChecks = (p: Props) => (
  <Icon {...p}>
    <path d="m3 6 2 2 3-4m3 2h10M3 14l2 2 3-4m3 2h10M11 21h10" />
  </Icon>
);
export const Wallet = (p: Props) => (
  <Icon {...p}>
    <path d="M20 7H5a2 2 0 0 1 0-4h13v4M3 5v14a2 2 0 0 0 2 2h15V7m0 5h-5v4h5" />
  </Icon>
);
export const Bell = (p: Props) => (
  <Icon {...p}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
  </Icon>
);
export const Compass = (p: Props) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z" />
  </Icon>
);
export const Pause = (p: Props) => (
  <Icon {...p}>
    <path d="M9 5v14M15 5v14" />
  </Icon>
);
export const Play = (p: Props) => (
  <Icon {...p}>
    <path d="m8 5 11 7-11 7V5Z" />
  </Icon>
);
