import ClientWrapper from "./components/ClientWrapper";
import HomeSeoContent from "./components/HomeSeoContent";

/* Edge CDN — pre-rendered at build time, zero cold start */
export const dynamic = "force-static";

/**
 * Home is a server component. It renders the interactive client widget
 * (ClientWrapper, which lazy-imports HomeClient with ssr:false) and
 * underneath it a server-rendered SEO/content section. The content
 * section is real prose visible to users when they scroll, but its
 * primary job is making sure crawlers — Google, Okara, every site
 * auditor that scrapes raw HTML — see real content instead of a
 * 100-byte React skeleton. Before this, the served HTML was 36KB of
 * which only ~800 bytes were visible text (2.2% text-to-HTML ratio
 * — Okara was flagging it). After: the same 36KB shell plus several
 * thousand bytes of actual product description, FAQs and use cases.
 */
export default function Home() {
  return (
    <>
      <ClientWrapper />
      <HomeSeoContent />
    </>
  );
}
