import {
  createAdminToken,
  getAdminPassword,
  passwordsMatch,
} from "../_lib/admin.js";

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") return JSON.parse(req.body);
  return req.body;
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const expected = getAdminPassword();
    if (!expected) {
      return res.status(500).json({
        error:
          "ADMIN_PASSWORD is not set. Add it in Vercel env (and local .env), then redeploy.",
      });
    }

    const body = parseBody(req);
    const password = String(body.password || "");

    if (!passwordsMatch(password, expected)) {
      return res.status(401).json({ error: "Incorrect password." });
    }

    const token = createAdminToken();
    return res.status(200).json({
      token,
      expiresInDays: 7,
    });
  } catch (error) {
    console.error("admin login failed:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Login failed",
    });
  }
}
