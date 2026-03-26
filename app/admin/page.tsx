"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

const fmt = (n: number) => n?.toFixed ? n.toFixed(2) : n;
const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

function Stat({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: "16px 20px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" as const, color: "var(--clr-text-5)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", color: color ?? "var(--clr-text)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--clr-text-4)", marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" as const, color: "var(--clr-text-5)", marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

export default function AdminPage() {
  const { userId, isLoaded } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAll = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([
        fetch("/api/admin/stats").then(r => r.json()),
        fetch("/api/admin/health").then(r => r.json()),
      ]);
      setStats(s);
      setHealth(h);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    fetchAll();
    const interval = setInterval(fetchAll, 60000); // auto-refresh every 60s
    return () => clearInterval(interval);
  }, [isLoaded, userId, fetchAll]);

  if (!isLoaded || !userId) return <div style={{ padding: 40, color: "var(--clr-text)" }}>Loading...</div>;
  if (stats?.error) return <div style={{ padding: 40, color: "#ef4444" }}>Access denied</div>;

  const allHealthy = health?.checks?.every((c: any) => c.ok);

  return (
    <div style={{ padding: "32px 40px 80px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "var(--clr-text-5)", marginBottom: 6 }}>Admin</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>Mission Control</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "var(--clr-text-5)" }}>
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchAll}
            style={{ padding: "7px 16px", borderRadius: 8, background: "var(--clr-surface)", border: "1px solid var(--clr-border)", color: "var(--clr-text)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "var(--clr-text-4)", fontSize: 14 }}>Loading data...</div>
      ) : (
        <>
          {/* Site Status */}
          <Section title="🟢 Site health">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
              {health?.checks?.map((c: any) => (
                <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8, background: c.ok ? "#f0fdf4" : "#fef2f2", border: `1px solid ${c.ok ? "#bbf7d0" : "#fecaca"}` }}>
                  <span style={{ fontSize: 8, color: c.ok ? "#16a34a" : "#ef4444" }}>●</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.ok ? "#15803d" : "#dc2626" }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: c.ok ? "#16a34a" : "#ef4444" }}>{c.latency}ms</span>
                </div>
              ))}
              {!health?.checks?.length && <span style={{ fontSize: 13, color: "var(--clr-text-4)" }}>No checks yet</span>}
            </div>
          </Section>

          {/* Key Metrics */}
          <Section title="📊 Overview">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              <Stat label="Total users" value={stats?.users?.total ?? 0} sub={`+${stats?.users?.today ?? 0} today · +${stats?.users?.week ?? 0} this week`} />
              <Stat label="Total reports" value={stats?.reports?.total ?? 0} sub={`+${stats?.reports?.today ?? 0} today · +${stats?.reports?.week ?? 0} this week`} />
              <Stat label="Total revenue" value={`$${fmt(stats?.revenue?.total ?? 0)}`} sub={`$${fmt(stats?.revenue?.today ?? 0)} today`} color="#16a34a" />
              <Stat label="Orders" value={stats?.orders?.length ?? 0} sub="last 20" />
              <Stat label="Pulse signals" value={stats?.pulse?.signals ?? 0} sub={stats?.pulse?.generatedAt ? `Updated ${timeAgo(stats.pulse.generatedAt)}` : "Never run"} />
            </div>
          </Section>

          {/* Recent Orders */}
          <Section title="💰 Recent orders">
            {stats?.orders?.length > 0 ? (
              <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--clr-border)" }}>
                      {["Time", "Package", "Credits", "Amount", "User"].map(h => (
                        <th key={h} style={{ textAlign: "left" as const, padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "var(--clr-text-4)", letterSpacing: ".05em", textTransform: "uppercase" as const }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.orders.map((o: any) => (
                      <tr key={o.id} style={{ borderBottom: "1px solid var(--clr-border)" }}>
                        <td style={{ padding: "9px 16px", color: "var(--clr-text-3)", whiteSpace: "nowrap" as const }}>{timeAgo(o.created_at)}</td>
                        <td style={{ padding: "9px 16px", fontWeight: 600, color: "var(--clr-text)" }}>{o.package_slug}</td>
                        <td style={{ padding: "9px 16px", color: "var(--clr-text)" }}>{o.credits_added}</td>
                        <td style={{ padding: "9px 16px", color: "#16a34a", fontWeight: 700 }}>${fmt(o.amount_usd ?? 0)}</td>
                        <td style={{ padding: "9px 16px", color: "var(--clr-text-4)", fontSize: 11 }}><code>{o.user_id?.slice(0, 20)}...</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div style={{ fontSize: 13, color: "var(--clr-text-4)", padding: "12px 0" }}>No orders yet</div>}
          </Section>

          {/* Recent Reports */}
          <Section title="📋 Recent reports">
            <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--clr-border)" }}>
                    {["Time", "Tool", "Idea", "User"].map(h => (
                      <th key={h} style={{ textAlign: "left" as const, padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "var(--clr-text-4)", letterSpacing: ".05em", textTransform: "uppercase" as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentReports ?? []).map((r: any) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--clr-border)" }}>
                      <td style={{ padding: "9px 16px", color: "var(--clr-text-3)", whiteSpace: "nowrap" as const }}>{timeAgo(r.created_at)}</td>
                      <td style={{ padding: "9px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: r.tool === "gap-analysis" ? "rgba(124,111,255,0.1)" : "rgba(56,189,248,0.1)", color: r.tool === "gap-analysis" ? "#7c6fff" : "#0ea5e9" }}>
                          {r.tool === "gap-analysis" ? "Dig" : "Stack"}
                        </span>
                      </td>
                      <td style={{ padding: "9px 16px", color: "var(--clr-text)", maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{r.idea}</td>
                      <td style={{ padding: "9px 16px", color: "var(--clr-text-4)", fontSize: 11 }}><code>{r.user_id?.slice(0, 20)}...</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Pulse Status */}
          <Section title="📡 Pulse">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" as const, color: "var(--clr-text-5)", marginBottom: 6 }}>Last update</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--clr-text)" }}>
                  {stats?.pulse?.generatedAt ? new Date(stats.pulse.generatedAt).toLocaleString() : "Never"}
                </div>
                <div style={{ fontSize: 11, color: "var(--clr-text-4)", marginTop: 4 }}>
                  {stats?.pulse?.generatedAt ? timeAgo(stats.pulse.generatedAt) : "—"}
                </div>
              </div>
              <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase" as const, color: "var(--clr-text-5)", marginBottom: 6 }}>Signals in feed</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--clr-text)" }}>{stats?.pulse?.signals ?? 0}</div>
              </div>
            </div>
          </Section>

          {/* Top Ideas */}
          <Section title="💡 Top ideas this month">
            <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: "4px 0" }}>
              {(stats?.topIdeas ?? []).slice(0, 15).map((r: any, i: number) => (
                <div key={i} style={{ padding: "9px 16px", borderBottom: i < 14 ? "1px solid var(--clr-border)" : "none", fontSize: 13, color: "var(--clr-text)" }}>
                  <span style={{ color: "var(--clr-text-5)", marginRight: 10, fontSize: 11, fontWeight: 700 }}>{i + 1}.</span>
                  {r.idea}
                </div>
              ))}
              {!(stats?.topIdeas?.length) && <div style={{ padding: "12px 16px", fontSize: 13, color: "var(--clr-text-4)" }}>No reports yet</div>}
            </div>
          </Section>

          {/* Help messages */}
          <Section title="📩 Help messages">
            {(stats?.helpMessages ?? []).length > 0 ? (
              <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, overflow: "hidden" }}>
                {stats.helpMessages.map((m: any, i: number) => (
                  <div key={i} style={{ padding: "12px 16px", borderBottom: "1px solid var(--clr-border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--clr-text)" }}>{m.name ?? "Anonymous"} — {m.email}</span>
                      <span style={{ fontSize: 11, color: "var(--clr-text-5)" }}>{timeAgo(m.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--clr-text-3)" }}>{m.message}</div>
                  </div>
                ))}
              </div>
            ) : <div style={{ fontSize: 13, color: "var(--clr-text-4)" }}>No messages stored yet</div>}
          </Section>

          {/* Footer */}
          <div style={{ fontSize: 11, color: "var(--clr-text-5)", textAlign: "center" as const, marginTop: 40 }}>
            Auto-refreshes every 60 seconds · {stats?.timestamp ? new Date(stats.timestamp).toLocaleString() : ""}
          </div>
        </>
      )}
    </div>
  );
}
