import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";

const TOKEN_KEY = "gcwc_admin_token";

export type Registration = {
  id: string;
  orderId: string;
  name: string;
  email: string;
  mobile: string;
  amountInr: number;
  currency: string;
  status: string;
  method: string;
  errorDescription?: string;
  paidAt: string | null;
};

type RegistrationsResponse = {
  count: number;
  failedCount?: number;
  revenue: number;
  registrations: Registration[];
  fetchedAt: string;
  error?: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function AdminLogin({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) {
        throw new Error(data.error || "Login failed");
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      onSuccess(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-shell admin-login-shell">
      <div className="admin-aurora" aria-hidden>
        <span className="ab a1" />
        <span className="ab a2" />
        <span className="ab a3" />
      </div>
      <motion.form
        className="admin-login-card"
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <p className="admin-eyebrow">Workshop console</p>
        <h1>Seat Reservations</h1>
        <p className="admin-login-copy">
          Sign in to view parents who reserved seats for the biomedical workshop.
        </p>
        <label>
          Admin password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
          />
        </label>
        {error ? <p className="admin-error">{error}</p> : null}
        <button className="admin-btn" type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Enter dashboard"}
        </button>
        <Link className="admin-back" to="/">
          ← Back to landing page
        </Link>
      </motion.form>
    </div>
  );
}

function StatCard({
  label,
  value,
  delay,
}: {
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.article
      className="admin-stat"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </motion.article>
  );
}

function AdminDashboard({
  token,
  onLogout,
}: {
  token: string;
  onLogout: () => void;
}) {
  const [data, setData] = useState<RegistrationsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch("/api/admin/registrations", {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      const text = await res.text();
      let json: RegistrationsResponse;
      try {
        json = JSON.parse(text) as RegistrationsResponse;
      } catch {
        throw new Error(
          res.ok
            ? "Unexpected response from server."
            : `Could not load registrations (${res.status}).`,
        );
      }
      if (!res.ok) {
        if (res.status === 401) {
          onLogout();
          return;
        }
        throw new Error(json.error || "Could not load registrations");
      }
      setData(json);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          "Timed out loading from Razorpay. Tap Refresh — if it keeps failing, check Vercel function logs.",
        );
      } else {
        setError(err instanceof Error ? err.message : "Load failed");
      }
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filtered = useMemo(() => {
    const list = data?.registrations ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) =>
      [r.name, r.email, r.mobile, r.id, r.orderId]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [data, query]);

  function exportCsv() {
    const rows = [
      ["Name", "Mobile", "Email", "Amount", "Status", "Method", "Paid At", "Payment ID", "Order ID"],
      ...filtered.map((r) => [
        r.name,
        r.mobile,
        r.email,
        String(r.amountInr),
        r.status,
        r.method,
        r.paidAt || "",
        r.id,
        r.orderId,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workshop-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin-shell admin-dash-shell">
      <div className="admin-aurora soft" aria-hidden>
        <span className="ab a1" />
        <span className="ab a2" />
      </div>

      <header className="admin-topbar">
        <div>
          <p className="admin-eyebrow">Global Child Wellness Centre</p>
          <h1>Registrations</h1>
        </div>
        <div className="admin-top-actions">
          <button type="button" className="admin-btn ghost" onClick={() => void load()}>
            Refresh
          </button>
          <button type="button" className="admin-btn ghost" onClick={exportCsv} disabled={!filtered.length}>
            Export CSV
          </button>
          <button
            type="button"
            className="admin-btn"
            onClick={() => {
              localStorage.removeItem(TOKEN_KEY);
              onLogout();
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="admin-stats">
        <StatCard
          label="Seats reserved"
          value={loading ? "…" : String(data?.count ?? 0)}
          delay={0.05}
        />
        <StatCard
          label="Revenue captured"
          value={loading ? "…" : formatMoney(data?.revenue ?? 0)}
          delay={0.12}
        />
        <StatCard
          label="Failed attempts"
          value={loading ? "…" : String(data?.failedCount ?? 0)}
          delay={0.19}
        />
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2>Parent details</h2>
            <p>
              Razorpay workshop payments (captured + failed attempts)
              {data?.fetchedAt ? ` · updated ${formatDate(data.fetchedAt)}` : ""}
            </p>
          </div>
          <input
            className="admin-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, mobile, email…"
          />
        </div>

        {error ? <p className="admin-error">{error}</p> : null}

        <div className="admin-table-wrap">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                className="admin-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Gathering registrations…
              </motion.div>
            ) : filtered.length === 0 ? (
              <motion.div
                key="empty"
                className="admin-empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                No successful registrations yet. Failed payment attempts still
                appear below after Refresh — only “captured” payments reserve a
                seat.
              </motion.div>
            ) : (
              <motion.table
                key="table"
                className="admin-table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <thead>
                  <tr>
                    <th>Parent</th>
                    <th>Contact</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Paid at</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, index) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.4), ease: EASE }}
                    >
                      <td>
                        <strong>{row.name}</strong>
                        <span className="muted">{row.email}</span>
                      </td>
                      <td>
                        <a href={`tel:${row.mobile}`}>{row.mobile}</a>
                        <span className="muted">{row.method}</span>
                      </td>
                      <td>{formatMoney(row.amountInr)}</td>
                      <td>
                        <span className={`admin-pill ${row.status}`}>
                          {row.status}
                        </span>
                        {row.errorDescription ? (
                          <span className="muted">{row.errorDescription}</span>
                        ) : null}
                      </td>
                      <td>{formatDate(row.paidAt)}</td>
                      <td className="mono">{row.id}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </motion.table>
            )}
          </AnimatePresence>
        </div>
      </section>

      <footer className="admin-foot">
        <Link to="/">View public workshop page</Link>
      </footer>
    </div>
  );
}

export function AdminPage() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY),
  );

  if (!token) {
    return <AdminLogin onSuccess={setToken} />;
  }

  return (
    <AdminDashboard
      token={token}
      onLogout={() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }}
    />
  );
}
