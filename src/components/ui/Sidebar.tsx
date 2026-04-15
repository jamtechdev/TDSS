"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Campaigns", href: "/dashboard/campaigns", icon: "📢" },
  { name: "A/B Tests", href: "/dashboard/ab-tests", icon: "🧪" },
  { name: "Conversions", href: "/dashboard/conversions", icon: "🛒" },
  { name: "Domains", href: "/dashboard/domains", icon: "🌐" },
  { name: "Reports", href: "/dashboard/reports", icon: "📈" },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside style={{ width: 240, flexShrink: 0, background: "var(--color-surface-1)", borderRight: "1px solid var(--color-surface-4)", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0 }}>
      <div style={{ height: 56, display: "flex", alignItems: "center", gap: 10, padding: "0 20px", borderBottom: "1px solid var(--color-surface-4)" }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--color-brand-600)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>TDS</div>
          <div style={{ fontSize: 9, color: "#8b93a6", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>Traffic Distribution</div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {nav.map((item) => {
          const active = path === item.href || (item.href !== "/dashboard" && path.startsWith(item.href));
          return (
            <Link key={item.name} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: "none", transition: "all 0.15s",
              background: active ? "rgba(26,108,245,0.12)" : "transparent",
              color: active ? "var(--color-brand-400)" : "#8b93a6",
              border: active ? "1px solid rgba(26,108,245,0.2)" : "1px solid transparent",
            }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: "12px 20px", borderTop: "1px solid var(--color-surface-4)", fontSize: 11, color: "#555d6f" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-green)", display: "inline-block" }} />
          System Active
        </div>
        <div style={{ marginTop: 2, fontSize: 10 }}>Sync every 15 min</div>
      </div>
    </aside>
  );
}
