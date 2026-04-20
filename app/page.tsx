import ClientWrapper from "./components/ClientWrapper";

/* Edge CDN — pre-rendered at build time, zero cold start */
export const dynamic = "force-static";

export default function Home() {
  return <ClientWrapper />;
}
