import { useEffect, useState } from "react";
import { LandingPage } from "./components/LandingPage";
import { SuccessPage } from "./components/SuccessPage";
import { workshop } from "./config";
import { trackPageView, trackViewContent } from "./lib/metaPixel";

function initMetaPixel() {
  const pixelId = workshop.metaPixelId;
  if (!pixelId || window.fbq) return;

  const script = document.createElement("script");
  script.innerHTML = `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
  `;
  document.head.appendChild(script);
}

export default function App() {
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    initMetaPixel();
    trackPageView();
    trackViewContent();
  }, []);

  useEffect(() => {
    if (paid) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [paid]);

  if (paid) {
    return <SuccessPage />;
  }

  return (
    <LandingPage
      onPaid={() => {
        setPaid(true);
      }}
    />
  );
}
