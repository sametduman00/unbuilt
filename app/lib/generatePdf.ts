// Shared PDF generation for Dig reports
// Used by both app/page.tsx (report header) and app/reports/page.tsx (My Reports)

export interface ReportData {
  id: string;
  tool: "gap-analysis" | "stack-advisor";
  idea: string;
  created_at: string;
  json_content: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateStackPdf(report: ReportData, jsPDF: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const M = 14, PW = 210, CW = PW - M * 2;
  let y = 18;

  const e = (s: unknown) => String(s ?? "").replace(/[\u0080-\uFFFF]/g, "");
  const arr = <T,>(v: unknown): T[] => Array.isArray(v) ? v as T[] : [];
  const str = (v: unknown) => String(v ?? "");

  const lH = (sz: number) => sz * 0.39;
  const chk = (n = 10) => { if (y + n > 285) { doc.addPage(); y = 16; } };

  const t = (content: string, sz = 10, bold = false, color: [number,number,number] = [30,30,30], ind = 0) => {
    doc.setFontSize(sz); doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(e(content), CW - ind);
    for (const line of lines) {
      if (y + lH(sz) + 2 > 285) { doc.addPage(); y = 16; doc.setFontSize(sz); doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setTextColor(...color); }
      doc.text(line, M + ind, y);
      y += lH(sz);
    }
    y += 2;
  };

  const bul = (content: string, ind = 4) => {
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(30,30,30);
    const lines = doc.splitTextToSize(e(content), CW - ind - 4);
    lines.forEach((line: string, i: number) => {
      if (y + lH(10) + 2 > 285) { doc.addPage(); y = 16; doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.setTextColor(30,30,30); }
      if (i === 0) doc.text("•", M + ind, y);
      doc.text(line, M + ind + 4, y);
      y += lH(10);
    });
    y += 2;
  };

  const sec = (title: string, sub?: string) => {
    chk(14); y += 5;
    doc.setFillColor(248,248,255); doc.rect(M-2, y-4, CW+4, 10, "F");
    doc.setDrawColor(200,200,230); doc.line(M-2, y-4, M-2, y+6);
    doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(60,60,120);
    doc.text(e(title), M+2, y+2);
    if (sub) { doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(150,150,150); doc.text(e(sub), M+2+doc.getTextWidth(title)*0.9+4, y+2); }
    y += 10; doc.setTextColor(30,30,30);
  };

  let p: Record<string,unknown> = {};
  try {
    const m = report.json_content.match(/```json\s*([\s\S]*?)```/);
    p = JSON.parse(m ? m[1] : report.json_content);
  } catch { /* ignore */ }

  const dateStr = new Date(report.created_at).toLocaleDateString("en-GB");

  // Header bar
  doc.setFillColor(99,102,241); doc.rect(0,0,210,12,"F");
  doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
  doc.text("STACK ADVISOR  |  UNBUILT.ME", M, 8);
  doc.text(dateStr, PW-M, 8, { align: "right" });
  y = 22;

  // Title
  t(e(report.idea), 15, true, [30,30,30]); y += 2;

  // Headline
  if (p.headline) {
    doc.setFillColor(245,243,255); doc.roundedRect(M, y-2, CW, 16, 2, 2, "F");
    doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(124,58,237);
    doc.text("RECOMMENDATION", M+4, y+3);
    const hlLines = doc.splitTextToSize(e(p.headline), CW-8);
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(17,24,39);
    doc.text(hlLines, M+4, y+8);
    y += 8 + hlLines.length*4 + 6;
  }

  // Summary badges
  const badges: string[] = [];
  if (p.timeToMvp) badges.push("MVP: " + str(p.timeToMvp));
  const phases = arr<{name:string;subtitle:string;tools:{name:string;purpose:string;price:string;free:boolean;alternatives?:{name:string;reason:string}[]}[];costs?:{tools:{name:string;purpose:string;freeTier:boolean;monthlyCost:string}[];total:string};vibeGuide?:{tool:string;url:string;prompt:string;tip?:string}[]}>(p.phases);
  if (phases.length) badges.push(phases.length + " phases");
  if (badges.length) { t(badges.join("   |   "), 9, false, [80,80,80]); y += 2; }

  // OVERVIEW: Phase summary cards
  sec("OVERVIEW");
  phases.forEach((phase, pi) => {
    const isP0 = /phase\s*0/i.test(phase.name) || /validate/i.test(phase.name);
    const phaseColors: [number,number,number][] = [[99,102,241],[16,185,129],[14,165,233],[245,158,11],[139,92,246]];
    const c = phaseColors[pi] ?? phaseColors[0];
    chk(22);
    // Phase row
    doc.setFillColor(...c.map(x => Math.min(255, x + 185)) as [number,number,number]);
    doc.roundedRect(M, y - 2, CW, 18, 2, 2, "F");
    // Phase label
    doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(...c);
    doc.text(isP0 ? "START HERE" : "PHASE " + pi, M + 4, y + 3);
    // Phase name
    doc.setFontSize(10.5); doc.setFont("helvetica","bold"); doc.setTextColor(17,24,39);
    doc.text(e(phase.name.replace(/^Phase\s*\d+:\s*/i, "")), M + 4, y + 9);
    // Subtitle
    if (phase.subtitle) {
      const subLines = doc.splitTextToSize(e(phase.subtitle), CW - 80);
      doc.setFontSize(8.5); doc.setFont("helvetica","normal"); doc.setTextColor(107,114,128);
      doc.text(subLines[0], M + 4, y + 14);
    }
    // Cost + tools count on right
    if (phase.costs?.total) {
      doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(...c);
      doc.text(str(phase.costs.total).split("(")[0].trim(), PW - M, y + 7, { align: "right" });
    }
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(150,150,150);
    doc.text(phase.tools.length + " tools →", PW - M, y + 13, { align: "right" });
    y += 22;
  });

  // PHASES — each phase in order
  phases.forEach((phase, pi) => {
    const phaseColors: [number,number,number][] = [[99,102,241],[16,185,129],[14,165,233],[245,158,11],[139,92,246]];
    const c = phaseColors[pi] ?? phaseColors[0];
    const isP0 = /phase\s*0/i.test(phase.name) || /validate/i.test(phase.name);

    sec(phase.name.replace(/^Phase\s*\d+:\s*/i,''), phase.subtitle);

    if (isP0) {
      doc.setFillColor(...c.map(x=>Math.min(255,x+180)) as [number,number,number]);
      doc.roundedRect(M, y-3, 60, 6, 1, 1, "F");
      doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(...c);
      doc.text("START HERE — DO THIS FIRST", M+3, y+1.5);
      y += 8;
    }

    // Tools
    t("Tools", 9, true, c, 0);
    phase.tools.forEach(tool => {
      chk(16);
      const priceTag = tool.free ? "Free" : tool.price;
      t(tool.name + "  [" + priceTag + "]", 10, true, [17,24,39], 4);
      t(tool.purpose, 9.5, false, [55,65,81], 8);
      const alts = arr<{name:string;reason:string}>(tool.alternatives);
      if (alts.length) {
        t("Alternatives: " + alts.map(a => a.name + " — " + a.reason).join("  |  "), 8.5, false, [150,150,150], 8);
      }
      y += 1;
    });

    // Cost breakdown
    if (phase.costs && phase.costs.tools.length > 0) {
      y += 2; t("Cost Breakdown", 9, true, [100,100,100], 0);
      phase.costs.tools.forEach(ct => {
        t(ct.name + ":  " + ct.monthlyCost + (ct.freeTier ? "  (free tier)" : "") + "  — " + ct.purpose, 9, false, [80,80,80], 4);
      });
      doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(...c);
      chk(6);
      doc.text("Phase total: " + str(phase.costs.total), PW-M, y, { align: "right" });
      y += 6;
    }

    // Vibe Guide
    const vg = arr<{tool:string;url:string;prompt:string;tip?:string}>(phase.vibeGuide);
    if (vg.length) {
      y += 3;
      doc.setFillColor(240,253,250); doc.roundedRect(M, y-3, CW, 8, 2, 2, "F");
      doc.setFontSize(8.5); doc.setFont("helvetica","bold"); doc.setTextColor(13,148,136);
      doc.text("🚀 HOW TO ACTUALLY DO THIS", M+4, y+2);
      y += 9;
      vg.forEach((step, si) => {
        doc.setFillColor(13,148,136); doc.circle(M+4, y+1.5, 3, "F");
        doc.setFontSize(8.5); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
        doc.text(String(si+1), M+3.2, y+2.2);
        t("Open " + step.tool + " → " + step.url, 9.5, true, [13,148,136], 10);
        t("Type this: " + step.prompt, 9, false, [20,78,74], 14);
        if (step.tip) t("💡 " + step.tip, 8.5, false, [107,114,128], 14);
        y += 3;
      });
    }
    y += 4;
  });

  // BUILD ORDER
  const buildOrder = arr<{week:string;title:string;steps:string[]}>(p.buildOrder);
  if (buildOrder.length) {
    sec("BUILD ORDER");
    buildOrder.forEach((block, bi) => {
      const bColors: [number,number,number][] = [[99,102,241],[16,185,129],[14,165,233],[245,158,11],[139,92,246]];
      const c = bColors[bi % bColors.length];
      doc.setFillColor(...c.map(x=>Math.min(255,x+170)) as [number,number,number]);
      doc.circle(M+5, y+2, 4, "F");
      doc.setFontSize(8.5); doc.setFont("helvetica","bold"); doc.setTextColor(...c);
      doc.text(String(bi+1), M+3.5, y+3.2);
      t(block.week + " — " + block.title, 10, true, [17,24,39], 12);
      arr<string>(block.steps).forEach((step, si) => {
        bul((si+1) + ". " + str(step), 8);
      });
      y += 3;
    });
  }

  // AVOID THESE (Mistakes)
  const mistakes = arr<{title:string;description:string}>(p.mistakes);
  if (mistakes.length) {
    sec("AVOID THESE");
    mistakes.forEach(m => {
      chk(18);
      doc.setFillColor(254,242,242); doc.roundedRect(M, y-2, CW, 8, 2, 2, "F");
      doc.setFontSize(8.5); doc.setFont("helvetica","bold"); doc.setTextColor(220,38,38);
      doc.text("⚠", M+3, y+3);
      t(str(m.title), 10, true, [220,38,38], 10);
      t(str(m.description), 9.5, false, [107,114,128], 4);
      y += 4;
    });
  }

  // SCALE UP (Scalability + Upgrades)
  const scalability = arr<{trigger:string;whatBreaks:string;upgradeTo:string;severity:string}>(p.scalability);
  const upgrades = arr<{tool:string;trigger:string;migrateTo:string}>(p.upgrades);
  if (scalability.length || upgrades.length) {
    sec("SCALE UP");
    if (scalability.length) {
      t("Scalability Triggers", 10, true, [60,60,120]);
      scalability.forEach(s => {
        const sc: [number,number,number] = s.severity === "high" ? [220,38,38] : s.severity === "medium" ? [245,158,11] : [16,185,129];
        t(str(s.trigger) + "  [" + str(s.severity).toUpperCase() + "]", 10, true, sc, 4);
        t("🔴 " + str(s.whatBreaks), 9.5, false, [107,114,128], 8);
        t("→ Upgrade to: " + str(s.upgradeTo), 9.5, false, [16,185,129], 8);
        y += 2;
      });
    }
    if (upgrades.length) {
      y += 3; t("Upgrade Path", 10, true, [60,60,120]);
      upgrades.forEach(u => {
        t(str(u.tool), 10, true, [30,30,30], 4);
        t("When: " + str(u.trigger), 9, false, [107,114,128], 8);
        t("→ Migrate to: " + str(u.migrateTo), 9.5, false, [99,102,241], 8);
        y += 2;
      });
    }
  }

  // Page footers
  const total = doc.getNumberOfPages();
  for (let i=1; i<=total; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(180,180,180);
    doc.text("Generated by Unbuilt.me  |  " + dateStr, M, 292);
    doc.text("Page " + i + " / " + total, PW-M, 292, { align: "right" });
  }

  doc.save(e(report.idea).replace(/[^a-z0-9]+/gi,"-").toLowerCase().substring(0,50) + "-stack-report.pdf");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generatePdf(report: ReportData, jsPDF: any) {
  // Route to Stack renderer
  if (report.tool === 'stack-advisor') {
    generateStackPdf(report, jsPDF);
    return;
  }

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const M = 14, PW = 210, CW = PW - M * 2;
  let y = 18;

  const e = (s: unknown) => String(s ?? "").replace(/[\u0080-\uFFFF]/g, "");
  const arr = <T,>(v: unknown): T[] => Array.isArray(v) ? v as T[] : [];
  const str = (v: unknown) => String(v ?? "");
  const o = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v)) ? v as Record<string, unknown> : {};

  const chk = (n = 10) => { if (y + n > 282) { doc.addPage(); y = 16; } };

  const lineH = (sz: number) => sz * 0.39;
  const t = (content: string, sz = 10, bold = false, color: [number, number, number] = [30, 30, 30], ind = 0) => {
    doc.setFontSize(sz); doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(e(content), CW - ind);
    // Render line by line, adding new page as needed
    for (const line of lines) {
      if (y + lineH(sz) + 2 > 285) { doc.addPage(); y = 16; doc.setFontSize(sz); doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setTextColor(...color); }
      doc.text(line, M + ind, y);
      y += lineH(sz);
    }
    y += 2;
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
    // Print bullet on first line, continuation lines indented
    lines.forEach((line: string, i: number) => {
      if (y + lineH(10) + 2 > 285) { doc.addPage(); y = 16; doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(30, 30, 30); }
      if (i === 0) doc.text("•", M + ind, y);
      doc.text(line, M + ind + 4, y);
      y += lineH(10);
    });
    y += 2;
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
      const bl = doc.splitTextToSize(e(item.body), cw - 6);
      doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
      doc.text(bl, cx + 3, cy + 10 + tl.length * 4 + 2);
      maxH = Math.max(maxH, 10 + tl.length * 4 + 2 + bl.length * 3.5 + 4);
    });
    y = cy + maxH + 4;
  };

  let p: Record<string, unknown> = {};
  try {
    let fenceMatch = report.json_content.match(/```json\s*([\s\S]*?)```/);
    if (!fenceMatch) {
      const openMatch = report.json_content.match(/```json\s*([\s\S]*)/);
      if (openMatch) fenceMatch = openMatch;
    }
    let jsonStr = fenceMatch ? fenceMatch[1].trim() : report.json_content;
    // Find first { if not starting with one
    if (!jsonStr.startsWith('{')) {
      const idx = jsonStr.indexOf('{');
      if (idx >= 0) jsonStr = jsonStr.substring(idx);
    }
    try { JSON.parse(jsonStr); } catch {
      jsonStr = jsonStr.replace(/,\s*$/, '');
      let opens = 0, opensArr = 0;
      for (const ch of jsonStr) {
        if (ch === '{') opens++; else if (ch === '}') opens--;
        else if (ch === '[') opensArr++; else if (ch === ']') opensArr--;
      }
      for (let i = 0; i < opensArr; i++) jsonStr += ']';
      for (let i = 0; i < opens; i++) jsonStr += '}';
    }
    p = JSON.parse(jsonStr);
  } catch { /* ignore */ }

  const toolLabel = report.tool === "gap-analysis" ? "Dig" : "Stack";
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
    // Confidence badge
    const ev = o(p._evidence);
    if (ev.level) {
      const confC: [number, number, number] = ev.level === "high" ? [22, 163, 74] : ev.level === "moderate" ? [234, 88, 12] : [220, 38, 38];
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...confC);
      doc.text(str(ev.level).toUpperCase() + " CONFIDENCE", M + 50, y + 16);
    }
    y += 20;
  }
  // Verdict
  if (p.verdict) t(str(p.verdict), 10, true, [17, 24, 39]);
  if (p.marketScoreSummary) t(str(p.marketScoreSummary), 10, false, [60, 60, 60]);

  // Recommended action badge
  const synAct = o(p.synthesis);
  if (synAct.recommendedAction) {
    const actC: [number, number, number] = synAct.recommendedAction === "kill" ? [220, 38, 38] : synAct.recommendedAction === "move_fast" ? [22, 163, 74] : synAct.recommendedAction === "build_mvp" ? [37, 99, 235] : synAct.recommendedAction === "reposition" ? [234, 88, 12] : [55, 65, 81];
    t("Recommended: " + str(synAct.recommendedAction).replace(/_/g, " "), 10, true, actC);
  }

  if (p.oneLiner) { y += 2; t("One-Liner: " + str(p.oneLiner), 10, false, [80, 40, 160]); }

  // Key numbers
  const kn: string[] = [];
  const ms0 = o(p.marketSize); if (ms0.tam) kn.push("TAM: " + str(ms0.tam).split(" ")[0]);
  const comp0 = arr<{ name: string }>(p.competitors)[0]; if (comp0) kn.push("Top threat: " + str(comp0.name));
  const gap0 = arr<{ title: string }>(p.marketGaps)[0]; if (gap0) kn.push("Best gap: " + str(gap0.title));
  if (kn.length) { y += 2; t(kn.join("   |   "), 9, false, [80, 80, 80]); }

  // Fatal flaw + upside condition cards
  const synFF = o(p.synthesis);
  if (synFF.fatalFlaw || synFF.upsideCondition) {
    y += 3;
    if (synFF.fatalFlaw) {
      doc.setFillColor(254, 242, 242); doc.roundedRect(M, y - 2, CW / 2 - 2, 20, 2, 2, "F");
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(220, 38, 38);
      doc.text("FATAL FLAW", M + 3, y + 3);
      doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(127, 29, 29);
      const ffLines = doc.splitTextToSize(e(synFF.fatalFlaw), CW / 2 - 10);
      doc.text(ffLines, M + 3, y + 7);
      const ffH = Math.max(20, ffLines.length * 3.5 + 10);
      doc.setFillColor(254, 242, 242); doc.roundedRect(M, y - 2, CW / 2 - 2, ffH, 2, 2, "F");
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(220, 38, 38); doc.text("FATAL FLAW", M + 3, y + 3);
      doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(127, 29, 29); doc.text(ffLines, M + 3, y + 7);
    }
    if (synFF.upsideCondition) {
      const ux = M + CW / 2 + 2;
      doc.setFillColor(240, 253, 244); doc.roundedRect(ux, y - 2, CW / 2 - 2, 20, 2, 2, "F");
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(22, 163, 74);
      doc.text("UPSIDE CONDITION", ux + 3, y + 3);
      doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(20, 83, 45);
      const ucLines = doc.splitTextToSize(e(synFF.upsideCondition), CW / 2 - 10);
      doc.text(ucLines, ux + 3, y + 7);
      const ucH = Math.max(20, ucLines.length * 3.5 + 10);
      doc.setFillColor(240, 253, 244); doc.roundedRect(ux, y - 2, CW / 2 - 2, ucH, 2, 2, "F");
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(22, 163, 74); doc.text("UPSIDE CONDITION", ux + 3, y + 3);
      doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(20, 83, 45); doc.text(ucLines, ux + 3, y + 7);
    }
    y += 24;
  }

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

  // D1-D5 Score Breakdown
  const scoring = o(p._scoring);
  if (Object.keys(scoring).length) {
    y += 4;
    t("SCORE BREAKDOWN", 9, true, [60, 60, 120]);
    const dims = [
      { key: "D1_demand", label: "Demand signals (30%)", color: [99, 102, 241] as [number, number, number] },
      { key: "D2_competition", label: "Competitive density (20%)", color: [245, 158, 11] as [number, number, number] },
      { key: "D3_gaps", label: "Gap quality (25%)", color: [16, 185, 129] as [number, number, number] },
      { key: "D4_timing", label: "Market timing (15%)", color: [236, 72, 153] as [number, number, number] },
      { key: "D5_entry", label: "Entry feasibility (10%)", color: [139, 92, 246] as [number, number, number] },
    ];
    dims.forEach(dim => {
      const d = o(scoring[dim.key]);
      const sc = Number(d.score ?? 0);
      chk(8);
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(55, 65, 81);
      doc.text(dim.label, M, y + 2);
      // Progress bar
      const barX = M + 55, barW = CW - 70;
      doc.setFillColor(243, 244, 246); doc.roundedRect(barX, y - 1, barW, 4, 1, 1, "F");
      doc.setFillColor(...dim.color); doc.roundedRect(barX, y - 1, barW * sc / 100, 4, 1, 1, "F");
      doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(17, 24, 39);
      doc.text(str(sc), M + CW - 4, y + 2, { align: "right" });
      y += 7;
    });
    if (scoring.fatal_floor_applied) {
      doc.setFillColor(254, 242, 242); doc.roundedRect(M, y, CW, 7, 2, 2, "F");
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(220, 38, 38);
      doc.text("Fatal floor applied — score capped due to low demand or gap quality.", M + 3, y + 4.5);
      y += 10;
    }
  }

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
  const painPts = arr<{ quote: string; source?: string; severity?: string; demandSignal?: string }>(p.painPoints);
  if (painPts.length) {
    t("Pain Points", 10, true, [60, 60, 120]);
    painPts.forEach(pp => {
      const sc: [number, number, number] = pp.severity === "high" ? [239, 68, 68] : pp.severity === "medium" ? [245, 158, 11] : [16, 185, 129];
      doc.setFillColor(...sc); doc.rect(M, y - 1, 2, 5, "F");
      bul((pp.severity ? "[" + str(pp.severity).toUpperCase() + "] " : "") + '"' + str(pp.quote) + '"' + (pp.source ? "  — " + str(pp.source) : ""), 6);
      if (pp.demandSignal) t("Signal: " + str(pp.demandSignal), 8.5, false, [139, 92, 246], 10);
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
      if (r.body) t(str(r.body), 9, false, [107, 114, 128], 8);
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
  arr<{ name: string; tagline: string; threatLevel?: number; funding?: string; userCount?: string; strengths?: string[]; weaknesses?: string[] }>(p.competitors).forEach(c => {
    chk(20);
    const tl = c.threatLevel ?? 0;
    const tlc: [number, number, number] = tl >= 8 ? [220, 38, 38] : tl >= 5 ? [234, 88, 12] : [22, 163, 74];
    t(str(c.name) + "  " + (tl > 0 ? "Threat: " + tl + "/10" : ""), 11, true, tlc);
    t(str(c.tagline), 9, false, [107, 114, 128], 4);
    const meta: string[] = [];
    if (c.funding) meta.push("Funding: " + str(c.funding));
    if (c.userCount) meta.push("Users: " + str(c.userCount));
    if (meta.length) t(meta.join("  |  "), 8.5, false, [150, 150, 150], 4);
    const str2 = arr<string>(c.strengths); const wks = arr<string>(c.weaknesses);
    if (str2.length) { t("Strengths:", 9, true, [16, 185, 129], 4); str2.forEach(s => bul(str(s), 8)); }
    if (wks.length) { t("Weaknesses:", 9, true, [239, 68, 68], 4); wks.forEach(w => bul(str(w), 8)); }
    y += 2;
  });

  // Existing Apps (App Store)
  const itunesApps = arr<{trackName?:string;artworkUrl60?:string;averageUserRating?:number;userRatingCount?:number;description?:string;formattedPrice?:string;sellerName?:string}>(p.itunesApps);
  if (itunesApps.length) {
    y += 4; t("Existing Apps (App Store)", 10, true, [60, 60, 120]);
    itunesApps.forEach(app => {
      const rating = app.averageUserRating ? app.averageUserRating.toFixed(1) : "";
      const reviews = app.userRatingCount ? (app.userRatingCount >= 1000 ? Math.round(app.userRatingCount/1000)+"K reviews" : app.userRatingCount+" reviews") : "";
      t(str(app.trackName) + (rating ? "  ★" + rating : "") + (reviews ? "  (" + reviews + ")" : "") + (app.formattedPrice ? "  " + str(app.formattedPrice) : "  Free"), 10, true, [17, 24, 39], 4);
      if (app.sellerName) t("by " + str(app.sellerName), 8.5, false, [150, 150, 150], 8);
      if (app.description) t(str(app.description), 9, false, [107, 114, 128], 8);
      y += 1;
    });
  }

  // ── TAB 5: MARKET GAPS ───────────────────────────────────────
  sec("MARKET GAPS");
  arr<{ title: string; description: string; evidence?: string; opportunityScore?: number; status?: string }>(p.marketGaps).forEach(g => {
    const sc: [number, number, number] = g.status === "untapped" ? [22, 101, 52] : g.status === "emerging" ? [30, 64, 175] : [133, 77, 14];
    t(str(g.title) + (g.status ? "  [" + g.status.toUpperCase() + "]" : "") + (g.opportunityScore != null ? "  Score: " + g.opportunityScore + "/10" : ""), 10, true, sc);
    t(str(g.description), 9.5, false, [60, 60, 60], 4);
    if (g.evidence) t("Evidence: " + str(g.evidence), 8.5, false, [150, 150, 150], 4);
    y += 2;
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
      t(str(c.name) + (c.type ? "  [" + str(c.type).toUpperCase() + "]" : "") + (c.estimatedCAC ? "  Est. CAC: " + str(c.estimatedCAC) : ""), 10, true, tc, 4);
      if (c.description) t(str(c.description), 9, false, [107, 114, 128], 8);
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
        if (ti.evidence) t(str(ti.evidence), 8.5, false, [150, 150, 150], 10);
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
      if (burn.infrastructure) t("Infrastructure: " + str(burn.infrastructure), 9, false, [107, 114, 128], 6);
      if (burn.tools) t("Tools: " + str(burn.tools), 9, false, [107, 114, 128], 6);
      if (burn.marketing) t("Marketing: " + str(burn.marketing), 9, false, [107, 114, 128], 6);
      if (burn.acquisition) t("Acquisition: " + str(burn.acquisition), 9, false, [107, 114, 128], 6);
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
        if (sv.assumption) t(str(sv.assumption), 9, false, [107, 114, 128], 8);
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
      if (vv.note) t(str(vv.note), 9, false, [107, 114, 128], 8);
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
      if (v.howToTest) t("Test: " + str(v.howToTest), 9, false, [107, 114, 128], 8);
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
  // Verdict
  if (p.verdict) t(str(p.verdict), 10, true, [17, 24, 39]);
  if (syn.oneParagraph) t(str(syn.oneParagraph), 10, false, [55, 65, 81]);

  // Recommended action
  if (syn.recommendedAction) {
    const actColor: [number, number, number] = syn.recommendedAction === "kill" ? [220, 38, 38] : syn.recommendedAction === "move_fast" ? [22, 163, 74] : syn.recommendedAction === "build_mvp" ? [37, 99, 235] : syn.recommendedAction === "reposition" ? [234, 88, 12] : [55, 65, 81];
    y += 2; t("Recommended: " + str(syn.recommendedAction).replace(/_/g, " "), 11, true, actColor);
  }

  // Fatal flaw + upside condition
  if (syn.fatalFlaw) {
    y += 3;
    doc.setFillColor(254, 242, 242); doc.roundedRect(M, y - 2, CW, 14, 2, 2, "F");
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(220, 38, 38);
    doc.text("FATAL FLAW", M + 3, y + 2);
    const ffL = doc.splitTextToSize(e(syn.fatalFlaw), CW - 8);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(127, 29, 29);
    doc.text(ffL, M + 3, y + 6);
    y += Math.max(14, ffL.length * 3.8 + 8);
  }
  if (syn.upsideCondition) {
    doc.setFillColor(240, 253, 244); doc.roundedRect(M, y - 2, CW, 14, 2, 2, "F");
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(22, 163, 74);
    doc.text("UPSIDE CONDITION", M + 3, y + 2);
    const ucL = doc.splitTextToSize(e(syn.upsideCondition), CW - 8);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(20, 83, 45);
    doc.text(ucL, M + 3, y + 6);
    y += Math.max(14, ucL.length * 3.8 + 8);
  }

  // One-liner
  if (p.oneLiner) { y += 3; doc.setFillColor(245, 243, 255); doc.roundedRect(M, y - 2, CW, 14, 2, 2, "F"); doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(124, 58, 237); doc.text("YOUR ONE-LINER", M + 4, y + 2); const olLines = doc.splitTextToSize('"' + e(p.oneLiner) + '"', CW - 8); doc.setFontSize(9.5); doc.setFont("helvetica", "italic"); doc.setTextColor(30, 27, 75); doc.text(olLines, M + 4, y + 7); y += olLines.length * 4 + 9; }

  // Defensibility
  const def = o(syn.defensibility);
  if (Object.keys(def).length) {
    y += 3; t("DEFENSIBILITY", 9, true, [60, 60, 120]);
    if (def.level) {
      const defC: [number, number, number] = def.level === "high" ? [22, 163, 74] : def.level === "medium" ? [234, 88, 12] : [220, 38, 38];
      t(str(def.level).toUpperCase() + " defensibility", 10, true, defC, 4);
    }
    if (def.moat) t("Moat: " + str(def.moat), 9.5, false, [55, 65, 81], 4);
    if (def.copyTimeframe) t("Copy timeframe: " + str(def.copyTimeframe), 9.5, false, [55, 65, 81], 4);
  }

  // Working for you / Watch out
  const wfy = arr<string>(syn.workingForYou);
  const wof = arr<string>(syn.watchOutFor);
  if (wfy.length) { y += 2; t("Working For You", 10, true, [16, 185, 129]); wfy.forEach(x => bul("● " + str(x), 4)); }
  if (wof.length) { y += 2; t("Watch Out For", 10, true, [245, 158, 11]); wof.forEach(x => bul("● " + str(x), 4)); }

  // Confidence note
  if (syn.confidenceNote) { y += 3; t(str(syn.confidenceNote), 9, false, [150, 150, 150]); }

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
