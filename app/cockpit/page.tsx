"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

const $n = (n: number) => `$${(n??0).toFixed(2)}`;
const num = (n: number) => (n??0).toLocaleString();
const ago = (iso: string) => {
  const m = Math.floor((Date.now()-new Date(iso).getTime())/60000);
  if (m<1) return "just now"; if (m<60) return `${m}m ago`;
  const h=Math.floor(m/60); if (h<24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
};

function Card({ title, value, sub, color }: { title:string; value:React.ReactNode; sub?:string; color?:string }) {
  return (
    <div style={{ background:"var(--clr-surface)", border:`1px solid ${color?color+"33":"var(--clr-border)"}`, borderRadius:12, padding:"16px 18px" }}>
      <div style={{ fontSize:10, fontWeight:800, letterSpacing:".08em", textTransform:"uppercase" as const, color:"var(--clr-text-5)", marginBottom:8 }}>{title}</div>
      <div style={{ fontSize:"1.5rem", fontWeight:800, letterSpacing:"-0.03em", color:color??"var(--clr-text)", lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"var(--clr-text-4)", marginTop:5 }}>{sub}</div>}
    </div>
  );
}

function Row({ label, value, accent }: { label:string; value:string|number; accent?:string }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid var(--clr-border)" }}>
      <span style={{ fontSize:12, color:"var(--clr-text-3)" }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:700, color:accent??"var(--clr-text)" }}>{value}</span>
    </div>
  );
}

export default function CockpitPage() {
  const { userId, isLoaded } = useAuth();
  const [stats, setStats]   = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hChecking, setHChecking] = useState(false);
  const [lastRef, setLastRef] = useState(new Date());

  const fetchStats = useCallback(async () => {
    const s = await fetch("/api/admin/stats").then(r=>r.json()).catch(()=>null);
    if (s) { setStats(s); setLastRef(new Date()); }
  }, []);

  const runHealth = useCallback(async () => {
    setHChecking(true);
    const h = await fetch("/api/admin/health").then(r=>r.json()).catch(()=>null);
    if (h) setHealth(h);
    setHChecking(false);
  }, []);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    Promise.all([fetchStats(), runHealth()]).finally(()=>setLoading(false));
    const si = setInterval(fetchStats, 60000);
    return () => clearInterval(si);
  }, [isLoaded, userId, fetchStats, runHealth]);

  if (!isLoaded || !userId) return <div style={{padding:40}}>Loading...</div>;
  if (stats?.error) return <div style={{padding:40,color:"#ef4444"}}>Access denied.</div>;

  const failing = health?.checks?.filter((c:any)=>!c.ok) ?? [];
  const allOk   = health?.checks?.every((c:any)=>c.ok);
  const pulseOk = stats?.pulse?.ageMinutes !== null && stats?.pulse?.ageMinutes < 180;

  const dailyKeys = Object.keys(stats?.daily??{}).sort().slice(-14);
  const maxVal = Math.max(1, ...dailyKeys.map(k=>(stats.daily[k].dig??0)+(stats.daily[k].stack??0)));

  return (
    <div style={{ padding:"28px 36px 80px", maxWidth:1040, margin:"0 auto" }}>

      {/* HEADER */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:".1em", textTransform:"uppercase" as const, color:"var(--clr-text-5)", marginBottom:4 }}>Admin</div>
          <h1 style={{ margin:0, fontSize:"1.375rem", fontWeight:800, letterSpacing:"-0.03em" }}>Cockpit</h1>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:11, color:"var(--clr-text-5)" }}>Refreshed {lastRef.toLocaleTimeString()}</span>
          <button onClick={fetchStats} style={{ padding:"6px 14px", borderRadius:7, border:"1px solid var(--clr-border)", background:"var(--clr-surface)", color:"var(--clr-text)", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>↻</button>
          <button onClick={runHealth} disabled={hChecking} style={{ padding:"6px 16px", borderRadius:7, border:"none", background:allOk===false?"#ef4444":allOk===true?"#16a34a":"var(--clr-surface)", color:allOk!==undefined?"#fff":"var(--clr-text)", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:hChecking?0.6:1 }}>
            {hChecking?"Checking...":`${allOk===false?`⚠ ${failing.length} DOWN`:allOk===true?"✓ All OK":"Check health"}`}
          </button>
        </div>
      </div>

      {loading ? <div style={{color:"var(--clr-text-4)",fontSize:13}}>Loading...</div> : <>

      {/* SITE HEALTH */}
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:10, fontWeight:800, letterSpacing:".1em", textTransform:"uppercase" as const, color:"var(--clr-text-5)", marginBottom:12 }}>🛡 Site health</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" as const }}>
          {(health?.checks??[]).map((c:any) => (
            <div key={c.name} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px", borderRadius:7, border:`1px solid ${c.ok?"#bbf7d0":"#fecaca"}`, background:c.ok?"#f0fdf4":"#fef2f2" }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:c.ok?"#16a34a":"#ef4444", display:"inline-block" }} />
              <span style={{ fontSize:12, fontWeight:600, color:c.ok?"#15803d":"#dc2626" }}>{c.name}</span>
              <span style={{ fontSize:11, color:c.ok?"#4ade80":"#f87171" }}>{c.latency}ms</span>
            </div>
          ))}
        </div>
        {failing.map((c:any) => (
          <div key={c.name} style={{ marginTop:8, padding:"10px 14px", borderRadius:8, background:"#fef2f2", border:"1px solid #fecaca" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#dc2626" }}>🚨 {c.name} — HTTP {c.status||"TIMEOUT"}</div>
            {c.error && <div style={{ fontSize:11, color:"#ef4444", fontFamily:"monospace", marginTop:3 }}>{c.error}</div>}
          </div>
        ))}
      </div>

      {/* USAGE */}
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:10, fontWeight:800, letterSpacing:".1em", textTransform:"uppercase" as const, color:"var(--clr-text-5)", marginBottom:12 }}>📊 Usage</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          <Card title="Users today"   value={stats?.users?.today??0}           sub={`${num(stats?.users?.week??0)} this week · ${num(stats?.users?.total??0)} total`} />
          <Card title="Reports today" value={stats?.reports?.today??0}         sub={`${num(stats?.reports?.week??0)} this week · ${num(stats?.reports?.total??0)} total`} />
          <Card title="Dig today"     value={stats?.reports?.dig?.today??0}    sub={`${num(stats?.reports?.dig?.total??0)} total`} color="#7c6fff" />
          <Card title="Stack today"   value={stats?.reports?.stack?.today??0}  sub={`${num(stats?.reports?.stack?.total??0)} total`} color="#0ea5e9" />
        </div>
      </div>

      {/* REVENUE */}
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:10, fontWeight:800, letterSpacing:".1em", textTransform:"uppercase" as const, color:"var(--clr-text-5)", marginBottom:12 }}>💰 Revenue</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:12 }}>
          <Card title="Today"        value={$n(stats?.revenue?.today??0)}   sub={`${$n(stats?.revenue?.week??0)} this week`} color="#16a34a" />
          <Card title="Total"        value={$n(stats?.revenue?.total??0)}   sub="all time" color="#16a34a" />
          <Card title="Orders today" value={stats?.orders?.today??0}        sub={`${num(stats?.orders?.total??0)} total`} />
          <Card title="Credits sold" value={num(stats?.orders?.credits??0)} sub="total distributed" />
        </div>
        {(stats?.orders?.recent??[]).length>0 && (
          <div style={{ background:"var(--clr-surface)", border:"1px solid var(--clr-border)", borderRadius:10, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead><tr style={{ borderBottom:"1px solid var(--clr-border)" }}>
                {["When","Package","Credits","Amount"].map(h=>(
                  <th key={h} style={{ padding:"8px 14px", textAlign:"left" as const, fontSize:10, fontWeight:700, color:"var(--clr-text-5)", letterSpacing:".06em", textTransform:"uppercase" as const }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{stats.orders.recent.map((o:any,i:number)=>(
                <tr key={i} style={{ borderBottom:"1px solid var(--clr-border)" }}>
                  <td style={{ padding:"8px 14px", color:"var(--clr-text-3)" }}>{ago(o.created_at)}</td>
                  <td style={{ padding:"8px 14px", fontWeight:600 }}>{o.package_slug}</td>
                  <td style={{ padding:"8px 14px" }}>{o.credits_added}</td>
                  <td style={{ padding:"8px 14px", color:"#16a34a", fontWeight:700 }}>{$n(o.amount_usd??0)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {/* API COSTS */}
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:10, fontWeight:800, letterSpacing:".1em", textTransform:"uppercase" as const, color:"var(--clr-text-5)", marginBottom:12 }}>💸 API costs (Anthropic)</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div style={{ background:"var(--clr-surface)", border:"1px solid var(--clr-border)", borderRadius:12, padding:"16px 18px" }}>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:".08em", textTransform:"uppercase" as const, color:"var(--clr-text-5)", marginBottom:8 }}>March 2026 baseline</div>
            <div style={{ fontSize:"1.5rem", fontWeight:800, color:"var(--clr-text)" }}>$40.04</div>
            <div style={{ fontSize:11, color:"var(--clr-text-4)", marginTop:6, lineHeight:1.6 }}>
              Sonnet 4.6: $16.07 · Opus 4.6: $11.33 · Haiku: $8.45<br/>
              Dig/Stack: ~$0.45–0.75/query · Pulse: ~$3.21/day
            </div>
          </div>
          <div style={{ background:"var(--clr-surface)", border:"1px solid var(--clr-border)", borderRadius:12, padding:"16px 18px", display:"flex", flexDirection:"column" as const, gap:10 }}>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:".08em", textTransform:"uppercase" as const, color:"var(--clr-text-5)" }}>Live billing</div>
            <div style={{ fontSize:12, color:"var(--clr-text-3)", lineHeight:1.6 }}>Real-time token counts and costs are in Anthropic Console.</div>
            <a href="https://console.anthropic.com/workspaces/default/cost" target="_blank" rel="noopener noreferrer"
              style={{ padding:"8px 14px", borderRadius:8, background:"#7c6fff", color:"#fff", textDecoration:"none", fontSize:12, fontWeight:700, display:"inline-block", width:"fit-content" }}>
              Open Console ↗
            </a>
          </div>
        </div>
      </div>

      {/* PULSE */}
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:10, fontWeight:800, letterSpacing:".1em", textTransform:"uppercase" as const, color:"var(--clr-text-5)", marginBottom:12 }}>📡 Pulse</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          <Card title="Last update"   value={stats?.pulse?.generatedAt?ago(stats.pulse.generatedAt):"Never"} sub={stats?.pulse?.generatedAt?new Date(stats.pulse.generatedAt).toLocaleString():"—"} color={pulseOk?undefined:"#ef4444"} />
          <Card title="Signals"       value={num(stats?.pulse?.signals??0)} sub="in feed" />
          <Card title="Feed age"      value={stats?.pulse?.ageMinutes!==null?`${stats.pulse.ageMinutes}m`:"?"} sub={pulseOk?"✓ Fresh":"⚠ Stale — check cron"} color={pulseOk?"#16a34a":"#ef4444"} />
        </div>
      </div>

      {/* CHART */}
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:10, fontWeight:800, letterSpacing:".1em", textTransform:"uppercase" as const, color:"var(--clr-text-5)", marginBottom:12 }}>📈 Daily reports (last 14 days)</div>
        <div style={{ background:"var(--clr-surface)", border:"1px solid var(--clr-border)", borderRadius:12, padding:"20px 20px 16px" }}>
          {dailyKeys.length===0 ? <div style={{fontSize:13,color:"var(--clr-text-5)"}}>No data yet</div> : (
            <>
              <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:80 }}>
                {dailyKeys.map(k=>{
                  const d=stats.daily[k]; const total=(d.dig??0)+(d.stack??0);
                  const h=Math.max(4,Math.round((total/maxVal)*72));
                  return (
                    <div key={k} style={{ flex:1, display:"flex", flexDirection:"column" as const, alignItems:"center" }} title={`${k}: ${d.dig} Dig, ${d.stack} Stack`}>
                      <div style={{ width:"100%", display:"flex", flexDirection:"column" as const, justifyContent:"flex-end", height:72 }}>
                        <div style={{ height:h, borderRadius:3, background:total>0?"#7c6fff":"var(--clr-border)", opacity:total>0?1:0.3 }}/>
                      </div>
                      <div style={{ fontSize:9, color:"var(--clr-text-5)", marginTop:4, transform:"rotate(-45deg)", whiteSpace:"nowrap" as const }}>{k.slice(5)}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop:16, fontSize:11, color:"var(--clr-text-5)", display:"flex", gap:20 }}>
                <span>Dig total: <b style={{color:"var(--clr-text)"}}>{num(stats?.reports?.dig?.total??0)}</b></span>
                <span>Stack total: <b style={{color:"var(--clr-text)"}}>{num(stats?.reports?.stack?.total??0)}</b></span>
                <span>This week: <b style={{color:"var(--clr-text)"}}>{num(stats?.reports?.week??0)}</b></span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* QUICK LINKS */}
      <div style={{ marginBottom:32 }}>
        <div style={{ fontSize:10, fontWeight:800, letterSpacing:".1em", textTransform:"uppercase" as const, color:"var(--clr-text-5)", marginBottom:12 }}>🔗 Quick links</div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" as const }}>
          {[
            ["Anthropic Console","https://console.anthropic.com/workspaces/default/cost"],
            ["Vercel","https://vercel.com/sametduman00s-projects/unbuilt"],
            ["Supabase","https://supabase.com/dashboard/project/jlqawgrtnbizwqigbyho"],
            ["Clerk Users","https://dashboard.clerk.com"],
            ["Google Analytics","https://analytics.google.com"],
            ["Paddle","https://vendors.paddle.com"],
          ].map(([l,u])=>(
            <a key={l} href={u} target="_blank" rel="noopener noreferrer"
              style={{ padding:"8px 14px", borderRadius:8, border:"1px solid var(--clr-border)", background:"var(--clr-surface)", color:"var(--clr-text)", textDecoration:"none", fontSize:12, fontWeight:600 }}>
              {l} ↗
            </a>
          ))}
        </div>
      </div>

      {/* SIDEBAR nav fix */}
      <div style={{ fontSize:11, color:"var(--clr-text-5)", textAlign:"center" as const, marginTop:16 }}>
        Auto-refreshes every 60s · {lastRef.toLocaleString()}
      </div>

      </>}
    </div>
  );
}
