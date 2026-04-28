"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { generatePdf, type ReportData } from "@/app/lib/generatePdf";

type Report = Omit<ReportData, "json_content"> & { json_content?: string };

export default function ReportsPage() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportsError, setReportsError] = useState(false);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    // Drop the legacy single-key cache from before the per-user fix.
    try { localStorage.removeItem("unbuilt_isPro"); } catch {}
    if (!isLoaded) return;
    if (!isSignedIn) { router.push("/"); return; }
    // Read cached Pro state first so the empty-state CTA doesn't flash the wrong variant.
    if (userId) {
      try {
        const cached = localStorage.getItem(`unbuilt_isPro:${userId}`);
        if (cached === "true") setIsPro(true);
        else if (cached === "false") setIsPro(false);
      } catch {}
    }
    fetch("/api/user/plan")
      .then(async r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d) return; // API failed — keep cached state
        const pro = d.isPro ?? false;
        setIsPro(pro);
        if (userId) {
          try { localStorage.setItem(`unbuilt_isPro:${userId}`, String(pro)); } catch {}
        }
      })
      .catch(() => {});
    // Distinguish "no reports yet" from "API failed" — the previous code showed
    // an empty state in both cases, which made Supabase outages look like
    // missing data.
    fetch("/api/reports")
      .then(async r => {
        if (!r.ok) { setReportsError(true); return null; }
        return r.json();
      })
      .then(d => { if (d) setReports(d.reports ?? []); })
      .catch(() => setReportsError(true))
      .finally(() => setLoading(false));
  }, [isSignedIn, isLoaded, userId, router]);

  const handleDelete = async (id: string) => {
    if(!confirm("Delete this report?")) return;
    setDeleting(id);
    try {
      const r = await fetch("/api/reports", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!r.ok) {
        alert("Couldn't delete right now — please try again in a moment.");
        return;
      }
      setReports(r => r.filter(x => x.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const handlePdf = async (report: Report) => {
    const jsPDF = (window as any).jspdf?.jsPDF;
    if (!jsPDF) { alert("PDF library loading, please wait and try again."); return; }
    setGenerating(report.id);
    try {
      // Lazy-load full report content if not already in memory.
      // The list endpoint intentionally omits json_content for speed.
      let full: Report = report;
      if (!report.json_content) {
        const r = await fetch(`/api/reports/${report.id}`);
        if (!r.ok) throw new Error(`fetch failed: ${r.status}`);
        const j = await r.json();
        if (!j?.report?.json_content) throw new Error("missing content");
        full = j.report as Report;
      }
      generatePdf(full as ReportData, jsPDF);
    }
    catch (err) {
      console.error("PDF error:", err);
      alert("Could not generate PDF. Please try again.");
    }
    finally { setTimeout(() => setGenerating(null), 1500); }
  };

  const toolColor = (t: string) => t === "gap-analysis" ? "#7c6fff" : "#38bdf8";
  const toolLabel = (t: string) => t === "gap-analysis" ? "Dig" : "Stack";

  return (
    <div style={{ padding: "32px 24px 80px", maxWidth: 760, margin: "0 auto" }}>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" strategy="lazyOnload" />

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "var(--clr-text-4)", marginBottom: 6 }}>My Reports</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--clr-text)", margin: "0 0 6px" }}>Your analyses</h1>
        <p style={{ fontSize: 14, color: "var(--clr-text-3)", margin: 0 }}>Every Dig and Stack report you've run.</p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ padding: "48px 0", textAlign: "center", color: "var(--clr-text-4)", fontSize: 14 }}>Loading...</div>
      )}

      {/* Error state — distinguishes Supabase outage from genuine empty list */}
      {!loading && reportsError && (
        <div style={{ padding: "48px 32px", textAlign: "center", border: "1px solid #fecaca", background: "#fef2f2", borderRadius: 12 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block" }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#991b1b", marginBottom: 6 }}>Couldn't load your reports</div>
          <div style={{ fontSize: 13, color: "#7f1d1d", marginBottom: 16 }}>Our database is having a temporary issue. Your reports are safe — please try again in a few minutes.</div>
          <button onClick={() => window.location.reload()} style={{
            padding: "8px 18px", borderRadius: 8, border: "1px solid #fecaca",
            background: "#fff", color: "#991b1b", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>Retry</button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !reportsError && reports.length === 0 && (
        isPro === false ? (
          /* Free user — upgrade CTA */
          <div style={{ padding: "56px 32px", textAlign: "center", borderRadius: 16, background: "linear-gradient(135deg, #f5f3ff 0%, #eef2ff 50%, #fdf2f8 100%)", border: "1px solid #e9e5ff" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#fff", boxShadow: "0 2px 12px rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <path d="M9 15l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Save your analyses</div>
            <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, maxWidth: 360, margin: "0 auto 24px" }}>
              Pro members get full reports saved automatically —<br/>revisit, compare, and export as PDF anytime.
            </div>
            <a href="/pricing" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 12,
              background: "#6366f1", color: "#fff",
              fontSize: "0.9rem", fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(99,102,241,0.25)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,102,241,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.25)"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Upgrade to Pro
            </a>
          </div>
        ) : (
          /* Pro user — no reports yet */
          <div style={{ padding: "64px 32px", textAlign: "center", border: "1px dashed var(--clr-border)", borderRadius: 12 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }}>
              <path d="M8 6h16l8 8v22H8V6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M24 6v8h8" stroke="currentColor" strokeWidth="2" />
              <path d="M13 20h14M13 27h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--clr-text-2)", marginBottom: 6 }}>No reports yet</div>
            <div style={{ fontSize: 13, color: "var(--clr-text-4)" }}>Run a Dig or Stack to get started.</div>
          </div>
        )
      )}

      {/* Cards */}
      {!loading && reports.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {reports.map((report) => (
            <div key={report.id} style={{
              background: "var(--clr-surface)",
              border: "1px solid var(--clr-border)",
              borderRadius: 12,
              padding: "16px 18px",
            }}>
              {/* Top row: badge + date + actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" as const }}>
                {/* Tool badge */}
                <span style={{
                  fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const,
                  letterSpacing: "0.06em", padding: "3px 9px", borderRadius: 5,
                  background: `${toolColor(report.tool)}18`, color: toolColor(report.tool)
                }}>
                  {toolLabel(report.tool)}
                </span>

                {/* Date */}
                <span style={{ fontSize: 12, color: "var(--clr-text-4)", flex: 1 }}>
                  {new Date(report.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>

                {/* PDF button */}
                <button
                  onClick={() => handlePdf(report)}
                  disabled={generating === report.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 11px", borderRadius: 7,
                    border: "1px solid var(--clr-border)", background: "transparent",
                    color: "var(--clr-text-2)", fontSize: 12, fontWeight: 600,
                    cursor: generating === report.id ? "default" : "pointer",
                    fontFamily: "inherit", opacity: generating === report.id ? 0.5 : 1
                  }}>
                  {generating === report.id ? "..." : (
                    <>
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                        <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 11v1.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                      PDF
                    </>
                  )}
                </button>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(report.id)}
                  disabled={deleting === report.id}
                  style={{
                    width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 6, border: "none", background: "transparent",
                    cursor: "pointer", opacity: deleting === report.id ? 0.3 : 0.5
                  }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M3 4h10M6 4V2.5h4V4M5 4v8.5A1.5 1.5 0 006.5 14h3A1.5 1.5 0 0011 12.5V4" stroke="#ef4444" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Idea text */}
              <div style={{
                fontSize: 14, fontWeight: 500, color: "var(--clr-text)",
                lineHeight: 1.5,
                display: "-webkit-box", WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical" as const, overflow: "hidden"
              }}>
                {report.idea}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
