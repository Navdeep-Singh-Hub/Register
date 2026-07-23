import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createRazorpayOrder } from "../server/razorpayCore";

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
        ? (JSON.parse(req.body) as Record<string, string>)
        : ((req.body ?? {}) as Record<string, string>);

    const order = await createRazorpayOrder({
      workshop: "biomedical-parent-workshop",
      parent_name: body.name || "",
      parent_email: body.email || "",
      parent_mobile: body.contact || "",
    });

    return res.status(200).json(order);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Could not create order",
    });
  }
}
