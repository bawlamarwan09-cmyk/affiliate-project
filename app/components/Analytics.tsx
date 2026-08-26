import Script from "next/script";

const DEFAULT_GTM_ID = "GTM-PVNN5BFQ";

function analyticsIds(ids?: Record<string, unknown> | null) {
  const configuredGtm = typeof ids?.gtm === "string" ? ids.gtm.trim() : "";
  const configuredGa4 = typeof ids?.ga4 === "string" ? ids.ga4.trim() : "";
  const gtm = (configuredGtm || DEFAULT_GTM_ID).replace(/[^A-Z0-9-]/gi, "");
  const ga4 = !gtm ? configuredGa4.replace(/[^A-Z0-9-]/gi, "") : "";

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

  return (
    <>
      {gtm && (
        <Script id="gtm-loader" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}
        </Script>
      )}
      {ga4 && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4)}`} strategy="afterInteractive" />
          <Script id="ga4-config" strategy="afterInteractive">
            {`window.__bargainMomDirectGa=true;window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga4}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
    </>
  );
}
