function authHeader(keyId, keySecret) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

function readCredentials() {
  const keyId = (
    process.env.VITE_RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID ||
    ""
  ).trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  // Must match src/config.ts feeInr. Treat legacy Vercel value 1499 as 499.
  const fromEnv = (process.env.WORKSHOP_FEE_INR || "499").trim();
  const amountInr = Number(fromEnv === "1499" ? "499" : fromEnv);

  if (!keyId || !keySecret) {
    throw new Error(
      "Missing Razorpay credentials. Set VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel env, then redeploy.",
    );
  }
  if (!Number.isFinite(amountInr) || amountInr < 1) {
    throw new Error("Invalid WORKSHOP_FEE_INR in Vercel environment variables.");
  }

  return { keyId, keySecret, amountInr };
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    return JSON.parse(req.body);
  }
  return req.body;
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { keyId, keySecret, amountInr } = readCredentials();
    const body = parseBody(req);

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: authHeader(keyId, keySecret),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amountInr * 100),
        currency: "INR",
        receipt: `ws_${Date.now().toString(36)}`,
        notes: {
          workshop: "biomedical-parent-workshop",
          parent_name: body.name || "",
          parent_email: body.email || "",
          parent_mobile: body.contact || "",
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.id) {
      const description = data?.error?.description || "";
      if (
        response.status === 401 ||
        /authentication failed/i.test(description)
      ) {
        throw new Error(
          "Razorpay authentication failed. Check VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on Vercel.",
        );
      }
      throw new Error(
        description || `Razorpay order failed (${response.status}).`,
      );
    }

    return res.status(200).json({
      orderId: data.id,
      amount: data.amount ?? Math.round(amountInr * 100),
      currency: data.currency ?? "INR",
      keyId,
    });
  } catch (error) {
    console.error("create-order failed:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Could not create order",
    });
  }
}
