"use client";
import GlobalHeader from "../components/GlobalHeader";
import { useState } from "react";

const tools = [
  { id:"pulse", name:"Pulse", label:"I NEED INSPIRATION", features:["Product Hunt & App Store — daily","AI breakdown: WHAT / DIFF / MISS","Topic & category filters","No account required"] },
  { id:"gap", name:"Gap Analysis", label:"I HAVE AN IDEA", features:["Live Google & YouTube search","Real competitor breakdown","Market gap identification","Honest scoring — no fluff"] },
  { id:"stack", name:"Stack Advisor", label:"HELP ME CHOOSE MY STACK", features:["123+ tools with live pricing","Budget-matched recommendations","Phase-by-phase build plan","Time-to-MVP estimate"] },
];

const wallets = [
  { symbol:"BTC",  name:"Bitcoin",       color:"#F7931A", address:"bc1q9fjlxn39vs9sfurekgjd7p4qx9yzj4kulqe580",     qr:"/qr/btc.jpeg"  },
  { symbol:"ETH",  name:"Ethereum",      color:"#627EEA", address:"0x60d601C0CcF6A27f5BB00066FCAE8c7208a8Fac8",     qr:"/qr/eth.jpeg"  },
  { symbol:"SOL",  name:"Solana",        color:"#9945FF", address:"3oXApv9hQC2UUtoVKb29gLtW61SRdsT9mpfzKvM4jjgM", qr:"/qr/sol.jpeg"  },
  { symbol:"USDT", name:"Tether ERC-20", color:"#26A17B", address:"0x60d601C0CcF6A27f5BB00066FCAE8c7208a8Fac8",     qr:"/qr/usdt.jpeg" },
  { symbol:"XRP",  name:"Ripple",        color:"#00AAE4", address:"rPMvhnSuaw82TqEMPNffBVhj5yJTxZyv9Y",            qr:"/qr/xrp.jpeg"  },
];

export default function PricingPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (address: string, symbol: string) => {
    navigator.clipboard.writeText(address);
    setCopied(symbol);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:"var(--clr-bg)", color:"var(--clr-text)", overflow:"hidden" }}>
      <GlobalHeader />

      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"16px 24px", gap:12, minHeight:0, overflow:"hidden" }}>

        {/* Tools */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, flexShrink:0 }}>
          {tools.map(tool => (
            <div key={tool.id} style={{ border:"1px solid var(--clr-border)", borderRadius:12, padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--clr-accent)" }}>{tool.label}</div>
              <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between" }}>
                <span style={{ fontSize:"1rem", fontWeight:700 }}>{tool.name}</span>
                <span style={{ fontSize:"1.6rem", fontWeight:900, letterSpacing:"-0.04em", lineHeight:1 }}>$0<span style={{ fontSize:"0.65rem", color:"var(--clr-text-4)", fontWeight:400, marginLeft:3 }}>/ forever</span></span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {tool.features.map(f => (
                  <div key={f} style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ color:"var(--clr-accent)", fontSize:"0.7rem", flexShrink:0 }}>✓</span>
                    <span style={{ fontSize:"0.78rem", color:"var(--clr-text-3)" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Donate */}
        <div style={{ border:"1px solid var(--clr-border)", borderRadius:12, padding:"12px 14px", flex:1, display:"flex", flexDirection:"column", gap:10, minHeight:0, overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div>
              <span style={{ fontSize:"0.85rem", fontWeight:700 }}>If Unbuilt helped you, pay it forward.</span>
              <span style={{ fontSize:"0.72rem", color:"var(--clr-text-4)", marginLeft:8 }}>Everything is free — donations cover server &amp; API costs.</span>
            </div>
            <span style={{ fontSize:"0.72rem", color:"var(--clr-text-4)" }}>🙏 No pressure.</span>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, flex:1, minHeight:0 }}>
            {wallets.map(w => (
              <div key={w.symbol} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, border:"1px solid var(--clr-border)", borderRadius:10, padding:"10px 8px", minHeight:0, overflow:"hidden" }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:w.color, display:"inline-block", flexShrink:0 }}/>
                  <span style={{ fontWeight:700, fontSize:"0.82rem" }}>{w.symbol}</span>
                  <span style={{ fontSize:"0.62rem", color:"var(--clr-text-4)" }}>{w.name}</span>
                </div>
                <img src={w.qr} alt={w.symbol} style={{ width:"100%", aspectRatio:"1/1", borderRadius:6, background:"#fff", display:"block", objectFit:"cover", flexShrink:0, maxWidth:120 }}/>
                <div style={{ fontSize:"0.65rem", color:"var(--clr-text-3)", wordBreak:"break-all", textAlign:"center", lineHeight:1.4, fontFamily:"monospace", width:"100%", flexShrink:0 }}>{w.address}</div>
                <button onClick={() => copy(w.address, w.symbol)} style={{
                  width:"100%", padding:"0.28rem", marginTop:"auto",
                  background: copied===w.symbol ? "color-mix(in srgb,var(--clr-accent) 15%,transparent)" : "var(--clr-surface)",
                  border:"1px solid var(--clr-border)", borderRadius:7,
                  fontSize:"0.7rem", fontWeight:600, cursor:"pointer",
                  color: copied===w.symbol ? "var(--clr-accent)" : "var(--clr-text-3)",
                  flexShrink:0,
                }}>
                  {copied===w.symbol ? "Copied!" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
