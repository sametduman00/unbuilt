"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Report {
  id: string;
  tool: "gap-analysis" | "stack-advisor";
  idea: string;
  created_at: string;
  json_content: string;
}

function buildPdf(report: Report): string {
  const toolLabel = report.tool === "gap-analysis" ? "Gap Analysis" : "Stack Advisor";
  const dateStr = new Date(report.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const e = (s: unknown) => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  
  let p: Record<string, unknown> = {};
  try {
    const m = report.json_content.match(/```json\s*([\s\S]*?)```/);
    p = JSON.parse(m ? m[1] : report.json_content);
  } catch { return "<p>Could not parse report data.</p>"; }

  const arr = <T,>(v: unknown): T[] => Array.isArray(v) ? v as T[] : [];
  const str = (v: unknown): string => typeof v === "string" ? v : "";
  const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v)) ? v as Record<string, unknown> : {};

  const sections: string[] = [];

  // Overview
  const score = p.marketScore != null ? `<div class="score">${e(p.marketScore)}<span class="score-sub">/100</span></div><div class="score-label">${e(p.marketScoreLabel ?? "")}</div>` : "";
  if (p.marketScoreSummary) sections.push(`<h2>Overview</h2>${score}<p>${e(p.marketScoreSummary)}</p>`);
  if (p.oneLiner) sections.push(`<h2>One-liner</h2><blockquote>"${e(p.oneLiner)}"</blockquote>`);

  // Market Size
  const ms = obj(p.marketSize);
  if (ms.tam || ms.sam) sections.push(`<h2>Market Size</h2>
    <table><tr><th>TAM</th><th>SAM</th><th>SOM</th><th>Growth</th></tr>
    <tr><td>${e(ms.tam)}</td><td>${e(ms.sam)}</td><td>${e(ms.som)}</td><td>${e(ms.growthRate)}</td></tr></table>`);

  // Community Signals
  const cs = obj(p.communitySignals);
  const reddit = arr<{title:string;votes:unknown;url:string}>(p.redditPosts || cs.redditPosts);
  const xposts = arr<{text:string;likes:unknown}>(p.xPosts || cs.xPosts);
  if (reddit.length || xposts.length) {
    let html = "<h2>Community Signals</h2>";
    if (reddit.length) html += `<h3>Reddit</h3><ul>${reddit.map(r=>`<li><strong>${e(r.title)}</strong> — ${e(r.votes)} upvotes</li>`).join("")}</ul>`;
    if (xposts.length) html += `<h3>X / Twitter</h3><ul>${xposts.map(x=>`<li>${e(x.text)} <em>(${e(x.likes)} likes)</em></li>`).join("")}</ul>`;
    sections.push(html);
  }

  // Competitors
  const comps = arr<{name:string;tagline:string;rating:unknown;reviews:unknown;platform:string}>(p.competitors);
  if (comps.length) sections.push(`<h2>Competitors</h2>
    <table><tr><th>Name</th><th>Tagline</th><th>Rating</th><th>Reviews</th></tr>
    ${comps.map(c=>`<tr><td><strong>${e(c.name)}</strong></td><td>${e(c.tagline)}</td><td>${e(c.rating)}</td><td>${e(c.reviews)}</td></tr>`).join("")}</table>`);

  // Market Gaps
  const gaps = arr<{title:string;description:string;opportunityScore:unknown;status:string}>(p.marketGaps);
  if (gaps.length) sections.push(`<h2>Market Gaps</h2>
    ${gaps.map(g=>`<div class="card"><div class="card-title">${e(g.title)} <span class="badge">${e(g.status)}</span></div><p>${e(g.description)}</p></div>`).join("")}`);

  // Pain Points
  const pain = arr<{quote:string;source:string;badge:string[]}>(p.painPoints);
  if (pain.length) sections.push(`<h2>Pain Points</h2><ul>
    ${pain.map(pp=>`<li>"${e(pp.quote)}" <em>(${e(pp.source)})</em></li>`).join("")}</ul>`);

  // Go-to-Market
  const gtm = obj(p.goToMarket);
  if (gtm.launchTarget || gtm.channels) {
    let html = "<h2>Go-to-Market</h2>";
    if (gtm.launchTarget) html += `<p><strong>Launch target:</strong> ${e(gtm.launchTarget)}</p>`;
    const channels = arr<{channel:string;why:string;cac:string}>(gtm.channels);
    if (channels.length) html += `<ul>${channels.map(c=>`<li><strong>${e(c.channel)}</strong>: ${e(c.why)}${c.cac?` — CAC: ${e(c.cac)}`:""}</li>`).join("")}</ul>`;
    const phases = arr<{phase:string;actions:unknown[]}>(gtm.launchPhases);
    if (phases.length) html += `<h3>Launch Phases</h3><ol>${phases.map(ph=>`<li><strong>${e(ph.phase)}</strong></li>`).join("")}</ol>`;
    sections.push(html);
  }

  // Financial Deep
  const fin = obj(p.financialDeep);
  const finSimple = obj(p.financials);
  const finSrc = Object.keys(fin).length ? fin : finSimple;
  if (Object.keys(finSrc).length) {
    let html = "<h2>Financials</h2>";
    if (finSrc.revenueModel) html += `<p><strong>Revenue model:</strong> ${e(finSrc.revenueModel)}</p>`;
    if (finSrc.summary) html += `<p>${e(finSrc.summary)}</p>`;
    const models = arr<{model:string;monthlyRevenue:string;pros:string}>(finSrc.revenueModels);
    if (models.length) html += `<ul>${models.map(m=>`<li><strong>${e(m.model)}</strong>${m.monthlyRevenue?` (${e(m.monthlyRevenue)})`:""}${m.pros?`: ${e(m.pros)}`:""}</li>`).join("")}</ul>`;
    sections.push(html);
  }

  // Validation Checklist
  const vc = arr<{item:string;status:string}>(p.validationChecklist);
  if (vc.length) sections.push(`<h2>Validation Checklist</h2><ul>
    ${vc.map(v=>`<li>${v.status==="done"?"✓":v.status==="partial"?"◐":"○"} ${e(v.item)}</li>`).join("")}</ul>`);

  // Synthesis
  const syn = obj(p.synthesis);
  const synText = str(syn.oneParagraph);
  const pros = arr<string>(syn.workingForYou);
  const cons = arr<string>(syn.watchOutFor);
  if (synText || pros.length || cons.length) {
    let html = "<h2>Synthesis</h2>";
    if (synText) html += `<p>${e(synText)}</p>`;
    if (pros.length) html += `<h3>✓ Working for you</h3><ul>${pros.map((x:string)=>`<li>${e(x)}</li>`).join("")}</ul>`;
    if (cons.length) html += `<h3>⚠ Watch out for</h3><ul>${cons.map((x:string)=>`<li>${e(x)}</li>`).join("")}</ul>`;
    sections.push(html);
  }

  const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;color:#111;max-width:800px;margin:0 auto;padding:40px 32px;line-height:1.65;font-size:13px}
.header{margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #e5e7eb}
.badge-tool{display:inline-block;background:#eff6ff;color:#1d4ed8;padding:2px 9px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px}
h1{font-size:22px;font-weight:700;margin:4px 0}.meta{color:#6b7280;font-size:12px;margin-top:4px}
.score{font-size:52px;font-weight:800;color:#6366f1;line-height:1;margin:14px 0 2px;display:inline-block}
.score-sub{font-size:22px;color:#9ca3af;font-weight:400}.score-label{font-size:12px;color:#6b7280;margin-bottom:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#374151;margin:36px 0 10px;padding-bottom:6px;border-bottom:1.5px solid #e5e7eb}
h3{font-size:11px;font-weight:700;color:#6b7280;margin:14px 0 6px;text-transform:uppercase;letter-spacing:.05em}
p{margin:0 0 10px;font-size:13px}ul,ol{margin:0 0 12px;padding-left:20px}li{margin-bottom:5px}
blockquote{background:#faf5ff;border-left:3px solid #7c6fff;margin:0 0 16px;padding:14px 18px;font-style:italic;color:#4c1d95;border-radius:0 6px 6px 0;font-size:13px}
table{width:100%;border-collapse:collapse;margin:0 0 14px;font-size:12px}
th{background:#f9fafb;border:1px solid #e5e7eb;padding:7px 10px;font-weight:600;text-align:left;color:#374151}
td{border:1px solid #e5e7eb;padding:7px 10px;vertical-align:top}
.card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px 14px;margin-bottom:10px}
.card-title{font-weight:600;font-size:13px;margin-bottom:6px}
.badge{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:1px 6px;border-radius:3px;background:#dcfce7;color:#166534;margin-left:6px}
.footer{margin-top:48px;padding-top:14px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:10px;text-align:center}
@media print{body{padding:20px}h2{page-break-after:avoid}.card{page-break-inside:avoid}tr{page-break-inside:avoid}}
`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${e(toolLabel)} — ${e(report.idea)}</title><style>${css}</style></head><body>
<div class="header">
  <div class="badge-tool">${e(toolLabel)}</div>
  <h1>${e(report.idea)}</h1>
  <div class="meta">${dateStr}</div>
</div>
${sections.join("\n")}
<div class="footer">Generated by Unbuilt.me · ${dateStr}</div>
</body></html>`;
}

export default function ReportsPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.push("/"); return; }
    fetch("/api/reports")
      .then(r => r.json())
      .then(d => setReports(d.reports ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isSignedIn, isLoaded, router]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch("/api/reports", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setReports(r => r.filter(x => x.id !== id));
    setDeleting(null);
  };

  const handlePdf = (report: Report) => {
    const html = buildPdf(report);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      win.addEventListener("load", () => {
        setTimeout(() => { win.focus(); win.print(); }, 500);
      });
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const toolColor = (tool: string) => tool === "gap-analysis" ? "#7c6fff" : "#38bdf8";
  const toolLabel = (tool: string) => tool === "gap-analysis" ? "Gap Analysis" : "Stack Advisor";

  return (
    <div style={{ padding: "32px 40px", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--clr-text-4)", marginBottom: 6 }}>My Reports</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--clr-text)", margin: 0 }}>Your analyses</h1>
        <p style={{ fontSize: 14, color: "var(--clr-text-3)", marginTop: 6, marginBottom: 0 }}>Every Gap Analysis and Stack Advisor report you've run.</p>
      </div>

      {loading && (
        <div style={{ padding: "48px 0", textAlign: "center", color: "var(--clr-text-4)", fontSize: 14 }}>Loading…</div>
      )}

      {!loading && reports.length === 0 && (
        <div style={{ padding: "64px 32px", textAlign: "center", border: "1px dashed var(--clr-border)", borderRadius: 12, color: "var(--clr-text-4)" }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }}><path d="M8 6h16l8 8v22H8V6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M24 6v8h8" stroke="currentColor" strokeWidth="2"/><path d="M13 20h14M13 27h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--clr-text-2)", marginBottom: 6 }}>No reports yet</div>
          <div style={{ fontSize: 13, color: "var(--clr-text-4)" }}>Run a Gap Analysis or Stack Advisor to get started.</div>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div style={{ border: "1px solid var(--clr-border)", borderRadius: 12, overflow: "hidden", background: "var(--clr-surface)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 150px 110px 36px", padding: "10px 20px", background: "var(--clr-surface-2)", borderBottom: "1px solid var(--clr-border)", gap: 0 }}>
            {["Idea", "Tool", "Date", "", ""].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "var(--clr-text-4)" }}>{h}</div>
            ))}
          </div>

          {reports.map((report, i) => (
            <div key={report.id}
              style={{ display: "grid", gridTemplateColumns: "1fr 130px 150px 110px 36px", alignItems: "center", padding: "14px 20px", borderBottom: i < reports.length - 1 ? "1px solid var(--clr-border)" : "none", transition: "background 0.1s", gap: 0 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--clr-surface-2)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}
            >
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--clr-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 16 }}>
                {report.idea}
              </div>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", padding: "3px 8px", borderRadius: 5, background: `${toolColor(report.tool)}18`, color: toolColor(report.tool) }}>
                  {toolLabel(report.tool)}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--clr-text-3)" }}>
                {new Date(report.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </div>
              <div>
                <button onClick={() => handlePdf(report)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: "1px solid var(--clr-border)", background: "transparent", color: "var(--clr-text-2)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "var(--clr-surface-2)"}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 11v1.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  PDF
                </button>
              </div>
              <div>
                <button onClick={() => handleDelete(report.id)} disabled={deleting === report.id}
                  style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", opacity: deleting === report.id ? 0.3 : 0.45 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.45"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V2.5h4V4M5 4v8.5A1.5 1.5 0 006.5 14h3A1.5 1.5 0 0011 12.5V4" stroke="#ef4444" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
