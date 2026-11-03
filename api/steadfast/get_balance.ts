import fs from "fs";
import path from "path";

const BASE = process.env.STEADFAST_BASE_URL || "https://portal.packzy.com/api/v1";

function getFallbackCredentials() {
  try {
    const configPath = path.resolve(process.cwd(), "data", "config.json");
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (parsed?.steadfast?.key && parsed?.steadfast?.secret) {
        return parsed.steadfast;
      }
    }
  } catch {}
  return {};
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization, x-steadfast-key, x-steadfast-secret, x-steadfast-base"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const fallback = getFallbackCredentials();
  const key = (
    req.headers["x-steadfast-key"] ||
    process.env.STEADFAST_API_KEY ||
    fallback.key ||
    ""
  ).toString().trim();

  const secret = (
    req.headers["x-steadfast-secret"] ||
    process.env.STEADFAST_SECRET_KEY ||
    fallback.secret ||
    ""
  ).toString().trim();

  const baseUrl = (
    req.headers["x-steadfast-base"] ||
    fallback.base ||
    BASE
  ).toString().trim().replace(/\/$/, "");

  if (!key || !secret) {
    return res.status(200).json({
      status: 200,
      current_balance: 14500,
      message: "ডেমো ব্যালেন্স (সেটিংস থেকে আসল এপিআই কি দিন)",
    });
  }

  try {
    const response = await fetch(`${baseUrl}/get_balance`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Api-Key": key,
        "Secret-Key": secret,
      },
    });

    const text = await response.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {}

    return res.status(response.status).json(json || { error: text.slice(0, 200) });
  } catch (err: any) {
    return res.status(502).json({
      error: "Steadfast server unreachable: " + (err?.message || String(err)),
    });
  }
}
