import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, Plugin, PreviewServer, ViteDevServer } from "vite";
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  type RazorpayEnv,
} from "./razorpayCore.ts";

function json(
  res: ServerResponse,
  status: number,
  body: Record<string, unknown>,
) {
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

function attachApi(middlewares: Connect.Server, env: RazorpayEnv) {
  middlewares.use(async (req, res, next) => {
    const url = req.url?.split("?")[0];

    if (url === "/api/create-order" && req.method === "POST") {
      try {
        const raw = await readBody(req);
        const body = raw ? (JSON.parse(raw) as Record<string, string>) : {};
        const order = await createRazorpayOrder(
          {
            workshop: "biomedical-parent-workshop",
            parent_name: body.name || "",
            parent_email: body.email || "",
            parent_mobile: body.contact || "",
          },
          env,
        );
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
          verifyPaymentSignature(
            body.razorpay_order_id,
            body.razorpay_payment_id,
            body.razorpay_signature,
            env,
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

export function razorpayApiPlugin(env: Record<string, string>): Plugin {
  const install = (server: ViteDevServer | PreviewServer) => {
    attachApi(server.middlewares, env);
  };

  return {
    name: "razorpay-api",
    configureServer: install,
    configurePreviewServer: install,
  };
}
