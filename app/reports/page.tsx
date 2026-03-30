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
    if(!confirm("Delete this report?")) return;
    setDeleting(id);
    await fetch("/api/reports", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setReports(r => r.filter(x => x.id !== id));
    setDeleting(null);
  };

  const handlePdf = (report: Report) => {
    const jsPDF = (window as any).jspdf?.jsPDF;
    if (!jsPDF) { alert("PDF library loading, please wait and try again."); return; }
    setGenerating(report.id);
    try { generatePdf(report, jsPDF); }
    catch (err) { console.error("PDF error:", err); }
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

      {/* Empty state */}
      {!loading && reports.length === 0 && (
        <div style={{ padding: "64px 32px", textAlign: "center", border: "1px dashed var(--clr-border)", borderRadius: 12 }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }}>
            <path d="M8 6h16l8 8v22H8V6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M24 6v8h8" stroke="currentColor" strokeWidth="2" />
            <path d="M13 20h14M13 27h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--clr-text-2)", marginBottom: 6 }}>No reports yet</div>
          <div style={{ fontSize: 13, color: "var(--clr-text-4)" }}>Run a Dig or Stack to get started.</div>
        </div>
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
