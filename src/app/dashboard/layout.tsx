"use client";
import { Sidebar } from "@/components/ui/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: 32 }}>{children}</div>
      </main>
    </div>
  );
}
