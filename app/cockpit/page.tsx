"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

const $ = (n: number, d = 2) => n?.toFixed ? `$${n.toFixed(d)}` : `$${n}`;
const num = (n: number) => n?.toLocaleString?.() ?? n;
const ago = (iso: string) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now"; if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

function Card({ title, value, sub, accent, wide }: { title: string; value: React.ReactNode; sub?: string; accent?: string; wide?: boolean }) {
  return (
    <div style={{ background: "var(--clr-surface)", border: `1px solid ${accent ? accent + "33" : "var(--clr-border)"}`, borderRadius: 12, padding: "18px 20px", gridColumn: wide ? "span 2" : undefined }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" as const, color: "var(--clr-text-5)", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.03em", color: accent ?? "var(--clr-text)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--clr-text-4)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "var(--clr-text-5)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Grid({ children, cols = 4 }: { children: React.ReactNode; cols?: number }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, marginBottom: 0 }}>{children}</div>;
}

export default function CockpitPage() {
  const { userId, isLoaded } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStats = useCallback(async () => {
    try {
      const s = await fetch("/api/admin/stats").then(r => r.json());
      setStats(s);
      setLastRefresh(new Date());
    } catch {}
  }, []);

  const runHealthCheck = useCallback(async () => {
    setHealthLoading(true);
    try {
      const h = await fetch("/api/admin/health").then(r => r.json());
      setHealth(h);
    } catch {} finally { setHealthLoading(false); }
  }, []);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    Promise.all([fetchStats(), runHealthCheck()]).finally(() => setLoading(false));
    const si = setInterval(fetchStats, 60000);
    return () => clearInterval(si);
  }, [isLoaded, userId, fetchStats, runHealthCheck]);

  if (!isLoaded || !userId) return <div style={{ padding: 40 }}>Loading...</div>;
  if (stats?.error) return <div style={{ padding: 40, color: "#ef4444" }}>Access denied.</div>;

  const allOk = health?.checks?.every((c: any) => c.ok);
  const failing = health?.checks?.filter((c: any) => !c.ok) ?? [];

  // Daily chart data (last 14 days)
  const dailyKeys = Object.keys(stats?.daily ?? {}).sort().slice(-14);
  const maxVal = Math.max(1, ...dailyKeys.map(k => (stats.daily[k].dig ?? 0) + (stats.daily[k].stack ?? 0)));

  // Pulse health
  const pulseAgeMin = stats?.pulse?.ageMinutes;
  const pulseOk = pulseAgeMin !== null && pulseAgeMin < 180; // warn if >3h

  return (
    <div style={{ padding: "28px 36px 80px", maxWidth: 1060, margin: "0 auto", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" as const, color: "var(--clr-text-5)", marginBottom: 4 }}>Admin</div>
          <h1 style={{ margin: 0, fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.03em" }}>Cockpit</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "var(--clr-text-5)" }}>Refreshed {lastRefresh.toLocaleTimeString()}</span>
          <button onClick={fetchStats} style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid var(--clr-border)", background: "var(--clr-surface)", color: "var(--clr-text)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>↻ Refresh</button>
          <button onClick={runHealthCheck} disabled={healthLoading} style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: allOk === false ? "#ef4444" : "#16a34a", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: healthLoading ? 0.6 : 1 }}>
            {healthLoading ? "Checking..." : allOk === false ? `⚠ ${failing.length} DOWN` : "✓ All systems go"}
          </button>
        </div>
      </div>

      {loading ? <div style={{ color: "var(--clr-text-4)", fontSize: 13 }}>Loading data...</div> : <>

        {/* SITE HEALTH */}
        <Section title="🛡 Site health">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginBottom: failing.length ? 10 : 0 }}>
            {(health?.checks ?? []).map((c: any) => (
              <div key={c.name} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 12px",
                borderRadius: 7, border: `1px solid ${c.ok ? "#bbf7d0" : "#fecaca"}`,
                background: c.ok ? "#f0fdf4" : "#fef2f2",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.ok ? "#16a34a" : "#ef4444", display: "inline-block", flexShrink: 0, animation: c.ok ? undefined : "pulse-dot 1s infinite" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: c.ok ? "#15803d" : "#dc2626" }}>{c.name}</span>
                <span style={{ fontSize: 11, color: c.ok ? "#4ade80" : "#f87171" }}>{c.latency}ms</span>
              </div>
            ))}
          </div>
          {/* Error detail */}
          {failing.map((c: any) => (
            <div key={c.name} style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 3 }}>🚨 {c.name} — HTTP {c.status || "TIMEOUT"}</div>
              {c.error && <div style={{ fontSize: 11, color: "#ef4444", fontFamily: "monospace" }}>{c.error}</div>}
              <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 2 }}>{c.url}</div>
            </div>
          ))}
        </Section>

        {/* USAGE TODAY */}
        <Section title="📊 Usage today">
          <Grid cols={4}>
            <Card title="New users today" value={stats?.users?.today ?? 0} sub={`${num(stats?.users?.week ?? 0)} this week · ${num(stats?.users?.total ?? 0)} total`} />
            <Card title="Reports today" value={stats?.reports?.today ?? 0} sub={`${num(stats?.reports?.week ?? 0)} this week · ${num(stats?.reports?.total ?? 0)} total`} />
            <Card title="Dig today" value={stats?.reports?.dig?.today ?? 0} sub={`${num(stats?.reports?.dig?.total ?? 0)} total`} accent="#7c6fff" />
            <Card title="Stack today" value={stats?.reports?.stack?.today ?? 0} sub={`${num(stats?.reports?.stack?.total ?? 0)} total`} accent="#0ea5e9" />
          </Grid>
        </Section>

        {/* REVENUE */}
        <Section title="💰 Revenue">
          <Grid cols={4}>
            <Card title="Revenue today" value={$(stats?.revenue?.today ?? 0)} sub={`${$(stats?.revenue?.week ?? 0)} this week`} accent="#16a34a" />
            <Card title="Total revenue" value={$(stats?.revenue?.total ?? 0)} sub="all time" accent="#16a34a" />
            <Card title="Orders today" value={stats?.orders?.today ?? 0} sub={`${num(stats?.orders?.total ?? 0)} total orders`} />
            <Card title="Credits sold" value={num(stats?.orders?.credits ?? 0)} sub="total credits distributed" />
          </Grid>
          {/* Recent orders */}
          {(stats?.orders?.recent ?? []).length > 0 && (
            <div style={{ marginTop: 12, background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ borderBottom: "1px solid var(--clr-border)" }}>
                  {["When", "Package", "Credits", "Amount"].map(h => (
                    <th key={h} style={{ padding: "8px 14px", textAlign: "left" as const, fontSize: 10, fontWeight: 700, color: "var(--clr-text-5)", letterSpacing: ".06em", textTransform: "uppercase" as const }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {stats.orders.recent.map((o: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--clr-border)" }}>
                      <td style={{ padding: "8px 14px", color: "var(--clr-text-3)" }}>{ago(o.created_at)}</td>
                      <td style={{ padding: "8px 14px", fontWeight: 600, color: "var(--clr-text)" }}>{o.package_slug}</td>
                      <td style={{ padding: "8px 14px", color: "var(--clr-text)" }}>{o.credits_added}</td>
                      <td style={{ padding: "8px 14px", color: "#16a34a", fontWeight: 700 }}>{$(o.amount_usd ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* API COSTS — link to console */}
        <Section title="💸 API costs (Anthropic)">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" as const, color: "var(--clr-text-5)", marginBottom: 10 }}>March 2026 total (baseline)</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--clr-text)" }}>$40.04</div>
              <div style={{ fontSize: 11, color: "var(--clr-text-4)", marginTop: 6 }}>Sonnet $16.07 · Opus $11.33 · Haiku $8.45</div>
              <div style={{ marginTop: 10, fontSize: 11, color: "var(--clr-text-4)" }}>Dig/Stack: ~$0.45–0.75/query · Pulse: ~$3.21/day</div>
            </div>
            <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: "18px 20px", display: "flex", flexDirection: "column" as const, justifyContent: "space-between" }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" as const, color: "var(--clr-text-5)", marginBottom: 10 }}>Live usage & billing</div>
              <div style={{ fontSize: 13, color: "var(--clr-text-3)", lineHeight: 1.6 }}>Real-time token counts and costs are in Anthropic Console</div>
              <a href="https://console.anthropic.com/workspaces/default/cost" target="_blank" rel="noopener noreferrer"
                style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "#7c6fff", color: "#fff", textDecoration: "none", fontSize: 12, fontWeight: 700, width: "fit-content" }}>
                Open Anthropic Console ↗
              </a>
            </div>
          </div>
        </Section>

        {/* PULSE STATUS */}
        <Section title="📡 Pulse">
          <Grid cols={3}>
            <Card
              title="Last update"
              value={stats?.pulse?.generatedAt ? ago(stats.pulse.generatedAt) : "Never"}
              sub={stats?.pulse?.generatedAt ? new Date(stats.pulse.generatedAt).toLocaleString() : "—"}
              accent={pulseOk ? undefined : "#ef4444"}
            />
            <Card title="Signals in feed" value={num(stats?.pulse?.signals ?? 0)} sub="active signals" />
            <Card title="Feed age" value={pulseAgeMin !== null ? `${pulseAgeMin}m` : "?"}
              sub={pulseOk ? "✓ Fresh" : "⚠ Stale — check cron"}
              accent={pulseOk ? "#16a34a" : "#ef4444"}
            />
          </Grid>
        </Section>

        {/* ACTIVITY CHART (last 14 days) */}
        <Section title="📈 Daily activity (last 14 days)">
          <div style={{ background: "var(--clr-surface)", border: "1px solid var(--clr-border)", borderRadius: 12, padding: "20px 20px 12px" }}>
            {dailyKeys.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--clr-text-5)" }}>No data yet</div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
                {dailyKeys.map(k => {
                  const d = stats.daily[k];
                  const total = (d.dig ?? 0) + (d.stack ?? 0);
                  const h = Math.max(4, Math.round((total / maxVal) * 72));
                  return (
                    <div key={k} style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2 }} title={`${k}: ${d.dig} Dig, ${d.stack} Stack`}>
                      <div style={{ width: "100%", display: "flex", flexDirection: "column" as const, justifyContent: "flex-end", height: 72 }}>
                        <div style={{ height: h, borderRadius: 4, background: total > 0 ? "var(--clr-accent)" : "var(--clr-border)", opacity: total > 0 ? 1 : 0.4 }} />
                      </div>
                      <div style={{ fontSize: 9, color: "var(--clr-text-5)", transform: "rotate(-45deg)", marginTop: 4, whiteSpace: "nowrap" as const }}>{k.slice(5)}</div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: 16, fontSize: 11, color: "var(--clr-text-5)", display: "flex", gap: 16 }}>
              <span>Dig (total): <strong style={{ color: "var(--clr-text)" }}>{num(stats?.reports?.dig?.total ?? 0)}</strong></span>
              <span>Stack (total): <strong style={{ color: "var(--clr-text)" }}>{num(stats?.reports?.stack?.total ?? 0)}</strong></span>
              <span>Reports this week: <strong style={{ color: "var(--clr-text)" }}>{num(stats?.reports?.week ?? 0)}</strong></span>
            </div>
          </div>
        </Section>

        {/* QUICK LINKS */}
        <Section title="🔗 Quick links">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
            {[
              ["Anthropic Console", "https://console.anthropic.com/workspaces/default/cost"],
              ["Vercel Dashboard", "https://vercel.com/sametduman00s-projects/unbuilt"],
              ["Supabase", "https://supabase.com/dashboard/project/jlqawgrtnbizwqigbyho"],
              ["Clerk Users", "https://dashboard.clerk.com"],
              ["Google Analytics", "https://analytics.google.com"],
              ["Paddle Dashboard", "https://vendors.paddle.com"],
            ].map(([label, url]) => (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--clr-border)", background: "var(--clr-surface)", color: "var(--clr-text)", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                {label} ↗
              </a>
            ))}
          </div>
        </Section>

        <div style={{ fontSize: 11, color: "var(--clr-text-5)", textAlign: "center" as const, marginTop: 20 }}>Auto-refreshes every 60s · {lastRefresh.toLocaleString()}</div>
      </>}
    </div>
  );
}
