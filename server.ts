import express from "express";
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
