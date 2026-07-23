import { workshop } from "../config";
import { trackInitiateCheckout, trackPurchase } from "./metaPixel";
import type { RazorpaySuccessResponse } from "../vite-env";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface CheckoutPrefill {
  name: string;
  email: string;
  contact: string;
}

interface CreatedOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

function isConfiguredKey(key: string): boolean {
  if (!key) return false;
  if (key.includes("xxxx")) return false;
  if (key === "rzp_test_xxxxxxxx" || key === "rzp_live_xxxxxxxx") return false;
  return /^rzp_(test|live)_[A-Za-z0-9]+$/.test(key);
}

function formatContact(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return mobile.startsWith("+") ? mobile : `+${digits}`;
}

async function createOrder(prefill: CheckoutPrefill): Promise<CreatedOrder> {
  const response = await fetch("/api/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefill),
  });

  const text = await response.text();
  let data: CreatedOrder & { error?: string };
  try {
    data = JSON.parse(text) as CreatedOrder & { error?: string };
  } catch {
    throw new Error(
      text.trim().slice(0, 180) ||
        `Payment server error (${response.status}). Redeploy after fixing API.`,
    );
  }

  if (!response.ok || !data.orderId) {
    throw new Error(data.error || "Could not create payment order.");
  }
  return data;
}

async function verifyPayment(
  response: RazorpaySuccessResponse,
): Promise<boolean> {
  if (
    !response.razorpay_order_id ||
    !response.razorpay_payment_id ||
    !response.razorpay_signature
  ) {
    return false;
  }

  const res = await fetch("/api/verify-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    }),
  });
  const text = await res.text();
  try {
    const data = JSON.parse(text) as { verified?: boolean };
    return !!data.verified;
  } catch {
    return false;
  }
}

export async function openRazorpayCheckout(
  prefill: CheckoutPrefill,
  onSuccess: (paymentId: string) => void,
  onFailure?: (message: string) => void,
): Promise<void> {
  const key = workshop.razorpayKeyId.trim();

  if (!isConfiguredKey(key)) {
    throw new Error(
      "Razorpay is not configured. Set VITE_RAZORPAY_KEY_ID in .env, then restart npm run dev.",
    );
  }

  const order = await createOrder(prefill);

  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error("Unable to load payment gateway. Please try again.");
  }

  trackInitiateCheckout();

  const rzp = new window.Razorpay({
    key: order.keyId || key,
    amount: order.amount,
    currency: order.currency,
    order_id: order.orderId,
    name: workshop.brand,
    description: "Parent Biomedical Workshop (2 Hours)",
    prefill: {
      name: prefill.name,
      email: prefill.email,
      contact: formatContact(prefill.contact),
    },
    notes: {
      workshop: "biomedical-parent-workshop",
      parent_name: prefill.name,
      parent_email: prefill.email,
      parent_mobile: prefill.contact,
    },
    theme: { color: "#0F6B5C" },
    async handler(response) {
      try {
        const ok = await verifyPayment(response);
        if (!ok) {
          onFailure?.(
            "Payment received but could not be verified. Contact support with your payment ID.",
          );
          return;
        }
        trackPurchase(response.razorpay_payment_id);
        onSuccess(response.razorpay_payment_id);
      } catch {
        onFailure?.("Payment verification failed. Please contact support.");
      }
    },
  });

  rzp.on("payment.failed", (response) => {
    const err = response as {
      error?: { description?: string; reason?: string };
    };
    const message =
      err.error?.description ||
      err.error?.reason ||
      "Payment failed. Please try again.";
    onFailure?.(message);
  });

  rzp.open();
}
