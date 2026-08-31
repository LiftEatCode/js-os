import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CommandCenterShell } from "@/components/command-center/shell";

export const metadata: Metadata = {
  title: {
    default: "Overview",
    template: "%s · JS OS",
  },
  description: "JS Solutions operating system Command Center.",
};

function environmentLabel(): string {
  if (process.env.NODE_ENV === "production") {
    return "Production";
  }
  return "Development";
}

export default function CommandCenterLayout({ children }: { children: ReactNode }) {
  return (
    <CommandCenterShell environment={environmentLabel()}>{children}</CommandCenterShell>
  );
}
