const BASE = process.env.STEADFAST_BASE_URL || "https://portal.packzy.com/api/v1";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-steadfast-key, x-steadfast-secret, x-steadfast-base");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const key = req.headers["x-steadfast-key"] || process.env.STEADFAST_API_KEY;
  const secret = req.headers["x-steadfast-secret"] || process.env.STEADFAST_SECRET_KEY;
  const baseUrl = (req.headers["x-steadfast-base"] || BASE).replace(/\/$/, "");

  const parts = req.query?.path || [];
  const sub = "/" + (Array.isArray(parts) ? parts.join("/") : parts);

  if (!key || !secret) {
    if (sub.includes("get_balance")) {
      return res.status(200).json({ status: 200, current_balance: 14500, message: "ডেমো ব্যালেন্স" });
    }
    if (sub.includes("create_order")) {
      return res.status(200).json({
        status: 200,
        consignment: {
          consignment_id: "CID-" + Math.floor(100000 + Math.random() * 900000),
          tracking_code: "SF" + Math.floor(10000000 + Math.random() * 90000000),
          invoice: req.body?.invoice || "INV-" + Date.now(),
        },
      });
    }
    return res.status(500).json({ error: "STEADFAST_API_KEY / SECRET_KEY missing" });
  }

  const url = baseUrl + sub;

  try {
    const r = await fetch(url, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "Api-Key": key,
        "Secret-Key": secret,
      },
      body: req.method === "GET" || req.method === "HEAD" ? undefined : JSON.stringify(req.body || {}),
    });

    const text = await r.text();
    res.status(r.status).setHeader("Content-Type", "application/json").send(text);
  } catch (e: unknown) {
    res.status(502).json({ error: "Steadfast unreachable: " + (e instanceof Error ? e.message : String(e)) });
  }
}
