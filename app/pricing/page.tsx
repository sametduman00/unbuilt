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
    <div style={{ height:"100dvh", display:"flex", flexDirection:"column", background:"var(--clr-bg)", color:"var(--clr-text)" }}>
      <GlobalHeader />

      <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"14px 22px 14px", gap:10, overflow:"hidden" }}>

        {/* Tools — 3 col, fixed height */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
          {tools.map(tool => (
            <div key={tool.id} style={{ border:"1px solid var(--clr-border)", borderRadius:11, padding:"11px 14px", display:"flex", flexDirection:"column", gap:7 }}>
              <div style={{ fontSize:"0.58rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--clr-accent)" }}>{tool.label}</div>
              <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", gap:8 }}>
                <span style={{ fontSize:"1rem", fontWeight:700 }}>{tool.name}</span>
                <span style={{ fontSize:"1.5rem", fontWeight:900, letterSpacing:"-0.04em", lineHeight:1, flexShrink:0 }}>$0<span style={{ fontSize:"0.6rem", color:"var(--clr-text-4)", fontWeight:400, marginLeft:2 }}>/ forever</span></span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {tool.features.map(f => (
                  <div key={f} style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ color:"var(--clr-accent)", fontSize:"0.68rem", flexShrink:0 }}>✓</span>
                    <span style={{ fontSize:"0.76rem", color:"var(--clr-text-3)", lineHeight:1.3 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Donate */}
        <div style={{ border:"1px solid var(--clr-border)", borderRadius:11, padding:"11px 14px", flex:1, display:"flex", flexDirection:"column", gap:8, overflow:"hidden" }}>
          {/* header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:"0.82rem", fontWeight:700 }}>If Unbuilt helped you, pay it forward.</span>
              <span style={{ fontSize:"0.7rem", color:"var(--clr-text-4)" }}>Everything is free — donations cover server &amp; API costs.</span>
            </div>
            <span style={{ fontSize:"0.7rem", color:"var(--clr-text-4)", flexShrink:0 }}>🙏 No pressure.</span>
          </div>

          {/* wallet cards — stretch to fill remaining */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, flex:1, overflow:"hidden" }}>
            {wallets.map(w => (
              <div key={w.symbol} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, border:"1px solid var(--clr-border)", borderRadius:9, padding:"10px 8px", overflow:"hidden" }}>
                {/* symbol row */}
                <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:w.color, display:"inline-block", flexShrink:0 }}/>
                  <span style={{ fontWeight:700, fontSize:"0.8rem" }}>{w.symbol}</span>
                  <span style={{ fontSize:"0.6rem", color:"var(--clr-text-4)" }}>{w.name}</span>
                </div>
                {/* QR - fill available space */}
                <div style={{ flex:1, width:"100%", minHeight:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <img src={w.qr} alt={w.symbol} style={{ width:"100%", height:"100%", objectFit:"contain", borderRadius:6, background:"#fff", display:"block" }}/>
                </div>
                {/* address */}
                <div style={{ fontSize:"0.63rem", color:"var(--clr-text-3)", wordBreak:"break-all", textAlign:"center", lineHeight:1.4, fontFamily:"monospace", width:"100%", flexShrink:0 }}>{w.address}</div>
                {/* copy btn */}
                <button onClick={() => copy(w.address, w.symbol)} style={{
                  width:"100%", padding:"0.28rem", flexShrink:0,
                  background: copied===w.symbol ? "color-mix(in srgb,var(--clr-accent) 15%,transparent)" : "var(--clr-surface)",
                  border:"1px solid var(--clr-border)", borderRadius:7,
                  fontSize:"0.68rem", fontWeight:600, cursor:"pointer",
                  color: copied===w.symbol ? "var(--clr-accent)" : "var(--clr-text-3)",
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
