import { workshop } from "../config";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackPageView() {
  window.fbq?.("track", "PageView");
}

export function trackViewContent() {
  window.fbq?.("track", "ViewContent", {
    content_name: "Biomedical Workshop",
    content_category: "Workshop",
    value: workshop.feeInr,
    currency: "INR",
  });
}

export function trackInitiateCheckout() {
  window.fbq?.("track", "InitiateCheckout", {
    content_name: "Biomedical Workshop",
    value: workshop.feeInr,
    currency: "INR",
    num_items: 1,
  });
}

export function trackPurchase(paymentId: string) {
  window.fbq?.("track", "Purchase", {
    content_name: "Biomedical Workshop",
    value: workshop.feeInr,
    currency: "INR",
    order_id: paymentId,
  });
}
