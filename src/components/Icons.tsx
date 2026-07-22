import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    ...props,
  };
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function IconMapPin(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="3" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a3 3 0 0 1 0 5.74" />
    </svg>
  );
}

export function IconBrain(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 4a4 4 0 0 0-4 4v1a3 3 0 0 0-2 2.8V14a3 3 0 0 0 2 2.8V18a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-1.2A3 3 0 0 0 18 14v-2.2A3 3 0 0 0 16 9V8a4 4 0 0 0-4-4Z" />
      <path d="M12 8v12" />
    </svg>
  );
}

export function IconUtensils(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 3v8M7 11v10M4 3v5a3 3 0 0 0 3 3M17 3v7c0 1.7-1.3 3-3 3v7M17 3h3v4a3 3 0 0 1-3 3" />
    </svg>
  );
}

export function IconMicrobe(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </svg>
  );
}

export function IconPill(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m10.5 6.5 7 7a3.5 3.5 0 0 1-5 5l-7-7a3.5 3.5 0 1 1 5-5Z" />
      <path d="m11.5 12.5 3-3" />
    </svg>
  );
}

export function IconStethoscope(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 3v7a4 4 0 0 0 8 0V3" />
      <path d="M6 5H4M14 5h2" />
      <path d="M18 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
      <path d="M14 14v1a4 4 0 0 0 4 4h0a4 4 0 0 0 4-4v-1" />
    </svg>
  );
}

export function IconFlask(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 3h6M10 3v6l-5 8.5A2 2 0 0 0 6.7 21h10.6a2 2 0 0 0 1.7-3.5L14 9V3" />
    </svg>
  );
}

export function IconMoon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z" />
    </svg>
  );
}

export function IconXCircle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function IconMessage(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
    </svg>
  );
}

export function IconStar(props: IconProps) {
  return (
    <svg {...base({ ...props, fill: "currentColor", stroke: "none" })}>
      <path d="m12 3 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 7.2 18.9l.9-5.4L4.2 8.7l5.4-.8L12 3Z" />
    </svg>
  );
}

export function IconChevron(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function IconWhatsApp(props: IconProps) {
  return (
    <svg {...base({ ...props, fill: "currentColor", stroke: "none" })}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.76.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.78 14.08c-.24.68-1.4 1.25-1.95 1.33-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.26-4.79-4.2-4.93-4.39-.14-.2-1.17-1.56-1.17-2.97 0-1.42.74-2.11 1-2.4.26-.28.57-.35.76-.35h.55c.17 0 .41-.07.64.49.24.58.81 2 .88 2.14.07.14.12.31.02.5-.1.2-.15.32-.3.49-.14.17-.3.38-.43.51-.14.14-.29.29-.12.56.17.28.75 1.23 1.61 2 .1.99 2.04 1.82 2.34 1.96.3.14.48.12.65-.07.18-.2.74-.86.94-1.15.2-.3.4-.24.67-.14.27.1 1.72.81 2.01.96.3.14.49.22.56.34.08.13.08.74-.16 1.42Z" />
    </svg>
  );
}
