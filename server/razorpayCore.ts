import { createHmac } from "node:crypto";

export type RazorpayEnv = {
  VITE_RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  WORKSHOP_FEE_INR?: string;
};

export type CreatedOrder = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

function authHeader(keyId: string, keySecret: string) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

/** Read credentials from process.env (Vercel) or a provided map (Vite). */
export function readRazorpayEnv(
  source: RazorpayEnv | NodeJS.ProcessEnv = process.env,
): Required<Pick<RazorpayEnv, "RAZORPAY_KEY_SECRET">> & {
  keyId: string;
  amountInr: number;
} {
  const keyId = (
    source.VITE_RAZORPAY_KEY_ID ||
    source.RAZORPAY_KEY_ID ||
    ""
  ).trim();
  const keySecret = (source.RAZORPAY_KEY_SECRET || "").trim();
  const amountInr = Number(source.WORKSHOP_FEE_INR || "1499");

  if (!keyId || !keySecret) {
    throw new Error(
      "Missing Razorpay credentials. Set VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables.",
    );
  }
  if (!Number.isFinite(amountInr) || amountInr < 1) {
    throw new Error("Invalid WORKSHOP_FEE_INR in environment variables.");
  }

  return { keyId, RAZORPAY_KEY_SECRET: keySecret, amountInr };
}

export async function createRazorpayOrder(
  notes: Record<string, string>,
  source: RazorpayEnv | NodeJS.ProcessEnv = process.env,
): Promise<CreatedOrder> {
  const { keyId, RAZORPAY_KEY_SECRET: keySecret, amountInr } =
    readRazorpayEnv(source);

  const receipt = `ws_${Date.now().toString(36)}`;
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: authHeader(keyId, keySecret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amountInr * 100),
      currency: "INR",
      receipt,
      notes,
    }),
  });

  const data = (await response.json()) as {
    id?: string;
    amount?: number;
    currency?: string;
    error?: { description?: string; code?: string };
  };

  if (!response.ok || !data.id) {
    const description = data.error?.description || "";
    if (response.status === 401 || /authentication failed/i.test(description)) {
      throw new Error(
        "Razorpay authentication failed. Regenerate Live API Keys in the Dashboard, update VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then redeploy.",
      );
    }
    throw new Error(
      description ||
        `Razorpay order failed (${response.status}). Check Key ID + Secret.`,
    );
  }

  return {
    orderId: data.id,
    amount: data.amount ?? Math.round(amountInr * 100),
    currency: data.currency ?? "INR",
    keyId,
  };
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  source: RazorpayEnv | NodeJS.ProcessEnv = process.env,
): boolean {
  const { RAZORPAY_KEY_SECRET: secret } = readRazorpayEnv(source);
  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}
