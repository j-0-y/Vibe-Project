import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

// In-memory cache fallback for serverless
let memConfig: any = null;

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
        return res.status(200).json(JSON.parse(raw));
      }
    } catch {}

    if (memConfig) {
      return res.status(200).json(memConfig);
    }

    return res.status(200).json({});
  }

  if (req.method === "POST") {
    try {
      let body = req.body || {};
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch {}
      }

      // Merge with existing
      let current: any = {};
      try {
        if (fs.existsSync(CONFIG_FILE)) {
          current = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
        }
      } catch {}

      const updated = { ...current, ...body, updatedAt: Date.now() };

      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), "utf-8");
      } catch {}

      memConfig = updated;
      return res.status(200).json({ success: true, config: updated });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || "Failed to save config" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
