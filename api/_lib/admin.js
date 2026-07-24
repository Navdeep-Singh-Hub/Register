import { createHmac, timingSafeEqual } from "node:crypto";

const WORKSHOP_NOTE = "biomedical-parent-workshop";

export function workshopNote() {
  return WORKSHOP_NOTE;
}

export function razorpayAuthHeader() {
  const keyId = (
    process.env.VITE_RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID ||
    ""
  ).trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (!keyId || !keySecret) {
    throw new Error("Missing Razorpay credentials in environment variables.");
  }
  return {
    keyId,
    keySecret,
    header: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
  };
}

function adminSecret() {
  return (
    process.env.ADMIN_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    ""
  ).trim();
}

export function getAdminPassword() {
  return (process.env.ADMIN_PASSWORD || "").trim();
}

export function createAdminToken() {
  const secret = adminSecret();
  if (!secret) {
    throw new Error("Set ADMIN_SECRET or RAZORPAY_KEY_SECRET for admin auth.");
  }
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7;
  const payload = Buffer.from(
    JSON.stringify({ role: "admin", exp }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== "string") return false;
  const secret = adminSecret();
  if (!secret) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data?.role === "admin" && typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function passwordsMatch(provided, expected) {
  if (!provided || !expected) return false;
  const a = Buffer.from(String(provided));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function bearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || "";
  if (typeof header !== "string") return "";
  const [type, token] = header.split(" ");
  if (type?.toLowerCase() !== "bearer" || !token) return "";
  return token.trim();
}

/**
 * @param {{ strict?: boolean }} [options]
 * When strict is true, only payments with notes.workshop matching this event count
 * (used for the public seat counter so unrelated payments don't eat seats).
 */
export async function fetchWorkshopRegistrations(options = {}) {
  const strict = options.strict === true;
  const { header } = razorpayAuthHeader();
  const registrations = [];
  let skip = 0;
  const count = 100;

  // Paginate through recent payments (source of paid seat holders).
  for (let page = 0; page < 5; page += 1) {
    const url = `https://api.razorpay.com/v1/payments?count=${count}&skip=${skip}`;
    const response = await fetch(url, {
      headers: { Authorization: header },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data?.error?.description ||
          `Could not load payments from Razorpay (${response.status}).`,
      );
    }

    const items = Array.isArray(data.items) ? data.items : [];
    if (items.length === 0) break;

    for (const payment of items) {
      if (!["captured", "authorized"].includes(payment.status)) continue;

      let notes = payment.notes || {};
      let orderId = payment.order_id || "";

      // Enrich from order notes when payment notes are empty.
      if (
        orderId &&
        (!notes.parent_name || !notes.parent_email || !notes.workshop)
      ) {
        try {
          const orderRes = await fetch(
            `https://api.razorpay.com/v1/orders/${orderId}`,
            { headers: { Authorization: header } },
          );
          if (orderRes.ok) {
            const order = await orderRes.json();
            notes = { ...order.notes, ...notes };
            orderId = order.id || orderId;
          }
        } catch {
          // keep payment notes only
        }
      }

      if (notes.workshop && notes.workshop !== WORKSHOP_NOTE) continue;

      if (strict) {
        if (notes.workshop !== WORKSHOP_NOTE) continue;
      } else {
        // If workshop note missing, still include payments that look like ours
        // (description match) so older test payments aren't totally lost.
        const desc = String(payment.description || "");
        if (
          notes.workshop !== WORKSHOP_NOTE &&
          !/biomedical|workshop|parent/i.test(desc) &&
          !notes.parent_name
        ) {
          continue;
        }
      }

      registrations.push({
        id: payment.id,
        orderId,
        name: notes.parent_name || notes.name || "—",
        email: notes.parent_email || notes.email || "—",
        mobile: notes.parent_mobile || notes.contact || payment.contact || "—",
        amountInr: (payment.amount || 0) / 100,
        currency: payment.currency || "INR",
        status: payment.status,
        method: payment.method || "—",
        paidAt: payment.created_at
          ? new Date(payment.created_at * 1000).toISOString()
          : null,
      });
    }

    if (items.length < count) break;
    skip += count;
  }

  registrations.sort((a, b) => {
    const ta = a.paidAt ? Date.parse(a.paidAt) : 0;
    const tb = b.paidAt ? Date.parse(b.paidAt) : 0;
    return tb - ta;
  });

  return registrations;
}

/**
 * Live seat inventory.
 * remaining = SEATS_REMAINING_START − successful workshop payments (after baseline).
 * If Razorpay already has N workshop payments and you still want to show 29,
 * set SEATS_PAID_BASELINE=N (or set SEATS_REMAINING_START to 29 + N).
 */
export async function getSeatAvailability() {
  const total = Number(process.env.SEATS_TOTAL || "40");
  const startRemaining = Number(process.env.SEATS_REMAINING_START || "29");
  const paidBaseline = Number(process.env.SEATS_PAID_BASELINE || "0");
  const registrations = await fetchWorkshopRegistrations({ strict: true });
  const paid = Math.max(
    0,
    registrations.length - (Number.isFinite(paidBaseline) ? paidBaseline : 0),
  );
  const remaining = Math.max(0, startRemaining - paid);
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 40;

  return {
    total: safeTotal,
    remaining,
    paid,
    sold: Math.max(0, safeTotal - remaining),
  };
}
