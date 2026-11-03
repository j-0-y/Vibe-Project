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
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method is allowed for create_order" });
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

  let body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  // If no credentials configured yet, simulate gracefully for non-technical user preview
  if (!key || !secret) {
    const cid = "CID-" + Math.floor(100000 + Math.random() * 900000);
    const tracking = "SF" + Math.floor(10000000 + Math.random() * 90000000);
    return res.status(200).json({
      status: 200,
      consignment: {
        consignment_id: cid,
        tracking_code: tracking,
        invoice: body?.invoice || "INV-" + Date.now(),
        recipient_name: body?.recipient_name || "Customer",
        recipient_phone: body?.recipient_phone || "01700000000",
        recipient_address: body?.recipient_address || "Dhaka",
        cod_amount: body?.cod_amount || 0,
        status: "in_review",
      },
      message: "পার্সেল সফলভাবে তৈরি হয়েছে (ডেমো মোড - সেটিংস থেকে আসল এপিআই কি দিন)",
    });
  }

  // Validate required fields according to Steadfast documentation
  const invoice = String(body.invoice || "").trim();
  const recipient_name = String(body.recipient_name || "").trim();
  const recipient_phone = String(body.recipient_phone || "").trim().replace(/\D/g, "");
  const recipient_address = String(body.recipient_address || "").trim();
  const cod_amount = Number(body.cod_amount) || 0;

  if (!invoice || !recipient_name || !recipient_phone || !recipient_address) {
    return res.status(400).json({
      status: 400,
      error: "ইনভয়েস, কাস্টমারের নাম, ১১ ডিজিটের মোবাইল নম্বর ও পূর্ণ ঠিকানা আবশ্যক",
    });
  }

  const payload: Record<string, any> = {
    invoice,
    recipient_name,
    recipient_phone,
    recipient_address,
    cod_amount,
  };

  if (body.note) {
    payload.note = String(body.note).slice(0, 480);
  }
  if (body.item_quantity) {
    payload.item_quantity = Number(body.item_quantity) || 1;
  }
  if (body.item_weight) {
    payload.item_weight = Number(body.item_weight) || 0.5;
  }

  const targetUrl = `${baseUrl}/create_order`;

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Api-Key": key,
        "Secret-Key": secret,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {}

    if (!response.ok) {
      return res.status(response.status).json(
        json || { error: `Steadfast returned HTTP ${response.status}: ${text.slice(0, 200)}` }
      );
    }

    return res.status(200).json(json || { status: 200, message: "Order created successfully" });
  } catch (err: any) {
    return res.status(502).json({
      error: "Steadfast server unreachable: " + (err?.message || String(err)),
    });
  }
}
