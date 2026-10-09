import type { SVGProps } from "react";

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  viewBox: "0 0 24 24",
} as const;

export function SearchIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width={19} height={19} {...base} {...p}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.5" y2="16.5" />
    </svg>
  );
}

export function UserIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width={19} height={19} {...base} {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </svg>
  );
}

export function HeartIcon({
  filled,
  ...p
}: SVGProps<SVGSVGElement> & { filled?: boolean }) {
  return (
    <svg
      width={19}
      height={19}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.4}
      {...p}
    >
      <path d="M12 20s-7-4.6-9.3-9C1.2 8.3 2.5 5 5.6 5c2 0 3.3 1.4 4.4 3 1.1-1.6 2.4-3 4.4-3 3.1 0 4.4 3.3 2.9 6-2.3 4.4-9.3 9-9.3 9z" />
    </svg>
  );
}

export function BagIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width={19} height={19} {...base} {...p}>
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export function MenuIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width={22} height={22} {...base} {...p}>
      <line x1="3" y1="7" x2="21" y2="7" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="17" x2="21" y2="17" />
    </svg>
  );
}

export function CloseIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width={20} height={20} {...base} {...p}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

export function CheckIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width={17} height={17} {...base} strokeWidth={1.6} {...p}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function ChevronRight(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width={16} height={16} {...base} {...p}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function InstagramIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width={16} height={16} {...base} strokeWidth={1.5} {...p}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function PinterestIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg width={16} height={16} {...base} strokeWidth={1.5} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8c-1.7 0-3 1.2-3 2.8 0 .9.5 1.8 1 2 .1 0 .1 0 .1-.1l.2-.8c0-.1 0-.1-.1-.2-.3-.3-.4-.7-.4-1.1 0-1.3 1-2.3 2.5-2.3 1.4 0 2.2.8 2.2 2 0 1.5-.7 2.8-1.7 2.8-.5 0-.9-.5-.8-1 .1-.6.5-1.3.5-1.8 0-.4-.2-.8-.7-.8-.6 0-1 .6-1 1.4 0 .5.2.8.2.8s-.6 2.6-.7 3.1c-.1.5 0 1.2 0 1.3 0 .1.1.1.1 0 .1-.1.7-.9.9-1.4l.4-1.4c.2.4.8.7 1.4.7 1.8 0 3.1-1.7 3.1-3.8C16.9 9.6 15.5 8 12 8z" />
    </svg>
  );
}
