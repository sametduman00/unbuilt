"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

interface Signal {
  source: string; sourceLabel: string; emoji: string;
  title: string; subtitle: string; signal: string; url: string; timestamp: string;
  movementType?: string; rankChange?: number;
  imageUrl?: string; topics?: string[]; tagline?: string;
  externalUrl?: string; claudeGap?: string;
}
interface BuildWithTool { name: string; role: string; }
interface AppStoreApp {
  app_id: string; app_name: string; developer: string; category: string;
  price: string; icon_url: string; store_url: string; release_date: string;
  description: string; rating: number | null; review_count: number;
  min_os: string; age_rating: string; languages: string[];
  screenshot_urls: string[]; file_size_mb: number | null;
  claude_what: string | null;
  claude_difficulty: "simple" | "medium" | "hard" | null;
  claude_difficulty_note: string | null;
  claude_competitors: string[] | null;
  claude_build_with: BuildWithTool[] | null;
  isToday?: boolean;
}
interface AppStoreDay { date: string; isToday: boolean; apps: AppStoreApp[]; appCount: number; generatedAt: string; }

const TOPIC_COLORS = ["#6366f1","#06b6d4","#f59e0b","#ec4899","#22c55e","#8b5cf6","#f97316","#14b8a6"];
const MOVEMENT_COLORS: Record<string,string> = { rank_jump:"#22c55e",new_entry:"#3b82f6",review_spike:"#f59e0b",top_mover:"#8b5cf6",weekly_mover:"#06b6d4",monthly_mover:"#ec4899" };
const DIFF_CONFIG = { simple:{dot:"#639922",text:"#3B6D11"}, medium:{dot:"#BA7517",text:"#854F0B"}, hard:{dot:"#A32D2D",text:"#A32D2D"} };

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff/60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins+"m ago";
  const h = Math.floor(mins/60);
  if (h < 24) return h+"h ago";
  return Math.floor(h/24)+"d ago";
}
function parseGap(gap: string|undefined) {
  if (!gap) return null;
  const p = gap.split("\u2726").map(s=>s.trim());
  if (p.length < 3) return null;
  return { what: p[0].replace(/^What:\s*/i,"").trim(), different: p[1].replace(/^Different:\s*/i,"").trim(), missing: p[2].replace(/^Missing:\s*/i,"").trim() };
}
function formatDate(d: string): string {
  return new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
}

function Toolbar({ search, onSearch, topic, onTopic, topics, sort, onSort, sortOptions, count, total, accentColor }: {
  search: string; onSearch: (v:string)=>void;
  topic: string; onTopic: (v:string)=>void; topics: string[];
  sort: string; onSort: (v:string)=>void; sortOptions: {value:string;label:string}[];
  count: number; total: number; accentColor: string;
}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"0.625rem",marginBottom:"1.5rem"}}>
      <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",alignItems:"center"}}>
        <div style={{position:"relative",flex:"1",minWidth:200}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{position:"absolute",left:"0.75rem",top:"50%",transform:"translateY(-50%)",color:"var(--clr-text-4)",pointerEvents:"none"}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e=>onSearch(e.target.value)} placeholder="Search..." style={{width:"100%",boxSizing:"border-box",padding:"0.5rem 0.75rem 0.5rem 2.25rem",background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderRadius:8,fontSize:"0.875rem",color:"var(--clr-text)",outline:"none"}}/>
          {search && <button onClick={()=>onSearch("")} style={{position:"absolute",right:"0.5rem",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--clr-text-4)",fontSize:"1rem",lineHeight:1,padding:"0 0.25rem"}}>×</button>}
        </div>
        <div style={{position:"relative"}}>
          <select value={topic} onChange={e=>onTopic(e.target.value)} style={{appearance:"none",WebkitAppearance:"none",padding:"0.5rem 2rem 0.5rem 0.875rem",background:"var(--clr-surface)",border:topic!=="all"?"1px solid "+accentColor+"66":"1px solid var(--clr-border)",borderRadius:8,fontSize:"0.875rem",color:topic!=="all"?accentColor:"var(--clr-text-3)",cursor:"pointer",outline:"none",minWidth:140,fontWeight:topic!=="all"?600:400}}>
            <option value="all">All Categories</option>
            {topics.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{position:"absolute",right:"0.6rem",top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:"var(--clr-text-4)"}}><path d="m6 9 6 6 6-6"/></svg>
        </div>
        <div style={{position:"relative"}}>
          <select value={sort} onChange={e=>onSort(e.target.value)} style={{appearance:"none",WebkitAppearance:"none",padding:"0.5rem 2rem 0.5rem 0.875rem",background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderRadius:8,fontSize:"0.875rem",color:"var(--clr-text-3)",cursor:"pointer",outline:"none",minWidth:130}}>
            {sortOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{position:"absolute",right:"0.6rem",top:"50%",transform:"translateY(-50%)",pointerEvents:"none",color:"var(--clr-text-4)"}}><path d="m6 9 6 6 6-6"/></svg>
        </div>
        {(search || topic !== "all") && <button onClick={()=>{onSearch("");onTopic("all");}} style={{padding:"0.5rem 0.75rem",background:"none",border:"1px solid var(--clr-border)",borderRadius:8,fontSize:"0.8125rem",color:"var(--clr-text-4)",cursor:"pointer"}}>Clear</button>}
      </div>
      <div style={{fontSize:"0.8125rem",color:"var(--clr-text-4)"}}>
        {count === total ? <span>{total.toLocaleString()} results</span> : <span><span style={{fontWeight:600,color:"var(--clr-text-3)"}}>{count.toLocaleString()}</span> of {total.toLocaleString()}</span>}
      </div>
    </div>
  );
}

function AppStoreAiBlock({ app }: { app: AppStoreApp }) {
  const { claude_what, claude_difficulty, claude_difficulty_note, claude_competitors, claude_build_with } = app;
  if (!claude_what && !claude_difficulty && !claude_competitors && !claude_build_with) return null;
  const diffCfg = claude_difficulty ? DIFF_CONFIG[claude_difficulty] : null;
  const rowStyle: React.CSSProperties = { display:"grid", gridTemplateColumns:"88px 1fr", gap:"8px", alignItems:"flex-start", paddingTop:10, borderTop:"1px solid var(--clr-border)", marginTop:2 };
  const labelStyle: React.CSSProperties = { fontSize:"0.625rem", fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase" as const, color:"var(--clr-text-4)", paddingTop:2 };
  const pillStyle: React.CSSProperties = { fontSize:"0.75rem", padding:"2px 10px", borderRadius:999, background:"var(--clr-surface)", border:"1px solid var(--clr-border)", color:"var(--clr-text-3)", whiteSpace:"nowrap" as const };
  return (
    <div style={{display:"flex",flexDirection:"column",marginTop:4}}>
      {claude_what && <div style={rowStyle}><span style={labelStyle}>What</span><p style={{fontSize:"0.8125rem",color:"var(--clr-text-3)",margin:0,lineHeight:1.5}}>{claude_what}</p></div>}
      {claude_difficulty && diffCfg && (
        <div style={rowStyle}>
          <span style={labelStyle}>Difficulty</span>
          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:diffCfg.dot,flexShrink:0,display:"inline-block"}}/>
            <span style={{fontSize:"0.8125rem",fontWeight:600,color:diffCfg.text,textTransform:"capitalize"}}>{claude_difficulty}</span>
            {claude_difficulty_note && <span style={{fontSize:"0.75rem",color:"var(--clr-text-4)"}}>— {claude_difficulty_note}</span>}
          </div>
        </div>
      )}
      {claude_competitors && claude_competitors.length > 0 && (
        <div style={rowStyle}>
          <span style={labelStyle}>Competitors</span>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{claude_competitors.map(c=><span key={c} style={pillStyle}>{c}</span>)}</div>
        </div>
      )}
      {claude_build_with && claude_build_with.length > 0 && (
        <div style={rowStyle}>
          <span style={{...labelStyle,paddingTop:6}}>Build it with</span>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {claude_build_with.map(t=>(
                <div key={t.name} style={{display:"flex",flexDirection:"column",alignItems:"center",background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderRadius:8,padding:"4px 10px",gap:2}}>
                  <span style={{fontSize:"0.75rem",fontWeight:600,color:"var(--clr-text-2)"}}>{t.name}</span>
                  <span style={{fontSize:"0.625rem",color:"var(--clr-text-4)"}}>{t.role}</span>
                </div>
              ))}
            </div>
            <Link href="/stack" onClick={e=>e.stopPropagation()} style={{display:"inline-block",background:"rgba(16,185,129,0.1)",color:"rgb(5,150,105)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:999,padding:"6px 16px",fontSize:"0.8125rem",fontWeight:600,textDecoration:"none",alignSelf:"flex-start"}}>Get my Stack →</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function PhAiBlock({ what, diff, gap }: { what:string|null; diff:string|null; gap:string|null }) {
  if (!what && !diff && !gap) return null;
  return (
    <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginTop:"0.75rem"}}>
      {what && <div style={{flex:"1 1 150px",background:"rgba(var(--clr-text-rgb),0.03)",border:"1px solid var(--clr-border)",borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:"0.5625rem",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:"#534AB7",marginBottom:3}}>What it does</div><div style={{fontSize:"0.75rem",color:"var(--clr-text-3)",lineHeight:1.5}}>{what}</div></div>}
      {diff && <div style={{flex:"1 1 140px",background:"rgba(var(--clr-text-rgb),0.03)",border:"1px solid var(--clr-border)",borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:"0.5625rem",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:"#0F6E56",marginBottom:3}}>Different because</div><div style={{fontSize:"0.75rem",color:"var(--clr-text-3)",lineHeight:1.5}}>{diff}</div></div>}
      {gap && <div style={{flex:"1 1 140px",background:"rgba(250,199,117,0.08)",border:"1px solid rgba(250,199,117,0.55)",borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:"0.5625rem",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",color:"#854F0B",marginBottom:3}}>Blind spot</div><div style={{fontSize:"0.75rem",color:"#633806",lineHeight:1.5}}>{gap}</div></div>}
    </div>
  );
}

const Skeleton = () => (
  <div style={{display:"flex",flexDirection:"column",gap:"0.625rem"}}>
    {[1,2,3,4,5].map(i=>(
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

export default function PulsePage() {
  const [tab, setTab] = useState<"appstore"|"ph">("appstore");
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [asDays, setAsDays] = useState<AppStoreDay[]>([]);
  const [asLoading, setAsLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [phSearch, setPhSearch] = useState("");
  const [phTopic, setPhTopic] = useState("all");
  const [phSort, setPhSort] = useState("newest");
  const [asSearch, setAsSearch] = useState("");
  const [asCat, setAsCat] = useState("all");
  const [asSort, setAsSort] = useState("newest");

  useEffect(()=>{ const s=localStorage.getItem("theme"); const d=s?s==="dark":true; setIsDark(d); document.documentElement.classList.toggle("light",!d); },[]);
  const toggleTheme=()=>{ const n=!isDark; setIsDark(n); document.documentElement.classList.toggle("light",!n); localStorage.setItem("theme",n?"dark":"light"); };

  const fetchSignals=useCallback(async()=>{ try{ const res=await fetch("/api/pulse"); const data=await res.json(); if(!res.ok) throw new Error(data.error||"Failed"); setSignals(data.signals??[]); setError(null); } catch(e){ setError(e instanceof Error?e.message:"Error"); } finally{ setLoading(false); } },[]);
  const fetchAS=useCallback(async()=>{ setAsLoading(true); try{ const r=await fetch("/api/pulse/appstore"); const d=await r.json(); setAsDays(d.days??[]); } catch{} finally{ setAsLoading(false); } },[]);

  useEffect(()=>{ if(asDays.length===0) fetchAS(); },[asDays.length,fetchAS]);
  useEffect(()=>{ if(tab==="ph"&&signals.length===0&&!loading) fetchSignals(); },[tab,signals.length,loading,fetchSignals]);
  useEffect(()=>{ fetchSignals(); },[fetchSignals]);

  const ph=signals.filter(s=>s.source==="producthunt");
  const phTopics=useMemo(()=>Array.from(new Set(ph.flatMap(s=>s.topics||[]))).sort(),[ph]);
  const phFiltered=useMemo(()=>{ let list=phTopic==="all"?ph:ph.filter(s=>s.topics?.includes(phTopic)); if(phSearch){ const q=phSearch.toLowerCase(); list=list.filter(s=>s.title?.toLowerCase().includes(q)||s.tagline?.toLowerCase().includes(q)); } if(phSort==="az") list=[...list].sort((a,b)=>a.title.localeCompare(b.title)); return list; },[ph,phTopic,phSearch,phSort]);

  const allAsApps=useMemo(()=>asDays.flatMap(d=>d.apps),[asDays]);
  const asCategories=useMemo(()=>Array.from(new Set(allAsApps.map(a=>a.category).filter(Boolean))).sort(),[allAsApps]);
  const asFiltered=useMemo(()=>{ let list=asCat==="all"?allAsApps:allAsApps.filter(a=>a.category===asCat); if(asSearch){ const q=asSearch.toLowerCase(); list=list.filter(a=>a.app_name?.toLowerCase().includes(q)||a.developer?.toLowerCase().includes(q)||a.description?.toLowerCase().includes(q)); } if(asSort==="az") list=[...list].sort((a,b)=>a.app_name.localeCompare(b.app_name)); else if(asSort==="newest") list=[...list].sort((a,b)=>new Date(b.release_date||0).getTime()-new Date(a.release_date||0).getTime()); return list; },[allAsApps,asCat,asSearch,asSort]);

  const TABS=[{id:"appstore" as const,label:"App Store",color:"#007AFF"},{id:"ph" as const,label:"Product Hunt",color:"#DA552F"}];

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
            {isDark?<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
            {isDark?"Light":"Dark"}
          </button>
        </div>
      </header>

      <div style={{borderBottom:"1px solid var(--clr-border)",background:"var(--clr-bg)",position:"sticky",top:56,zIndex:40}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 2rem",display:"flex"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",borderBottom:tab===t.id?"2px solid "+t.color:"2px solid transparent",padding:"0.75rem 1.25rem",cursor:"pointer",fontSize:"0.875rem",fontWeight:tab===t.id?600:400,color:tab===t.id?t.color:"var(--clr-text-3)",transition:"color 0.15s,border-color 0.15s"}}>{t.label}</button>
          ))}
        </div>
      </div>

      <main style={{maxWidth:1200,margin:"0 auto",padding:"2rem 2rem 4rem"}}>

        {tab==="appstore" && (
          <div>
            <div style={{marginBottom:"1.25rem"}}>
              <h1 style={{fontSize:"1.75rem",fontWeight:700,letterSpacing:"-0.03em",margin:"0 0 0.25rem"}}>What Launched Today</h1>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:"0.75rem",color:"var(--clr-text-3)"}}>via</span>
                <span style={{fontSize:"0.75rem",fontWeight:600,color:"#007AFF"}}>App Store</span>
                <span style={{fontSize:"0.625rem",fontWeight:700,padding:"0.2rem 0.6rem",borderRadius:999,background:"rgba(0,122,255,0.12)",color:"#007AFF",letterSpacing:"0.05em"}}>NEW TODAY</span>
              </div>
            </div>
            <Toolbar search={asSearch} onSearch={setAsSearch} topic={asCat} onTopic={setAsCat} topics={asCategories} sort={asSort} onSort={setAsSort} sortOptions={[{value:"newest",label:"Newest first"},{value:"az",label:"A → Z"}]} count={asFiltered.length} total={allAsApps.length} accentColor="#007AFF"/>
            {asLoading && <Skeleton/>}
            {!asLoading && asDays.length===0 && <div style={{textAlign:"center",padding:"4rem 0",color:"var(--clr-text-3)"}}><div style={{fontSize:"2rem",marginBottom:"0.75rem"}}>🔄</div><div style={{fontWeight:600,marginBottom:"0.375rem"}}>No data yet</div><div style={{fontSize:"0.875rem"}}>Check back after 08:00 UTC.</div></div>}
            {!asLoading && asFiltered.length===0 && allAsApps.length>0 && <div style={{textAlign:"center",padding:"4rem 0",color:"var(--clr-text-3)"}}>No results. <button onClick={()=>{setAsSearch("");setAsCat("all");}} style={{color:"#007AFF",background:"none",border:"none",cursor:"pointer",fontSize:"0.875rem"}}>Clear filters</button></div>}
            {!asLoading && asFiltered.length>0 && (()=>{
              const byDate=new Map<string,{day:AppStoreDay;apps:AppStoreApp[]}>();
              for(const day of asDays){ const dayApps=asFiltered.filter(a=>day.apps.some(da=>da.app_id===a.app_id)); if(dayApps.length>0) byDate.set(day.date,{day,apps:dayApps}); }
              return (
                <div style={{display:"flex",flexDirection:"column",gap:"2rem"}}>
                  {Array.from(byDate.values()).map(({day,apps})=>(
                    <div key={day.date}>
                      <div style={{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"0.75rem"}}>
                        <span style={{fontSize:"0.9375rem",fontWeight:700,color:"var(--clr-text)",letterSpacing:"-0.01em"}}>{formatDate(day.date)}</span>
                        {day.isToday?<span style={{fontSize:"0.5625rem",fontWeight:700,padding:"0.15rem 0.5rem",borderRadius:999,background:"rgba(0,122,255,0.12)",color:"#007AFF",letterSpacing:"0.05em"}}>TODAY</span>:<span style={{fontSize:"0.5625rem",fontWeight:700,padding:"0.15rem 0.5rem",borderRadius:999,background:"rgba(var(--clr-text-rgb),0.06)",color:"var(--clr-text-4)",letterSpacing:"0.05em"}}>❆ FROZEN</span>}
                        <span style={{fontSize:"0.75rem",color:"var(--clr-text-4)"}}>{apps.length} apps</span>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                        {apps.map(app=>(
                          <a key={app.app_id} href={app.store_url} target="_blank" rel="noopener noreferrer"
                            style={{display:"flex",flexDirection:"column",gap:"0.875rem",padding:"1.25rem",background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderLeft:day.isToday?"3px solid #007AFF":"1px solid var(--clr-border)",borderRadius:12,textDecoration:"none",color:"inherit",transition:"background 0.15s"}}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(var(--clr-text-rgb),0.02)"}
                            onMouseLeave={e=>e.currentTarget.style.background="var(--clr-surface)"}>
                            <div style={{display:"flex",alignItems:"flex-start",gap:"1rem"}}>
                              {app.icon_url?<img src={app.icon_url} alt="" width={64} height={64} style={{borderRadius:14,flexShrink:0,objectFit:"cover",border:"1px solid var(--clr-border)"}}/>:<div style={{width:64,height:64,borderRadius:14,background:"var(--clr-border)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.75rem"}}>📱</div>}
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.25rem",flexWrap:"wrap"}}>
                                  <span style={{fontSize:"1rem",fontWeight:650,color:"var(--clr-text)",letterSpacing:"-0.02em"}}>{app.app_name}</span>
                                  {app.category&&<span style={{fontSize:"0.5625rem",fontWeight:700,letterSpacing:"0.04em",textTransform:"uppercase",padding:"0.1rem 0.4rem",borderRadius:999,background:"rgba(99,102,241,0.12)",color:"#6366f1"}}>{app.category}</span>}
                                  {app.price&&app.price!=="Free"&&<span style={{fontSize:"0.6875rem",fontWeight:700,color:"#22c55e"}}>{app.price}</span>}
                                  {app.age_rating&&<span style={{fontSize:"0.6875rem",color:"var(--clr-text-4)"}}>{app.age_rating}</span>}
                                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{marginLeft:"auto",flexShrink:0,color:"var(--clr-text-4)"}}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                                <div style={{fontSize:"0.8125rem",color:"var(--clr-text-3)",marginBottom:"0.25rem"}}>{app.developer}</div>
                                <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap",fontSize:"0.75rem",color:"var(--clr-text-4)"}}>
                                  {app.min_os&&<span>iOS {app.min_os}+</span>}
                                  {app.file_size_mb&&<span>{app.file_size_mb} MB</span>}
                                  {app.languages?.length>0&&<span>{app.languages.slice(0,3).join(", ")}{app.languages.length>3?" +"+(app.languages.length-3):""}</span>}
                                </div>
                              </div>
                            </div>
                            {app.screenshot_urls&&app.screenshot_urls.length>0&&(
                              <div style={{overflowX:"auto",display:"flex",gap:"0.5rem",paddingBottom:"0.25rem"}} onClick={e=>e.preventDefault()}>
                                {app.screenshot_urls.slice(0,5).map((url,si)=><img key={si} src={url} alt={"Screenshot "+(si+1)} style={{height:160,width:"auto",borderRadius:8,flexShrink:0,border:"1px solid var(--clr-border)",objectFit:"cover"}}/>)}
                              </div>
                            )}
                            <AppStoreAiBlock app={app}/>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {tab==="ph" && (
          <div>
            <div style={{marginBottom:"1.25rem"}}>
              <h1 style={{fontSize:"1.75rem",fontWeight:700,letterSpacing:"-0.03em",margin:"0 0 0.25rem"}}>What Launched Today</h1>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:"0.75rem",color:"var(--clr-text-3)"}}>via</span>
                <span style={{fontSize:"0.75rem",fontWeight:600,color:"#DA552F"}}>Product Hunt</span>
                <span style={{fontSize:"0.625rem",fontWeight:700,padding:"0.2rem 0.6rem",borderRadius:999,background:"rgba(218,85,47,0.12)",color:"#DA552F",letterSpacing:"0.05em"}}>TODAY</span>
              </div>
            </div>
            <Toolbar search={phSearch} onSearch={setPhSearch} topic={phTopic} onTopic={setPhTopic} topics={phTopics} sort={phSort} onSort={setPhSort} sortOptions={[{value:"newest",label:"Newest first"},{value:"az",label:"A → Z"}]} count={phFiltered.length} total={ph.length} accentColor="#DA552F"/>
            {loading && <Skeleton/>}
            {error && !loading && <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,padding:"1rem",color:"#ef4444",fontSize:"0.875rem"}}>{error}</div>}
            {!loading && phFiltered.length===0 && <div style={{textAlign:"center",padding:"4rem 0",color:"var(--clr-text-3)"}}>No results. <button onClick={()=>{setPhSearch("");setPhTopic("all");}} style={{color:"#DA552F",background:"none",border:"none",cursor:"pointer",fontSize:"0.875rem"}}>Clear filters</button></div>}
            {!loading && phFiltered.length>0 && (
              <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                {phFiltered.map((s,i)=>{
                  const mc=MOVEMENT_COLORS[s.movementType??""];
                  const gap=parseGap(s.claudeGap);
                  return (
                    <a key={s.title+i} href={s.externalUrl||s.url} target="_blank" rel="noopener noreferrer"
                      style={{display:"flex",alignItems:"flex-start",gap:"1rem",padding:"1.25rem",background:"var(--clr-surface)",border:"1px solid var(--clr-border)",borderLeft:mc?"3px solid "+mc:"1px solid var(--clr-border)",borderRadius:12,textDecoration:"none",color:"inherit",transition:"background 0.15s"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(var(--clr-text-rgb),0.02)"}
                      onMouseLeave={e=>e.currentTarget.style.background="var(--clr-surface)"}>
                      {s.imageUrl?<img src={s.imageUrl} alt="" width={64} height={64} style={{borderRadius:14,flexShrink:0,objectFit:"cover",border:"1px solid var(--clr-border)"}}/>:<div style={{width:64,height:64,borderRadius:14,background:"var(--clr-border)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.75rem"}}>{s.emoji}</div>}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"0.375rem",flexWrap:"wrap"}}>
                          <span style={{fontSize:"1rem",fontWeight:650,color:"var(--clr-text)",letterSpacing:"-0.02em"}}>{s.title}</span>
                          {mc&&s.movementType!=="ph_trending"&&s.movementType!=="trending"&&<span style={{fontSize:"0.5625rem",fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",padding:"0.1rem 0.4rem",borderRadius:999,background:mc+"20",color:mc}}>{s.movementType==="rank_jump"?"RANK JUMP":s.movementType==="new_entry"?"NEW":s.movementType==="review_spike"?"REVIEWS":s.movementType==="top_mover"?"TOP MOVER":s.movementType==="weekly_mover"?"WEEKLY":"MONTHLY"}</span>}
                          <span style={{fontSize:"0.6875rem",color:"var(--clr-text-4)",marginLeft:"auto"}}>{relativeTime(s.timestamp)}</span>
                        </div>
                        {s.tagline&&<p style={{fontSize:"0.875rem",color:"var(--clr-text-3)",margin:"0 0 0.5rem",lineHeight:1.45}}>{s.tagline}</p>}
                        {s.topics&&s.topics.length>0&&<div style={{display:"flex",gap:"0.25rem",marginBottom:"0.625rem",flexWrap:"wrap"}}>{s.topics.map((t,ti)=><span key={t} style={{fontSize:"0.625rem",fontWeight:600,padding:"0.15rem 0.5rem",borderRadius:999,background:TOPIC_COLORS[ti%TOPIC_COLORS.length]+"18",color:TOPIC_COLORS[ti%TOPIC_COLORS.length]}}>{t}</span>)}</div>}
                        <PhAiBlock what={gap?.what??null} diff={gap?.different??null} gap={gap?.missing??null}/>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{flexShrink:0,color:"var(--clr-text-4)",alignSelf:"center"}}><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </a>
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
