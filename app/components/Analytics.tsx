const DEFAULT_GTM_ID = "GTM-PVNN5BFQ";
const DEFAULT_GA4_ID = "G-3BPZSB39ME";

function analyticsIds(ids?: Record<string, unknown> | null) {
  const configuredGtm = typeof ids?.gtm === "string" ? ids.gtm.trim() : "";
  const configuredGa4 = typeof ids?.ga4 === "string" ? ids.ga4.trim() : "";
  const gtm = (configuredGtm || DEFAULT_GTM_ID).replace(/[^A-Z0-9-]/gi, "");
  const ga4 = (configuredGa4 || DEFAULT_GA4_ID).replace(/[^A-Z0-9-]/gi, "");

  return { gtm, ga4 };
}

export function AnalyticsNoScript({ ids }: { ids?: Record<string, unknown> | null }) {
  const { gtm } = analyticsIds(ids);
  if (!gtm) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtm)}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}

export function Analytics({ ids }: { ids?: Record<string, unknown> | null }) {
  const { gtm, ga4 } = analyticsIds(ids);
  if (!gtm && !ga4) return null;
  const source = gtm
    ? `https://www.googletagmanager.com/gtm.js?id=${gtm}`
    : `https://www.googletagmanager.com/gtag/js?id=${ga4}`;
  const setup = gtm
    ? `w.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});`
    : `w.__bargainMomDirectGa=true;w.dataLayer.push(['js',new Date()]);w.dataLayer.push(['config','${ga4}',{anonymize_ip:true}]);`;
  const code = `(function(w,d){var loaded=false;w.dataLayer=w.dataLayer||[];function load(){if(loaded)return;loaded=true;${setup}var s=d.createElement('script');s.async=true;s.src='${source}';d.head.appendChild(s)}['pointerdown','keydown','scroll'].forEach(function(e){w.addEventListener(e,load,{once:true,passive:true})});w.setTimeout(load,8000)})(window,document);`;
  return <script id="deferred-analytics" dangerouslySetInnerHTML={{ __html: code }} />;
}
