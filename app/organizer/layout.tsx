// app/musician/layout.tsx
import type { ReactNode } from 'react';
import { AppShell } from "@/components/layout/AppShell";
export default function OrganizerLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
