import { getSeatAvailability } from "../_lib/admin.js";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const seats = await getSeatAvailability();
    return res.status(200).json(seats);
  } catch (error) {
    console.error("seats failed:", error);
    // Fall back so the landing page still shows the configured opening count.
    const total = Number(process.env.SEATS_TOTAL || "40");
    const remaining = Number(process.env.SEATS_REMAINING_START || "29");
    return res.status(200).json({
      total: Number.isFinite(total) ? total : 40,
      remaining: Number.isFinite(remaining) ? remaining : 29,
      paid: 0,
      sold: 0,
      fallback: true,
      error: error instanceof Error ? error.message : "Could not load seats",
    });
  }
}
