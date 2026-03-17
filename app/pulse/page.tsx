"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Signal {
  source: string; sourceLabel: string; emoji: string;
  title: string; subtitle: string; signal: string; url: string; timestamp: string;
  movementType?: string; rankChange?: number;
  imageUrl?: string; topics?: string[]; tagline?: string;
  externalUrl?: string; claudeGap?: string;
}

interface AppStoreApp {
  app_id: string; app_name: string; developer: string; category: string;
  price: string; icon_url: string; store_url: string; release_date: string;
  description: string; rating: number | null; review_count: number;
  min_os: string; age_rating: string; languages: string[];
  screenshot_urls: string[]; file_size_mb: number | null;
  claude_what: string | null; claude_different: string | null; claude_missing: string | null;
  isToday?: boolean;
}

interface AppStoreDay {
  date: string; isToday: boolean; apps: AppStoreApp[]; appCount: number; generatedAt: string;
}

const TOPIC_COLORS = ["#6366f1","#06b6d4","#f59e0b","#ec4899","#22c55e","#8b5cf6","#f97316","#14b8a6"];
const MOVEMENT_COLORS: Record<string, string> = { rank_jump:"#22c55e", new_entry:"#3b82f6", review_spike:"#f59e0b", top_mover:"#8b5cf6", weekly_mover:"#06b6d4", monthly_mover:"#ec4899" };

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const h = Math.floor(mins / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}
function parseGap(gap: string | undefined) {
  if (!gap) return null;
  const p = gap.split("\u2726").map(s => s.trim());
  if (p.length < 3) return null;
  return { what: p[0].replace(/^What:\s*/i,"").trim(), different: p[1].replace(/^Different:\s*/i,"").trim(), missing: p[2].replace(/^Missing:\s*/i,"").trim() };
}
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function PulsePage() {
  const [tab, setTab] = useState<"ph"|"appstore">("ph");
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [hasMovement, setHasMovement] = useState(false);
  const [asDays, setAsDays] = useState<AppStoreDay[]>([]);
  const [asLoading, setAsLoading] = useState(false);
  const [asFilter, setAsFilter] = useState("all");
  const [phFilter, setPhFilter] = useState("all");
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const s = localStorage.getItem("theme");
    const d = s ? s === "dark" : true;
    setIsDark(d);
    document.documentElement.classList.toggle("light", !d);
  }, []);
  const toggleTheme = () => {
    const n = !isDark; setIsDark(n);
    document.documentElement.classList.toggle("light", !n);
    localStorage.setItem("theme", n ? "dark" : "light");
  };

  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch("/api/pulse");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSignals(data.signals ?? []); setHasMovement(data.hasMovementData ?? false); setError(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchSignals(); }, [fetchSignals]);

  const fetchAS = useCallback(async () => {
    setAsLoading(true);
    try {
      const r = await fetch("/api/pulse/appstore");
      const d = await r.json();
      setAsDays(d.days ?? []);
    } catch {} finally { setAsLoading(false); }
  }, []);
  useEffect(() => { if (tab === "appstore" && asDays.length === 0) fetchAS(); }, [tab, asDays.length, fetchAS]);

  const ph = signals.filter(s => s.source === "producthunt");
  const topics = Array.from(new Set(ph.flatMap(s => s.topics||[]))).sort();
  const filteredPH = phFilter === "all" ? ph : ph.filter(s => s.topics?.includes(phFilter));
  const analyzed = ph.filter(s => s.claudeGap).length;

  // App store: flatten all apps, filter by category
  const allAsCategories = Array.from(new Set(asDays.flatMap(d => d.apps.map(a => a.category)))).sort();
  const allAsApps = asDays.flatMap(d => d.apps.filter(a => asFilter === "all" || a.category === asFilter));

  const skeleton = (
    <div style={{display:"flex",flexDirection:"column",gap:"0.625rem"}}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderRadius:12,padding:"1.25rem",opacity:1-i*0.15}}>
          <div style={{display:"flex",gap:"1rem"}}>
            <div style={{width:64,height:64,borderRadius:14,background:"var(--clr-border)",flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{width:"50%",height:16,borderRadius:6,background:"var(--clr-border)",marginBottom:8}}/>
              <div style={{width:"30%",height:12,borderRadius:6,background:"var(--clr-border)",marginBottom:12}}/>
              <div style={{width:"80%",height:12,borderRadius:6,background:"var(--clr-border)"}}/>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"var(--clr-bg)",color:"var(--clr-text)"}}>
      <header style={{borderBottom:"1px solid var(--clr-border)",background:"var(--clr-bg)",position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 2rem",height:56,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Link href="/" style={{display:"flex",alignItems:"center",gap:8,textDecoration:"none"}}>
              <svg width="20" height="20" viewBox="0 0 19 19" fill="none"><path d="M2.5 5.5h14M2.5 9.5h10M2.5 13.5h6" stroke="var(--clr-accent)" strokeWidth="2" strokeLinecap="round"/></svg>
              <span style={{fontWeight:700,fontSize:"1rem",color:"var(--clr-text)",letterSpacing:"-0.02em"}}>Unbuilt</span>
            </Link>
            <span style={{marginLeft:"0.5rem",fontSize:"0.875rem",color:"var(--clr-text-3)"}}>/ Pulse</span>
          </div>
          <button onClick={toggleTheme} style={{background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderRadius:8,padding:"0.375rem 0.75rem",cursor:"pointer",display:"flex",alignItems:"center",gap:6,fontSize:"0.8125rem",color:"var(--clr-text-3)"}}>
            {isDark ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
            {isDark ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      <div style={{borderBottom:"1px solid var(--clr-border)",background:"var(--clr-bg)",position:"sticky",top:56,zIndex:40}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 2rem",display:"flex"}}>
          {([{id:"ph" as const,label:"Product Hunt",color:"#DA552F"},{id:"appstore" as const,label:"App Store",color:"#007AFF"}]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{background:"none",border:"none",borderBottom:tab===t.id?"2px solid "+t.color:"2px solid transparent",padding:"0.75rem 1.25rem",cursor:"pointer",fontSize:"0.875rem",fontWeight:tab===t.id?600:400,color:tab===t.id?t.color:"var(--clr-text-3)",transition:"color 0.15s,border-color 0.15s"}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main style={{maxWidth:1200,margin:"0 auto",padding:"2rem 2rem 4rem"}}>

        {/* PRODUCT HUNT */}
        {tab === "ph" && (
          <div>
            <div style={{marginBottom:"1.5rem"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                <h1 style={{fontSize:"1.5rem",fontWeight:700,letterSpacing:"-0.03em",margin:0}}>Product Hunt</h1>
                <span style={{fontSize:"0.625rem",fontWeight:700,padding:"0.2rem 0.6rem",borderRadius:999,background:"rgba(218,85,47,0.12)",color:"#DA552F",letterSpacing:"0.05em"}}>TODAY</span>
              </div>
              <p style={{color:"var(--clr-text-3)",fontSize:"0.875rem",margin:"0 0 0.75rem"}}>
                {ph.length > 0 ? ph.length + " products · " + analyzed + " analyzed" : "Loading today's products..."}
              </p>
              {topics.length > 0 && (
                <div style={{display:"flex",gap:"0.375rem",flexWrap:"wrap"}}>
                  {["all",...topics.slice(0,15)].map(t => (
                    <button key={t} onClick={() => setPhFilter(t)} style={{background:phFilter===t?"rgba(218,85,47,0.12)":"var(--clr-surface)",border:phFilter===t?"1px solid rgba(218,85,47,0.35)":"1px solid var(--clr-border)",color:phFilter===t?"#DA552F":"var(--clr-text-3)",borderRadius:999,padding:"0.25rem 0.75rem",fontSize:"0.75rem",fontWeight:phFilter===t?600:400,cursor:"pointer",transition:"all 0.15s"}}>
                      {t === "all" ? "All" : t}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {loading && skeleton}
            {error && !loading && <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,padding:"1rem",color:"#ef4444",fontSize:"0.875rem"}}>{error}</div>}
            {!loading && filteredPH.length === 0 && <div style={{textAlign:"center",padding:"4rem 0",color:"var(--clr-text-3)"}}>No products found.</div>}
            {!loading && filteredPH.length > 0 && (
              <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                {filteredPH.map((s,i) => {
                  const mc = MOVEMENT_COLORS[s.movementType??""]; const gap = parseGap(s.claudeGap);
                  return (
                    <a key={s.title+i} href={s.externalUrl||s.url} target="_blank" rel="noopener noreferrer"
                      style={{display:"flex",alignItems:"flex-start",gap:"1rem",padding:"1.25rem",background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderLeft:mc?"3px solid "+mc:"1px solid var(--clr-border)",borderRadius:12,textDecoration:"none",color:"inherit",transition:"background 0.15s"}}
                      onMouseEnter={e => e.currentTarget.style.background="rgba(var(--clr-text-rgb),0.02)"}
                      onMouseLeave={e => e.currentTarget.style.background="var(--clr-surface)"}>
                      {s.imageUrl ? <img src={s.imageUrl} alt="" width={64} height={64} style={{borderRadius:14,flexShrink:0,objectFit:"cover",border:"1px solid var(--clr-border)"}}/>
                        : <div style={{width:64,height:64,borderRadius:14,background:"var(--clr-border)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.75rem"}}>{s.emoji}</div>}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.375rem",flexWrap:"wrap"}}>
                          <span style={{fontSize:"1rem",fontWeight:650,color:"var(--clr-text)",letterSpacing:"-0.02em"}}>{s.title}</span>
                          {mc && s.movementType !== "ph_trending" && s.movementType !== "trending" && (
                            <span style={{fontSize:"0.5625rem",fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",padding:"0.1rem 0.4rem",borderRadius:999,background:mc+"20",color:mc}}>
                              {s.movementType==="rank_jump"?"RANK JUMP":s.movementType==="new_entry"?"NEW":s.movementType==="review_spike"?"REVIEWS":s.movementType==="top_mover"?"TOP MOVER":s.movementType==="weekly_mover"?"WEEKLY":"MONTHLY"}
                            </span>
                          )}
                          <span style={{fontSize:"0.6875rem",color:"var(--clr-text-4)",marginLeft:"auto"}}>{relativeTime(s.timestamp)}</span>
                        </div>
                        {s.tagline && <p style={{fontSize:"0.875rem",color:"var(--clr-text-3)",margin:"0 0 0.5rem",lineHeight:1.45}}>{s.tagline}</p>}
                        {s.topics && s.topics.length > 0 && (
                          <div style={{display:"flex",gap:"0.25rem",marginBottom:"0.625rem",flexWrap:"wrap"}}>
                            {s.topics.map((t,ti) => <span key={t} style={{fontSize:"0.625rem",fontWeight:600,padding:"0.15rem 0.5rem",borderRadius:999,background:TOPIC_COLORS[ti%TOPIC_COLORS.length]+"18",color:TOPIC_COLORS[ti%TOPIC_COLORS.length]}}>{t}</span>)}
                          </div>
                        )}
                        {gap && (
                          <div style={{background:"rgba(var(--clr-text-rgb),0.03)",border:"1px solid var(--clr-border)",borderRadius:10,padding:"0.75rem 1rem"}}>
                            <div style={{fontSize:"0.625rem",fontWeight:700,color:"var(--clr-text-4)",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:"0.5rem"}}>AI Analysis</div>
                            <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                              <div style={{display:"flex",gap:"0.5rem",alignItems:"flex-start"}}><span style={{fontSize:"0.625rem",fontWeight:700,color:"#6366f1",background:"rgba(99,102,241,0.12)",padding:"0.1rem 0.45rem",borderRadius:5,flexShrink:0,marginTop:1,whiteSpace:"nowrap"}}>WHAT</span><span style={{fontSize:"0.8125rem",color:"var(--clr-text-3)",lineHeight:1.5}}>{gap.what}</span></div>
                              <div style={{display:"flex",gap:"0.5rem",alignItems:"flex-start"}}><span style={{fontSize:"0.625rem",fontWeight:700,color:"#06b6d4",background:"rgba(6,182,212,0.12)",padding:"0.1rem 0.45rem",borderRadius:5,flexShrink:0,marginTop:1,whiteSpace:"nowrap"}}>DIFF</span><span style={{fontSize:"0.8125rem",color:"var(--clr-text-3)",lineHeight:1.5}}>{gap.different}</span></div>
                              <div style={{display:"flex",gap:"0.5rem",alignItems:"flex-start"}}><span style={{fontSize:"0.625rem",fontWeight:700,color:"#f59e0b",background:"rgba(245,158,11,0.12)",padding:"0.1rem 0.45rem",borderRadius:5,flexShrink:0,marginTop:1,whiteSpace:"nowrap"}}>GAP</span><span style={{fontSize:"0.8125rem",color:"var(--clr-text-3)",lineHeight:1.5}}>{gap.missing}</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{flexShrink:0,color:"var(--clr-text-4)",alignSelf:"center"}}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* APP STORE */}
        {tab === "appstore" && (
          <div>
            <div style={{marginBottom:"1.5rem"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                <h1 style={{fontSize:"1.5rem",fontWeight:700,letterSpacing:"-0.03em",margin:0}}>App Store</h1>
                <span style={{fontSize:"0.625rem",fontWeight:700,padding:"0.2rem 0.6rem",borderRadius:999,background:"rgba(0,122,255,0.12)",color:"#007AFF",letterSpacing:"0.05em"}}>NEW TODAY</span>
              </div>
              <p style={{color:"var(--clr-text-3)",fontSize:"0.875rem",margin:"0 0 0.75rem"}}>
                {asDays.length > 0 ? "Last " + asDays.length + " days · " + allAsApps.length + " apps" : "Loading today's apps..."}
              </p>
              {allAsCategories.length > 0 && (
                <div style={{display:"flex",gap:"0.375rem",flexWrap:"wrap"}}>
                  {["all",...allAsCategories.slice(0,20)].map(cat => (
                    <button key={cat} onClick={() => setAsFilter(cat)} style={{background:asFilter===cat?"rgba(0,122,255,0.12)":"var(--clr-surface)",border:asFilter===cat?"1px solid rgba(0,122,255,0.3)":"1px solid var(--clr-border)",color:asFilter===cat?"#007AFF":"var(--clr-text-3)",borderRadius:999,padding:"0.25rem 0.75rem",fontSize:"0.75rem",fontWeight:asFilter===cat?600:400,cursor:"pointer",transition:"all 0.15s"}}>
                      {cat === "all" ? "All" : cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {asLoading && skeleton}

            {!asLoading && asDays.length === 0 && (
              <div style={{textAlign:"center",padding:"4rem 0",color:"var(--clr-text-3)"}}>
                <div style={{fontSize:"2rem",marginBottom:"0.75rem"}}>\uD83D\uDD04</div>
                <div style={{fontWeight:600,marginBottom:"0.375rem"}}>No data yet</div>
                <div style={{fontSize:"0.875rem"}}>Check back after 08:00 UTC.</div>
              </div>
            )}

            {!asLoading && asDays.length > 0 && (
              <div style={{display:"flex",flexDirection:"column",gap:"2rem"}}>
                {asDays.map(day => {
                  const dayApps = day.apps.filter(a => asFilter === "all" || a.category === asFilter);
                  if (dayApps.length === 0) return null;
                  return (
                    <div key={day.date}>
                      {/* Day header */}
                      <div style={{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"0.75rem"}}>
                        <span style={{fontSize:"0.9375rem",fontWeight:700,color:"var(--clr-text)",letterSpacing:"-0.01em"}}>{formatDate(day.date)}</span>
                        {day.isToday
                          ? <span style={{fontSize:"0.5625rem",fontWeight:700,padding:"0.15rem 0.5rem",borderRadius:999,background:"rgba(0,122,255,0.12)",color:"#007AFF",letterSpacing:"0.05em"}}>TODAY</span>
                          : <span style={{fontSize:"0.5625rem",fontWeight:700,padding:"0.15rem 0.5rem",borderRadius:999,background:"rgba(var(--clr-text-rgb),0.06)",color:"var(--clr-text-4)",letterSpacing:"0.05em"}}>❄ FROZEN</span>
                        }
                        <span style={{fontSize:"0.75rem",color:"var(--clr-text-4)"}}>{dayApps.length} apps</span>
                      </div>

                      {/* Apps for this day */}
                      <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                        {dayApps.map(app => (
                          <a key={app.app_id} href={app.store_url} target="_blank" rel="noopener noreferrer"
                            style={{display:"flex",flexDirection:"column",gap:"0.875rem",padding:"1.25rem",background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderLeft:day.isToday?"3px solid #007AFF":"1px solid var(--clr-border)",borderRadius:12,textDecoration:"none",color:"inherit",transition:"background 0.15s"}}
                            onMouseEnter={e => e.currentTarget.style.background="rgba(var(--clr-text-rgb),0.02)"}
                            onMouseLeave={e => e.currentTarget.style.background="var(--clr-surface)"}>

                            {/* Top row: icon + info */}
                            <div style={{display:"flex",alignItems:"flex-start",gap:"1rem"}}>
                              {app.icon_url
                                ? <img src={app.icon_url} alt="" width={64} height={64} style={{borderRadius:14,flexShrink:0,objectFit:"cover",border:"1px solid var(--clr-border)"}}/>
                                : <div style={{width:64,height:64,borderRadius:14,background:"var(--clr-border)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.75rem"}}>\uD83D\uDCF1</div>
                              }
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.25rem",flexWrap:"wrap"}}>
                                  <span style={{fontSize:"1rem",fontWeight:650,color:"var(--clr-text)",letterSpacing:"-0.02em"}}>{app.app_name}</span>
                                  {app.category && <span style={{fontSize:"0.5625rem",fontWeight:700,letterSpacing:"0.04em",textTransform:"uppercase",padding:"0.1rem 0.4rem",borderRadius:999,background:"rgba(99,102,241,0.12)",color:"#6366f1"}}>{app.category}</span>}
                                  {app.price && app.price !== "Free" && <span style={{fontSize:"0.6875rem",fontWeight:700,color:"#22c55e"}}>{app.price}</span>}
                                  {app.age_rating && <span style={{fontSize:"0.6875rem",color:"var(--clr-text-4)"}}>{app.age_rating}</span>}
                                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{marginLeft:"auto",flexShrink:0,color:"var(--clr-text-4)"}}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                                <div style={{fontSize:"0.8125rem",color:"var(--clr-text-3)",marginBottom:"0.25rem"}}>{app.developer}</div>
                                <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap",fontSize:"0.75rem",color:"var(--clr-text-4)"}}>
                                  {app.min_os && <span>iOS {app.min_os}+</span>}
                                  {app.file_size_mb && <span>{app.file_size_mb} MB</span>}
                                  {app.languages?.length > 0 && <span>{app.languages.slice(0,3).join(", ")}{app.languages.length > 3 ? " +" + (app.languages.length - 3) : ""}</span>}
                                </div>
                              </div>
                            </div>

                            {/* Screenshots — horizontal scroll */}
                            {app.screenshot_urls && app.screenshot_urls.length > 0 && (
                              <div style={{overflowX:"auto",display:"flex",gap:"0.5rem",paddingBottom:"0.25rem"}}
                                onClick={e => e.preventDefault()}>
                                {app.screenshot_urls.slice(0, 5).map((url, si) => (
                                  <img key={si} src={url} alt={"Screenshot " + (si+1)}
                                    style={{height:160,width:"auto",borderRadius:8,flexShrink:0,border:"1px solid var(--clr-border)",objectFit:"cover"}}/>
                                ))}
                              </div>
                            )}

                            {/* AI Analysis */}
                            {(app.claude_what || app.claude_different || app.claude_missing) && (
                              <div style={{background:"rgba(var(--clr-text-rgb),0.03)",border:"1px solid var(--clr-border)",borderRadius:10,padding:"0.75rem 1rem"}}>
                                <div style={{fontSize:"0.625rem",fontWeight:700,color:"var(--clr-text-4)",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:"0.5rem",display:"flex",alignItems:"center",gap:5}}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                                  AI Analysis (Vision)
                                </div>
                                <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                                  {app.claude_what && <div style={{display:"flex",gap:"0.5rem",alignItems:"flex-start"}}><span style={{fontSize:"0.625rem",fontWeight:700,color:"#6366f1",background:"rgba(99,102,241,0.12)",padding:"0.1rem 0.45rem",borderRadius:5,flexShrink:0,marginTop:1,whiteSpace:"nowrap"}}>WHAT</span><span style={{fontSize:"0.8125rem",color:"var(--clr-text-3)",lineHeight:1.5}}>{app.claude_what}</span></div>}
                                  {app.claude_different && <div style={{display:"flex",gap:"0.5rem",alignItems:"flex-start"}}><span style={{fontSize:"0.625rem",fontWeight:700,color:"#06b6d4",background:"rgba(6,182,212,0.12)",padding:"0.1rem 0.45rem",borderRadius:5,flexShrink:0,marginTop:1,whiteSpace:"nowrap"}}>DIFF</span><span style={{fontSize:"0.8125rem",color:"var(--clr-text-3)",lineHeight:1.5}}>{app.claude_different}</span></div>}
                                  {app.claude_missing && <div style={{display:"flex",gap:"0.5rem",alignItems:"flex-start"}}><span style={{fontSize:"0.625rem",fontWeight:700,color:"#f59e0b",background:"rgba(245,158,11,0.12)",padding:"0.1rem 0.45rem",borderRadius:5,flexShrink:0,marginTop:1,whiteSpace:"nowrap"}}>GAP</span><span style={{fontSize:"0.8125rem",color:"var(--clr-text-3)",lineHeight:1.5}}>{app.claude_missing}</span></div>}
                                </div>
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
