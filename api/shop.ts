import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data");

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
        return res.status(200).json({ success: true, data: JSON.parse(raw) });
      }
    } catch {}

    if (memShops[shopId]) {
      return res.status(200).json({ success: true, data: memShops[shopId] });
    }

    return res.status(200).json({ success: false, data: null });
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

      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(shopData, null, 2), "utf-8");
      } catch {}

      memShops[shopId] = shopData;
      return res.status(200).json({ success: true, shopId, updatedAt: Date.now() });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || "Failed to save shop" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
