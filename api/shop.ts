import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

// In-memory cache for serverless instances
const memShops: Record<string, any> = {};

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const shopId = (req.query?.id || req.body?.id || "bag_store_1").toString().trim();
  const filePath = path.join(DATA_DIR, `shop_${shopId}.json`);

  if (req.method === "GET") {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        const stat = fs.statSync(filePath);
        const updatedAt = Number(parsed.updated_at || stat.mtimeMs || 0);
        return res.status(200).json({ success: true, data: parsed, updatedAt });
      }
    } catch {}

    if (memShops[shopId]) {
      const updatedAt = Number(memShops[shopId].updated_at || Date.now());
      return res.status(200).json({ success: true, data: memShops[shopId], updatedAt });
    }

    return res.status(200).json({ success: false, data: null, updatedAt: 0 });
  }

  if (req.method === "POST") {
    try {
      let body = req.body || {};
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch {}
      }

      const shopData = body.data || body;
      const now = Number(body.updatedAt) || Date.now();
      shopData.updated_at = now;

      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(shopData, null, 2), "utf-8");

        // Sync shared config if settings were passed
        if (shopData.settings) {
          let cfg: any = {};
          try {
            if (fs.existsSync(CONFIG_FILE)) cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
          } catch {}
          let changed = false;
          if (shopData.settings.steadfast?.key) {
            cfg.steadfast = shopData.settings.steadfast;
            changed = true;
          }
          if (shopData.settings.bdCourierKey) {
            cfg.bdCourierKey = shopData.settings.bdCourierKey;
            changed = true;
          }
          if (shopData.settings.supabase?.url) {
            cfg.supabase = shopData.settings.supabase;
            changed = true;
          }
          if (shopData.settings.shopName) {
            cfg.shopName = shopData.settings.shopName;
            changed = true;
          }
          if (changed) {
            cfg.updatedAt = now;
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf-8");
          }
        }
      } catch {}

      memShops[shopId] = shopData;
      return res.status(200).json({ success: true, shopId, updatedAt: now });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || "Failed to save shop" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
