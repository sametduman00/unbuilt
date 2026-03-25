"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Script from "next/script";

interface Report {
  id: string;
  tool: "gap-analysis" | "stack-advisor";
  idea: string;
  created_at: string;
  json_content: string;
}

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;color:#111;max-width:820px;margin:0 auto;padding:40px 32px;line-height:1.7;font-size:13px}
.header{margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #e5e7eb}
.badge{display:inline-block;background:#eff6ff;color:#1d4ed8;padding:2px 10px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;margin-bottom:12px}
h1{font-size:24px;font-weight:700;margin:4px 0}.meta{color:#6b7280;font-size:12px;margin-top:5px}
.score-wrap{margin:16px 0 4px}.score{font-size:56px;font-weight:800;color:#6366f1;line-height:1;display:inline-block}
.score-den{font-size:24px;color:#9ca3af;font-weight:400}.score-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#6b7280;margin-bottom:10px}
h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#374151;margin:38px 0 12px;padding-bottom:6px;border-bottom:1.5px solid #e5e7eb;page-break-after:avoid}
h3{font-size:11px;font-weight:700;color:#6b7280;margin:16px 0 8px;text-transform:uppercase;letter-spacing:.06em}
p{margin:0 0 10px}
ul,ol{margin:0 0 14px;padding-left:20px}li{margin-bottom:6px}
blockquote{background:#faf5ff;border-left:4px solid #7c6fff;margin:0 0 18px;padding:14px 18px;font-style:italic;color:#4c1d95;border-radius:0 8px 8px 0;font-size:14px}
table{width:100%;border-collapse:collapse;margin:0 0 16px;font-size:12px}
th{background:#f9fafb;border:1px solid #e5e7eb;padding:8px 10px;font-weight:600;text-align:left;color:#374151;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
td{border:1px solid #e5e7eb;padding:8px 10px;vertical-align:top}
.card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;margin-bottom:12px;page-break-inside:avoid}
.card-title{font-weight:700;font-size:13px;margin-bottom:6px;display:flex;align-items:center;gap:8px}
.tag{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:2px 7px;border-radius:3px}
.tag-untapped{background:#dcfce7;color:#166534}
.tag-emerging{background:#dbeafe;color:#1e40af}
.tag-contested{background:#fef9c3;color:#854d0e}
.tag-high{background:#fee2e2;color:#991b1b}
.tag-medium{background:#fef9c3;color:#854d0e}
.tag-low{background:#dcfce7;color:#166534}
.severity{font-size:9px;font-weight:700;padding:2px 6px;border-radius:3px;text-transform:uppercase}
.dim{color:#9ca3af;font-size:11px}
.thr{font-size:11px;font-weight:700;color:#6b7280}
.footer{margin-top:52px;padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:10px;text-align:center}
@media print{body{padding:20px}h2{page-break-after:avoid}.card{page-break-inside:avoid}tr{page-break-inside:avoid}}
`;

function buildHtml(report: Report): string {
  const label = report.tool === "gap-analysis" ? "Gap Analysis" : "Stack Advisor";
  const date = new Date(report.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const e = (s: unknown) => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const arr = <T,>(v: unknown): T[] => Array.isArray(v) ? v as T[] : [];
  const s = (v: unknown) => String(v ?? "");
  const sec: string[] = [];

  let p: Record<string,unknown> = {};
  try {
    const m = report.json_content.match(/```json\s*([\s\S]*?)```/);
    p = JSON.parse(m ? m[1] : report.json_content);
  } catch { return `<h2>Could not parse report</h2>`; }

  // 1. Score + summary
  if (p.marketScore != null) {
    sec.push(`<h2>Overview</h2>
    <div class="score-wrap"><span class="score">${e(p.marketScore)}</span><span class="score-den">/100</span></div>
    <div class="score-label">${e(p.marketScoreLabel ?? "")}</div>
    <p>${e(p.marketScoreSummary)}</p>`);
  }

  // 2. One-liner
  if (p.oneLiner) sec.push(`<h2>One-Liner</h2><blockquote>"${e(p.oneLiner)}"</blockquote>`);

  // 3. Market Size — GapMarketSize: {tam, sam, som, growthRate}
  const ms = p.marketSize as {tam?:string;sam?:string;som?:string;growthRate?:string} | undefined;
  if (ms?.tam) sec.push(`<h2>Market Size</h2>
  <table><tr><th>TAM</th><th>SAM</th><th>SOM</th><th>Growth Rate</th></tr>
  <tr><td>${e(ms.tam)}</td><td>${e(ms.sam)}</td><td>${e(ms.som)}</td><td>${e(ms.growthRate)}</td></tr></table>`);

  // 4. Community Signals — GapRedditPost + GapXPost
  const reddit = arr<{subreddit:string;title:string;body:string;upvotes?:number;sentiment:string}>(p.redditPosts);
  const xp = arr<{handle:string;text:string;likes?:number;sentiment:string}>(p.xPosts);
  if (reddit.length || xp.length) {
    let h = "<h2>Community Signals</h2>";
    if (reddit.length) {
      h += `<h3>Reddit</h3><ul>${reddit.map(r =>
        `<li><strong>${e(r.title)}</strong>${r.upvotes ? ` <span class="dim">(${r.upvotes} upvotes)</span>` : ""}${r.subreddit ? ` <span class="dim">r/${e(r.subreddit)}</span>` : ""}${r.body ? `<br><span class="dim">${e(r.body.substring(0, 150))}${r.body.length > 150 ? "…" : ""}</span>` : ""}</li>`
      ).join("")}</ul>`;
    }
    if (xp.length) {
      h += `<h3>X / Twitter</h3><ul>${xp.map(x =>
        `<li>${e(x.text)}${x.likes ? ` <span class="dim">(${x.likes} likes)</span>` : ""}${x.handle ? ` <span class="dim">@${e(x.handle)}</span>` : ""}</li>`
      ).join("")}</ul>`;
    }
    sec.push(h);
  }

  // 5. Competitors — GapCompetitor: {name, tagline, threatLevel, strengths, weaknesses}
  const comps = arr<{name:string;tagline:string;threatLevel?:number;strengths?:string[];weaknesses?:string[]}>(p.competitors);
  if (comps.length) {
    let h = "<h2>Competitors</h2>";
    comps.forEach(c => {
      h += `<div class="card">
        <div class="card-title">${e(c.name)}${c.threatLevel != null ? ` <span class="thr">Threat: ${c.threatLevel}/5</span>` : ""}</div>
        <p class="dim">${e(c.tagline)}</p>
        ${arr<string>(c.strengths).length ? `<p><strong>Strengths:</strong> ${arr<string>(c.strengths).map(e).join(" · ")}</p>` : ""}
        ${arr<string>(c.weaknesses).length ? `<p><strong>Weaknesses:</strong> ${arr<string>(c.weaknesses).map(e).join(" · ")}</p>` : ""}
      </div>`;
    });
    sec.push(h);
  }

  // 6. Market Gaps — GapMarketGap: {title, description, opportunityScore, status}
  const gaps = arr<{title:string;description:string;opportunityScore?:number;status?:string}>(p.marketGaps);
  if (gaps.length) {
    sec.push(`<h2>Market Gaps</h2>${gaps.map(g =>
      `<div class="card">
        <div class="card-title">${e(g.title)}${g.status ? ` <span class="tag tag-${g.status}">${e(g.status)}</span>` : ""}${g.opportunityScore != null ? ` <span class="dim">${g.opportunityScore}/10</span>` : ""}</div>
        <p>${e(g.description)}</p>
      </div>`
    ).join("")}`);
  }

  // 7. Pain Points — GapPainPoint: {quote, source, severity}
  const pain = arr<{quote:string;source?:string;severity?:string}>(p.painPoints);
  if (pain.length) sec.push(`<h2>Pain Points</h2><ul>${pain.map(pp =>
    `<li>${pp.severity ? `<span class="tag tag-${pp.severity} severity">${e(pp.severity)}</span> ` : ""}"${e(pp.quote)}"${pp.source ? ` <span class="dim">(${e(pp.source)})</span>` : ""}</li>`
  ).join("")}</ul>`);

  // 8. SWOT — GapSWOT: {strengths, weaknesses, opportunities, threats}
  const swot = p.swot as {strengths?:string[];weaknesses?:string[];opportunities?:string[];threats?:string[]} | undefined;
  if (swot) {
    const r = (label: string, items?: string[]) => items?.length ? `<tr><td><strong>${label}</strong></td><td><ul>${items.map(x=>`<li>${e(x)}</li>`).join("")}</ul></td></tr>` : "";
    const rows = [r("Strengths",swot.strengths),r("Weaknesses",swot.weaknesses),r("Opportunities",swot.opportunities),r("Threats",swot.threats)].filter(Boolean).join("");
    if (rows) sec.push(`<h2>SWOT</h2><table>${rows}</table>`);
  }

  // 9. Opportunity — GapOpportunity: {headline, urgency, actionItems: [{step, action, detail}]}
  const opp = p.opportunity as {headline?:string;urgency?:string;actionItems?:{step:number;action:string;detail:string}[]} | undefined;
  if (opp?.headline) {
    let h = `<h2>Opportunity</h2><p><strong>${e(opp.headline)}</strong>${opp.urgency ? ` <span class="tag tag-${opp.urgency}">${e(opp.urgency)} urgency</span>` : ""}</p>`;
    if (opp.actionItems?.length) h += `<ol>${opp.actionItems.map(a => `<li><strong>${e(a.action)}</strong>${a.detail ? `: ${e(a.detail)}` : ""}</li>`).join("")}</ol>`;
    sec.push(h);
  }

  // 10. Target Customer — GapTargetCustomer
  const tc = p.targetCustomer as {persona?:string;jobTitle?:string;demographics?:string;painPoints?:string[];currentTools?:string[];willingnessToPay?:string} | undefined;
  if (tc) {
    let h = `<h2>Target Customer</h2>`;
    if (tc.persona) h += `<p><strong>Persona:</strong> ${e(tc.persona)}</p>`;
    if (tc.jobTitle) h += `<p><strong>Job title:</strong> ${e(tc.jobTitle)}</p>`;
    if (tc.demographics) h += `<p><strong>Demographics:</strong> ${e(tc.demographics)}</p>`;
    if (tc.willingnessToPay) h += `<p><strong>Willingness to pay:</strong> ${e(tc.willingnessToPay)}</p>`;
    if (tc.painPoints?.length) h += `<h3>Pain Points</h3><ul>${tc.painPoints.map(x=>`<li>${e(x)}</li>`).join("")}</ul>`;
    if (tc.currentTools?.length) h += `<p><strong>Current tools:</strong> ${tc.currentTools.map(e).join(", ")}</p>`;
    sec.push(h);
  }

  // 11. Industry Trends — GapIndustryTrends: {now, emerging, structural} each GapIndustryTrend[]
  const trends = p.industryTrends as {now?:{trend:string;evidence:string;impact:string}[];emerging?:{trend:string;evidence:string;impact:string}[];structural?:{trend:string;evidence:string;impact:string}[]} | undefined;
  if (trends) {
    const rTrend = (items?: {trend:string;evidence:string;impact:string}[]) =>
      items?.length ? `<ul>${items.map(t => `<li><strong>${e(t.trend)}</strong>${t.impact ? ` <span class="tag tag-${t.impact}">${e(t.impact)}</span>` : ""}${t.evidence ? `<br><span class="dim">${e(t.evidence)}</span>` : ""}</li>`).join("")}</ul>` : "";
    const tN = rTrend(trends.now), tE = rTrend(trends.emerging), tSt = rTrend(trends.structural);
    if (tN || tE || tSt) {
      let h = "<h2>Industry Trends</h2>";
      if (tN) h += `<h3>Now</h3>${tN}`;
      if (tE) h += `<h3>Emerging</h3>${tE}`;
      if (tSt) h += `<h3>Structural</h3>${tSt}`;
      sec.push(h);
    }
  }

  // 12. Market Segments — GapMarketSegment: {name, fit, size, growth, description}
  const segs = arr<{name?:string;fit?:string;size?:string;growth?:string;description?:string}>(p.marketSegments);
  if (segs.length) {
    sec.push(`<h2>Market Segments</h2><table><tr><th>Segment</th><th>Fit</th><th>Size</th><th>Growth</th></tr>
    ${segs.map(sg => `<tr><td><strong>${e(sg.name)}</strong>${sg.description ? `<br><span class="dim">${e(sg.description)}</span>` : ""}</td><td>${sg.fit ? `<span class="tag tag-${sg.fit==="primary"?"untapped":sg.fit==="secondary"?"emerging":"contested"}">${e(sg.fit)}</span>` : ""}</td><td>${e(sg.size)}</td><td>${e(sg.growth)}</td></tr>`).join("")}</table>`);
  }

  // 13. Go-to-Market — GapGoToMarket: {channels: GapGTMChannel[], launchTarget, launchPhases: GapLaunchPhase[]}
  const gtm = p.goToMarket as {channels?:{name:string;type?:string;estimatedCAC?:string;description?:string}[];launchTarget?:string;launchPhases?:{phase:number;name:string;duration:string;steps?:string[]}[]} | undefined;
  if (gtm) {
    let h = "<h2>Go-to-Market</h2>";
    if (gtm.launchTarget) h += `<p><strong>Launch target:</strong> ${e(gtm.launchTarget)}</p>`;
    if (gtm.channels?.length) {
      h += `<h3>Channels</h3><table><tr><th>Channel</th><th>Type</th><th>CAC</th><th>Description</th></tr>
      ${gtm.channels.map(c => `<tr><td><strong>${e(c.name)}</strong></td><td>${c.type ? `<span class="tag tag-${c.type==="primary"?"untapped":c.type==="secondary"?"emerging":"contested"}">${e(c.type)}</span>` : ""}</td><td>${e(c.estimatedCAC)}</td><td>${e(c.description?.substring(0,120))}${(c.description?.length??0)>120?"…":""}</td></tr>`).join("")}</table>`;
    }
    if (gtm.launchPhases?.length) {
      h += `<h3>Launch Phases</h3>`;
      gtm.launchPhases.forEach(ph => {
        h += `<div class="card"><div class="card-title">Phase ${e(ph.phase)}: ${e(ph.name)} <span class="dim">(${e(ph.duration)})</span></div>`;
        if (ph.steps?.length) h += `<ul>${ph.steps.map(st => `<li>${e(st)}</li>`).join("")}</ul>`;
        h += `</div>`;
      });
    }
    sec.push(h);
  }

  // 14. Customer Interview Guide
  const cig = p.customerInterviewGuide as {questions?:string[];whereToFindThem?:string[];greenSignals?:string[];redSignals?:string[];targetInterviews?:number} | undefined;
  if (cig) {
    let h = "<h2>Customer Interview Guide</h2>";
    if (cig.targetInterviews) h += `<p><strong>Target interviews:</strong> ${e(cig.targetInterviews)}</p>`;
    if (cig.questions?.length) h += `<h3>Questions</h3><ol>${cig.questions.map(q=>`<li>${e(q)}</li>`).join("")}</ol>`;
    if (cig.whereToFindThem?.length) h += `<h3>Where to find them</h3><ul>${cig.whereToFindThem.map(x=>`<li>${e(x)}</li>`).join("")}</ul>`;
    if (cig.greenSignals?.length) h += `<h3>✓ Green signals</h3><ul>${cig.greenSignals.map(x=>`<li>${e(x)}</li>`).join("")}</ul>`;
    if (cig.redSignals?.length) h += `<h3>✗ Red signals</h3><ul>${cig.redSignals.map(x=>`<li>${e(x)}</li>`).join("")}</ul>`;
    sec.push(h);
  }

  // 15. Financials — GapFinancialDeep
  const fin = p.financialDeep as {monthlyBurn?:{total?:string;infrastructure?:string;tools?:string;marketing?:string;acquisition?:string};breakEvenMonth?:string;twelveMonthMRR?:string;revenueScenarios?:{cautious?:{mrr:string;probability:string;assumption:string};middle?:{mrr:string;probability:string;assumption:string};optimistic?:{mrr:string;probability:string;assumption:string}};pricingBenchmark?:string} | undefined;
  if (fin) {
    let h = "<h2>Financials</h2>";
    const burn = fin.monthlyBurn;
    if (burn) {
      h += `<p><strong>Monthly burn:</strong> ${e(burn.total)}</p>`;
      const burnRows = [["Infrastructure", burn.infrastructure],["Tools", burn.tools],["Marketing", burn.marketing],["Acquisition", burn.acquisition]].filter(([,v])=>v);
      if (burnRows.length) h += `<table><tr><th>Category</th><th>Cost</th></tr>${burnRows.map(([k,v])=>`<tr><td>${e(k)}</td><td>${e(s(v).substring(0,100))}${s(v).length>100?"…":""}</td></tr>`).join("")}</table>`;
    }
    if (fin.breakEvenMonth) h += `<p><strong>Break-even:</strong> month ${e(fin.breakEvenMonth)}</p>`;
    if (fin.twelveMonthMRR) h += `<p><strong>12-month MRR target:</strong> ${e(fin.twelveMonthMRR)}</p>`;
    if (fin.pricingBenchmark) h += `<p><strong>Pricing benchmark:</strong> ${e(fin.pricingBenchmark)}</p>`;
    if (fin.revenueScenarios) {
      const scens = Object.entries(fin.revenueScenarios).filter(([,v])=>v);
      if (scens.length) h += `<h3>Revenue Scenarios</h3><table><tr><th>Scenario</th><th>MRR</th><th>Probability</th><th>Assumption</th></tr>${scens.map(([k,v])=>{const sc=v as {mrr:string;probability:string;assumption:string}; return `<tr><td><strong>${e(k)}</strong></td><td>${e(sc?.mrr)}</td><td>${e(sc?.probability)}</td><td>${e(s(sc?.assumption).substring(0,100))}${s(sc?.assumption).length>100?"…":""}</td></tr>`;}).join("")}</table>`;
    }
    sec.push(h);
  }

  // 16. Target Customer Deep
  const tcd = p.targetCustomerDeep as {whoTheyAre?:string;howTheyThink?:string;availableMoney?:string;howTheyBuy?:string;triggerEvents?:string[];whereToFindThem?:string[]} | undefined;
  if (tcd) {
    let h = "<h2>Target Customer (Deep)</h2>";
    if (tcd.whoTheyAre) h += `<p><strong>Who they are:</strong> ${e(tcd.whoTheyAre)}</p>`;
    if (tcd.howTheyThink) h += `<p><strong>How they think:</strong> ${e(tcd.howTheyThink)}</p>`;
    if (tcd.availableMoney) h += `<p><strong>Budget:</strong> ${e(tcd.availableMoney)}</p>`;
    if (tcd.howTheyBuy) h += `<p><strong>How they buy:</strong> ${e(tcd.howTheyBuy)}</p>`;
    if (tcd.triggerEvents?.length) h += `<h3>Trigger Events</h3><ul>${tcd.triggerEvents.map(x=>`<li>${e(x)}</li>`).join("")}</ul>`;
    if (tcd.whereToFindThem?.length) h += `<h3>Where to find them</h3><ul>${tcd.whereToFindThem.map(x=>`<li>${e(x)}</li>`).join("")}</ul>`;
    sec.push(h);
  }

  // 17. Fundability Radar — GapFundabilityRadar
  const fund = p.fundabilityRadar as Record<string,{score:number;note:string}> | undefined;
  if (fund && typeof fund === "object") {
    const rows = Object.entries(fund).map(([k,v]) =>
      `<tr><td><strong>${e(k.charAt(0).toUpperCase()+k.slice(1))}</strong></td><td>${e(v?.score)}/10</td><td>${e(s(v?.note).substring(0,120))}${s(v?.note).length>120?"…":""}</td></tr>`
    ).join("");
    if (rows) sec.push(`<h2>Fundability Radar</h2><table><tr><th>Dimension</th><th>Score</th><th>Note</th></tr>${rows}</table>`);
  }

  // 18. Validation Checklist — GapValidationItem: {assumption, risk, howToTest}
  const vc = arr<{assumption?:string;risk?:string;howToTest?:string}>(p.validationChecklist);
  if (vc.length) {
    sec.push(`<h2>Validation Checklist</h2>${vc.map(v =>
      `<div class="card">
        <div class="card-title">${v.risk ? `<span class="tag tag-${v.risk}">${e(v.risk)}</span>` : ""}${e(v.assumption)}</div>
        ${v.howToTest ? `<p class="dim"><strong>How to test:</strong> ${e(v.howToTest)}</p>` : ""}
      </div>`
    ).join("")}`);
  }

  // 19. Synthesis — GapSynthesis: {oneParagraph, workingForYou, watchOutFor}
  const syn = p.synthesis as {oneParagraph?:string;workingForYou?:string[];watchOutFor?:string[]} | undefined;
  if (syn) {
    let h = "<h2>Synthesis</h2>";
    if (syn.oneParagraph) h += `<p>${e(syn.oneParagraph)}</p>`;
    if (syn.workingForYou?.length) h += `<h3>✓ Working for you</h3><ul>${syn.workingForYou.map(x=>`<li>${e(x)}</li>`).join("")}</ul>`;
    if (syn.watchOutFor?.length) h += `<h3>⚠ Watch out for</h3><ul>${syn.watchOutFor.map(x=>`<li>${e(x)}</li>`).join("")}</ul>`;
    sec.push(h);
  }

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${e(label)} — ${e(report.idea)}</title><style>${CSS}</style></head><body>
<div class="header"><div class="badge">${e(label)}</div><h1>${e(report.idea)}</h1><div class="meta">${date}</div></div>
${sec.join("\n")}
<div class="footer">Generated by Unbuilt.me · ${date}</div>
</body></html>`;
}

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
    fetch("/api/reports").then(r=>r.json()).then(d=>setReports(d.reports??[])).catch(()=>{}).finally(()=>setLoading(false));
  }, [isSignedIn, isLoaded, router]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch("/api/reports", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id}) });
    setReports(r=>r.filter(x=>x.id!==id));
    setDeleting(null);
  };

  const handlePdf = (report: Report) => {
    setGenerating(report.id);
    const html = buildHtml(report);
    const filename = report.idea.replace(/[^a-z0-9]+/gi,"-").toLowerCase() + "-report.pdf";

    // Parse the HTML and render into a hidden div in the current page
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:820px;background:white;";
    container.innerHTML = html.replace(/<!DOCTYPE[^>]*>/i,"").replace(/<html[^>]*>/i,"").replace(/<\/html>/i,"").replace(/<head>[\s\S]*?<\/head>/i,"").replace(/<body[^>]*>/i,"").replace(/<\/body>/i,"");
    document.body.appendChild(container);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h2p = (window as any).html2pdf;
    if (!h2p) {
      document.body.removeChild(container);
      setGenerating(null);
      alert("PDF library not loaded yet. Please try again in a moment.");
      return;
    }

    h2p().set({
      margin: 12,
      filename,
      image: { type: "jpeg", quality: 0.97 },
      html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    }).from(container).save().then(() => {
      document.body.removeChild(container);
      setGenerating(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).catch((err: any) => {
      console.error("pdf error:", err);
      document.body.removeChild(container);
      setGenerating(null);
    });
  };

  const toolColor = (t: string) => t==="gap-analysis"?"#7c6fff":"#38bdf8";
  const toolLabel = (t: string) => t==="gap-analysis"?"Gap Analysis":"Stack Advisor";

  return (
    <div style={{padding:"32px 40px",maxWidth:960,margin:"0 auto"}}>
      <div style={{marginBottom:28}}>
        <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.08em",color:"var(--clr-text-4)",marginBottom:6}}>My Reports</div>
        <h1 style={{fontSize:22,fontWeight:700,color:"var(--clr-text)",margin:0}}>Your analyses</h1>
        <p style={{fontSize:14,color:"var(--clr-text-3)",marginTop:6,marginBottom:0}}>Every Gap Analysis and Stack Advisor report you've run.</p>
      </div>
      {loading && <div style={{padding:"48px 0",textAlign:"center",color:"var(--clr-text-4)",fontSize:14}}>Loading…</div>}
      {!loading && reports.length===0 && (
        <div style={{padding:"64px 32px",textAlign:"center",border:"1px dashed var(--clr-border)",borderRadius:12}}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{margin:"0 auto 12px",display:"block",opacity:0.3}}><path d="M8 6h16l8 8v22H8V6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M24 6v8h8" stroke="currentColor" strokeWidth="2"/><path d="M13 20h14M13 27h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          <div style={{fontSize:15,fontWeight:600,color:"var(--clr-text-2)",marginBottom:6}}>No reports yet</div>
          <div style={{fontSize:13,color:"var(--clr-text-4)"}}>Run a Gap Analysis or Stack Advisor to get started.</div>
        </div>
      )}
      {!loading && reports.length>0 && (
        <div style={{border:"1px solid var(--clr-border)",borderRadius:12,overflow:"hidden",background:"var(--clr-surface)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 130px 150px 120px 36px",padding:"10px 20px",background:"var(--clr-surface-2)",borderBottom:"1px solid var(--clr-border)"}}>
            {["Idea","Tool","Date","",""].map((h,i)=>(
              <div key={i} style={{fontSize:11,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.07em",color:"var(--clr-text-4)"}}>{h}</div>
            ))}
          </div>
          {reports.map((report,i)=>(
            <div key={report.id} style={{display:"grid",gridTemplateColumns:"1fr 130px 150px 120px 36px",alignItems:"center",padding:"14px 20px",borderBottom:i<reports.length-1?"1px solid var(--clr-border)":"none",transition:"background 0.1s"}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--clr-surface-2)"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=""}>
              <div style={{fontSize:14,fontWeight:500,color:"var(--clr-text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:16}}>{report.idea}</div>
              <div><span style={{fontSize:10,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.05em",padding:"3px 8px",borderRadius:5,background:`${toolColor(report.tool)}18`,color:toolColor(report.tool)}}>{toolLabel(report.tool)}</span></div>
              <div style={{fontSize:13,color:"var(--clr-text-3)"}}>{new Date(report.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>
              <div>
                <button onClick={()=>handlePdf(report)} disabled={generating===report.id}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:7,border:"1px solid var(--clr-border)",background:generating===report.id?"var(--clr-surface-2)":"transparent",color:"var(--clr-text-2)",fontSize:12,fontWeight:600,cursor:generating===report.id?"default":"pointer",fontFamily:"inherit",opacity:generating===report.id?0.6:1}}
                  onMouseEnter={e=>{if(generating!==report.id)(e.currentTarget as HTMLButtonElement).style.background="var(--clr-surface-2)";}}
                  onMouseLeave={e=>{if(generating!==report.id)(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
                  {generating===report.id ? (
                    <><svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{animation:"spin 1s linear infinite"}}><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 8"/></svg>PDF…</>
                  ) : (
                    <><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 11v1.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>PDF</>
                  )}
                </button>
              </div>
              <div>
                <button onClick={()=>handleDelete(report.id)} disabled={deleting===report.id}
                  style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,border:"none",background:"transparent",cursor:"pointer",opacity:deleting===report.id?0.3:0.45}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.opacity="1";(e.currentTarget as HTMLButtonElement).style.background="rgba(239,68,68,0.08)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.opacity="0.45";(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V2.5h4V4M5 4v8.5A1.5 1.5 0 006.5 14h3A1.5 1.5 0 0011 12.5V4" stroke="#ef4444" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="lazyOnload" />
    </div>
  );
}
