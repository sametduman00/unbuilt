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
  const M = 14, PW = 210, CW = PW - M * 2;
  let y = 18;

  const e = (s: unknown) => String(s ?? "").replace(/[\u0080-\uFFFF]/g, "");
  const arr = <T,>(v: unknown): T[] => Array.isArray(v) ? v as T[] : [];
  const str = (v: unknown) => String(v ?? "");
  const o = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v)) ? v as Record<string, unknown> : {};

  const chk = (n = 10) => { if (y + n > 282) { doc.addPage(); y = 16; } };

  const t = (content: string, sz = 10, bold = false, color: [number, number, number] = [30, 30, 30], ind = 0) => {
    doc.setFontSize(sz); doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(e(content), CW - ind);
    chk(lines.length * sz * 0.38 + 2);
    doc.text(lines, M + ind, y);
    y += lines.length * sz * 0.38 + 2;
  };

  const sec = (title: string, sub?: string) => {
    chk(14); y += 5;
    doc.setFillColor(248, 248, 255); doc.rect(M - 2, y - 4, CW + 4, 10, "F");
    doc.setDrawColor(200, 200, 230); doc.line(M - 2, y - 4, M - 2, y + 6);
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(60, 60, 120);
    doc.text(e(title), M + 2, y + 2);
    if (sub) { doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(150, 150, 150); doc.text(e(sub), M + 2 + doc.getTextWidth(title) * 0.9 + 4, y + 2); }
    y += 10; doc.setTextColor(30, 30, 30);
  };

  const bul = (content: string, ind = 4) => {
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(e(content), CW - ind - 4);
    chk(lines.length * 4 + 2);
    doc.text("•", M + ind, y); doc.text(lines, M + ind + 4, y);
    y += lines.length * 4 + 2;
  };

  const card3 = (items: { label: string; title: string; body: string; lc: [number, number, number]; bg: [number, number, number] }[]) => {
    chk(28); const cw = (CW - 8) / 3; const cy = y; let maxH = 0;
    items.forEach((item, i) => {
      const cx = M + i * (cw + 4);
      doc.setFillColor(...item.bg); doc.roundedRect(cx, cy, cw, 35, 2, 2, "F");
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...item.lc);
      doc.text(item.label, cx + 3, cy + 5);
      const tl = doc.splitTextToSize(e(item.title), cw - 6);
      doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(17, 24, 39);
      doc.text(tl, cx + 3, cy + 10);
      const bl = doc.splitTextToSize(e(item.body).substring(0, 200), cw - 6);
      doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
      doc.text(bl, cx + 3, cy + 10 + tl.length * 4 + 2);
      maxH = Math.max(maxH, 10 + tl.length * 4 + 2 + bl.length * 3.5 + 4);
    });
    y = cy + maxH + 4;
  };

  let p: Record<string, unknown> = {};
  try {
    const m = report.json_content.match(/```json\s*([\s\S]*?)```/);
    p = JSON.parse(m ? m[1] : report.json_content);
  } catch { /* ignore */ }

  const toolLabel = report.tool === "gap-analysis" ? "Gap Analysis" : "Stack Advisor";
  const dateStr = new Date(report.created_at).toLocaleDateString("en-GB");

  // ── HEADER BAR ──────────────────────────────────────────────
  doc.setFillColor(99, 102, 241); doc.rect(0, 0, 210, 12, "F");
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text(toolLabel.toUpperCase() + "  |  UNBUILT.ME", M, 8);
  doc.text(dateStr, PW - M, 8, { align: "right" });
  y = 22;
  t(e(report.idea), 15, true, [30, 30, 30]); y += 2;

  // ── TAB 1: OVERVIEW ──────────────────────────────────────────
  sec("OVERVIEW", "TL;DR — Executive Summary");

  if (p.marketScore != null) {
    doc.setFontSize(38); doc.setFont("helvetica", "bold"); doc.setTextColor(99, 102, 241);
    doc.text(str(p.marketScore), M, y + 10);
    doc.setFontSize(14); doc.setTextColor(150, 150, 150); doc.text("/100", M + 24, y + 10);
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(80, 80, 80);
    if (p.marketScoreLabel) doc.text(str(p.marketScoreLabel).toUpperCase(), M, y + 16);
    y += 20;
  }
  if (p.marketScoreSummary) t(str(p.marketScoreSummary), 10, false, [60, 60, 60]);
  if (p.oneLiner) { y += 2; t("One-Liner: " + str(p.oneLiner), 10, false, [80, 40, 160]); }

  // Key numbers
  const kn: string[] = [];
  const ms0 = o(p.marketSize); if (ms0.tam) kn.push("TAM: " + str(ms0.tam).split(" ")[0]);
  const comp0 = arr<{ name: string }>(p.competitors)[0]; if (comp0) kn.push("Top threat: " + str(comp0.name));
  const gap0 = arr<{ title: string }>(p.marketGaps)[0]; if (gap0) kn.push("Best gap: " + str(gap0.title).substring(0, 40));
  if (kn.length) { y += 2; t(kn.join("   |   "), 9, false, [80, 80, 80]); }

  // 3 cards
  const fg = arr<{ title: string; description: string }>(p.marketGaps)[0];
  const ft = arr<string>(o(p.swot).threats)[0];
  const ft2 = arr<string>(o(p.swot).threats)[1];
  const fm = arr<{ action?: string; detail?: string }>(o(p.opportunity).actionItems)[0];
  y += 3;
  card3([
    { label: "BIGGEST OPPORTUNITY", title: str(fg?.title), body: str(fg?.description), lc: [13, 148, 136], bg: [240, 253, 250] },
    { label: "BIGGEST RISK", title: str(ft), body: str(ft2), lc: [234, 88, 12], bg: [255, 247, 237] },
    { label: "FIRST MOVE", title: str(fm?.action), body: str(fm?.detail), lc: [37, 99, 235], bg: [239, 246, 255] },
  ]);

  // Synthesis paragraph (also shown in overview)
  const syn0 = o(p.synthesis);
  if (syn0.oneParagraph) { y += 2; t(str(syn0.oneParagraph), 10, false, [60, 60, 60]); }

  // ── TAB 2: MARKET DATA ───────────────────────────────────────
  sec("MARKET DATA");
  const ms = o(p.marketSize);
  if (ms.tam) {
    t("TAM: " + str(ms.tam), 10, true); t("SAM: " + str(ms.sam), 10); t("SOM: " + str(ms.som), 10);
    if (ms.growthRate) { doc.setFillColor(240, 253, 244); doc.roundedRect(M, y, CW, 8, 2, 2, "F"); doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(21, 128, 61); doc.text("Growth rate: " + str(ms.growthRate), M + 4, y + 5.5); y += 12; }
  }
  const segs = arr<{ name?: string; fit?: string; size?: string; growth?: string; description?: string }>(p.marketSegments);
  if (segs.length) {
    y += 2; t("Market Segments", 10, true, [60, 60, 120]);
    segs.forEach(sg => {
      const fitColor: [number, number, number] = sg.fit === "primary" ? [14, 165, 233] : sg.fit === "secondary" ? [16, 185, 129] : [245, 158, 11];
      doc.setFillColor(...fitColor); doc.rect(M, y - 1, 3, (str(sg.name).length > 0 ? 8 : 6), "F");
      t(str(sg.name || "") + (sg.fit ? "  [" + str(sg.fit).toUpperCase() + "]" : "") + (sg.size ? "  " + str(sg.size) : "") + (sg.growth ? "  ↑ " + str(sg.growth) : ""), 10, true, [17, 24, 39], 6);
      if (sg.description) t(str(sg.description), 9, false, [107, 114, 128], 6);
      y += 1;
    });
  }

  // ── TAB 3: COMMUNITY SIGNALS ─────────────────────────────────
  sec("COMMUNITY SIGNALS");
  const painPts = arr<{ quote: string; source?: string; severity?: string }>(p.painPoints);
  if (painPts.length) {
    t("Pain Points", 10, true, [60, 60, 120]);
    painPts.forEach(pp => {
      const sc: [number, number, number] = pp.severity === "high" ? [239, 68, 68] : pp.severity === "medium" ? [245, 158, 11] : [16, 185, 129];
      doc.setFillColor(...sc); doc.rect(M, y - 1, 2, 5, "F");
      bul((pp.severity ? "[" + str(pp.severity).toUpperCase() + "] " : "") + '"' + str(pp.quote) + '"' + (pp.source ? "  — " + str(pp.source) : ""), 6);
    });
  }
  const comSigs = arr<{ quote: string; source?: string; sentiment?: string; subredditOrHandle?: string }>(p.communitySignals);
  if (comSigs.length) {
    y += 2; t("Community Signals", 10, true, [60, 60, 120]);
    comSigs.forEach(sig => bul('"' + str(sig.quote) + '"  — ' + str(sig.subredditOrHandle || sig.source), 4));
  }
  const reddit = arr<{ title: string; body?: string; upvotes?: number; subreddit?: string; sentiment?: string }>(p.redditPosts);
  if (reddit.length) {
    y += 2; t("Reddit Posts", 10, true, [200, 80, 20]);
    reddit.forEach(r => {
      t(str(r.title) + (r.upvotes ? "  (↑ " + r.upvotes + ")" : "") + (r.subreddit ? "  r/" + str(r.subreddit) : ""), 10, true, [17, 24, 39], 4);
      if (r.body) t(str(r.body).substring(0, 200), 9, false, [107, 114, 128], 8);
      y += 1;
    });
  }
  const xp = arr<{ text: string; likes?: number; handle?: string; sentiment?: string }>(p.xPosts);
  if (xp.length) {
    y += 2; t("X / Twitter Posts", 10, true, [17, 24, 39]);
    xp.forEach(x => { t((x.handle ? "@" + str(x.handle) + ": " : "") + str(x.text) + (x.likes ? "  (♥ " + x.likes + ")" : ""), 10, false, [55, 65, 81], 4); y += 1; });
  }

  // ── TAB 4: COMPETITORS ───────────────────────────────────────
  sec("COMPETITORS");
  arr<{ name: string; tagline: string; threatLevel?: number; strengths?: string[]; weaknesses?: string[] }>(p.competitors).forEach(c => {
    chk(20);
    const tl = c.threatLevel ?? 0;
    const tlc: [number, number, number] = tl >= 8 ? [220, 38, 38] : tl >= 5 ? [234, 88, 12] : [22, 163, 74];
    t(str(c.name) + "  " + (tl > 0 ? "Threat: " + tl + "/10" : ""), 11, true, tlc);
    t(str(c.tagline), 9, false, [107, 114, 128], 4);
    const str2 = arr<string>(c.strengths); const wks = arr<string>(c.weaknesses);
    if (str2.length) { t("Strengths:", 9, true, [16, 185, 129], 4); str2.forEach(s => bul(str(s), 8)); }
    if (wks.length) { t("Weaknesses:", 9, true, [239, 68, 68], 4); wks.forEach(w => bul(str(w), 8)); }
    y += 2;
  });

  // ── TAB 5: MARKET GAPS ───────────────────────────────────────
  sec("MARKET GAPS");
  arr<{ title: string; description: string; opportunityScore?: number; status?: string }>(p.marketGaps).forEach(g => {
    const sc: [number, number, number] = g.status === "untapped" ? [22, 101, 52] : g.status === "emerging" ? [30, 64, 175] : [133, 77, 14];
    t(str(g.title) + (g.status ? "  [" + g.status.toUpperCase() + "]" : "") + (g.opportunityScore != null ? "  Score: " + g.opportunityScore + "/10" : ""), 10, true, sc);
    t(str(g.description), 9.5, false, [60, 60, 60], 4); y += 2;
  });

  // SWOT
  y += 2; t("SWOT Analysis", 10, true, [60, 60, 120]);
  const swotCfg: { key: "strengths" | "weaknesses" | "opportunities" | "threats"; label: string; color: [number, number, number] }[] = [
    { key: "strengths", label: "Strengths", color: [22, 101, 52] },
    { key: "weaknesses", label: "Weaknesses", color: [180, 30, 30] },
    { key: "opportunities", label: "Opportunities", color: [30, 64, 175] },
    { key: "threats", label: "Threats", color: [133, 77, 14] },
  ];
  const sw = o(p.swot);
  swotCfg.forEach(({ key, label, color }) => {
    const items = arr<string>(sw[key]); if (!items.length) return;
    t(label, 10, true, color, 2); items.forEach(x => bul(str(x), 6));
  });

  // ── TAB 6: GO-TO-MARKET ──────────────────────────────────────
  sec("GO-TO-MARKET");
  const tcd = o(p.targetCustomerDeep);
  if (Object.keys(tcd).length) {
    t("Target Customer", 10, true, [60, 60, 120]);
    if (tcd.whoTheyAre) t("Who they are: " + str(tcd.whoTheyAre), 9.5, false, [55, 65, 81], 4);
    if (tcd.howTheyThink) t("How they think: " + str(tcd.howTheyThink), 9.5, false, [55, 65, 81], 4);
    if (tcd.availableMoney) t("Budget: " + str(tcd.availableMoney), 9.5, false, [55, 65, 81], 4);
    if (tcd.howTheyBuy) t("How they buy: " + str(tcd.howTheyBuy), 9.5, false, [55, 65, 81], 4);
    const tr = arr<string>(tcd.triggerEvents);
    if (tr.length) { y += 2; t("Trigger Events:", 9, true, [234, 88, 12], 4); tr.forEach(x => bul(str(x), 8)); }
    const wh = arr<string>(tcd.whereToFindThem);
    if (wh.length) { y += 2; t("Where to find them:", 9, true, [37, 99, 235], 4); wh.forEach(x => bul(str(x), 8)); }
    y += 3;
  }

  const gtm = o(p.goToMarket);
  if (Object.keys(gtm).length) {
    t("GTM Channels", 10, true, [60, 60, 120]);
    if (gtm.launchTarget) t("Launch target: " + str(gtm.launchTarget), 9.5, false, [55, 65, 81]);
    arr<{ name?: string; type?: string; estimatedCAC?: string; description?: string }>(gtm.channels).forEach(c => {
      const tc: [number, number, number] = c.type === "primary" ? [14, 165, 233] : c.type === "secondary" ? [16, 185, 129] : [245, 158, 11];
      t(str(c.name) + (c.type ? "  [" + str(c.type).toUpperCase() + "]" : "") + (c.estimatedCAC ? "  Est. CAC: " + str(c.estimatedCAC).substring(0, 30) : ""), 10, true, tc, 4);
      if (c.description) t(str(c.description).substring(0, 180), 9, false, [107, 114, 128], 8);
      y += 1;
    });
  }

  const trends = o(p.industryTrends);
  if (Object.keys(trends).length) {
    y += 2; t("Industry Trends", 10, true, [60, 60, 120]);
    const tKeys: { k: "now" | "emerging" | "structural"; label: string; color: [number, number, number] }[] = [
      { k: "now", label: "Current (Now)", color: [14, 165, 233] },
      { k: "emerging", label: "Emerging (1-3yr)", color: [245, 158, 11] },
      { k: "structural", label: "Structural (3-5yr)", color: [139, 92, 246] },
    ];
    tKeys.forEach(({ k, label, color }) => {
      const items = arr<{ trend?: string; evidence?: string; impact?: string }>(trends[k]);
      if (!items.length) return;
      t(label, 9.5, true, color, 4);
      items.forEach(ti => {
        t(str(ti.trend) + (ti.impact ? "  [" + str(ti.impact).toUpperCase() + "]" : ""), 9.5, false, [17, 24, 39], 8);
        if (ti.evidence) t(str(ti.evidence).substring(0, 150), 8.5, false, [150, 150, 150], 10);
        y += 1;
      });
    });
  }

  // ── TAB 7: FINANCIALS ────────────────────────────────────────
  sec("FINANCIALS");
  const fin = o(p.financialDeep);
  if (Object.keys(fin).length) {
    const burn = o(fin.monthlyBurn);
    if (burn.total) {
      t("Monthly Burn: " + str(burn.total), 11, true, [239, 68, 68]);
      if (burn.infrastructure) t("Infrastructure: " + str(burn.infrastructure).substring(0, 100), 9, false, [107, 114, 128], 6);
      if (burn.tools) t("Tools: " + str(burn.tools).substring(0, 100), 9, false, [107, 114, 128], 6);
      if (burn.marketing) t("Marketing: " + str(burn.marketing).substring(0, 100), 9, false, [107, 114, 128], 6);
      if (burn.acquisition) t("Acquisition: " + str(burn.acquisition).substring(0, 100), 9, false, [107, 114, 128], 6);
    }
    y += 2;
    if (fin.breakEvenMonth) t("Break-Even: Month " + str(fin.breakEvenMonth), 10, true, [16, 185, 129]);
    if (fin.twelveMonthMRR) t("12-Month MRR Target: " + str(fin.twelveMonthMRR), 10, true, [8, 145, 178]);
    if (fin.pricingBenchmark) t("Pricing Benchmark: " + str(fin.pricingBenchmark), 10, false, [55, 65, 81]);
    y += 2;
    const sc2 = o(fin.revenueScenarios);
    if (Object.keys(sc2).length) {
      t("Revenue Scenarios", 10, true, [60, 60, 120]);
      const scColors: Record<string, [number, number, number]> = { cautious: [107, 114, 128], middle: [14, 165, 233], optimistic: [16, 185, 129] };
      Object.entries(sc2).forEach(([k2, v2]) => {
        const sv = o(v2);
        t(k2.toUpperCase() + ": " + str(sv.mrr) + "  (" + str(sv.probability) + " likely)", 10, true, scColors[k2] || [30, 30, 30], 4);
        if (sv.assumption) t(str(sv.assumption).substring(0, 150), 9, false, [107, 114, 128], 8);
      });
    }
  }
  y += 3;
  const fund = p.fundabilityRadar as Record<string, { score?: number; note?: string }> | undefined;
  if (fund && typeof fund === "object") {
    t("Fundability Radar", 10, true, [60, 60, 120]);
    Object.entries(fund).forEach(([k, v]) => {
      const vv = o(v); const sc = Number(vv.score ?? 0);
      const fc: [number, number, number] = sc >= 7 ? [16, 185, 129] : sc >= 5 ? [245, 158, 11] : [239, 68, 68];
      t(k.charAt(0).toUpperCase() + k.slice(1) + ": " + str(sc) + "/10", 10, true, fc, 4);
      if (vv.note) t(str(vv.note).substring(0, 180), 9, false, [107, 114, 128], 8);
      y += 1;
    });
  }

  // ── TAB 8: VALIDATE ──────────────────────────────────────────
  sec("VALIDATE");
  const vc = arr<{ assumption?: string; risk?: string; howToTest?: string }>(p.validationChecklist);
  if (vc.length) {
    t("Validation Checklist", 10, true, [60, 60, 120]);
    vc.forEach((v, i) => {
      const rc: [number, number, number] = v.risk === "high" ? [220, 38, 38] : v.risk === "medium" ? [245, 158, 11] : [22, 163, 74];
      t((i + 1) + ". " + str(v.assumption) + (v.risk ? "  [" + str(v.risk).toUpperCase() + " RISK]" : ""), 10, true, rc, 2);
      if (v.howToTest) t("Test: " + str(v.howToTest).substring(0, 250), 9, false, [107, 114, 128], 8);
      y += 2;
    });
  }
  const cig = o(p.customerInterviewGuide);
  if (Object.keys(cig).length) {
    y += 2; t("Customer Interview Guide", 10, true, [60, 60, 120]);
    if (cig.targetInterviews) t("Target: " + str(cig.targetInterviews) + " interviews", 9, false, [55, 65, 81]);
    const qs = arr<string>(cig.questions);
    if (qs.length) { y += 2; t("Questions:", 9, true, [37, 99, 235], 4); qs.forEach((q, i) => bul((i + 1) + ". " + str(q), 8)); }
    const wf = arr<string>(cig.whereToFindThem);
    if (wf.length) { y += 2; t("Where to Find Them:", 9, true, [14, 165, 233], 4); wf.forEach(w => bul(str(w), 8)); }
    const green = arr<string>(cig.greenSignals);
    if (green.length) { y += 2; t("Green Signals:", 9, true, [22, 163, 74], 4); green.forEach(g => bul(str(g), 8)); }
    const red = arr<string>(cig.redSignals);
    if (red.length) { y += 2; t("Red Signals:", 9, true, [220, 38, 38], 4); red.forEach(r => bul(str(r), 8)); }
  }

  // ── TAB 9: ACTION PLAN ───────────────────────────────────────
  sec("ACTION PLAN");
  const opp = o(p.opportunity);
  if (opp.headline) {
    t(str(opp.headline), 11, true, [17, 24, 39]);
    if (opp.urgency) t("Urgency: " + str(opp.urgency).toUpperCase(), 9, false, [107, 114, 128]);
    y += 2;
    arr<{ step?: number; action?: string; detail?: string }>(opp.actionItems).forEach((a, i) => {
      chk(16);
      doc.setFillColor(17, 24, 39); doc.roundedRect(M, y - 2, 7, 7, 1, 1, "F");
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
      doc.text(str(a.step || i + 1), M + 2.5, y + 3);
      t(str(a.action), 10, true, [17, 24, 39], 10);
      if (a.detail) t(str(a.detail), 9, false, [107, 114, 128], 14);
      y += 2;
    });
  }
  const gtm2 = o(p.goToMarket);
  const phases = arr<{ phase?: number; name?: string; duration?: string; steps?: string[] }>(gtm2.launchPhases);
  if (phases.length) {
    y += 3; t("Launch Roadmap", 10, true, [60, 60, 120]);
    phases.forEach(ph => {
      chk(14);
      doc.setFillColor(17, 24, 39); doc.circle(M + 4, y + 2, 4, "F");
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
      doc.text(str(ph.phase || ""), M + 2.5, y + 3.5);
      doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(17, 24, 39);
      doc.text(str(ph.name), M + 11, y + 3.5);
      doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(150, 150, 150);
      doc.text(str(ph.duration), PW - M, y + 3.5, { align: "right" });
      y += 9;
      arr<string>(ph.steps).forEach(step => bul(str(step), 10));
      y += 2;
    });
  }

  // ── TAB 10: SYNTHESIS ────────────────────────────────────────
  sec("SYNTHESIS");
  const syn = o(p.synthesis);
  if (syn.oneParagraph) t(str(syn.oneParagraph), 10, false, [55, 65, 81]);
  if (p.oneLiner) { y += 3; doc.setFillColor(245, 243, 255); doc.roundedRect(M, y - 2, CW, 14, 2, 2, "F"); doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(124, 58, 237); doc.text("YOUR ONE-LINER", M + 4, y + 2); const olLines = doc.splitTextToSize('"' + e(p.oneLiner) + '"', CW - 8); doc.setFontSize(9.5); doc.setFont("helvetica", "italic"); doc.setTextColor(30, 27, 75); doc.text(olLines, M + 4, y + 7); y += olLines.length * 4 + 9; }
  const wfy = arr<string>(syn.workingForYou);
  const wof = arr<string>(syn.watchOutFor);
  if (wfy.length) { y += 2; t("Working For You", 10, true, [16, 185, 129]); wfy.forEach(x => bul("● " + str(x), 4)); }
  if (wof.length) { y += 2; t("Watch Out For", 10, true, [245, 158, 11]); wof.forEach(x => bul("● " + str(x), 4)); }

  // ── PAGE FOOTERS ─────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(180, 180, 180);
    doc.text("Generated by Unbuilt.me  |  " + dateStr, M, 292);
    doc.text("Page " + i + " / " + total, PW - M, 292, { align: "right" });
  }

  doc.save(e(report.idea).replace(/[^a-z0-9]+/gi, "-").toLowerCase().substring(0, 50) + "-report.pdf");
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
