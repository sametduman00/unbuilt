"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { generatePdf, type ReportData } from "@/app/lib/generatePdf";

type Report = ReportData;



export default function ReportsPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.push("/"); return; }
    fetch("/api/reports").then(r => r.json()).then(d => setReports(d.reports ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, [isSignedIn, isLoaded, router]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch("/api/reports", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setReports(r => r.filter(x => x.id !== id));
    setDeleting(null);
  };

  const handlePdf = (report: Report) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsPDF = (window as any).jspdf?.jsPDF;
    if (!jsPDF) { alert("PDF library loading, please wait a moment and try again."); return; }
    setGenerating(report.id);
    try { generatePdf(report, jsPDF); }
    catch (err) { console.error("PDF error:", err); }
    finally { setTimeout(() => setGenerating(null), 1500); }
  };

  const toolColor = (t2: string) => t2 === "gap-analysis" ? "#7c6fff" : "#38bdf8";
  const toolLabelText = (t2: string) => t2 === "gap-analysis" ? "Gap Analysis" : "Stack Advisor";

  return (
    <div style={{ padding: "32px 40px", maxWidth: 960, margin: "0 auto" }}>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" strategy="lazyOnload" />
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--clr-text-4)", marginBottom: 6 }}>My Reports</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--clr-text)", margin: 0 }}>Your analyses</h1>
        <p style={{ fontSize: 14, color: "var(--clr-text-3)", marginTop: 6, marginBottom: 0 }}>Every Gap Analysis and Stack Advisor report you have run.</p>
      </div>
      {loading && <div style={{ padding: "48px 0", textAlign: "center", color: "var(--clr-text-4)", fontSize: 14 }}>Loading...</div>}
      {!loading && reports.length === 0 && (
        <div style={{ padding: "64px 32px", textAlign: "center", border: "1px dashed var(--clr-border)", borderRadius: 12 }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }}><path d="M8 6h16l8 8v22H8V6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M24 6v8h8" stroke="currentColor" strokeWidth="2" /><path d="M13 20h14M13 27h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--clr-text-2)", marginBottom: 6 }}>No reports yet</div>
          <div style={{ fontSize: 13, color: "var(--clr-text-4)" }}>Run a Gap Analysis or Stack Advisor to get started.</div>
        </div>
      )}
      {!loading && reports.length > 0 && (
        <div style={{ border: "1px solid var(--clr-border)", borderRadius: 12, overflow: "hidden", background: "var(--clr-surface)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 150px 120px 36px", padding: "10px 20px", background: "var(--clr-surface-2)", borderBottom: "1px solid var(--clr-border)" }}>
            {["Idea", "Tool", "Date", "", ""].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: "var(--clr-text-4)" }}>{h}</div>
            ))}
          </div>
          {reports.map((report, i) => (
            <div key={report.id}
              style={{ display: "grid", gridTemplateColumns: "1fr 130px 150px 120px 36px", alignItems: "center", padding: "14px 20px", borderBottom: i < reports.length - 1 ? "1px solid var(--clr-border)" : "none", transition: "background 0.1s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--clr-surface-2)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
              <div title={report.idea} style={{ fontSize: 14, fontWeight: 500, color: "var(--clr-text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden", paddingRight: 16 }}>{report.idea}</div>
              <div><span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", padding: "3px 8px", borderRadius: 5, background: `${toolColor(report.tool)}18`, color: toolColor(report.tool) }}>{toolLabelText(report.tool)}</span></div>
              <div style={{ fontSize: 13, color: "var(--clr-text-3)" }}>{new Date(report.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
              <div>
                <button onClick={() => handlePdf(report)} disabled={generating === report.id}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: "1px solid var(--clr-border)", background: "transparent", color: "var(--clr-text-2)", fontSize: 12, fontWeight: 600, cursor: generating === report.id ? "default" : "pointer", fontFamily: "inherit", opacity: generating === report.id ? 0.6 : 1 }}
                  onMouseEnter={e => { if (generating !== report.id) (e.currentTarget as HTMLButtonElement).style.background = "var(--clr-surface-2)"; }}
                  onMouseLeave={e => { if (generating !== report.id) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                  {generating === report.id ? "..." : (<><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 11v1.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>PDF</>)}
                </button>
              </div>
              <div>
                <button onClick={() => handleDelete(report.id)} disabled={deleting === report.id}
                  style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", opacity: deleting === report.id ? 0.3 : 0.45 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.45"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V2.5h4V4M5 4v8.5A1.5 1.5 0 006.5 14h3A1.5 1.5 0 0011 12.5V4" stroke="#ef4444" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
