import { createHmac, timingSafeEqual } from "node:crypto";

const WORKSHOP_NOTE = "biomedical-parent-workshop";
const WORKSHOP_AMOUNTS_PAISE = new Set([49900, 149900]);

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

function normalizeNotes(raw) {
  if (!raw || Array.isArray(raw) || typeof raw !== "object") return {};
  return raw;
}

function looksLikeWorkshop(payment, notes) {
  if (notes.workshop === WORKSHOP_NOTE) return true;
  if (notes.parent_name && WORKSHOP_AMOUNTS_PAISE.has(Number(payment.amount))) {
    return true;
  }
  const desc = String(payment.description || "");
  return /biomedical|parent biomedical workshop/i.test(desc);
}

async function mapPool(items, concurrency, mapper) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next;
      next += 1;
      results[i] = await mapper(items[i], i);
    }
  }
  const workers = Array.from(
    { length: Math.min(concurrency, Math.max(items.length, 1)) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

/**
 * @param {{ strict?: boolean }} [options]
 * strict: only captured/authorized with notes.workshop (seat counter)
 * default: workshop payments including failed attempts (admin list)
 */
export async function fetchWorkshopRegistrations(options = {}) {
  const strict = options.strict === true;
  const { header } = razorpayAuthHeader();
  const candidates = [];
  let skip = 0;
  const count = 100;
  // Keep this light for Vercel hobby timeouts.
  const maxPages = strict ? 2 : 3;

  for (let page = 0; page < maxPages; page += 1) {
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
      const notes = normalizeNotes(payment.notes);
      if (notes.workshop && notes.workshop !== WORKSHOP_NOTE) continue;

      const statusOk = strict
        ? ["captured", "authorized"].includes(payment.status)
        : ["captured", "authorized", "failed"].includes(payment.status);
      if (!statusOk) continue;

      // Skip obvious non-workshop traffic without an order round-trip.
      if (!looksLikeWorkshop(payment, notes) && !payment.order_id) continue;
      if (
        !looksLikeWorkshop(payment, notes) &&
        !WORKSHOP_AMOUNTS_PAISE.has(Number(payment.amount)) &&
        notes.workshop !== WORKSHOP_NOTE
      ) {
        continue;
      }

      candidates.push(payment);
    }

    if (items.length < count) break;
    skip += count;
  }

  const enriched = await mapPool(candidates, 8, async (payment) => {
    let notes = normalizeNotes(payment.notes);
    let orderId = payment.order_id || "";

    const needsOrder =
      orderId &&
      (notes.workshop !== WORKSHOP_NOTE ||
        !notes.parent_name ||
        !notes.parent_email);

    if (needsOrder && looksLikeWorkshop(payment, notes)) {
      try {
        const orderRes = await fetch(
          `https://api.razorpay.com/v1/orders/${orderId}`,
          { headers: { Authorization: header } },
        );
        if (orderRes.ok) {
          const order = await orderRes.json();
          notes = { ...normalizeNotes(order.notes), ...notes };
          orderId = order.id || orderId;
        }
      } catch {
        // keep payment notes only
      }
    } else if (
      needsOrder &&
      WORKSHOP_AMOUNTS_PAISE.has(Number(payment.amount))
    ) {
      try {
        const orderRes = await fetch(
          `https://api.razorpay.com/v1/orders/${orderId}`,
          { headers: { Authorization: header } },
        );
        if (orderRes.ok) {
          const order = await orderRes.json();
          notes = { ...normalizeNotes(order.notes), ...notes };
          orderId = order.id || orderId;
        }
      } catch {
        // keep payment notes only
      }
    }

    if (notes.workshop && notes.workshop !== WORKSHOP_NOTE) return null;

    if (strict) {
      if (notes.workshop !== WORKSHOP_NOTE) return null;
      if (!["captured", "authorized"].includes(payment.status)) return null;
    } else if (!looksLikeWorkshop(payment, notes)) {
      return null;
    }

    return {
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
    };
  });

  const registrations = enriched.filter(Boolean);

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
