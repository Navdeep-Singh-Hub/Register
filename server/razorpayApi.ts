import type { IncomingMessage, ServerResponse } from "node:http";
import { createHmac } from "node:crypto";
import type { Connect, Plugin, PreviewServer, ViteDevServer } from "vite";

type Env = Record<string, string>;

function json(res: ServerResponse, status: number, body: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function authHeader(keyId: string, keySecret: string) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

async function createRazorpayOrder(env: Env, notes: Record<string, string>) {
  const keyId = env.VITE_RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID || "";
  const keySecret = env.RAZORPAY_KEY_SECRET || "";
  const amountInr = Number(env.WORKSHOP_FEE_INR || "1499");

  if (!keyId || !keySecret) {
    throw new Error(
      "Missing Razorpay credentials. Set VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env",
    );
  }
  if (!Number.isFinite(amountInr) || amountInr < 1) {
    throw new Error("Invalid WORKSHOP_FEE_INR in .env");
  }

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
        "Razorpay authentication failed. In Dashboard (Live Mode) regenerate API Keys, then update VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env and restart the server.",
      );
    }
    throw new Error(
      description ||
        `Razorpay order failed (${response.status}). Check live Key ID + Secret.`,
    );
  }

  return {
    orderId: data.id,
    amount: data.amount ?? Math.round(amountInr * 100),
    currency: data.currency ?? "INR",
    keyId,
  };
}

function verifySignature(
  env: Env,
  orderId: string,
  paymentId: string,
  signature: string,
) {
  const secret = env.RAZORPAY_KEY_SECRET || "";
  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

function attachApi(middlewares: Connect.Server, env: Env) {
  middlewares.use(async (req, res, next) => {
    const url = req.url?.split("?")[0];

    if (url === "/api/create-order" && req.method === "POST") {
      try {
        const raw = await readBody(req);
        const body = raw ? (JSON.parse(raw) as Record<string, string>) : {};
        const order = await createRazorpayOrder(env, {
          workshop: "biomedical-parent-workshop",
          parent_name: body.name || "",
          parent_email: body.email || "",
          parent_mobile: body.contact || "",
        });
        json(res, 200, order);
      } catch (error) {
        json(res, 500, {
          error:
            error instanceof Error ? error.message : "Could not create order",
        });
      }
      return;
    }

    if (url === "/api/verify-payment" && req.method === "POST") {
      try {
        const raw = await readBody(req);
        const body = JSON.parse(raw) as {
          razorpay_order_id?: string;
          razorpay_payment_id?: string;
          razorpay_signature?: string;
        };
        const ok =
          !!body.razorpay_order_id &&
          !!body.razorpay_payment_id &&
          !!body.razorpay_signature &&
          verifySignature(
            env,
            body.razorpay_order_id,
            body.razorpay_payment_id,
            body.razorpay_signature,
          );
        json(res, ok ? 200 : 400, {
          verified: ok,
          error: ok ? undefined : "Payment signature verification failed",
        });
      } catch (error) {
        json(res, 500, {
          error: error instanceof Error ? error.message : "Verification failed",
        });
      }
      return;
    }

    next();
  });
}

export function razorpayApiPlugin(env: Env): Plugin {
  const install = (server: ViteDevServer | PreviewServer) => {
    attachApi(server.middlewares, env);
  };

  return {
    name: "razorpay-api",
    configureServer: install,
    configurePreviewServer: install,
  };
}
