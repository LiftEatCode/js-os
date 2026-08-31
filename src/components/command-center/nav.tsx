import type { ReactNode } from "react";

export type CommandCenterNavItem = {
  label: string;
  href: string;
  description: string;
  icon: NavIconName;
};

export type NavIconName =
  | "overview"
  | "goals"
  | "work"
  | "activity"
  | "approvals"
  | "agents"
  | "knowledge";

export const COMMAND_CENTER_NAV: CommandCenterNavItem[] = [
  {
    label: "Overview",
    href: "/app",
    description: "Current company state and owner attention.",
    icon: "overview",
  },
  {
    label: "Goals",
    href: "/app/goals",
    description: "Strategic objectives and measurable progress.",
    icon: "goals",
  },
  {
    label: "Work",
    href: "/app/work",
    description: "WorkItems across JS Solutions.",
    icon: "work",
  },
  {
    label: "Activity",
    href: "/app/activity",
    description: "BusinessEvent operational history.",
    icon: "activity",
  },
  {
    label: "Approvals",
    href: "/app/approvals",
    description: "Human decision and authorization queue.",
    icon: "approvals",
  },
  {
    label: "Agents",
    href: "/app/agents",
    description: "Organizational AgentDefinitions and future activity.",
    icon: "agents",
  },
  {
    label: "Knowledge",
    href: "/app/knowledge",
    description: "Internal JS OS and company documentation.",
    icon: "knowledge",
  },
];

export function isCommandCenterNavActive(pathname: string, href: string): boolean {
  if (href === "/app") {
    return pathname === "/app";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const iconClassName = "size-4 shrink-0";

export function NavIcon({ name }: { name: NavIconName }): ReactNode {
  switch (name) {
    case "overview":
      return (
        <svg className={iconClassName} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "goals":
      return (
        <svg className={iconClassName} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="12" cy="12" r="1.25" fill="currentColor" />
        </svg>
      );
    case "work":
      return (
        <svg className={iconClassName} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="4" y="7" width="16" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
          <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    case "activity":
      return (
        <svg className={iconClassName} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 12h4l2.5-6 3 12 2.5-6H20"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "approvals":
      return (
        <svg className={iconClassName} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
          <path d="m8.5 12.5 2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "agents":
      return (
        <svg className={iconClassName} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="9" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="16" cy="9" r="2" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M4.5 18c.4-2.4 2.4-4 4.5-4s4.1 1.6 4.5 4M13 17.5c.5-1.6 1.9-2.7 3.5-2.7 1.3 0 2.5.7 3.1 1.8"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      );
    case "knowledge":
      return (
        <svg className={iconClassName} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21.5V5.5Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M5 18h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
  }
}
