import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Body parsers
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-steadfast-key, x-steadfast-secret, x-steadfast-base");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") return res.status(200).end();
    next();
  });

  /* ---------------- Steadfast Proxy Endpoint ---------------- */
  // /api/steadfast/* -> portal.packzy.com/api/v1/*
  app.all("/api/steadfast/*", async (req, res) => {
    const subPath = ((req.params as unknown as Record<string, string>)["0"]) || "";
    const key = (req.headers["x-steadfast-key"] as string) || process.env.STEADFAST_API_KEY || "";
    const secret = (req.headers["x-steadfast-secret"] as string) || process.env.STEADFAST_SECRET_KEY || "";
    const base = ((req.headers["x-steadfast-base"] as string) || process.env.STEADFAST_BASE_URL || "https://portal.packzy.com/api/v1").replace(/\/$/, "");

    // If no credentials configured yet, simulate gracefully for non-technical user preview!
    if (!key || !secret) {
      if (subPath.includes("get_balance")) {
        return res.json({
          status: 200,
          current_balance: 14500,
          message: "ডেমো ব্যালেন্স (লাইভ এপিআই বসালে রিয়েল ব্যালেন্স দেখাবে)",
        });
      }
      if (subPath.includes("create_order")) {
        const cid = "CID-" + Math.floor(100000 + Math.random() * 900000);
        const tracking = "SF" + Math.floor(10000000 + Math.random() * 90000000);
        return res.json({
          status: 200,
          consignment: {
            consignment_id: cid,
            tracking_code: tracking,
            invoice: req.body?.invoice || "INV-" + Date.now(),
            status: "in_review",
          },
          message: "পার্সেল সফলভাবে তৈরি হয়েছে (সিমুলেশন)",
        });
      }
      if (subPath.includes("status_by_cid") || subPath.includes("status_by_trackingcode")) {
        return res.json({
          status: 200,
          delivery_status: "in_transit",
          history: [
            { time: "আজ সকাল ১০:৩০", status: "পার্সেল পিকআপ সম্পন্ন হয়েছে" },
            { time: "আজ দুপুর ০২:১৫", status: "স্টেডফাস্ট হাব-এ প্রক্রিয়াধীন" },
            { time: "আজ বিকাল ০৫:০০", status: "ডেলিভারি রাইডারের কাছে হস্তান্তরিত (In Transit)" },
          ],
        });
      }
      return res.json({ status: 200, message: "OK (Simulation)" });
    }

    const targetUrl = `${base}/${subPath}${req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : ""}`;

    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
          "Api-Key": key,
          "Secret-Key": secret,
        },
        body: req.method === "GET" || req.method === "HEAD" ? undefined : JSON.stringify(req.body || {}),
      });

      const text = await response.text();
      res.status(response.status).setHeader("Content-Type", "application/json").send(text);
    } catch (e: unknown) {
      res.status(502).json({ error: "Steadfast unreachable: " + (e instanceof Error ? e.message : String(e)) });
    }
  });

  /* ---------------- Steadfast Webhook Callback Endpoint ---------------- */
  // /api/webhook
  app.all("/api/webhook", async (req, res) => {
    // Steadfast pings GET to test URL validity
    if (req.method === "GET") {
      return res.status(200).json({
        status: "success",
        message: "Webhook active. Send POST for events.",
      });
    }

    if (req.method !== "POST") {
      return res.status(200).json({ status: "success", message: "Ignored." });
    }

    console.log("[Steadfast Webhook Event]", JSON.stringify(req.body));
    // Always acknowledge 200 so Steadfast never pauses the merchant's webhook!
    return res.status(200).json({
      status: "success",
      message: "Webhook received successfully.",
    });
  });

  /* ---------------- BD Courier Fraud Check Endpoint ---------------- */
  // /api/bdcourier/check
  app.all("/api/bdcourier/check", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-bdcourier-key");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") return res.status(200).end();

    const body = req.body || {};
    const phone = String(body.phone || req.query?.phone || "").trim().replace(/\D/g, "");
    const apiKey = (
      req.headers["x-bdcourier-key"] ||
      body.apiKey ||
      process.env.BD_COURIER_API_KEY ||
      ""
    ).toString().trim();

    if (!phone || phone.length < 11) {
      return res.status(400).json({ error: "সঠিক ১১ ডিজিটের ফোন নম্বর দিন" });
    }

    if (!apiKey) {
      return res.status(200).json({
        configured: false,
        message: "বিডি কুরিয়ার API Key কনফিগার করা হয়নি। সেটিংস ট্যাবে গিয়ে API Key যুক্ত করুন।",
        phone,
        total: 0,
        delivered: 0,
        cancelled: 0,
        rate: 0,
        risk_verdict: {
          level: "warning",
          label: "API Key প্রয়োজন ⚠️",
          action: "সেটিংস থেকে BD Courier API Key সেট করুন",
          color: "#eab308",
          reasons: ["লাইভ ডাটা পেতে BD Courier API Key প্রয়োজন"],
        },
      });
    }

    const endpoints = [
      "https://bdcourier.com/api/courier-check",
      "https://api.bdcourier.com/courier-check",
    ];

    for (const url of endpoints) {
      try {
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "api-key": apiKey,
            "x-api-key": apiKey,
          },
          body: JSON.stringify({ phone }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const total = Number(data.total_parcels || data.total || data.data?.total || 0);
          const delivered = Number(data.success_parcels || data.delivered || data.data?.delivered || 0);
          const cancelled = Number(data.cancelled_parcels || data.cancelled || data.data?.cancelled || 0);
          const rate = total > 0 ? Math.round((delivered / total) * 100) : (data.success_rate || 0);

          let riskLevel: "safe" | "medium" | "high" = "safe";
          let label = "বিশ্বস্ত কাস্টমার ✅";
          let action = "নিশ্চিন্তে ক্যাশ অন ডেলিভারিতে পাঠান";
          let color = "#16a34a";

          if (total > 0 && rate < 60) {
            riskLevel = "high";
            label = "উচ্চ ঝুঁকিপূর্ণ কাস্টমার 🚨";
            action = "পার্সেল পাঠানোর আগে ডেলিভারি চার্জ অগ্রিম নিন";
            color = "#dc2626";
          } else if (total > 0 && rate < 80) {
            riskLevel = "medium";
            label = "সতর্কতা প্রয়োজন ⚠️";
            action = "অগ্রিম ডেলিভারি চার্জ নিয়ে কনফার্ম করুন";
            color = "#eab308";
          }

          return res.status(200).json({
            configured: true,
            phone,
            total,
            delivered,
            cancelled,
            rate,
            risk_verdict: {
              level: riskLevel,
              label,
              action,
              color,
              reasons: [total > 0 ? `মোট ${total} পার্সেলের মধ্যে ${delivered} ডেলিভারি (${rate}%)` : "নতুন নম্বর"],
            },
            source: "BD Courier Live API",
            raw: data,
          });
        }
      } catch {}
    }

    return res.status(200).json({
      configured: true,
      warning: "BD Courier রেসপন্স দেয়নি। API Key সঠিক আছে কিনা যাচাই করুন।",
      phone,
      total: 0,
      delivered: 0,
      cancelled: 0,
      rate: 0,
      risk_verdict: {
        level: "medium",
        label: "API সংযোগ সমস্যা ⚠️",
        action: "সঠিক BD Courier API Key দিয়েছেন কি না পরীক্ষা করুন",
        color: "#eab308",
        reasons: ["বিডি কুরিয়ার সার্ভারের সাথে সংযোগ করা সম্ভব হয়নি"],
      },
      source: "BD Courier Check",
    });
  });

  /* ---------------- Shared Config Endpoint (Cross-device sync) ---------------- */
  // /api/config
  const DATA_DIR = path.resolve(__dirname, "data");
  const CONFIG_FILE = path.join(DATA_DIR, "config.json");

  app.get("/api/config", (_req, res) => {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        return res.json(JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8")));
      }
    } catch {}
    res.json({});
  });

  app.post("/api/config", (req, res) => {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      let current: any = {};
      try {
        if (fs.existsSync(CONFIG_FILE)) {
          current = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
        }
      } catch {}
      const updated = { ...current, ...(req.body || {}), updatedAt: Date.now() };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), "utf-8");
      res.json({ success: true, config: updated });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to save config" });
    }
  });

  /* ---------------- Shared Shop Data Endpoint (Cross-device sync) ---------------- */
  // /api/shop
  app.get("/api/shop", (req, res) => {
    const shopId = (req.query?.id || "bag_store_1").toString().trim();
    const filePath = path.join(DATA_DIR, `shop_${shopId}.json`);
    try {
      if (fs.existsSync(filePath)) {
        return res.json({ success: true, data: JSON.parse(fs.readFileSync(filePath, "utf-8")) });
      }
    } catch {}
    res.json({ success: false, data: null });
  });

  app.post("/api/shop", (req, res) => {
    const shopId = (req.body?.id || "bag_store_1").toString().trim();
    const shopData = req.body?.data || req.body;
    const filePath = path.join(DATA_DIR, `shop_${shopId}.json`);
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(shopData, null, 2), "utf-8");
      res.json({ success: true, shopId, updatedAt: Date.now() });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to save shop" });
    }
  });

  /* ---------------- Frontend Vite / Static Integration ---------------- */
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BagBox server running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
