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
    <>
      <GlobalHeader />
      <main style={{
        position:"fixed", top:60, left:0, right:0, bottom:0,
        display:"flex", flexDirection:"column",
        padding:"12px 22px", gap:10,
        background:"var(--clr-bg)", color:"var(--clr-text)",
        overflow:"hidden",
      }}>

        {/* Tools — 80% */}
        <div style={{ flex:"0 0 78%", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, overflow:"hidden" }}>
          {tools.map(tool => (
            <div key={tool.id} style={{ border:"1px solid var(--clr-border)", borderRadius:12, padding:"16px 18px", display:"flex", flexDirection:"column", gap:10, overflow:"hidden" }}>
              <div style={{ fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--clr-accent)", flexShrink:0 }}>{tool.label}</div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, flexShrink:0 }}>
                <span style={{ fontSize:"1.1rem", fontWeight:700 }}>{tool.name}</span>
                <span style={{ fontSize:"2.4rem", fontWeight:900, letterSpacing:"-0.05em", lineHeight:1, flexShrink:0 }}>$0</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:7, flex:1, overflow:"hidden" }}>
                {tool.features.map(f => (
                  <div key={f} style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <span style={{ color:"var(--clr-accent)", fontSize:"0.72rem", flexShrink:0 }}>&#10003;</span>
                    <span style={{ fontSize:"0.82rem", color:"var(--clr-text-3)", lineHeight:1.3 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Donate — 20% */}
        <div style={{ flex:"0 0 calc(22% - 10px)", border:"1px solid var(--clr-border)", borderRadius:12, padding:"10px 14px", display:"flex", flexDirection:"column", gap:8, overflow:"hidden", minHeight:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div>
              <span style={{ fontSize:"0.8rem", fontWeight:700 }}>If Unbuilt helped you, pay it forward.</span>
              <span style={{ fontSize:"0.68rem", color:"var(--clr-text-4)", marginLeft:8 }}>Everything is free — donations cover server &amp; API costs.</span>
            </div>
            <span style={{ fontSize:"0.68rem", color:"var(--clr-text-4)", flexShrink:0 }}>&#128591; No pressure.</span>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, flex:1, minHeight:0, overflow:"hidden" }}>
            {wallets.map(w => (
              <div key={w.symbol} style={{ display:"flex", flexDirection:"row", alignItems:"center", gap:8, border:"1px solid var(--clr-border)", borderRadius:9, padding:"7px 10px", overflow:"hidden", minHeight:0 }}>
                {/* QR small */}
                <img src={w.qr} alt={w.symbol} style={{ width:52, height:52, borderRadius:5, background:"#fff", flexShrink:0, display:"block" }}/>
                {/* info */}
                <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:4 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ width:7, height:7, borderRadius:"50%", background:w.color, display:"inline-block", flexShrink:0 }}/>
                    <span style={{ fontWeight:700, fontSize:"0.82rem" }}>{w.symbol}</span>
                    <span style={{ fontSize:"0.6rem", color:"var(--clr-text-4)" }}>{w.name}</span>
                  </div>
                  <div style={{ fontSize:"0.6rem", color:"var(--clr-text-3)", wordBreak:"break-all", lineHeight:1.4, fontFamily:"monospace" }}>{w.address}</div>
                  <button onClick={() => copy(w.address, w.symbol)} style={{
                    width:"100%", padding:"0.22rem",
                    background: copied===w.symbol ? "color-mix(in srgb,var(--clr-accent) 15%,transparent)" : "var(--clr-surface)",
                    border:"1px solid var(--clr-border)", borderRadius:6,
                    fontSize:"0.66rem", fontWeight:600, cursor:"pointer",
                    color: copied===w.symbol ? "var(--clr-accent)" : "var(--clr-text-3)",
                  }}>
                    {copied===w.symbol ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </>
  );
}
