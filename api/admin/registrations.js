import {
  bearerToken,
  fetchWorkshopRegistrations,
  verifyAdminToken,
} from "../_lib/admin.js";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = bearerToken(req);
    if (!verifyAdminToken(token)) {
      return res.status(401).json({ error: "Unauthorized. Please sign in again." });
    }

    const registrations = await fetchWorkshopRegistrations();
    const revenue = registrations.reduce((sum, r) => sum + (r.amountInr || 0), 0);

    return res.status(200).json({
      count: registrations.length,
      revenue,
      registrations,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("admin registrations failed:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Could not load registrations",
    });
  }
}
