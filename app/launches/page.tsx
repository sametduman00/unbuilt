"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function LaunchesPage() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [isPro, setIsPro] = useState(false);
  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/user/plan").then(r => r.json()).then(d => setIsPro(d.isPro ?? false)).catch(() => {});
  }, [isSignedIn]);
  const [pulseTab, setPulseTab] = useState<"ph"|"appstore">("appstore");
  const [pulseSignals, setPulseSignals] = useState<Array<{source:string;sourceLabel:string;emoji:string;title:string;subtitle:string;signal:string;url:string;timestamp:string;movementType?:string;imageUrl?:string;topics?:string[];tagline?:string;externalUrl?:string;claudeGap?:string;}>>([]);
  const [pulseLoading, setPulseLoading] = useState(false);
  const [pulseError, setPulseError] = useState<string|null>(null);
  const [pulseAsDays, setPulseAsDays] = useState<Array<{date:string;isToday:boolean;apps:Array<{app_id:string;app_name:string;developer:string;category:string;price:string;icon_url:string;store_url:string;release_date:string;description:string;rating:number|null;review_count:number;min_os:string;age_rating:string;languages:string[];screenshot_urls:string[];file_size_mb:number|null;claude_what:string|null;claude_different:string|null;claude_missing:string|null;claude_difficulty:"simple"|"medium"|"hard"|null;claude_difficulty_note:string|null;claude_competitors:string[]|null;claude_build_with:{name:string;role:string}[]|null;}>;appCount:number;generatedAt:string;}>>([]);
  const [pulseAsLoading, setPulseAsLoading] = useState(false);
  const [pulsePhSearch, setPulsePhSearch] = useState("");
  const [pulsePhTopic, setPulsePhTopic] = useState("all");
  const [pulseAsSearch, setPulseAsSearch] = useState("");
  const [pulseAsCat, setPulseAsCat] = useState("all");
  const [phPage, setPhPage] = useState(1);
  const [asPage, setAsPage] = useState(1);
  const PAGE_SIZE = 60;
  const PULSE_TOPIC_COLORS = ["#6366f1","#06b6d4","#f59e0b","#ec4899","#22c55e","#8b5cf6","#f97316","#14b8a6"];

  const pulseRelTime = (ts:string) => { const m=Math.floor((Date.now()-new Date(ts).getTime())/60000); if(m<1)return"just now"; if(m<60)return m+"m ago"; const h=Math.floor(m/60); if(h<24)return h+"h ago"; return Math.floor(h/24)+"d ago"; };

  const fetchPulseSignals = useCallback(async()=>{ if(pulseSignals.length>0)return; setPulseLoading(true); try{const res=await fetch("/api/pulse");const data=await res.json();if(!res.ok)throw new Error(data.error||"Failed");setPulseSignals(data.signals??[]);setPulseError(null);}catch(e){setPulseError(e instanceof Error?e.message:"Error");}finally{setPulseLoading(false);} },[pulseSignals.length]);
  const fetchPulseAS = useCallback(async()=>{ if(pulseAsDays.length>0)return; setPulseAsLoading(true); try{const r=await fetch("/api/pulse/appstore");const d=await r.json();setPulseAsDays(d.days??[]);}catch{}finally{setPulseAsLoading(false);} },[pulseAsDays.length]);

  useEffect(()=>{ fetchPulseSignals(); },[fetchPulseSignals]);
  useEffect(()=>{ if(pulseTab==="appstore")fetchPulseAS(); },[pulseTab,fetchPulseAS]);

  const phSignals = useMemo(()=>pulseSignals.filter(s=>s.source==="producthunt"),[pulseSignals]);
  const phTopics = useMemo(()=>Array.from(new Set(phSignals.flatMap(s=>s.topics||[]))).sort(),[phSignals]);
  const phFiltered = useMemo(()=>{ setPhPage(1); let list=pulsePhTopic==="all"?phSignals:phSignals.filter(s=>s.topics?.includes(pulsePhTopic)); if(pulsePhSearch){const q=pulsePhSearch.toLowerCase();list=list.filter(s=>s.title?.toLowerCase().includes(q)||s.tagline?.toLowerCase().includes(q));} return list; },[phSignals,pulsePhTopic,pulsePhSearch]);
  const phTotal = phFiltered.length;
  const phPages = Math.ceil(phTotal / PAGE_SIZE);
  const phPaged = useMemo(()=>phFiltered.slice((phPage-1)*PAGE_SIZE, phPage*PAGE_SIZE),[phFiltered,phPage]);

  const allAsApps = useMemo(()=>pulseAsDays.flatMap(d=>d.apps),[pulseAsDays]);
  const asCategories = useMemo(()=>Array.from(new Set(allAsApps.map(a=>a.category).filter(Boolean))).sort(),[allAsApps]);
  const asFiltered = useMemo(()=>{ setAsPage(1); let list=pulseAsCat==="all"?allAsApps:allAsApps.filter(a=>a.category===pulseAsCat); if(pulseAsSearch){const q=pulseAsSearch.toLowerCase();list=list.filter(a=>a.app_name?.toLowerCase().includes(q)||a.developer?.toLowerCase().includes(q));} return list.sort((a,b)=>new Date(b.release_date||0).getTime()-new Date(a.release_date||0).getTime()); },[allAsApps,pulseAsCat,pulseAsSearch]);
  const asTotal = asFiltered.length;
  const asPages = Math.ceil(asTotal / PAGE_SIZE);
  const asPaged = useMemo(()=>asFiltered.slice((asPage-1)*PAGE_SIZE, asPage*PAGE_SIZE),[asFiltered,asPage]);

  const handleDigNiche = (text: string) => {
    router.push("/?idea=" + encodeURIComponent(text) + "&tool=gap-analysis");
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "1rem 1.5rem" }}>
      {/* Feed header */}
                  <div style={{ padding: "1rem 1.5rem 0", flexShrink: 0 }}>
                    <h2 style={{ fontSize: "1.26rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--clr-text)", margin: 0 }}>What Launched Today</h2>
                  </div>
                  {/* Tab bar */}
                  <div style={{ display: "flex", borderBottom: "1px solid var(--clr-border)", padding: "0 1.5rem", flexShrink: 0, background: "var(--clr-bg)" }}>
                    {([{id:"appstore" as const,label:"App Store",color:"#007AFF"},{id:"ph" as const,label:"Product Hunt",color:"#DA552F"}]).map(t=>(
                      <button key={t.id} onClick={()=>setPulseTab(t.id)} style={{ background:"none", border:"none", borderBottom: pulseTab===t.id?"2px solid "+t.color:"2px solid transparent", padding:"12px 16px", cursor:"pointer", fontSize:"0.875rem", fontWeight: pulseTab===t.id?600:400, color: pulseTab===t.id?t.color:"var(--clr-text-3)", fontFamily:"inherit", marginBottom:-1, transition:"color 0.15s,border-color 0.15s" }}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Feed */}
                  <div style={{ flex:1, overflowY:"auto", padding:"1.25rem 1.5rem" }}>

                    {/* ── PRODUCT HUNT ── */}
                    {pulseTab==="ph" && (
                      <div>
                        {/* Filters */}
                        <div style={{ display:"flex", gap:8, marginBottom:"1.25rem", flexWrap:"wrap" }}>
                          <input value={pulsePhSearch} onChange={e=>setPulsePhSearch(e.target.value)} placeholder="Search..." style={{ flex:1, minWidth:160, padding:"7px 12px", border:"1px solid var(--clr-border)", borderRadius:8, fontSize:"0.875rem", background:"var(--clr-surface)", color:"var(--clr-text)", outline:"none" }}/>
                          {phTopics.length>0&&(
                            <select value={pulsePhTopic} onChange={e=>setPulsePhTopic(e.target.value)} style={{ padding:"7px 12px", border:"1px solid var(--clr-border)", borderRadius:8, fontSize:"0.875rem", background:"var(--clr-surface)", color:"var(--clr-text)", cursor:"pointer", outline:"none" }}>
                              <option value="all">All Topics</option>
                              {phTopics.map(t=><option key={t} value={t}>{t}</option>)}
                            </select>
                          )}
                        </div>

                        {pulseLoading && (
                          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                            {[1,2,3,4].map(i=>(
                              <div key={i} className="shimmer" style={{ height:80, borderRadius:10 }}/>
                            ))}
                          </div>
                        )}
                        {pulseError && !pulseLoading && (
                          <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"1rem", color:"#ef4444", fontSize:"0.875rem" }}>{pulseError}</div>
                        )}
                        {!pulseLoading && phFiltered.length===0 && pulseSignals.length>0 && (
                          <div style={{ textAlign:"center", padding:"3rem 0", color:"var(--clr-text-3)" }}>No results. <button onClick={()=>{setPulsePhSearch("");setPulsePhTopic("all");}} style={{ color:"#DA552F", background:"none", border:"none", cursor:"pointer" }}>Clear</button></div>
                        )}
                        {!pulseLoading && phPaged.length>0 && (
                          <div className="ph-card-grid" style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:10 }}>
                            {phPaged.map((s,i)=>{
                              const isLocked = !isPro && i >= 3;
                              return (
                                <div key={s.title+i} style={{ position: "relative" }}>
                                <div style={{ background:"var(--clr-surface)", border:"1px solid var(--clr-border)", borderRadius:12, overflow:"hidden", display:"flex", flexDirection:"column", ...(isLocked ? { filter: "blur(6px)", pointerEvents: "none" as const, userSelect: "none" as const } : {}) }}>
                                  
                                  <a href={s.externalUrl||s.url} target="_blank" rel="noopener noreferrer"
                                    style={{ display:"flex", alignItems:"flex-start", gap:"1rem", padding:"1.125rem 1.125rem 0.875rem", textDecoration:"none", color:"inherit", transition:"background 0.15s" }}
                                    onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,0.02)"}
                                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                                  >
                                    {s.imageUrl
                                      ? <img src={s.imageUrl} alt="" width={48} height={48} style={{ borderRadius:10, flexShrink:0, objectFit:"cover", border:"1px solid var(--clr-border)" }}/>
                                      : <div style={{ width:48, height:48, borderRadius:10, background:"var(--clr-border)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.25rem" }}>{s.emoji}</div>
                                    }
                                    <div style={{ flex:1, minWidth:0 }}>
                                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                                        <span style={{ fontSize:"0.9375rem", fontWeight:600, color:"var(--clr-text)", letterSpacing:"-0.015em" }}>{s.title}</span>
                                        <span style={{ fontSize:"0.6875rem", color:"var(--clr-text-4)", marginLeft:"auto", flexShrink:0 }}>{pulseRelTime(s.timestamp)}</span>
                                      </div>
                                      {s.tagline&&<p style={{ fontSize:"0.8125rem", color:"var(--clr-text-3)", margin:"0 0 8px", lineHeight:1.45 }}>{s.tagline}</p>}
                                      {s.topics&&s.topics.length>0&&(
                                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                                          {s.topics.map((t,ti)=><span key={t} style={{ fontSize:"0.5625rem", fontWeight:600, padding:"0.15rem 0.5rem", borderRadius:999, background:PULSE_TOPIC_COLORS[ti%PULSE_TOPIC_COLORS.length]+"18", color:PULSE_TOPIC_COLORS[ti%PULSE_TOPIC_COLORS.length] }}>{t}</span>)}
                                        </div>
                                      )}
                                    </div>
                                  </a>
                                  <div style={{ borderTop:"1px solid var(--clr-border)", padding:"8px 14px", display:"flex", justifyContent:"flex-end", marginTop:"auto" }}>
                                    <button
                                      onClick={e=>{e.preventDefault();handleDigNiche(s.tagline||s.title||"");}}
                                      style={{ fontSize:"0.6875rem", fontWeight:600, color:"#534AB7", background:"rgba(99,102,241,0.08)", border:"0.5px solid rgba(99,102,241,0.25)", borderRadius:999, padding:"4px 12px", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}
                                    >Dig this niche →</button>
                                  </div>
                                {isLocked && i === 3 && (
                                  <div style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <a href="/pricing" style={{
                                      display: "inline-flex", alignItems: "center", gap: 8,
                                      padding: "10px 22px", borderRadius: 12,
                                      background: "var(--clr-text)", color: "#fff",
                                      textDecoration: "none", fontSize: "0.8125rem", fontWeight: 600,
                                      letterSpacing: "-0.01em",
                                      boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                                      transition: "transform 0.15s, box-shadow 0.15s",
                                    }}
                                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)"; }}
                                      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.15)"; }}
                                    >See more — Go Pro</a>
                                  </div>
                                )}
                                </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {phPages > 1 && (
                          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:12, marginTop:24 }}>
                            {phPage > 1 && <button onClick={()=>{setPhPage(p=>p-1);window.scrollTo(0,0);}} style={{ padding:"8px 20px", borderRadius:8, border:"1px solid var(--clr-border)", background:"var(--clr-surface)", color:"var(--clr-text-2)", fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"inherit" }}>← Previous</button>}
                            <span style={{ fontSize:13, color:"var(--clr-text-4)" }}>Page {phPage} / {phPages}</span>
                            {phPage < phPages && <button onClick={()=>{setPhPage(p=>p+1);window.scrollTo(0,0);}} style={{ padding:"8px 20px", borderRadius:8, border:"1px solid var(--clr-border)", background:"var(--clr-surface)", color:"var(--clr-text-2)", fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"inherit" }}>Next →</button>}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── APP STORE ── */}
                    {pulseTab==="appstore" && (
                      <div>
                        <div style={{ display:"flex", gap:8, marginBottom:"1.25rem", flexWrap:"wrap" }}>
                          <input value={pulseAsSearch} onChange={e=>setPulseAsSearch(e.target.value)} placeholder="Search apps..." style={{ flex:1, minWidth:160, padding:"7px 12px", border:"1px solid var(--clr-border)", borderRadius:8, fontSize:"0.875rem", background:"var(--clr-surface)", color:"var(--clr-text)", outline:"none" }}/>
                          {asCategories.length>0&&(
                            <select value={pulseAsCat} onChange={e=>setPulseAsCat(e.target.value)} style={{ padding:"7px 12px", border:"1px solid var(--clr-border)", borderRadius:8, fontSize:"0.875rem", background:"var(--clr-surface)", color:"var(--clr-text)", cursor:"pointer", outline:"none" }}>
                              <option value="all">All Categories</option>
                              {asCategories.map(c=><option key={c} value={c}>{c}</option>)}
                            </select>
                          )}
                        </div>
                        {pulseAsLoading&&<div style={{ display:"flex",flexDirection:"column",gap:8 }}>{[1,2,3].map(i=><div key={i} className="shimmer" style={{ height:80, borderRadius:10 }}/>)}</div>}
                        {!pulseAsLoading&&pulseAsDays.length===0&&<div style={{ textAlign:"center", padding:"4rem 0", color:"var(--clr-text-3)" }}>No App Store data yet. Check back after 08:00 UTC.</div>}
                        {!pulseAsLoading&&asPaged.length>0&&(
                          <div key={pulseAsCat+"_"+pulseAsSearch} style={{ display:"flex", flexDirection:"column", gap:8 }}>
                            {asPaged.map((app,appIdx)=>{
                              const isLocked = !isPro && appIdx >= 3;
                              return (
                              <div key={app.app_id} style={{ position: "relative" }}>
                              <div style={{background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderRadius:12,overflow:"hidden", ...(isLocked ? { filter: "blur(6px)", pointerEvents: "none" as const, userSelect: "none" as const } : {})}}>
                                        <a href={app.store_url} target="_blank" rel="noopener noreferrer"
                            style={{display:"flex",flexDirection:"column",gap:"0.875rem",padding:"1.25rem",textDecoration:"none",color:"inherit",transition:"background 0.15s"}}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(var(--clr-text-rgb),0.02)"}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <div style={{display:"flex",alignItems:"flex-start",gap:"1rem"}}>
                              {app.icon_url
                                ? <img src={app.icon_url} alt="" width={64} height={64} style={{borderRadius:14,flexShrink:0,objectFit:"cover",border:"1px solid var(--clr-border)"}}/>
                                : <div style={{width:64,height:64,borderRadius:14,background:"var(--clr-border)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.75rem"}}>📱</div>}
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.25rem",flexWrap:"wrap"}}>
                                  <span style={{fontSize:"1rem",fontWeight:650,color:"var(--clr-text)",letterSpacing:"-0.02em"}}>{app.app_name}</span>
                                  {app.category&&<span style={{fontSize:"0.5625rem",fontWeight:700,letterSpacing:"0.04em",textTransform:"uppercase",padding:"0.1rem 0.4rem",borderRadius:999,background:"rgba(99,102,241,0.12)",color:"#6366f1"}}>{app.category}</span>}
                                  {app.price&&app.price!=="Free"&&<span style={{fontSize:"0.6875rem",fontWeight:700,color:"#22c55e"}}>{app.price}</span>}
                                  {app.age_rating&&<span style={{fontSize:"0.6875rem",color:"var(--clr-text-4)"}}>{app.age_rating}</span>}
                                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{marginLeft:"auto",flexShrink:0,color:"var(--clr-text-4)"}}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                                <div style={{fontSize:"0.8125rem",color:"var(--clr-text-2)",marginBottom:"0.25rem"}}>{app.developer}</div>
                                <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap",fontSize:"0.75rem",color:"var(--clr-text-4)"}}>
                                  {app.min_os&&<span>iOS {app.min_os}+</span>}
                                  {app.file_size_mb&&<span>{app.file_size_mb} MB</span>}
                                  {app.languages?.length>0&&<span>{app.languages.slice(0,3).join(", ")}{app.languages.length>3?" +"+(app.languages.length-3):""}</span>}
                                </div>
                              </div>
                            </div>
                            {app.screenshot_urls&&app.screenshot_urls.length>0&&(
                              <div style={{overflowX:"auto",display:"flex",gap:"0.5rem",paddingBottom:"0.25rem"}} onClick={e=>e.preventDefault()}>
                                {app.screenshot_urls.slice(0,5).map((url,si)=>(
                                  <img key={si} src={url} alt={"Screenshot "+(si+1)} style={{height:160,width:"auto",borderRadius:8,flexShrink:0,border:"1px solid var(--clr-border)",objectFit:"cover"}}/>
                                ))}
                              </div>
                            )}
                            {(app.claude_what||app.claude_difficulty||app.claude_competitors||app.claude_build_with)&&<div style={{marginTop:8}}>
{app.claude_what&&<div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:"8px",alignItems:"center",padding:"10px 0",borderTop:"1px solid var(--clr-border)"}}><span style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",color:"var(--clr-text-4)"}}>What</span><p style={{fontSize:"0.8rem",color:"var(--clr-text)",margin:0,lineHeight:1.5}}>{app.claude_what}</p></div>}
{app.claude_difficulty&&<div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:"8px",alignItems:"center",padding:"10px 0",borderTop:"1px solid var(--clr-border)"}}><span style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",color:"var(--clr-text-4)"}}>Difficulty</span><div style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:7,height:7,borderRadius:"50%",background:app.claude_difficulty==="simple"?"#639922":app.claude_difficulty==="medium"?"#BA7517":"#A32D2D",flexShrink:0,display:"inline-block"}}/><span style={{fontSize:"0.8rem",fontWeight:600,color:app.claude_difficulty==="simple"?"#3B6D11":app.claude_difficulty==="medium"?"#854F0B":"#A32D2D",textTransform:"capitalize"}}>{app.claude_difficulty}</span>{app.claude_difficulty_note&&<span className="diff-note" style={{fontSize:"0.75rem",color:"var(--clr-text-3)"}}>{"— "}{app.claude_difficulty_note}</span>}</div></div>}
{app.claude_competitors&&app.claude_competitors.length>0&&<div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:"8px",alignItems:"center",padding:"10px 0",borderTop:"1px solid var(--clr-border)"}}><span style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",color:"var(--clr-text-4)"}}>Competitors</span><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{app.claude_competitors.map((comp:string)=><a key={comp} href={"https://apps.apple.com/search?term="+encodeURIComponent(comp)} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:"0.75rem",padding:"2px 9px",borderRadius:999,background:"var(--clr-surface)",border:"1px solid var(--clr-border)",color:"var(--clr-text)",textDecoration:"none",whiteSpace:"nowrap"}}>{comp}</a>)}</div></div>}
{app.claude_build_with&&app.claude_build_with.length>0&&<div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:"8px",alignItems:"flex-start",padding:"8px 0 4px",borderTop:"1px solid var(--clr-border)"}}><span style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",color:"var(--clr-text-4)",paddingTop:4}}>Build with</span><div style={{display:"flex",flexWrap:"wrap",gap:5}}>{app.claude_build_with.map((t:{name:string;role:string})=><div key={t.name} style={{display:"flex",flexDirection:"column",alignItems:"center",background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderRadius:7,padding:"3px 9px",gap:1}}><span style={{fontSize:"0.72rem",fontWeight:600,color:"var(--clr-text)"}}>{t.name}</span><span style={{fontSize:"0.6rem",color:"var(--clr-text-4)"}}>{t.role}</span></div>)}</div></div>}
</div>}
                          </a>
                          {/* A-2 footer */}
                          <div className="as-a2-footer" style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderTop:"1px solid var(--clr-border)"}}>
                            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRight:"1px solid var(--clr-border)"}}>
                              <div style={{flexShrink:0,width:30,height:30,borderRadius:8,background:"rgba(99,102,241,0.08)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#534AB7" strokeWidth="1.3"/><path d="M11 11l2.5 2.5" stroke="#534AB7" strokeWidth="1.3" strokeLinecap="round"/></svg>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:"0.6875rem",fontWeight:600,color:"var(--clr-text)",marginBottom:1}}>Got a better idea?</div>
                                <div style={{fontSize:"0.625rem",color:"var(--clr-text-3)"}}>Analyze competitors & gaps</div>
                              </div>
                              <button onClick={e=>{e.preventDefault();router.push("/?tab=dig");}} style={{flexShrink:0,fontSize:"0.6875rem",fontWeight:600,color:"#534AB7",background:"rgba(99,102,241,0.08)",border:"0.5px solid rgba(99,102,241,0.25)",borderRadius:999,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Dig my idea →</button>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px"}}>
                              <div style={{flexShrink:0,width:30,height:30,borderRadius:8,background:"rgba(16,185,129,0.08)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1.2" stroke="rgb(5,150,105)" strokeWidth="1.3"/><rect x="9" y="2" width="5" height="5" rx="1.2" stroke="rgb(5,150,105)" strokeWidth="1.3"/><rect x="2" y="9" width="5" height="5" rx="1.2" stroke="rgb(5,150,105)" strokeWidth="1.3"/><rect x="9" y="9" width="5" height="5" rx="1.2" stroke="rgb(5,150,105)" strokeWidth="1.3"/></svg>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:"0.6875rem",fontWeight:600,color:"var(--clr-text)",marginBottom:1}}>Want to build this yourself?</div>
                                <div style={{fontSize:"0.625rem",color:"var(--clr-text-3)"}}>Get your personal tool stack</div>
                              </div>
                              <button onClick={e=>{e.preventDefault();router.push("/?tab=stack");}} style={{flexShrink:0,fontSize:"0.6875rem",fontWeight:600,color:"rgb(5,150,105)",background:"rgba(16,185,129,0.08)",border:"0.5px solid rgba(16,185,129,0.25)",borderRadius:999,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Get my Stack →</button>
                            </div>
                          </div>
                        </div>
                        {isLocked && appIdx === 3 && (
                          <div style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <a href="/pricing" style={{
                              display: "inline-flex", alignItems: "center", gap: 8,
                              padding: "10px 22px", borderRadius: 12,
                              background: "var(--clr-text)", color: "#fff",
                              textDecoration: "none", fontSize: "0.8125rem", fontWeight: 600,
                              letterSpacing: "-0.01em",
                              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                              transition: "transform 0.15s, box-shadow 0.15s",
                            }}
                              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)"; }}
                              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.15)"; }}
                            >See more — Go Pro</a>
                          </div>
                        )}
                        </div>
                            )})}
                          </div>
                        )}
                        {asPages > 1 && (
                          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:12, marginTop:24 }}>
                            {asPage > 1 && <button onClick={()=>{setAsPage(p=>p-1);window.scrollTo(0,0);}} style={{ padding:"8px 20px", borderRadius:8, border:"1px solid var(--clr-border)", background:"var(--clr-surface)", color:"var(--clr-text-2)", fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"inherit" }}>← Previous</button>}
                            <span style={{ fontSize:13, color:"var(--clr-text-4)" }}>Page {asPage} / {asPages}</span>
                            {asPage < asPages && <button onClick={()=>{setAsPage(p=>p+1);window.scrollTo(0,0);}} style={{ padding:"8px 20px", borderRadius:8, border:"1px solid var(--clr-border)", background:"var(--clr-surface)", color:"var(--clr-text-2)", fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"inherit" }}>Next →</button>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
    </div>
  );
}
