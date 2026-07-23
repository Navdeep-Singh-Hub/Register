import { createHmac } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

function parseBody(req: VercelRequest): {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
} {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    return JSON.parse(req.body) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };
  }
  return req.body as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
    if (!keySecret) {
      throw new Error(
        "Missing RAZORPAY_KEY_SECRET in Vercel environment variables.",
      );
    }

    const body = parseBody(req);
    const ok =
      !!body.razorpay_order_id &&
      !!body.razorpay_payment_id &&
      !!body.razorpay_signature &&
      createHmac("sha256", keySecret)
        .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
        .digest("hex") === body.razorpay_signature;

    return res.status(ok ? 200 : 400).json({
      verified: ok,
      error: ok ? undefined : "Payment signature verification failed",
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Verification failed",
    });
  }
}
