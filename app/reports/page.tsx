"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

interface Report {
  id: string;
  tool: "gap-analysis" | "stack-advisor";
  idea: string;
  created_at: string;
  json_content: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generatePdf(report: Report, jsPDF: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const margin = 14;
  const pageW = 210;
  const cW = pageW - margin * 2;
  let y = 18;

  const e = (s: unknown) => String(s ?? "").replace(/[-￿]/g, "");
  const arr = <T,>(v: unknown): T[] => Array.isArray(v) ? v as T[] : [];
  const str = (v: unknown) => String(v ?? "");
  const o = (v: unknown): Record<string,unknown> => (v && typeof v === "object" && !Array.isArray(v)) ? v as Record<string,unknown> : {};

  const checkPage = (needed = 10) => { if (y + needed > 282) { doc.addPage(); y = 16; } };

  const text = (content: string, size = 10, bold = false, color: [number,number,number] = [30,30,30], indent = 0) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(e(content), cW - indent);
    checkPage(lines.length * size * 0.38 + 2);
    doc.text(lines, margin + indent, y);
    y += lines.length * size * 0.38 + 2;
  };

  const section = (title: string) => {
    checkPage(14);
    y += 5;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y - 2, pageW - margin, y - 2);
    doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.setTextColor(120,120,120);
    doc.text(title.toUpperCase(), margin, y + 3);
    y += 8;
    doc.setTextColor(30,30,30);
  };

  const bullet = (content: string, indent = 4) => {
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.setTextColor(30,30,30);
    const lines = doc.splitTextToSize(e(content), cW - indent - 4);
    checkPage(lines.length * 4 + 2);
    doc.text("•", margin + indent, y);
    doc.text(lines, margin + indent + 4, y);
    y += lines.length * 4 + 1.5;
  };

  let p: Record<string,unknown> = {};
  try {
    const m = report.json_content.match(/```json\s*([\s\S]*?)```/);
    p = JSON.parse(m ? m[1] : report.json_content);
  } catch { /* ignore */ }

  const toolLabel = report.tool === "gap-analysis" ? "Gap Analysis" : "Stack Advisor";
  const dateStr = new Date(report.created_at).toLocaleDateString("en-GB");

  // Header bar
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, 210, 12, "F");
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(255,255,255);
  doc.text(toolLabel.toUpperCase() + "  |  UNBUILT.ME", margin, 8);
  doc.text(dateStr, pageW - margin, 8, { align: "right" });
  y = 22;

  text(e(report.idea), 16, true, [30,30,30]);
  y += 3;

  // Score
  if (p.marketScore != null) {
    doc.setFontSize(36); doc.setFont("helvetica","bold"); doc.setTextColor(99,102,241);
    doc.text(str(p.marketScore), margin, y + 8);
    doc.setFontSize(14); doc.setTextColor(150,150,150);
    doc.text("/100", margin + 22, y + 8);
    if (p.marketScoreLabel) { doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(80,80,80); doc.text(str(p.marketScoreLabel).toUpperCase(), margin, y + 14); }
    y += 18;
    if (p.marketScoreSummary) text(str(p.marketScoreSummary), 10, false, [60,60,60]);
  }

  if (p.oneLiner) { section("One-Liner"); text(str(p.oneLiner), 10, false, [80,40,160]); }

  const ms = o(p.marketSize);
  if (ms.tam) { section("Market Size"); if(ms.tam) text("TAM: "+str(ms.tam)); if(ms.sam) text("SAM: "+str(ms.sam)); if(ms.som) text("SOM: "+str(ms.som)); if(ms.growthRate) text("Growth: "+str(ms.growthRate)); }

  const reddit = arr<{title:string;upvotes?:number}>(p.redditPosts);
  const xp = arr<{text:string;likes?:number}>(p.xPosts);
  if (reddit.length || xp.length) {
    section("Community Signals");
    if (reddit.length) { text("Reddit", 10, true, [200,60,0]); reddit.forEach(r => bullet(str(r.title)+(r.upvotes?" ("+r.upvotes+" upvotes)":""))); }
    if (xp.length) { y+=2; text("X / Twitter", 10, true, [0,100,180]); xp.forEach(x => bullet(str(x.text)+(x.likes?" ("+x.likes+" likes)":""))); }
  }

  const comps = arr<{name:string;tagline:string;threatLevel?:number;strengths?:string[];weaknesses?:string[]}>(p.competitors);
  if (comps.length) {
    section("Competitors");
    comps.forEach(c => {
      text(str(c.name)+(c.threatLevel!=null?"  Threat: "+c.threatLevel+"/5":""), 10, true);
      if(c.tagline) text(str(c.tagline), 9, false, [100,100,100], 4);
      arr<string>(c.strengths).slice(0,2).forEach(s => bullet("+ "+str(s), 6));
      arr<string>(c.weaknesses).slice(0,1).forEach(w => bullet("- "+str(w), 6));
    });
  }

  const gaps = arr<{title:string;description:string;opportunityScore?:number;status?:string}>(p.marketGaps);
  if (gaps.length) {
    section("Market Gaps");
    gaps.forEach(g => {
      const sc: [number,number,number] = g.status==="untapped"?[22,101,52]:g.status==="emerging"?[30,64,175]:[133,77,14];
      text(str(g.title)+(g.status?"  ["+str(g.status).toUpperCase()+"]":"")+(g.opportunityScore!=null?"  "+g.opportunityScore+"/10":""), 10, true, sc);
      text(str(g.description), 9.5, false, [60,60,60], 4);
      y += 1;
    });
  }

  const pain = arr<{quote:string;source?:string;severity?:string}>(p.painPoints);
  if (pain.length) { section("Pain Points"); pain.forEach(pp => bullet((pp.severity?"["+str(pp.severity).toUpperCase()+"] ":"") + str(pp.quote) + (pp.source?" — "+str(pp.source):"")));  }

  const swot = o(p.swot);
  const swotK = ["strengths","weaknesses","opportunities","threats"] as const;
  if (swotK.some(k=>arr(swot[k]).length>0)) {
    section("SWOT");
    const swotColors: Record<string,[number,number,number]> = {strengths:[22,101,52],weaknesses:[180,30,30],opportunities:[30,64,175],threats:[133,77,14]};
    swotK.forEach(k => { const items=arr<string>(swot[k]); if(items.length){text(k.charAt(0).toUpperCase()+k.slice(1),10,true,swotColors[k]); items.forEach(x=>bullet(str(x)));} });
  }

  const opp = o(p.opportunity);
  if (opp.headline) {
    section("Opportunity");
    text(str(opp.headline), 11, true);
    if (opp.urgency) text("Urgency: "+str(opp.urgency).toUpperCase(), 9, false, [100,100,100]);
    arr<{action?:string;step?:number;detail?:string}>(opp.actionItems).forEach((a,i) => bullet((i+1)+". "+str(a.action||"")+(a.detail?": "+str(a.detail):"")));
  }

  const tc = o(p.targetCustomer);
  if (tc.persona||tc.jobTitle) {
    section("Target Customer");
    if(tc.persona) text("Persona: "+str(tc.persona),10,true);
    if(tc.jobTitle) text("Job title: "+str(tc.jobTitle));
    if(tc.demographics) text("Demographics: "+str(tc.demographics));
    if(tc.willingnessToPay) text("Willingness to pay: "+str(tc.willingnessToPay));
    arr<string>(tc.painPoints).forEach(x=>bullet(str(x)));
    const tools=arr<string>(tc.currentTools); if(tools.length) text("Current tools: "+tools.map(str).join(", "));
  }

  const trends = o(p.industryTrends);
  if (["now","emerging","structural"].some(k=>arr(trends[k]).length>0)) {
    section("Industry Trends");
    (["now","emerging","structural"] as const).forEach(k=>{
      const items=arr<{trend?:string;evidence?:string}|string>(trends[k]);
      if(items.length){
        text(k.charAt(0).toUpperCase()+k.slice(1),10,true,[80,80,80]);
        items.forEach(t=>bullet(typeof t==="string"?str(t):str(t.trend)+(t.evidence?" — "+str(t.evidence).substring(0,100):"")));
      }
    });
  }

  const segs = arr<{name?:string;fit?:string;size?:string;growth?:string;description?:string}>(p.marketSegments);
  if (segs.length) {
    section("Market Segments");
    segs.forEach(s=>{text((str(s.name||s.description))+(s.fit?" ["+str(s.fit).toUpperCase()+"]":""),10,true); if(s.size) text("Size: "+str(s.size)+(s.growth?" | Growth: "+str(s.growth):""),9,false,[80,80,80],4);});
  }

  const gtm = o(p.goToMarket);
  if (Object.keys(gtm).length) {
    section("Go-to-Market");
    if(gtm.launchTarget) text("Launch target: "+str(gtm.launchTarget));
    const channels=arr<{name?:string;channel?:string;type?:string;estimatedCAC?:string;cac?:string;description?:string;why?:string}>(gtm.channels);
    if(channels.length){y+=2;text("Channels",10,true);channels.forEach(c=>{text((str(c.name||c.channel))+(c.type?" ["+str(c.type)+"]":"")+(c.estimatedCAC||c.cac?"  CAC: "+str(c.estimatedCAC||c.cac):""),10,true,[30,30,30],4);if(c.description||c.why)text(str(c.description||c.why||"").substring(0,150),9,false,[80,80,80],8);});}
    const phases=arr<{phase?:number;name?:string;duration?:string;steps?:string[]}>(gtm.launchPhases);
    if(phases.length){y+=2;text("Launch Phases",10,true);phases.forEach(ph=>{text("Phase "+str(ph.phase)+": "+str(ph.name)+(ph.duration?" ("+str(ph.duration)+")":""),10,true,[30,30,30],4);arr<string>(ph.steps).forEach(step=>bullet(str(step),8));});}
  }

  const cig = o(p.customerInterviewGuide);
  if (Object.keys(cig).length) {
    section("Customer Interview Guide");
    if(cig.targetInterviews) text("Target: "+str(cig.targetInterviews)+" interviews");
    const qs=arr<string>(cig.questions); if(qs.length){text("Questions",10,true);qs.forEach((q,i)=>bullet((i+1)+". "+str(q)));}
    const green=arr<string>(cig.greenSignals); if(green.length){y+=2;text("Green Signals",10,true,[22,101,52]);green.forEach(x=>bullet(str(x)));}
    const red=arr<string>(cig.redSignals); if(red.length){y+=2;text("Red Signals",10,true,[180,30,30]);red.forEach(x=>bullet(str(x)));}
  }

  const fin = o(p.financialDeep);
  if (Object.keys(fin).length) {
    section("Financials");
    const burn=fin.monthlyBurn; if(burn){const bo=o(burn); if(bo.total)text("Monthly burn: "+str(bo.total),10,true); ["infrastructure","tools","marketing","acquisition"].forEach(k=>{if(bo[k])text(k+": "+str(bo[k]).substring(0,100),9,false,[80,80,80],4);});}
    if(fin.breakEvenMonth) text("Break-even: month "+str(fin.breakEvenMonth));
    if(fin.twelveMonthMRR) text("12-month MRR target: "+str(fin.twelveMonthMRR));
    const sc=o(fin.revenueScenarios); if(Object.keys(sc).length){y+=2;text("Revenue Scenarios",10,true);Object.entries(sc).forEach(([k,v])=>{const sv=o(v);text(k+": MRR "+str(sv.mrr)+" | Probability: "+str(sv.probability),10,false,[30,30,30],4);});}
  }

  const tcd = o(p.targetCustomerDeep);
  if (Object.keys(tcd).length) {
    section("Target Customer (Deep)");
    if(tcd.whoTheyAre) text("Who they are: "+str(tcd.whoTheyAre));
    if(tcd.howTheyThink) text("How they think: "+str(tcd.howTheyThink));
    if(tcd.availableMoney) text("Budget: "+str(tcd.availableMoney));
    if(tcd.howTheyBuy) text("How they buy: "+str(tcd.howTheyBuy));
    const tr=arr<string>(tcd.triggerEvents); if(tr.length){y+=2;text("Trigger Events",10,true);tr.forEach(x=>bullet(str(x)));}
    const wh=arr<string>(tcd.whereToFindThem); if(wh.length){y+=2;text("Where to find them",10,true);wh.forEach(x=>bullet(str(x)));}
  }

  const fund = p.fundabilityRadar as Record<string,{score?:number;note?:string}>|undefined;
  if (fund&&typeof fund==="object") {
    section("Fundability Radar");
    Object.entries(fund).forEach(([k,v])=>{const vv=o(v);text(k.charAt(0).toUpperCase()+k.slice(1)+": "+str(vv.score||"")+"/10",10,true);if(vv.note)text(str(vv.note).substring(0,150),9,false,[80,80,80],4);});
  }

  const vc = arr<{assumption?:string;risk?:string;howToTest?:string}>(p.validationChecklist);
  if (vc.length) {
    section("Validation Checklist");
    vc.forEach(v=>{
      const rc: [number,number,number]=v.risk==="high"?[180,30,30]:v.risk==="medium"?[180,120,0]:[22,101,52];
      text((v.risk?"["+str(v.risk).toUpperCase()+"] ":"")+str(v.assumption),10,true,rc);
      if(v.howToTest)text(str(v.howToTest).substring(0,200),9,false,[80,80,80],4);
    });
  }

  const syn = o(p.synthesis);
  if (syn.oneParagraph||arr(syn.workingForYou).length) {
    section("Synthesis");
    if(syn.oneParagraph) text(str(syn.oneParagraph));
    const pros=arr<string>(syn.workingForYou); if(pros.length){y+=3;text("Working for you",10,true,[22,101,52]);pros.forEach(x=>bullet(str(x)));}
    const cons=arr<string>(syn.watchOutFor); if(cons.length){y+=3;text("Watch out for",10,true,[180,30,30]);cons.forEach(x=>bullet(str(x)));}
  }

  // Page footers
  const total = doc.getNumberOfPages();
  for (let i=1;i<=total;i++) {
    doc.setPage(i);
    doc.setFontSize(7);doc.setFont("helvetica","normal");doc.setTextColor(180,180,180);
    doc.text("Generated by Unbuilt.me  |  "+dateStr, margin, 292);
    doc.text("Page "+i+" / "+total, pageW-margin, 292, {align:"right"});
  }

  doc.save(e(report.idea).replace(/[^a-z0-9]+/gi,"-").toLowerCase()+"-report.pdf");
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jsPDF = (window as any).jspdf?.jsPDF;
    if (!jsPDF) { alert("PDF library loading, please try again in a moment."); return; }
    setGenerating(report.id);
    try { generatePdf(report, jsPDF); }
    catch(err) { console.error("PDF error:", err); }
    finally { setTimeout(()=>setGenerating(null), 1500); }
  };

  const toolColor = (t: string) => t==="gap-analysis"?"#7c6fff":"#38bdf8";
  const toolLabel = (t: string) => t==="gap-analysis"?"Gap Analysis":"Stack Advisor";

  return (
    <div style={{padding:"32px 40px",maxWidth:960,margin:"0 auto"}}>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" strategy="lazyOnload" />
      <div style={{marginBottom:28}}>
        <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.08em",color:"var(--clr-text-4)",marginBottom:6}}>My Reports</div>
        <h1 style={{fontSize:22,fontWeight:700,color:"var(--clr-text)",margin:0}}>Your analyses</h1>
        <p style={{fontSize:14,color:"var(--clr-text-3)",marginTop:6,marginBottom:0}}>Every Gap Analysis and Stack Advisor report you have run.</p>
      </div>
      {loading && <div style={{padding:"48px 0",textAlign:"center",color:"var(--clr-text-4)",fontSize:14}}>Loading...</div>}
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
            {["Idea","Tool","Date","",""].map((h,i)=>(<div key={i} style={{fontSize:11,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.07em",color:"var(--clr-text-4)"}}>{h}</div>))}
          </div>
          {reports.map((report,i)=>(
            <div key={report.id} style={{display:"grid",gridTemplateColumns:"1fr 130px 150px 120px 36px",alignItems:"center",padding:"14px 20px",borderBottom:i<reports.length-1?"1px solid var(--clr-border)":"none",transition:"background 0.1s"}}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--clr-surface-2)"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=""}>
              <div style={{fontSize:14,fontWeight:500,color:"var(--clr-text)",paddingRight:16,position:"relative"}}
                title={report.idea}
                onMouseEnter={e=>{const el=e.currentTarget;el.style.whiteSpace="normal";el.style.zIndex="10";el.style.background="var(--clr-surface)";el.style.boxShadow="0 2px 12px rgba(0,0,0,0.10)";el.style.borderRadius="6px";el.style.padding="4px 8px";el.style.margin="-4px -8px";}}
                onMouseLeave={e=>{const el=e.currentTarget;el.style.whiteSpace="";el.style.zIndex="";el.style.background="";el.style.boxShadow="";el.style.borderRadius="";el.style.padding="";el.style.margin="";}}
              >
                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{report.idea}</span>
              </div>
              <div><span style={{fontSize:10,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.05em",padding:"3px 8px",borderRadius:5,background:`${toolColor(report.tool)}18`,color:toolColor(report.tool)}}>{toolLabel(report.tool)}</span></div>
              <div style={{fontSize:13,color:"var(--clr-text-3)"}}>{new Date(report.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>
              <div>
                <button onClick={()=>handlePdf(report)} disabled={generating===report.id}
                  style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:7,border:"1px solid var(--clr-border)",background:"transparent",color:"var(--clr-text-2)",fontSize:12,fontWeight:600,cursor:generating===report.id?"default":"pointer",fontFamily:"inherit",opacity:generating===report.id?0.6:1}}
                  onMouseEnter={e=>{if(generating!==report.id)(e.currentTarget as HTMLButtonElement).style.background="var(--clr-surface-2)";}}
                  onMouseLeave={e=>{if(generating!==report.id)(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
                  {generating===report.id?"...":<><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 11v1.5A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>PDF</>}
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
    </div>
  );
}
