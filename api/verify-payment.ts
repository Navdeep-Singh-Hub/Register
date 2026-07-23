import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyPaymentSignature } from "../server/razorpayCore";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string"
        ? (JSON.parse(req.body) as {
            razorpay_order_id?: string;
            razorpay_payment_id?: string;
            razorpay_signature?: string;
          })
        : ((req.body ?? {}) as {
            razorpay_order_id?: string;
            razorpay_payment_id?: string;
            razorpay_signature?: string;
          });

    const ok =
      !!body.razorpay_order_id &&
      !!body.razorpay_payment_id &&
      !!body.razorpay_signature &&
      verifyPaymentSignature(
        body.razorpay_order_id,
        body.razorpay_payment_id,
        body.razorpay_signature,
      );

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
