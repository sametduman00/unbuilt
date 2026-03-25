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

  const handleDownload = (report: Report) => {
    const toolLabel = report.tool === "gap-analysis" ? "Gap Analysis" : "Stack Advisor";
    const dateStr = new Date(report.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const esc = (s: unknown) => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    let p: Record<string, unknown> = {};
    try { const m = report.json_content.match(/```json\s*([\s\S]*?)```/); p = JSON.parse(m ? m[1] : report.json_content); } catch {}

    const arr = <T,>(v: unknown): T[] => Array.isArray(v) ? v as T[] : [];
    const str = (v: unknown) => typeof v === "string" ? v : "";
    const objR = (v: unknown): Record<string,string> => (v && typeof v === "object" && !Array.isArray(v)) ? v as Record<string,string> : {};

    const sections: string[] = [];
    const score = p.marketScore ? `<div class="score">${esc(p.marketScore)}<span class="score-sub">/100</span></div>` : "";
    const summary = str(p.marketScoreSummary);
    if (summary) sections.push(`<h2>Overview</h2>${score}<p>${esc(summary)}</p>`);
    const ol = objR(p.oneLiner); if (ol.text || str(p.oneLiner)) sections.push(`<h2>One-liner</h2><blockquote>"${esc(ol.text || str(p.oneLiner))}"</blockquote>`);
    const ms = objR(p.marketSizing);
    if (ms.tam || ms.summary) sections.push(`<h2>Market Data</h2>${ms.tam?`<p><strong>TAM:</strong> ${esc(ms.tam)}</p>`:""}${ms.summary?`<p>${esc(ms.summary)}</p>`:""}`);
    const reddit = arr<{title:string;votes:string}>(p.redditPosts);
    const xposts = arr<{text:string;likes:string}>(p.xPosts);
    if (reddit.length || xposts.length) {
      let html = "<h2>Community Signals</h2>";
      if (reddit.length) html += "<h3>Reddit</h3><ul>" + reddit.map(r=>`<li><strong>${esc(r.title)}</strong> — ${esc(r.votes)} votes</li>`).join("") + "</ul>";
      if (xposts.length) html += "<h3>X</h3><ul>" + xposts.map(x=>`<li>${esc(x.text)}</li>`).join("") + "</ul>";
      sections.push(html);
    }
    const comps = arr<{name:string;tagline:string}>(p.competitors);
    if (comps.length) sections.push(`<h2>Competitors</h2><ul>${comps.map(c=>`<li><strong>${esc(c.name)}</strong> — ${esc(c.tagline)}</li>`).join("")}</ul>`);
    const gaps = arr<{title:string;description:string;opportunity:string}>(p.marketGaps);
    if (gaps.length) sections.push(`<h2>Market Gaps</h2>${gaps.map(g=>`<div class="gap"><strong>${esc(g.title)}</strong><p>${esc(g.description)}</p>${g.opportunity?`<p class="opp">${esc(g.opportunity)}</p>`:""}</div>`).join("")}`);
    const pain = arr<{quote:string;source:string}>(p.painPoints);
    if (pain.length) sections.push(`<h2>Pain Points</h2><ul>${pain.map(pp=>`<li>"${esc(pp.quote)}" <em>(${esc(pp.source)})</em></li>`).join("")}</ul>`);
    const gtm = objR(p.goToMarket);
    if (gtm.summary || gtm.cac) sections.push(`<h2>Go-to-Market</h2>${gtm.summary?`<p>${esc(gtm.summary)}</p>`:""}${gtm.cac?`<p><strong>CAC:</strong> ${esc(gtm.cac)}</p>`:""}`);
    const fin = objR(p.financials);
    if (fin.summary || fin.revenueModel) sections.push(`<h2>Financials</h2>${fin.revenueModel?`<p><strong>Model:</strong> ${esc(fin.revenueModel)}</p>`:""}${fin.summary?`<p>${esc(fin.summary)}</p>`:""}`);
    const ap = arr<{step:string;description:string;timeline:string}>(p.actionPlan);
    if (ap.length) sections.push(`<h2>Action Plan</h2><ol>${ap.map(a=>`<li><strong>${esc(a.step)}</strong>${a.timeline?` <em>(${esc(a.timeline)})</em>`:""}<br>${esc(a.description)}</li>`).join("")}</ol>`);
    const syn = objR(p.synthesis);
    const synText = syn.oneParagraph || str(p.synthesis);
    const pros = arr<string>(syn.working || p.workingForYou);
    const cons = arr<string>(syn.watchOut || p.watchOut);
    if (synText || pros.length || cons.length) {
      let html = "<h2>Synthesis</h2>";
      if (synText) html += `<p>${esc(synText)}</p>`;
      if (pros.length) html += `<h3>Working for you</h3><ul>${pros.map((x:string)=>`<li>${esc(x)}</li>`).join("")}</ul>`;
      if (cons.length) html += `<h3>Watch out</h3><ul>${cons.map((x:string)=>`<li>${esc(x)}</li>`).join("")}</ul>`;
      sections.push(html);
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(toolLabel)} — ${esc(report.idea)}</title><style>
*{box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;color:#111;max-width:760px;margin:0 auto;padding:40px 32px;line-height:1.65;font-size:14px}
.header{margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #e5e7eb}.badge{display:inline-block;background:#eff6ff;color:#1d4ed8;padding:2px 9px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px}
h1{font-size:22px;font-weight:700;margin:0 0 4px}.meta{color:#6b7280;font-size:13px;margin:0}.score{font-size:48px;font-weight:800;color:#6366f1;line-height:1;margin:12px 0 0}.score-sub{font-size:20px;color:#9ca3af}
h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#374151;margin:36px 0 10px;padding-bottom:5px;border-bottom:1px solid #e5e7eb}
h3{font-size:12px;font-weight:700;color:#6b7280;margin:14px 0 6px;text-transform:uppercase;letter-spacing:.05em}
p{margin:0 0 10px}ul,ol{margin:0 0 12px;padding-left:20px}li{margin-bottom:5px}
blockquote{background:#faf5ff;border-left:3px solid #7c6fff;margin:0 0 16px;padding:12px 16px;font-style:italic;color:#4c1d95;border-radius:0 6px 6px 0}
.gap{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px 14px;margin-bottom:10px}.opp{color:#059669;font-size:13px;margin:4px 0 0}
.footer{margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px;text-align:center}
@media print{body{padding:20px}h2{page-break-after:avoid}.gap{page-break-inside:avoid}}
</style></head><body>
<div class="header"><div class="badge">${esc(toolLabel)}</div><h1>${esc(report.idea)}</h1><p class="meta">${dateStr}</p></div>
${sections.join("\n")}
<div class="footer">Generated by Unbuilt.me · ${dateStr}</div>
</body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 600); }
  };

  const toolColor = (tool: string) => tool === "gap-analysis" ? "#7c6fff" : "#38bdf8";
  const toolLabel = (tool: string) => tool === "gap-analysis" ? "Gap Analysis" : "Stack Advisor";

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--clr-text-4)", marginBottom: 6 }}>My Reports</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--clr-text)", margin: 0 }}>Your analyses</h1>
        <p style={{ fontSize: 14, color: "var(--clr-text-3)", marginTop: 6 }}>Every Gap Analysis and Stack Advisor report you've run.</p>
      </div>

      {loading && (
        <div style={{ padding: "48px 0", textAlign: "center", color: "var(--clr-text-4)", fontSize: 14 }}>Loading…</div>
      )}

      {!loading && reports.length === 0 && (
        <div style={{ padding: "64px 32px", textAlign: "center", border: "1px dashed var(--clr-border)", borderRadius: 12, color: "var(--clr-text-4)" }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: "0 auto", display: "block" }}><path d="M8 6h16l8 8v22H8V6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M24 6v8h8" stroke="currentColor" strokeWidth="2"/><path d="M13 20h14M13 27h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--clr-text-2)", marginBottom: 6 }}>No reports yet</div>
          <div style={{ fontSize: 13, color: "var(--clr-text-4)" }}>Run a Gap Analysis or Stack Advisor to get started.</div>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid var(--clr-border)", borderRadius: 12, overflow: "hidden", background: "var(--clr-surface)" }}>
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 140px 120px 36px", gap: 0, padding: "10px 20px", background: "var(--clr-surface-2)", borderBottom: "1px solid var(--clr-border)" }}>
            {["Idea", "Tool", "Date", "", ""].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--clr-text-4)" }}>{h}</div>
            ))}
          </div>

          {reports.map((report, i) => (
            <div key={report.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 140px 120px 36px", gap: 0, alignItems: "center", padding: "14px 20px", borderBottom: i < reports.length - 1 ? "1px solid var(--clr-border)" : "none", transition: "background 0.1s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--clr-surface-2)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}
            >
              {/* Idea */}
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--clr-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 16 }}>
                {report.idea}
              </div>

              {/* Tool badge */}
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "3px 8px", borderRadius: 5, background: `${toolColor(report.tool)}18`, color: toolColor(report.tool) }}>
                  {toolLabel(report.tool)}
                </span>
              </div>

              {/* Date */}
              <div style={{ fontSize: 13, color: "var(--clr-text-3)" }}>
                {new Date(report.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </div>

              {/* Download */}
              <div>
                <button
                  onClick={() => handleDownload(report)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: "1px solid var(--clr-border)", background: "transparent", color: "var(--clr-text-2)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "var(--clr-surface-2)"}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 11v1.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  PDF
                </button>
              </div>

              {/* Delete */}
              <div>
                <button
                  onClick={() => handleDelete(report.id)}
                  disabled={deleting === report.id}
                  style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", opacity: deleting === report.id ? 0.4 : 0.5, transition: "opacity 0.1s, background 0.1s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.5"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
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
