import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, Plugin, PreviewServer, ViteDevServer } from "vite";
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  type RazorpayEnv,
} from "./razorpayCore.ts";
import {
  bearerToken,
  createAdminToken,
  fetchWorkshopRegistrations,
  getAdminPassword,
  getSeatAvailability,
  passwordsMatch,
  verifyAdminToken,
} from "../api/_lib/admin.js";

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

function applyEnv(env: Record<string, string>) {
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function attachApi(middlewares: Connect.Server, env: RazorpayEnv & Record<string, string>) {
  applyEnv(env as Record<string, string>);

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

    if (url === "/api/seats" && req.method === "GET") {
      try {
        const seats = await getSeatAvailability();
        json(res, 200, seats);
      } catch (error) {
        const total = Number(process.env.SEATS_TOTAL || "40");
        const remaining = Number(process.env.SEATS_REMAINING_START || "29");
        json(res, 200, {
          total: Number.isFinite(total) ? total : 40,
          remaining: Number.isFinite(remaining) ? remaining : 29,
          paid: 0,
          sold: 0,
          fallback: true,
          error:
            error instanceof Error ? error.message : "Could not load seats",
        });
      }
      return;
    }

    if (url === "/api/admin/login" && req.method === "POST") {
      try {
        const expected = getAdminPassword();
        if (!expected) {
          json(res, 500, {
            error:
              "ADMIN_PASSWORD is not set. Add it to .env, then restart npm run dev.",
          });
          return;
        }
        const raw = await readBody(req);
        const body = raw ? (JSON.parse(raw) as { password?: string }) : {};
        if (!passwordsMatch(String(body.password || ""), expected)) {
          json(res, 401, { error: "Incorrect password." });
          return;
        }
        json(res, 200, { token: createAdminToken(), expiresInDays: 7 });
      } catch (error) {
        json(res, 500, {
          error: error instanceof Error ? error.message : "Login failed",
        });
      }
      return;
    }

    if (url === "/api/admin/registrations" && req.method === "GET") {
      try {
        const token = bearerToken(req);
        if (!verifyAdminToken(token)) {
          json(res, 401, { error: "Unauthorized. Please sign in again." });
          return;
        }
        const registrations = await fetchWorkshopRegistrations();
        const revenue = registrations.reduce(
          (sum: number, r: { amountInr?: number }) => sum + (r.amountInr || 0),
          0,
        );
        json(res, 200, {
          count: registrations.length,
          revenue,
          registrations,
          fetchedAt: new Date().toISOString(),
        });
      } catch (error) {
        json(res, 500, {
          error:
            error instanceof Error
              ? error.message
              : "Could not load registrations",
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
