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

function buildHtml(report: Report): string {
  const toolLabel = report.tool === "gap-analysis" ? "Gap Analysis" : "Stack Advisor";
  const dateStr = new Date(report.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const e = (s: unknown): string => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const arr = <T,>(v: unknown): T[] => Array.isArray(v) ? v as T[] : [];
  const str = (v: unknown): string => typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
  const o = (v: unknown): Record<string,unknown> => (v && typeof v === "object" && !Array.isArray(v)) ? v as Record<string,unknown> : {};

  let p: Record<string, unknown> = {};
  try {
    const m = report.json_content.match(/```json\s*([\s\S]*?)```/);
    p = JSON.parse(m ? m[1] : report.json_content);
  } catch { return "<p>Parse error.</p>"; }

  const sec: string[] = [];

  const score = p.marketScore != null ? `<div class="score">${e(p.marketScore)}<span class="score-sub">/100</span></div><div class="score-label">${e(p.marketScoreLabel ?? "")}</div>` : "";
  if (p.marketScoreSummary) sec.push(`<h2>Overview</h2>${score}<p>${e(p.marketScoreSummary)}</p>`);
  if (p.oneLiner) sec.push(`<h2>One-liner</h2><blockquote>&ldquo;${e(p.oneLiner)}&rdquo;</blockquote>`);

  const ms = o(p.marketSize);
  if (ms.tam || ms.sam) sec.push(`<h2>Market Size</h2><table><tr><th>TAM</th><th>SAM</th><th>SOM</th><th>Growth Rate</th></tr><tr><td>${e(ms.tam)}</td><td>${e(ms.sam)}</td><td>${e(ms.som)}</td><td>${e(ms.growthRate)}</td></tr></table>`);

  const reddit = arr<{title:string;votes:unknown}>(p.redditPosts);
  const xp = arr<{text:string;likes:unknown}>(p.xPosts);
  if (reddit.length || xp.length) {
    let h = "<h2>Community Signals</h2>";
    if (reddit.length) h += `<h3>Reddit</h3><ul>${reddit.map(r=>`<li>${e(r.title)}${r.votes?` <span class="dim">(${e(r.votes)} upvotes)</span>`:""}</li>`).join("")}</ul>`;
    if (xp.length) h += `<h3>X / Twitter</h3><ul>${xp.map(x=>`<li>${e(x.text)}${x.likes?` <span class="dim">(${e(x.likes)} likes)</span>`:""}</li>`).join("")}</ul>`;
    sec.push(h);
  }

  const comps = arr<{name:string;tagline:string;rating:unknown;reviews:unknown}>(p.competitors);
  if (comps.length) sec.push(`<h2>Competitors</h2><table><tr><th>Name</th><th>Tagline</th><th>Rating</th><th>Reviews</th></tr>${comps.map(c=>`<tr><td><strong>${e(c.name)}</strong></td><td>${e(c.tagline)}</td><td>${e(c.rating)}</td><td>${e(c.reviews)}</td></tr>`).join("")}</table>`);

  const gaps = arr<{title:string;description:string;status:string}>(p.marketGaps);
  if (gaps.length) sec.push(`<h2>Market Gaps</h2>${gaps.map(g=>`<div class="card"><div class="card-title">${e(g.title)}${g.status?` <span class="badge">${e(g.status)}</span>`:""}</div><p>${e(g.description)}</p></div>`).join("")}`);

  const pain = arr<{quote:string;source:string}>(p.painPoints);
  if (pain.length) sec.push(`<h2>Pain Points</h2><ul>${pain.map(pp=>`<li>&ldquo;${e(pp.quote)}&rdquo; <span class="dim">(${e(pp.source)})</span></li>`).join("")}</ul>`);

  const swot = o(p.swot);
  const swotRow = (label: string, items: unknown) => { const a=arr<string>(items); return a.length?`<tr><td><strong>${label}</strong></td><td><ul>${a.map(x=>`<li>${e(x)}</li>`).join("")}</ul></td></tr>`:""; };
  const swotRows = [swotRow("Strengths",swot.strengths),swotRow("Weaknesses",swot.weaknesses),swotRow("Opportunities",swot.opportunities),swotRow("Threats",swot.threats)].filter(Boolean).join("");
  if (swotRows) sec.push(`<h2>SWOT</h2><table class="swot">${swotRows}</table>`);

  const tc = o(p.targetCustomer);
  if (tc.persona || tc.jobTitle) {
    let h = `<h2>Target Customer</h2>`;
    if (tc.persona) h += `<p><strong>Persona:</strong> ${e(tc.persona)}</p>`;
    if (tc.jobTitle) h += `<p><strong>Job title:</strong> ${e(tc.jobTitle)}</p>`;
    if (tc.demographics) h += `<p><strong>Demographics:</strong> ${e(tc.demographics)}</p>`;
    if (tc.willingnessToPay) h += `<p><strong>Willingness to pay:</strong> ${e(tc.willingnessToPay)}</p>`;
    const tcPain=arr<string>(tc.painPoints); if(tcPain.length) h+=`<h3>Pain points</h3><ul>${tcPain.map(x=>`<li>${e(x)}</li>`).join("")}</ul>`;
    const ctTools=arr<string>(tc.currentTools); if(ctTools.length) h+=`<p><strong>Current tools:</strong> ${ctTools.map(t=>e(t)).join(", ")}</p>`;
    sec.push(h);
  }

  const trends = o(p.industryTrends);
  if (Object.keys(trends).length) {
    const renderT = (items: unknown) => arr<{trend:string;evidence:string}|string>(items).map(x=>typeof x==="string"?`<li>${e(x)}</li>`:`<li><strong>${e(x.trend)}</strong>${x.evidence?`<br><span class="dim">${e(x.evidence)}</span>`:""}</li>`).join("");
    const tN=renderT(trends.now), tE=renderT(trends.emerging), tS=renderT(trends.structural);
    if(tN||tE||tS) { let h=`<h2>Industry Trends</h2>`; if(tN) h+=`<h3>Now</h3><ul>${tN}</ul>`; if(tE) h+=`<h3>Emerging</h3><ul>${tE}</ul>`; if(tS) h+=`<h3>Structural</h3><ul>${tS}</ul>`; sec.push(h); }
  }

  const segs = arr<{segment:string;size:string;willingnessToPay:string;description:string}>(p.marketSegments);
  if (segs.length && segs.some(s=>s.segment||s.description)) sec.push(`<h2>Market Segments</h2><table><tr><th>Segment</th><th>Size</th><th>Willingness to Pay</th></tr>${segs.map(s=>`<tr><td><strong>${e(s.segment||s.description||"")}</strong></td><td>${e(s.size)}</td><td>${e(s.willingnessToPay)}</td></tr>`).join("")}</table>`);

  const opp = o(p.opportunity);
  if (opp.headline||opp.urgency) {
    let h=`<h2>Opportunity</h2>`; if(opp.headline) h+=`<p><strong>${e(opp.headline)}</strong></p>`; if(opp.urgency) h+=`<p>${e(opp.urgency)}</p>`;
    const actions=arr<{action:string;why:string}|string>(opp.actionItems);
    if(actions.length) h+=`<ol>${actions.map(a=>typeof a==="string"?`<li>${e(a)}</li>`:`<li><strong>${e(a.action)}</strong>${a.why?`: ${e(a.why)}`:""}</li>`).join("")}</ol>`;
    sec.push(h);
  }

  const gtm = o(p.goToMarket);
  if (Object.keys(gtm).length) {
    let h=`<h2>Go-to-Market</h2>`; if(gtm.launchTarget) h+=`<p><strong>Launch target:</strong> ${e(gtm.launchTarget)}</p>`;
    const ch=arr<{channel:string;why:string;cac:string;timeToFirstUser:string}>(gtm.channels);
    if(ch.length) h+=`<table><tr><th>Channel</th><th>Why</th><th>CAC</th><th>Time to first user</th></tr>${ch.map(c=>`<tr><td><strong>${e(c.channel)}</strong></td><td>${e(c.why)}</td><td>${e(c.cac)}</td><td>${e(c.timeToFirstUser)}</td></tr>`).join("")}</table>`;
    const ph=arr<{phase:string;duration:string}>(gtm.launchPhases);
    if(ph.length) h+=`<h3>Launch Phases</h3><ol>${ph.map(x=>`<li><strong>${e(x.phase)}</strong>${x.duration?` (${e(x.duration)})`:""}</li>`).join("")}</ol>`;
    sec.push(h);
  }

  const fin = o(p.financialDeep);
  if (Object.keys(fin).length) {
    let h=`<h2>Financials</h2>`;
    const burn=fin.monthlyBurn;
    if(burn){ const bo=o(burn); if(bo.total) h+=`<p><strong>Monthly burn:</strong> ${e(bo.total)}</p>`; else if(typeof burn==="string"||typeof burn==="number") h+=`<p><strong>Monthly burn:</strong> ${e(burn)}</p>`; }
    if(fin.breakEvenMonth) h+=`<p><strong>Break-even:</strong> month ${e(fin.breakEvenMonth)}</p>`;
    if(fin.twelveMonthMRR) h+=`<p><strong>12-month MRR target:</strong> ${e(fin.twelveMonthMRR)}</p>`;
    const sc=arr<{scenario:string;mrr:string;customers:string}>(fin.revenueScenarios);
    if(sc.length) h+=`<table><tr><th>Scenario</th><th>MRR</th><th>Customers</th></tr>${sc.map(s=>`<tr><td>${e(s.scenario)}</td><td>${e(s.mrr)}</td><td>${e(s.customers)}</td></tr>`).join("")}</table>`;
    sec.push(h);
  }

  const tcd = o(p.targetCustomerDeep);
  if (Object.keys(tcd).length) {
    let h=`<h2>Target Customer (Deep)</h2>`;
    if(tcd.whoTheyAre) h+=`<p><strong>Who they are:</strong> ${e(tcd.whoTheyAre)}</p>`;
    if(tcd.howTheyThink) h+=`<p><strong>How they think:</strong> ${e(tcd.howTheyThink)}</p>`;
    if(tcd.availableMoney) h+=`<p><strong>Budget:</strong> ${e(tcd.availableMoney)}</p>`;
    if(tcd.howTheyBuy) h+=`<p><strong>How they buy:</strong> ${e(tcd.howTheyBuy)}</p>`;
    const tr=arr<string>(tcd.triggerEvents); if(tr.length) h+=`<h3>Trigger Events</h3><ul>${tr.map(x=>`<li>${e(x)}</li>`).join("")}</ul>`;
    const wh=arr<string>(tcd.whereToFindThem); if(wh.length) h+=`<h3>Where to find them</h3><ul>${wh.map(x=>`<li>${e(x)}</li>`).join("")}</ul>`;
    sec.push(h);
  }

  const cig = o(p.customerInterviewGuide);
  if (Object.keys(cig).length) {
    let h=`<h2>Customer Interview Guide</h2>`;
    const qs=arr<string>(cig.questions); if(qs.length) h+=`<ol>${qs.map(q=>`<li>${e(q)}</li>`).join("")}</ol>`;
    const gr=arr<string>(cig.greenSignals); if(gr.length) h+=`<h3>Green signals</h3><ul>${gr.map(x=>`<li>${e(x)}</li>`).join("")}</ul>`;
    const rd=arr<string>(cig.redSignals); if(rd.length) h+=`<h3>Red signals</h3><ul>${rd.map(x=>`<li>${e(x)}</li>`).join("")}</ul>`;
    sec.push(h);
  }

  const fund = o(p.fundabilityRadar);
  if (Object.keys(fund).length) {
    const rows=Object.entries(fund).map(([k,v])=>{ const vo=o(v); const sc=vo.score!=null?str(vo.score):str(v); const nt=str(vo.note); return `<tr><td><strong>${e(k.charAt(0).toUpperCase()+k.slice(1))}</strong></td><td>${e(sc)}/10</td><td class="dim">${e(nt.substring(0,100))}${nt.length>100?"&hellip;":""}</td></tr>`; }).join("");
    if(rows) sec.push(`<h2>Fundability Radar</h2><table><tr><th>Dimension</th><th>Score</th><th>Note</th></tr>${rows}</table>`);
  }

  const vc = arr<{item:string;status:string;how:string;timeframe:string}|string>(p.validationChecklist);
  if (vc.length) {
    const items=vc.map(v=>{ if(typeof v==="string") return `<li>&#9675; ${e(v)}</li>`; const ic=v.status==="done"?"&#10003;":v.status==="partial"?"&#9685;":"&#9675;"; return `<li>${ic} <strong>${e(v.item)}</strong>${v.how?`: ${e(v.how)}`:""}</li>`; }).join("");
    sec.push(`<h2>Validation Checklist</h2><ul>${items}</ul>`);
  }

  const syn=o(p.synthesis); const synT=str(syn.oneParagraph); const pros=arr<string>(syn.workingForYou); const cons=arr<string>(syn.watchOutFor);
  if(synT||pros.length||cons.length) {
    let h=`<h2>Synthesis</h2>`; if(synT) h+=`<p>${e(synT)}</p>`;
    if(pros.length) h+=`<h3>Working for you</h3><ul>${pros.map((x:string)=>`<li>${e(x)}</li>`).join("")}</ul>`;
    if(cons.length) h+=`<h3>Watch out for</h3><ul>${cons.map((x:string)=>`<li>${e(x)}</li>`).join("")}</ul>`;
    sec.push(h);
  }

  const css=`*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,-apple-system,sans-serif;color:#111;max-width:800px;margin:0 auto;padding:40px 32px;line-height:1.65;font-size:13px}.header{margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #e5e7eb}.badge-tool{display:inline-block;background:#eff6ff;color:#1d4ed8;padding:2px 9px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px}h1{font-size:22px;font-weight:700;margin:4px 0}.meta{color:#6b7280;font-size:12px;margin-top:4px}.score{font-size:52px;font-weight:800;color:#6366f1;line-height:1;margin:14px 0 2px;display:inline-block}.score-sub{font-size:22px;color:#9ca3af;font-weight:400}.score-label{font-size:11px;color:#6b7280;margin-bottom:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:#374151;margin:36px 0 10px;padding-bottom:6px;border-bottom:1.5px solid #e5e7eb;page-break-after:avoid}h3{font-size:11px;font-weight:700;color:#6b7280;margin:14px 0 6px;text-transform:uppercase;letter-spacing:.05em}p{margin:0 0 10px}ul,ol{margin:0 0 12px;padding-left:20px}li{margin-bottom:5px}blockquote{background:#faf5ff;border-left:3px solid #7c6fff;margin:0 0 16px;padding:14px 18px;font-style:italic;color:#4c1d95;border-radius:0 6px 6px 0}table{width:100%;border-collapse:collapse;margin:0 0 14px;font-size:12px}th{background:#f9fafb;border:1px solid #e5e7eb;padding:7px 10px;font-weight:600;text-align:left;color:#374151}td{border:1px solid #e5e7eb;padding:7px 10px;vertical-align:top}.card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px 14px;margin-bottom:10px;page-break-inside:avoid}.card-title{font-weight:600;font-size:13px;margin-bottom:6px}.badge{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:1px 6px;border-radius:3px;background:#dcfce7;color:#166534;margin-left:6px}.dim{color:#9ca3af;font-size:11px}.swot td{vertical-align:top}.swot ul{margin:0;padding-left:16px}.print-btn{position:fixed;top:16px;right:16px;background:#7c6fff;color:white;border:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;z-index:999}.footer{margin-top:48px;padding-top:14px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:10px;text-align:center}@media print{body{padding:20px}.print-btn{display:none}tr{page-break-inside:avoid}}`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${e(toolLabel)} — ${e(report.idea)}</title><style>${css}</style></head><body><button class="print-btn" onclick="window.print()">Save as PDF</button><div class="header"><div class="badge-tool">${e(toolLabel)}</div><h1>${e(report.idea)}</h1><div class="meta">${dateStr}</div></div>${sec.join("\n")}<div class="footer">Generated by Unbuilt.me &middot; ${dateStr}</div></body></html>`;
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
    fetch("/api/reports").then(r=>r.json()).then(d=>setReports(d.reports??[])).catch(()=>{}).finally(()=>setLoading(false));
  }, [isSignedIn, isLoaded, router]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await fetch("/api/reports", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id}) });
    setReports(r=>r.filter(x=>x.id!==id));
    setDeleting(null);
  };

  const handlePdf = (report: Report) => {
    const html = buildHtml(report);
    const blob = new Blob([html], { type:"text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) { const a=document.createElement("a"); a.href=url; a.download=report.idea.replace(/[^a-z0-9]+/gi,"-").toLowerCase()+".html"; a.click(); }
    setTimeout(()=>URL.revokeObjectURL(url), 15000);
  };

  const toolColor = (t: string) => t==="gap-analysis"?"#7c6fff":"#38bdf8";
  const toolLabel = (t: string) => t==="gap-analysis"?"Gap Analysis":"Stack Advisor";

  return (
    <div style={{padding:"32px 40px",maxWidth:960,margin:"0 auto"}}>
      <div style={{marginBottom:28}}>
        <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.08em",color:"var(--clr-text-4)",marginBottom:6}}>My Reports</div>
        <h1 style={{fontSize:22,fontWeight:700,color:"var(--clr-text)",margin:0}}>Your analyses</h1>
        <p style={{fontSize:14,color:"var(--clr-text-3)",marginTop:6,marginBottom:0}}>Every Gap Analysis and Stack Advisor report you&#x27;ve run.</p>
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
          <div style={{display:"grid",gridTemplateColumns:"1fr 130px 150px 110px 36px",padding:"10px 20px",background:"var(--clr-surface-2)",borderBottom:"1px solid var(--clr-border)"}}>
            {["Idea","Tool","Date","",""].map((h,i)=>(
              <div key={i} style={{fontSize:11,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.07em",color:"var(--clr-text-4)"}}>{h}</div>
            ))}
          </div>
          {reports.map((report,i)=>(
            <div key={report.id} style={{display:"grid",gridTemplateColumns:"1fr 130px 150px 110px 36px",alignItems:"center",padding:"14px 20px",borderBottom:i<reports.length-1?"1px solid var(--clr-border)":"none",transition:"background 0.1s"}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--clr-surface-2)"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=""}>
              <div style={{fontSize:14,fontWeight:500,color:"var(--clr-text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:16}}>{report.idea}</div>
              <div><span style={{fontSize:10,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.05em",padding:"3px 8px",borderRadius:5,background:`${toolColor(report.tool)}18`,color:toolColor(report.tool)}}>{toolLabel(report.tool)}</span></div>
              <div style={{fontSize:13,color:"var(--clr-text-3)"}}>{new Date(report.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>
              <div>
                <button onClick={()=>handlePdf(report)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:7,border:"1px solid var(--clr-border)",background:"transparent",color:"var(--clr-text-2)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
                  onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background="var(--clr-surface-2)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background="transparent"}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 11v1.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  PDF
                </button>
              </div>
              <div>
                <button onClick={()=>handleDelete(report.id)} disabled={deleting===report.id} style={{width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,border:"none",background:"transparent",cursor:"pointer",opacity:deleting===report.id?0.3:0.45}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.opacity="1";(e.currentTarget as HTMLButtonElement).style.background="rgba(239,68,68,0.08)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.opacity="0.45";(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
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
