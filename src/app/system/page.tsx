import type { Metadata } from "next";

import { SystemShowcase } from "@/components/system-showcase";

export const metadata: Metadata = { title: "Design system" };

export default function SystemPage() {
  return <SystemShowcase />;
}
