"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const HomeClient = dynamic(() => import("./HomeClient"), { ssr: false });

export default function ClientWrapper() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    // Hide the server-rendered static hero once interactive page mounts
    const hero = document.getElementById("static-hero");
    if (hero) hero.style.display = "none";
  }, []);

  if (!ready) return null;
  return <HomeClient />;
}
